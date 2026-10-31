import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWellbeing } from "@/hooks/useWellbeing";
import { loginAs, logout } from "@/lib/auth";
import { onEvent, trackEvent } from "@/lib/progress/events";
import { _resetProgressForTests, getProgress } from "@/lib/progress/store";
import { notifyNaturalPause } from "@/lib/sessionClock";
import { speak } from "@/lib/speech";
import { NoticeToaster, STICKER_REVEAL_MS } from "../NoticeToaster";
import { RewardSheet, SUGGEST_LINE } from "../RewardSheet";
import { _resetProgressSessionForTests } from "../session";
import { useLastRunResult, type RunResult } from "../useRunResult";

vi.mock("@/lib/speech", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/speech")>();
  return { ...mod, speak: vi.fn() };
});

vi.mock("@/lib/sessionClock", () => ({
  notifyNaturalPause: vi.fn(),
  setClockContext: vi.fn(),
  requestCoplay: vi.fn(),
  isCoplayActive: () => false,
}));

const WB = {
  phase: "play" as const,
  honey: { left: 4, capacity: 13 },
  jarEmpty: false,
  blocking: false,
  overlay: null,
  coplay: false,
  evening: false,
};

vi.mock("@/hooks/useWellbeing", () => ({ useWellbeing: vi.fn(() => WB) }));

vi.mock("@/activities/engine/ExerciseSession", () => ({
  ExerciseSession: (p: {
    slug: string;
    skill: string;
    mode?: string;
    onDone?: () => void;
  }) => (
    <button
      type="button"
      data-testid="exercise"
      data-mode={p.mode}
      data-slug={p.slug}
      onClick={() => p.onDone?.()}
    >
      soru
    </button>
  ),
}));

const result: RunResult = {
  slug: "flappy-bird",
  score: 9,
  durationMs: 30_000,
  starsBefore: 1,
  starsAfter: 2,
  isNewStar: true,
  runStars: 2,
};

function sheet(
  props: Partial<{ onRestart: () => void; onMap: () => void; slug: string }> = {},
) {
  return render(
    <RewardSheet
      slug={props.slug ?? "flappy-bird"}
      result={result}
      onRestart={props.onRestart ?? vi.fn()}
      onMap={props.onMap ?? vi.fn()}
    />,
  );
}

function endRun(slug = "flappy-bird", score = 1) {
  trackEvent({ type: "run_end", slug, score, durationMs: 1000 });
}

