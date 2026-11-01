import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ctl = vi.hoisted(() => ({ fill: true }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/aktivite/super-ayi/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/lib/speech", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/speech")>();
  return { ...actual, speak: vi.fn(), unlockAudio: vi.fn() };
});

vi.mock("@/activities/engine/ExerciseSession", async () => {
  const { trackEvent } = await import("@/lib/progress/events");
  return {
    ExerciseSession: (p: { slug: string; skill: string; onDone?: () => void }) => (
      <button
        type="button"
        data-testid="exercise"
        onClick={() => {
          if (ctl.fill)
            trackEvent({
              type: "exercise_set_end",
              slug: p.slug,
              skill: p.skill as never,
              correct: 3,
              total: 3,
              firstTry: 3,
              mode: "gate",
            });
          p.onDone?.();
        }}
      >
        soru
      </button>
    ),
  };
});

import { ActivityShell } from "@/components/ActivityShell";
import { JAR_MAP_LINE } from "@/components/progress/RewardSheet";
import { _resetProgressSessionForTests, markHoneyOffered } from "@/components/progress/session";
import { VOICE } from "@/content/voice";
import type { ActivityLearning } from "@/lib/activityLearning.types";
import { loginAs, logout } from "@/lib/auth";
import { useGameActive, useRegisterRestart } from "@/lib/gameSession";
import { trackEvent } from "@/lib/progress/events";
import { _resetProgressForTests, getProgress } from "@/lib/progress/store";
import { emptyDay, emptyProgress } from "@/lib/progress/time";
import type { DayUsage } from "@/lib/progress/types";
import { _resetClockForTests, closeCoplayPrompt, requestCoplay, startCoplay } from "@/lib/sessionClock";
import { DEFAULT_SETTINGS, updateSettings } from "@/lib/settings";

const MON = "2026-11-02";
const at = (hhmm: string) => new Date(`${MON}T${hhmm}:00+03:00`).getTime();
const SLUG = "super-ayi";
const LEARNING = { guide: { short: "Zıpla ve topla!", intro: "Zıpla ve topla!" } } as unknown as ActivityLearning;
const noop = () => {};

function FakeGame() {
  useRegisterRestart(noop);
  const active = useGameActive();
  return (
    <button
      type="button"
      data-active={String(active)}
      data-testid="game"
      onClick={() => trackEvent({ type: "run_end", slug: SLUG, score: 5, durationMs: 1000 })}
    >
      bitir
    </button>
  );
}

function shell() {
  return render(
    <ActivityShell slug={SLUG} title="Süper Ayı" learning={LEARNING}>
      <FakeGame />
    </ActivityShell>,
  );
}

function setup(time: number, today: Partial<DayUsage> = {}) {
  vi.useFakeTimers({ shouldAdvanceTime: false });
  vi.setSystemTime(time);
  logout();
  _resetProgressForTests();
  loginAs("dogukan");
  const p = emptyProgress("dogukan", at("09:00"));
  p.days[MON] = { ...emptyDay(), ...today };
  _resetProgressForTests(p);
  _resetClockForTests();
  updateSettings({ ...DEFAULT_SETTINGS, graceUntil: "", firstBreakDone: true });
}

function day(): DayUsage {
  return getProgress().days[MON] ?? emptyDay();
}

function playFor(ms: number) {
  for (let t = 0; t < ms; t += 5_000) {
    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
      vi.advanceTimersByTime(Math.min(5_000, ms - t));
    });
  }
}

beforeEach(() => {
  ctl.fill = true;
  _resetProgressSessionForTests();
});

afterEach(() => {
  cleanup();
  _resetClockForTests();
  vi.useRealTimers();
});

