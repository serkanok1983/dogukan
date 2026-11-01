import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GameSessionProvider } from "@/lib/gameSession";
import { stubCanvasAndFrames } from "./canvasStub";

const scoreApi = vi.hoisted(() => ({
  player: null,
  playerName: "",
  rivalName: "",
  selfHigh: 0,
  rivalHigh: 0,
  submitFinal: async () => undefined,
  checkMilestone: async () => {},
  resetMilestones: () => {},
  reportLevel: () => {},
}));
vi.mock("@/hooks/useGameScore", () => ({ useGameScore: () => scoreApi }));

import { Tetris } from "../Tetris";

describe("Tetris", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("Başla'dan önce çizim döngüsü boş tahtayı hatasız çizer", () => {
    const { runFrames, frames } = stubCanvasAndFrames();
    render(
      <GameSessionProvider active={false}>
        <Tetris />
      </GameSessionProvider>,
    );
    expect(frames.length).toBeGreaterThan(0);
    expect(() => act(() => runFrames())).not.toThrow();
    // Döngü kendini yeniden kurdu (hata döngüyü durdurmadı).
    expect(frames.length).toBeGreaterThan(0);
    expect(() => act(() => runFrames())).not.toThrow();
  });

  it("Başla'dan sonra taş düşerken de hata atmaz", () => {
    const { runFrames } = stubCanvasAndFrames();
    render(
      <GameSessionProvider active>
        <Tetris />
      </GameSessionProvider>,
    );
    const t0 = performance.now();
    for (let i = 1; i <= 5; i++) {
      expect(() => act(() => runFrames(t0 + i * 1000))).not.toThrow();
    }
  });
});
