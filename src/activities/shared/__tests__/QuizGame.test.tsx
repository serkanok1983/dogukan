import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { QuizQuestion } from "@/activities/shared/QuizGame";

const h = vi.hoisted(() => ({
  spoken: [] as { text: string; rate?: number }[],
  events: [] as unknown[],
  pending: [] as (() => void)[],
  manual: false,
}));

vi.mock("@/lib/speech", () => ({
  speak: vi.fn((text: string, opts?: { rate?: number; onEnd?: () => void }) => {
    h.spoken.push({ text, rate: opts?.rate });
    if (!opts?.onEnd) return;
    if (h.manual) h.pending.push(opts.onEnd);
    else opts.onEnd();
  }),
  cancelSpeech: vi.fn(),
  unlockAudio: vi.fn(),
}));
vi.mock("@/lib/progress/events", () => ({
  trackEvent: vi.fn((e: unknown) => {
    h.events.push(e);
  }),
}));
vi.mock("@/lib/sounds", () => ({
  sounds: {
    success: vi.fn(),
    softWrong: vi.fn(),
    wrong: vi.fn(),
    star: vi.fn(),
    win: vi.fn(),
    tap: vi.fn(),
  },
}));
vi.mock("@/lib/praise", () => ({ praise: (ctx: string) => `praise:${ctx}` }));
vi.mock("@/lib/sessionClock", () => ({ notifyNaturalPause: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { QuizGame } from "@/activities/shared/QuizGame";
import { GameSessionProvider } from "@/lib/gameSession";
import { notifyNaturalPause } from "@/lib/sessionClock";
import { sounds } from "@/lib/sounds";
import { cancelSpeech } from "@/lib/speech";

const QUESTIONS: QuizQuestion[] = [
  { prompt: "Bu hangi şekil?", emoji: "🔺", answer: "Üçgen", options: ["Üçgen", "Kare", "Daire"], hint: "Üç köşesi var" },
  { prompt: "En az balon hangisinde?", emoji: "🎈", answer: "🎈", options: ["🎈", "🎈🎈"], optionSay: { "🎈": "bir balon", "🎈🎈": "iki balon" } },
];

const texts = () => h.spoken.map((s) => s.text);
const option = (name: string) => screen.getByRole("button", { name });

function view(active: boolean) {
  return (
    <GameSessionProvider active={active}>
      <QuizGame slug="sekil-tani" questions={QUESTIONS} />
    </GameSessionProvider>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  h.spoken.length = 0;
  h.events.length = 0;
  h.pending.length = 0;
  h.manual = false;
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("QuizGame", () => {
  it("StartCard geçilmeden (etkin değil) susar; etkin olunca soruyu ve seçenekleri okur", () => {
    const { rerender } = render(view(false));
    expect(h.spoken).toHaveLength(0);
    fireEvent.click(option("Üçgen"));
    expect(sounds.success).not.toHaveBeenCalled();

    rerender(view(true));
    expect(texts()).toEqual(["Bu hangi şekil?", "Üçgen", "Kare", "Daire"]);
    expect(screen.getByRole("button", { name: "Soruyu tekrar dinle" })).toBeTruthy();
  });

  it("seçenekler okunurken vurgulanır; bir dokunuş okumayı keser", () => {
    h.manual = true;
    const { container } = render(view(true));
    expect(texts()).toEqual(["Bu hangi şekil?"]);
    act(() => h.pending.shift()?.());
    expect(container.querySelector(".option-btn.is-reading")?.textContent).toBe("Üçgen");
    act(() => h.pending.shift()?.());
    expect(container.querySelector(".option-btn.is-reading")?.textContent).toBe("Kare");

    fireEvent.pointerDown(container.querySelector(".question-card") as HTMLElement);
    expect(cancelSpeech).toHaveBeenCalled();
    expect(container.querySelector(".option-btn.is-reading")).toBeNull();
    act(() => h.pending.shift()?.());
    expect(texts()).not.toContain("Daire");
  });

  it("1. yanlış: yumuşak ton, tekrar dene, ipucu, yavaş soru; 2. yanlış: cevap gösterilir", () => {
    const { container } = render(view(true));
    h.spoken.length = 0;
    fireEvent.click(option("Kare"));
    expect(sounds.softWrong).toHaveBeenCalledTimes(1);
    expect(sounds.wrong).not.toHaveBeenCalled();
    expect(h.spoken.slice(0, 3)).toEqual([
      { text: "praise:wrong_try_again", rate: undefined },
      { text: "Üç köşesi var", rate: undefined },
      { text: "Bu hangi şekil?", rate: 0.75 },
    ]);
    expect(texts()).not.toContain("Kare");
    expect((option("Kare") as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(option("Daire"));
    expect(sounds.softWrong).toHaveBeenCalledTimes(2);
    expect(texts().slice(-2)).toEqual(["praise:wrong_reveal", "Üçgen"]);
    expect(container.querySelector(".option-btn.correct")?.textContent).toBe("Üçgen");
    expect(container.textContent).not.toMatch(/seçtin|doğru yanıt|Havuz|Tebrikler|Harika iş|Pratik yap/);
    fireEvent.click(screen.getByRole("button", { name: "Devam ▶" }));
    expect(notifyNaturalPause).toHaveBeenCalledWith("card_end");
    expect(texts()).toContain("En az balon hangisinde?");
    expect([...texts().slice(-2)].sort()).toEqual(["bir balon", "iki balon"]);
  });

  it("doğru → süreç övgüsü ve ilerleme; set sonu exercise_set_end + set_end, iki düğme", () => {
    render(view(true));
    fireEvent.click(option("Üçgen"));
    expect(sounds.success).toHaveBeenCalledTimes(1);
    expect(texts()).toContain("praise:correct_first");
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(notifyNaturalPause).toHaveBeenCalledWith("card_end");

    fireEvent.click(option("iki balon"));
    fireEvent.click(option("bir balon"));
    expect(texts()).toContain("praise:correct_retry");
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(h.events).toEqual([
      {
        type: "exercise_set_end",
        slug: "sekil-tani",
        skill: "mat.sekil",
        correct: 2,
        total: 2,
        firstTry: 1,
        mode: "session",
      },
    ]);
    expect(notifyNaturalPause).toHaveBeenCalledWith("set_end");
    expect(texts()).toContain("praise:set_done_high");
    expect(screen.getByRole("button", { name: "Bir tane daha ⭐" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Haritaya dön 🗺️" }).getAttribute("href")).toBe("/");

    fireEvent.click(screen.getByRole("button", { name: "Bir tane daha ⭐" }));
    expect(screen.getByRole("button", { name: "Üçgen" })).toBeTruthy();
    expect(h.events).toHaveLength(1);
  });

  it("katman açılınca konuşmaz ve cevap almaz; kapanınca soru bir kez yeniden okunur", () => {
    const { rerender } = render(view(true));
    h.spoken.length = 0;
    rerender(view(false));
    fireEvent.click(option("Üçgen"));
    expect(sounds.success).not.toHaveBeenCalled();
    expect(h.spoken).toHaveLength(0);
    rerender(view(true));
    expect(texts().filter((t) => t === "Bu hangi şekil?")).toHaveLength(1);
    rerender(view(true));
    expect(texts().filter((t) => t === "Bu hangi şekil?")).toHaveLength(1);
  });
});
