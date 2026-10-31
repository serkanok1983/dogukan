import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CelebrationProvider,
  TOAST_MS,
  useCelebration,
} from "@/components/CelebrationProvider";
import { GameSessionProvider } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";

type Snapshot = { cel: ReturnType<typeof useCelebration>; running: boolean };

function Probe({ onValue }: { onValue: (s: Snapshot) => void }) {
  const cel = useCelebration();
  const running = useGameRunning();
  useEffect(() => {
    onValue({ cel, running });
  });
  return null;
}

function setup() {
  const box: { s?: Snapshot } = {};
  render(
    <CelebrationProvider>
      <GameSessionProvider active>
        <Probe
          onValue={(s) => {
            box.s = s;
          }}
        />
      </GameSessionProvider>
    </CelebrationProvider>,
  );
  return box;
}

describe("CelebrationProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("toast oyunu durdurmaz, tam ekran katman açmaz ve kendiliğinden kaybolur", () => {
    vi.useFakeTimers();
    const box = setup();
    expect(box.s!.running).toBe(true);

    act(() => box.s!.cel.toast("Süper!"));
    expect(box.s!.cel.isCelebrating).toBe(false);
    expect(box.s!.running).toBe(true);
    expect(screen.getByRole("status").textContent).toBe("Süper!");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.classList.contains("game-celebrating")).toBe(false);

    act(() => {
      vi.advanceTimersByTime(TOAST_MS + 10);
    });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("toast süresi 1.2–1.8 sn aralığındadır", () => {
    expect(TOAST_MS).toBeGreaterThanOrEqual(1200);
    expect(TOAST_MS).toBeLessThanOrEqual(1800);
  });

  it("show tam ekran kutlamadır ve oyunu duraklatır", () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", () => 0);
    vi.stubGlobal("cancelAnimationFrame", () => {});
    const box = setup();
    act(() => box.s!.cel.show("Yeni rekor!"));
    expect(box.s!.cel.isCelebrating).toBe(true);
    expect(box.s!.running).toBe(false);
    expect(screen.getByRole("dialog")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(box.s!.cel.isCelebrating).toBe(false);
  });

  it("bağlam değeri yeniden çizimlerde kararlıdır (memo)", () => {
    const seen = new Set<unknown>();
    function Collect() {
      const value = useCelebration();
      useEffect(() => {
        seen.add(value);
      });
      return null;
    }
    const { rerender } = render(
      <CelebrationProvider>
        <Collect />
      </CelebrationProvider>,
    );
    rerender(
      <CelebrationProvider>
        <Collect />
      </CelebrationProvider>,
    );
    expect(seen.size).toBe(1);
  });
});
