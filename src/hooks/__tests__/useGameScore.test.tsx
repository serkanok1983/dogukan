import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameScore } from "@/hooks/useGameScore";
import { loginAs, logout } from "@/lib/auth";
import { checkLiveMilestone, fetchGameScores, recordScore } from "@/lib/leaderboard";
import { onEvent } from "@/lib/progress/events";
import { _resetProgressForTests, getProgress } from "@/lib/progress/store";
import { updateSettings } from "@/lib/settings";

const toast = vi.fn();
const show = vi.fn();

vi.mock("@/components/CelebrationProvider", () => ({
  useCelebration: () => ({ show, toast, isCelebrating: false }),
}));

vi.mock("@/lib/leaderboard", () => ({
  fetchGameScores: vi.fn(async () => ({ dogukan: 10, serkan: 99 })),
  subscribeGameScores: vi.fn(() => null),
  recordScore: vi.fn(
    async (
      _slug: string,
      _player: string,
      score: number,
      opts?: { rivalVisible?: boolean },
    ) => ({
      score,
      isNewRecord: true,
      beatRival: true,
      celebrate: true,
      message: `🏆 ${score}! Dikkatle oynadın.${opts?.rivalVisible ? " · 🏆 Baba: 99" : ""}`,
    }),
  ),
  checkLiveMilestone: vi.fn(
    async (
      _slug: string,
      _player: string,
      score: number,
      _last: number,
      opts?: { rivalVisible?: boolean },
    ) =>
      opts?.rivalVisible && score < 200
        ? // Eski sürümün rakip türü: kanca bunu asla göstermemeli.
          {
            celebrate: true,
            message: "Vay be! Serkan'ı geçtin! 🏆",
            mark: score,
            kind: "rival",
          }
        : {
            celebrate: true,
            message: "⭐ 500! Dikkatle baktın!",
            mark: 500,
            kind: "mark",
          },
  ),
}));

const RIVAL = /Serkan|geçtin|yakaladın|Aferin|Süpersin|Vay be|Baba/;

beforeEach(() => {
  logout();
  _resetProgressForTests();
  localStorage.clear();
  updateSettings({ rivalVisible: false });
  loginAs("dogukan");
  toast.mockClear();
  show.mockClear();
  vi.mocked(recordScore).mockClear();
  vi.mocked(checkLiveMilestone).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

async function mount(slug = "tetris") {
  const hook = renderHook(() => useGameScore(slug));
  await act(async () => {});
  return hook;
}

describe("useGameScore", () => {
  it("açık koşu başına tek run_end (Tetris çift gönderimi)", async () => {
    const ends = vi.fn();
    const starts = vi.fn();
    const offEnd = onEvent("run_end", ends);
    const offStart = onEvent("run_start", starts);
    const { result } = await mount();

    act(() => result.current.resetMilestones());
    expect(starts).toHaveBeenCalledTimes(1);
    await act(async () => {
      await Promise.all([
        result.current.submitFinal(1200),
        result.current.submitFinal(1200),
      ]);
    });
    expect(ends).toHaveBeenCalledTimes(1);
    expect(recordScore).toHaveBeenCalledTimes(1);
    expect(getProgress().activities.tetris?.plays).toBe(1);

    act(() => result.current.resetMilestones());
    await act(async () => {
      await result.current.submitFinal(50);
    });
    expect(ends).toHaveBeenCalledTimes(2);
    offEnd();
    offStart();
  });

  it("süre run_start'tan ölçülür; seviye reportLevel'dan ya da opts'tan gelir", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(1_000_000);
    const ends = vi.fn();
    const levels = vi.fn();
    const offEnd = onEvent("run_end", ends);
    const offLevel = onEvent("level_complete", levels);
    const { result } = await mount("super-ayi");
    act(() => result.current.resetMilestones());
    vi.setSystemTime(1_045_000);
    act(() => result.current.reportLevel(3));
    expect(levels).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.submitFinal(400);
    });
    expect(ends.mock.calls[0]?.[0]).toMatchObject({
      slug: "super-ayi",
      score: 400,
      durationMs: 45_000,
      level: 3,
    });
    act(() => result.current.resetMilestones());
    await act(async () => {
      await result.current.submitFinal(10, { level: 7 });
    });
    expect(ends.mock.calls[1]?.[0]).toMatchObject({ level: 7 });
    expect(getProgress().activities["super-ayi"]?.stars).toBe(3);
    offEnd();
    offLevel();
  });

  it("rivalVisible kapalıyken rakip adı/skoru ve rakip metni yok; kutlama toast ile", async () => {
    const { result } = await mount();
    expect(result.current.rivalName).toBe("");
    expect(result.current.rivalHigh).toBe(0);
    expect(result.current.selfHigh).toBe(10);
    act(() => result.current.resetMilestones());
    await act(async () => {
      await result.current.submitFinal(500);
      await result.current.checkMilestone(600);
    });
    expect(show).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledTimes(2);
    for (const [msg] of toast.mock.calls) expect(msg).not.toMatch(RIVAL);
    expect(vi.mocked(recordScore).mock.calls[0]?.[3]).toEqual({
      rivalVisible: false,
    });
  });

  it("rivalVisible açıkken rakip yalnızca nötr sayı; kıyas/kişi övgüsü toast'u yok", async () => {
    updateSettings({ rivalVisible: true });
    const { result } = await mount();
    expect(result.current.rivalName).not.toBe("");
    expect(result.current.rivalHigh).toBe(99);
    await act(async () => {
      await result.current.checkMilestone(150);
    });
    expect(toast).not.toHaveBeenCalled();
    act(() => result.current.resetMilestones());
    await act(async () => {
      await result.current.submitFinal(500);
    });
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast.mock.calls[0]?.[0]).toMatch(/· 🏆 Baba: 99$/);
    expect(toast.mock.calls[0]?.[0]).not.toMatch(
      /Serkan|geçtin|yakaladın|Aferin|Süpersin/,
    );
  });

  it("submitFinal ağı beklemez: rekor toast'u fetchGameScores çözülmeden gelir", async () => {
    const { result } = await mount();
    vi.mocked(fetchGameScores).mockImplementationOnce(() => new Promise(() => {}));
    act(() => result.current.resetMilestones());
    await act(async () => {
      await result.current.submitFinal(700);
    });
    expect(toast).toHaveBeenCalledTimes(1);
  });

  it("ara kutlamalar 12 sn'de bir", async () => {
    const { result } = await mount();
    await act(async () => {
      await result.current.checkMilestone(600);
      await result.current.checkMilestone(700);
    });
    expect(checkLiveMilestone).toHaveBeenCalledTimes(1);
  });

  it("oturum yokken hiçbir şey yazmaz", async () => {
    logout();
    const ends = vi.fn();
    const off = onEvent("run_end", ends);
    const { result } = await mount();
    await act(async () => {
      await result.current.submitFinal(10);
    });
    expect(ends).not.toHaveBeenCalled();
    off();
  });
});
