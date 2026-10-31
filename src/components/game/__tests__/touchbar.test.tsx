import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GameTouchBar, TOUCH_LAYOUT_IDS, touchLayoutZones } from "@/components/GameTouchBar";

describe("GameTouchBar", () => {
  it("eski düzen anahtarları korunur", () => {
    expect([...TOUCH_LAYOUT_IDS].sort()).toEqual(
      ["asteroids", "breakout", "dovus-arenasi", "flappy-bird", "pinball", "pong", "snake", "super-ayi", "tetris"].sort(),
    );
  });

  it("her düzen en fazla iki başparmak kümesi kullanır", () => {
    for (const id of TOUCH_LAYOUT_IDS) {
      const zones = touchLayoutZones(id);
      expect(zones.length).toBeGreaterThan(0);
      expect(zones.length).toBeLessThanOrEqual(2);
      if (zones.includes("full")) expect(zones).toEqual(["full"]);
    }
  });

  it("korunan sınıfları taşır ve basılınca tuş olayı üretir", () => {
    const { container } = render(<GameTouchBar gameId="super-ayi" />);
    const bar = container.querySelector(".game-touch-bar.is-visible");
    expect(bar).not.toBeNull();
    expect(container.querySelector(".gf-zone-left")?.children.length).toBe(2);
    expect(container.querySelector(".gf-zone-right")?.children.length).toBe(2);
    expect(container.querySelector("button.touch-fire")).not.toBeNull();

    const seen: string[] = [];
    const onKey = (e: KeyboardEvent) => seen.push(`${e.type}:${e.code}`);
    document.addEventListener("keydown", onKey);
    document.addEventListener("keyup", onKey);
    const jump = container.querySelector<HTMLButtonElement>('button[aria-label="Zıpla"]')!;
    jump.setPointerCapture = vi.fn();
    fireEvent.pointerDown(jump, { pointerId: 1 });
    fireEvent.pointerUp(jump, { pointerId: 1 });
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("keyup", onKey);
    expect(seen).toEqual(["keydown:ArrowUp", "keyup:ArrowUp"]);
  });

  it("bilinmeyen oyun için hiçbir şey çizmez", () => {
    const { container } = render(<GameTouchBar gameId="yok" />);
    expect(container.innerHTML).toBe("");
  });
});