describe("ActivityShell + GameFrame — saat yalnızca oyun gerçekten çalışırken", () => {
  it("StartCard ve RewardSheet açıkken arcade süresi (kavanoz) azalmaz", () => {
    setup(at("10:00"));
    shell();
    playFor(20_000);
    expect(day().arcadeSec).toBe(0);
    fireEvent.click(screen.getByText(/Başla/));
    playFor(20_000);
    expect(day().arcadeSec).toBe(20);
    fireEvent.click(screen.getByTestId("game"));
    expect(screen.getByText("▶ Tekrar")).toBeTruthy();
    playFor(30_000);
    expect(day().arcadeSec).toBe(20);
    fireEvent.click(screen.getByText("▶ Tekrar"));
    playFor(10_000);
    expect(day().arcadeSec).toBe(30);
  });

  it("kaplama oyunu keserse oyun durur; kapanınca 3-2-1 ile sürer", () => {
    setup(at("10:00"));
    const { container } = shell();
    fireEvent.click(screen.getByText(/Başla/));
    expect(screen.getByTestId("game").dataset.active).toBe("true");
    act(() => requestCoplay());
    expect(screen.getByTestId("game").dataset.active).toBe("false");
    playFor(10_000);
    expect(day().arcadeSec).toBe(0);
    act(() => closeCoplayPrompt());
    expect(container.querySelector(".gf-count")?.textContent).toBe("3");
    expect(screen.getByTestId("game").dataset.active).toBe("false");
    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    expect(container.querySelector(".gf-pause")).toBeNull();
    expect(screen.getByTestId("game").dataset.active).toBe("true");
  });
});

describe("ActivityShell — kavanoz kapısı (K1/K4)", () => {
  const EMPTY = { arcadeSec: 16 * 60, totalSec: 16 * 60 };

  it("Bal topla oturumda en fazla 2 kez (RewardSheet ile ortak sayaç); sonra yalnız Harita", () => {
    setup(at("10:00"), EMPTY);
    markHoneyOffered(); // RewardSheet bir kez sundu
    const first = shell();
    expect(screen.getByTestId("exercise")).toBeTruthy();
    first.unmount();
    shell();
    expect(screen.queryByTestId("exercise")).toBeNull();
    expect(screen.queryByText(/Başla/)).toBeNull();
    expect(screen.getAllByText(JAR_MAP_LINE).length).toBeGreaterThan(0);
    expect(screen.getByText(/Harita$/)).toBeTruthy();
  });

  it("tavan doluysa Bal topla hiç sunulmaz ve sayaç harcanmaz", () => {
    setup(at("10:00"), { arcadeSec: 26 * 60, honeyEarned: 5, totalSec: 26 * 60 });
    shell();
    expect(screen.queryByTestId("exercise")).toBeNull();
    expect(screen.queryByText(/Başla/)).toBeNull();
    cleanup();
    setup(at("10:00"), EMPTY);
    shell();
    expect(screen.getByTestId("exercise")).toBeTruthy();
  });

  it("Bal topla hücre eklerse oyun başlar", () => {
    setup(at("10:00"), EMPTY);
    shell();
    fireEvent.click(screen.getByTestId("exercise"));
    expect(day().honeyEarned).toBe(1);
    expect(screen.queryByRole("dialog", { name: "Süper Ayı" })).toBeNull();
    expect(screen.getByTestId("game").dataset.active).toBe("true");
  });

  it("Bal topla bitti ama kavanozda hücre yok → oyun başlamaz, yalnız Harita", () => {
    setup(at("10:00"), EMPTY);
    ctl.fill = false;
    shell();
    fireEvent.click(screen.getByTestId("exercise"));
    expect(screen.queryByTestId("exercise")).toBeNull();
    expect(screen.queryByText(/Başla/)).toBeNull();
    expect(screen.getByTestId("game").dataset.active).toBe("false");
  });

  it("birlikte oyunda boş kavanoz kapı değildir", () => {
    setup(at("10:00"), EMPTY);
    startCoplay();
    shell();
    expect(screen.queryByTestId("exercise")).toBeNull();
    expect(screen.getByText(/Başla/)).toBeTruthy();
  });

  it("akşam −5 dk uyarısında da arcade uyur", () => {
    setup(at("20:05"), { totalSec: 26 * 60 });
    shell();
    expect(screen.queryByText(/Başla/)).toBeNull();
    expect(screen.getAllByText(VOICE.eveningTile).length).toBeGreaterThan(0);
  });
});