beforeEach(() => {
  logout();
  _resetProgressForTests();
  localStorage.clear();
  loginAs("dogukan");
  _resetProgressSessionForTests();
  vi.mocked(useWellbeing).mockReturnValue(WB);
  vi.mocked(speak).mockClear();
  vi.mocked(notifyNaturalPause).mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("RewardSheet", () => {
  it("iki eşit düğme: ▶ Tekrar ve 🗺️ Harita; doğal mola ve sesli övgü", () => {
    const onRestart = vi.fn();
    const onMap = vi.fn();
    sheet({ onRestart, onMap });
    const buttons = document.querySelectorAll(".pr-actions > .pr-btn");
    expect([...buttons].map((b) => b.textContent)).toEqual([
      "▶ Tekrar",
      "🗺️ Harita",
    ]);
    expect(new Set([...buttons].map((b) => b.className.split(" ")[0]))).toEqual(
      new Set(["pr-btn"]),
    );
    expect(
      document.querySelector(".pr-actions")?.classList.contains("is-single"),
    ).toBe(false);
    expect(notifyNaturalPause).toHaveBeenCalledWith("run_end");
    expect(vi.mocked(speak).mock.calls[0]?.[0]).toBeTruthy();
    fireEvent.click(screen.getByText("▶ Tekrar"));
    fireEvent.click(screen.getByText("🗺️ Harita"));
    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(onMap).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(SUGGEST_LINE, { exact: false })).toBeNull();
  });

  it("otomatik kapanmaz ve yeniden başlatmaz", () => {
    vi.useFakeTimers();
    const onRestart = vi.fn();
    const onMap = vi.fn();
    sheet({ onRestart, onMap });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(onRestart).not.toHaveBeenCalled();
    expect(onMap).not.toHaveBeenCalled();
    expect(screen.getByText("▶ Tekrar")).toBeTruthy();
  });

  it("kavanoz boş: Bal topla / Harita, oturumda en fazla 2 kez; sonra yalnız Harita", () => {
    vi.mocked(useWellbeing).mockReturnValue({
      ...WB,
      jarEmpty: true,
      honey: { left: 0, capacity: 13 },
    });
    for (let i = 0; i < 2; i++) {
      const { unmount } = sheet();
      expect(screen.getByText("🍯 Bal topla (3 soru)")).toBeTruthy();
      expect(screen.queryByText("▶ Tekrar")).toBeNull();
      expect(document.querySelectorAll(".pr-actions > .pr-btn")).toHaveLength(2);
      unmount();
    }
    sheet();
    expect(screen.queryByText("🍯 Bal topla (3 soru)")).toBeNull();
    expect(screen.queryByText("▶ Tekrar")).toBeNull();
    expect(
      document.querySelector(".pr-actions")?.classList.contains("is-single"),
    ).toBe(true);
    expect(screen.getByText("🗺️ Harita")).toBeTruthy();
  });

  it("Bal topla: 3 soruluk gate oturumu açar, bitince oyunu yeniden başlatır", () => {
    vi.mocked(useWellbeing).mockReturnValue({
      ...WB,
      jarEmpty: true,
      honey: { left: 0, capacity: 13 },
    });
    const onRestart = vi.fn();
    sheet({ onRestart });
    fireEvent.click(screen.getByText("🍯 Bal topla (3 soru)"));
    const ex = screen.getByTestId("exercise");
    expect(ex.dataset.mode).toBe("gate");
    expect(ex.dataset.slug).toBe("bal-topla");
    fireEvent.click(ex);
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it("aynı oyunda art arda 3 koşudan sonra öneri oturumda bir kez", () => {
    endRun();
    endRun();
    const first = sheet();
    expect(screen.queryByText(SUGGEST_LINE, { exact: false })).toBeNull();
    first.unmount();
    endRun();
    const second = sheet();
    const link = screen.getByText(SUGGEST_LINE, { exact: false }).closest("a");
    expect(link?.getAttribute("href")).toMatch(/^\//);
    expect(link?.getAttribute("target")).toBeNull();
    second.unmount();
    endRun();
    sheet();
    expect(screen.queryByText(SUGGEST_LINE, { exact: false })).toBeNull();
  });

  it("başka bir oyun araya girerse sayaç sıfırlanır", () => {
    endRun();
    endRun();
    endRun("super-ayi");
    endRun();
    sheet();
    expect(screen.queryByText(SUGGEST_LINE, { exact: false })).toBeNull();
  });
});

describe("useLastRunResult", () => {
  it("run_end ile sonuç, yeni yıldız ve dismiss; başka slug yok sayılır", () => {
    const { result: hook } = renderHook(() => useLastRunResult("flappy-bird"));
    expect(hook.current.result).toBeNull();
    act(() => endRun("super-ayi", 999));
    expect(hook.current.result).toBeNull();
    act(() => endRun("flappy-bird", 8));
    expect(hook.current.result).toMatchObject({
      score: 8,
      starsBefore: 0,
      starsAfter: 2,
      isNewStar: true,
      runStars: 2,
    });
    act(() => endRun("flappy-bird", 3));
    expect(hook.current.result).toMatchObject({
      starsBefore: 2,
      starsAfter: 2,
      isNewStar: false,
      runStars: 1,
    });
    act(() => hook.current.dismiss());
    expect(hook.current.result).toBeNull();
  });
});

describe("NoticeToaster", () => {
  it("bildirimleri tek tek gösterir ve notices_ack ile onaylar", () => {
    vi.useFakeTimers();
    const acks = vi.fn();
    const off = onEvent("notices_ack", acks);
    act(() => endRun("flappy-bird", 15)); // new_star + 3 çıkartma
    const before = getProgress().inbox.length;
    expect(before).toBeGreaterThan(1);
    render(<NoticeToaster />);
    expect(document.querySelectorAll(".pr-toast")).toHaveLength(1);
    const shown = new Set<string>();
    for (let i = 0; i < before + 1; i++) {
      const label = document.querySelector(".pr-toast")?.getAttribute("class");
      if (label) shown.add(`${i}:${label}`);
      act(() => {
        vi.advanceTimersByTime(5_000);
      });
    }
    expect(acks).toHaveBeenCalledTimes(before);
    expect(shown.size).toBe(before);
    expect(getProgress().inbox).toEqual([]);
    off();
  });

  it("çıkartma 1 sn sonra kendiliğinden açılır ve adı söylenir (sürükleme yok)", () => {
    vi.useFakeTimers();
    act(() => {
      trackEvent({ type: "app_open" });
    });
    expect(getProgress().inbox.map((n) => n.kind)).toEqual(["sticker"]);
    render(<NoticeToaster />);
    const toast = document.querySelector(".pr-toast--sticker");
    expect(toast?.classList.contains("is-revealed")).toBe(false);
    act(() => {
      vi.advanceTimersByTime(STICKER_REVEAL_MS);
    });
    expect(
      document
        .querySelector(".pr-toast--sticker")
        ?.classList.contains("is-revealed"),
    ).toBe(true);
    expect(vi.mocked(speak).mock.calls.at(-1)?.[0]).toMatch(/^Yeni çıkartma!/);
  });

  it("quests_all_done göstermez (ChapterEnd'e bırakır)", () => {
    const day = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Istanbul",
    }).format(new Date());
    act(() => {
      trackEvent({
        type: "quests_set",
        day,
        items: [{ id: `${day}:0`, kind: "extra", slug: "pong", done: false }],
      });
      endRun("pong", 0);
    });
    const ids = getProgress()
      .inbox.filter((n) => n.kind !== "quests_all_done")
      .map((n) => n.id);
    act(() => {
      trackEvent({ type: "notices_ack", ids });
    });
    expect(getProgress().inbox.map((n) => n.kind)).toEqual(["quests_all_done"]);
    render(<NoticeToaster />);
    expect(document.querySelector(".pr-toast")).toBeNull();
    expect(getProgress().inbox).toHaveLength(1);
  });
});
