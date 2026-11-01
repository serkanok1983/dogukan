import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Exercise, Generator } from "@/activities/engine/types";
import type { ProgressEventInput } from "@/lib/progress/types";
import type { SkillId, SkillLevel } from "@/lib/skills";

const h = vi.hoisted(() => ({
  spoken: [] as { text: string; rate?: number }[],
  events: [] as unknown[],
  counter: 0,
}));

function fakeGenerator(skill: SkillId): Generator {
  return {
    skill,
    maxLevel: 3,
    generate(_rng, level: SkillLevel): Exercise {
      h.counter += 1;
      const n = h.counter;
      return {
        id: `fake-${n}`,
        skill,
        level,
        kind: "choice",
        prompt: { say: `Soru ${n}`, hintSay: `Yavaş soru ${n}` },
        choices: [
          { id: "a", emoji: "🍎", say: "elma" },
          { id: "b", emoji: "🐱", say: "kedi" },
          { id: "c", emoji: "🚗", say: "araba" },
        ],
        answerIds: ["a"],
        feedback: { retry: "Bir daha bak.", reveal: "Doğrusu elma." },
      };
    },
  };
}

vi.mock("@/activities/content", () => {
  const GENERATORS = { "mat.sayma": fakeGenerator("mat.sayma") };
  return {
    GENERATORS,
    getGenerator: (skill: string) =>
      (GENERATORS as Record<string, Generator>)[skill],
  };
});

vi.mock("@/lib/progress/events", () => ({
  trackEvent: vi.fn((e: ProgressEventInput) => {
    h.events.push(e);
    return { ...e, id: "x", at: 0 };
  }),
  onEvent: vi.fn(() => () => {}),
}));

vi.mock("@/lib/speech", () => ({
  speak: vi.fn((text: string, opts?: { rate?: number; onEnd?: () => void }) => {
    h.spoken.push({ text, rate: opts?.rate });
    opts?.onEnd?.();
  }),
  cancelSpeech: vi.fn(),
  unlockAudio: vi.fn(),
}));

vi.mock("@/lib/sounds", () => ({
  sounds: {
    success: vi.fn(),
    softWrong: vi.fn(),
    wrong: vi.fn(),
    star: vi.fn(),
    pop: vi.fn(),
  },
}));

vi.mock("@/lib/praise", () => ({
  praise: (ctx: string) => `praise:${ctx}`,
}));

vi.mock("@/lib/sessionClock", () => ({
  notifyNaturalPause: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { ExerciseSession } from "@/activities/engine/ExerciseSession";
import { GameSessionProvider } from "@/lib/gameSession";
import { notifyNaturalPause } from "@/lib/sessionClock";
import { sounds } from "@/lib/sounds";
import { cancelSpeech, speak, unlockAudio } from "@/lib/speech";

type Ev = { type: string } & Record<string, unknown>;
const itemEvents = () =>
  (h.events as Ev[]).filter((e) => e.type === "exercise_item");
const setEndEvents = () =>
  (h.events as Ev[]).filter((e) => e.type === "exercise_set_end");
const lastSpoken = () => h.spoken.map((s) => s.text);

function choose(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function advance(ms = 500) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function start() {
  fireEvent.click(screen.getByRole("button", { name: "Başla ▶" }));
}

beforeEach(() => {
  vi.useFakeTimers();
  h.spoken.length = 0;
  h.events.length = 0;
  h.counter = 0;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ExerciseSession (session)", () => {
  it("ilk soru Başla dokunuşunda okunur; 6 doğru → olaylar ve set sonu", () => {
    render(<ExerciseSession slug="sayma-oyunu" skill="mat.sayma" />);
    expect(h.spoken).toHaveLength(0);
    start();
    expect(unlockAudio).toHaveBeenCalled();
    expect(lastSpoken()).toContain("Soru 1");

    for (let i = 1; i <= 6; i++) {
      expect(
        screen.getByRole("button", { name: "Soruyu tekrar dinle" }),
      ).toBeTruthy();
      choose("elma");
      expect(sounds.success).toHaveBeenCalledTimes(i);
      advance();
      if (i < 6) expect(lastSpoken()).toContain(`Soru ${i + 1}`);
    }

    expect(itemEvents()).toHaveLength(6);
    for (const e of itemEvents()) {
      expect(e).toMatchObject({
        slug: "sayma-oyunu",
        skill: "mat.sayma",
        firstTry: true,
        correct: true,
        review: false,
      });
      expect(typeof e.ms).toBe("number");
    }
    expect(setEndEvents()).toEqual([
      {
        type: "exercise_set_end",
        slug: "sayma-oyunu",
        skill: "mat.sayma",
        correct: 6,
        total: 6,
        firstTry: 6,
        mode: "session",
      },
    ]);
    expect(notifyNaturalPause).toHaveBeenCalledWith("set_end");
    expect(lastSpoken()).toContain("praise:set_done_high");
    expect(lastSpoken()).toContain("praise:correct_first");

    const again = screen.getByRole("button", { name: "Bir tane daha ⭐" });
    const map = screen.getByRole("link", { name: "Haritaya dön 🗺️" });
    expect(map.getAttribute("href")).toBe("/");

    fireEvent.click(again);
    expect(screen.queryByRole("button", { name: "Bir tane daha ⭐" })).toBeNull();
    expect(lastSpoken()).toContain("Soru 7");
    expect(setEndEvents()).toHaveLength(1);
  });

  it("1. yanlış ipucu, 2. yanlış cevabı gösterir ve maddeyi bir kez sona ekler", () => {
    render(<ExerciseSession slug="sayma-oyunu" skill="mat.sayma" />);
    start();

    choose("kedi");
    expect(sounds.softWrong).toHaveBeenCalledTimes(1);
    expect(sounds.wrong).not.toHaveBeenCalled();
    // İpucu, yavaş yönerge, sonra söndürülmemiş seçenekler sırayla.
    expect(h.spoken.slice(-4)).toEqual([
      { text: "Bir daha bak.", rate: undefined },
      { text: "Yavaş soru 1", rate: 0.75 },
      { text: "elma", rate: undefined },
      { text: "kedi", rate: undefined },
    ]);
    expect(
      (screen.getByRole("button", { name: "araba" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(itemEvents()).toHaveLength(0);

    choose("kedi");
    expect(sounds.softWrong).toHaveBeenCalledTimes(2);
    expect(lastSpoken().slice(-2)).toEqual(["Doğrusu elma.", "elma"]);
    expect(itemEvents()).toHaveLength(1);
    expect(itemEvents()[0]).toMatchObject({ firstTry: false, correct: false });
    // Cevap gösterildikten sonra seçenekler cevap vermez.
    choose("elma");
    expect(sounds.success).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Devam ▶" }));
    for (let i = 2; i <= 6; i++) {
      choose("elma");
      advance();
    }
    // 7. madde: sona eklenen kopya (aynı soru).
    expect(lastSpoken()).toContain("Soru 1");
    expect(screen.queryByRole("button", { name: "Bir tane daha ⭐" })).toBeNull();
    choose("elma");
    advance();

    expect(itemEvents()).toHaveLength(6);
    expect(setEndEvents()[0]).toMatchObject({
      correct: 5,
      total: 6,
      firstTry: 5,
      mode: "session",
    });
    expect(screen.getByRole("button", { name: "Bir tane daha ⭐" })).toBeTruthy();
    expect(lastSpoken()).toContain("praise:set_done_low");
  });

  it("ikinci denemede doğru: retry övgüsü ve firstTry false", () => {
    render(<ExerciseSession slug="sayma-oyunu" skill="mat.sayma" />);
    start();
    choose("kedi");
    choose("elma");
    expect(itemEvents()[0]).toMatchObject({ firstTry: false, correct: true });
    expect(lastSpoken()).toContain("praise:correct_retry");
  });

  it("hızlı çift dokunuş tek cevap sayılır", () => {
    render(<ExerciseSession slug="sayma-oyunu" skill="mat.sayma" />);
    start();
    const btn = screen.getByRole("button", { name: "elma" });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(sounds.success).toHaveBeenCalledTimes(1);
    expect(itemEvents()).toHaveLength(1);
  });

  it("uzun basınca seçenek okunur ve cevap sayılmaz", () => {
    render(<ExerciseSession slug="sayma-oyunu" skill="mat.sayma" />);
    start();
    const btn = screen.getByRole("button", { name: "kedi" });
    fireEvent.pointerDown(btn);
    advance(600);
    fireEvent.pointerUp(btn);
    fireEvent.click(btn);
    expect(lastSpoken()).toContain("kedi");
    expect(sounds.softWrong).not.toHaveBeenCalled();
  });

  it("yönergeden sonra seçenekler sırayla vurguyla okunur; bir dokunuş keser", () => {
    const pending: (() => void)[] = [];
    vi.mocked(speak).mockImplementation((text, opts) => {
      h.spoken.push({ text, rate: opts?.rate });
      if (opts?.onEnd) pending.push(opts.onEnd);
    });
    try {
      const { container } = render(
        <ExerciseSession slug="sayma-oyunu" skill="mat.sayma" />,
      );
      start();
      expect(lastSpoken()).toEqual(["Soru 1"]);
      act(() => pending.shift()?.());
      expect(lastSpoken()).toEqual(["Soru 1", "elma"]);
      expect(
        container.querySelector(".ex-choice.is-reading")?.getAttribute("aria-label"),
      ).toBe("elma");
      act(() => pending.shift()?.());
      expect(
        container.querySelector(".ex-choice.is-reading")?.getAttribute("aria-label"),
      ).toBe("kedi");

      fireEvent.pointerDown(container.querySelector(".ex-prompt") as HTMLElement);
      expect(cancelSpeech).toHaveBeenCalled();
      expect(container.querySelector(".ex-choice.is-reading")).toBeNull();
      act(() => pending.shift()?.());
      expect(lastSpoken()).not.toContain("araba");
    } finally {
      vi.mocked(speak).mockImplementation((text, opts) => {
        h.spoken.push({ text, rate: opts?.rate });
        opts?.onEnd?.();
      });
    }
  });

  it("oyun etkin değilken konuşmaz; katman kapanınca madde bir kez yeniden okunur", () => {
    const view = (active: boolean) => (
      <GameSessionProvider active={active}>
        <ExerciseSession slug="sayma-oyunu" skill="mat.sayma" />
      </GameSessionProvider>
    );
    const pending: (() => void)[] = [];
    vi.mocked(speak).mockImplementation((text, opts) => {
      h.spoken.push({ text, rate: opts?.rate });
      if (opts?.onEnd) pending.push(opts.onEnd);
    });
    const { rerender } = render(view(true));
    start();
    expect(lastSpoken()).toEqual(["Soru 1"]);

    // Katman açılır: süren zincir devam etmez (seçenekler katmanın üstüne okunmaz).
    rerender(view(false));
    act(() => pending.splice(0).forEach((f) => f()));
    expect(lastSpoken()).toEqual(["Soru 1"]);
    vi.mocked(speak).mockImplementation((text, opts) => {
      h.spoken.push({ text, rate: opts?.rate });
      opts?.onEnd?.();
    });
    h.spoken.length = 0;

    rerender(view(true));
    expect(lastSpoken().filter((t) => t === "Soru 1")).toHaveLength(1);
    rerender(view(true));
    expect(lastSpoken().filter((t) => t === "Soru 1")).toHaveLength(1);
  });

  it("üreticisi olmayan beceri 🚧 kartı gösterir, fırlatmaz", () => {
    render(<ExerciseSession slug="hece-birlestir" skill="tr.hece" />);
    expect(screen.getByText("🚧")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Haritaya dön 🗺️" })).toBeTruthy();
    expect(h.events).toHaveLength(0);
  });
});

describe("ExerciseSession (gate)", () => {
  it("tam 3 madde, set sonu ekranı yok, onDone çağrılır", () => {
    const onDone = vi.fn();
    render(
      <ExerciseSession
        slug="super-ayi"
        skill="mat.sayma"
        mode="gate"
        onDone={onDone}
        onExit={vi.fn()}
      />,
    );
    start();
    for (let i = 0; i < 3; i++) {
      choose("elma");
      advance();
    }
    expect(itemEvents()).toHaveLength(3);
    expect(setEndEvents()).toEqual([
      {
        type: "exercise_set_end",
        slug: "super-ayi",
        skill: "mat.sayma",
        correct: 3,
        total: 3,
        firstTry: 3,
        mode: "gate",
      },
    ]);
    expect(onDone).toHaveBeenCalledWith({ correct: 3, total: 3, firstTry: 3 });
    expect(screen.queryByRole("button", { name: "Bir tane daha ⭐" })).toBeNull();
    expect(notifyNaturalPause).not.toHaveBeenCalled();
  });

  it("Harita düğmesi onExit çağırır", () => {
    const onExit = vi.fn();
    render(
      <ExerciseSession
        slug="super-ayi"
        skill="mat.sayma"
        mode="gate"
        onExit={onExit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Haritaya dön" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
