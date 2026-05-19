"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mountClassicAsteroids, type AsteroidsHooks } from "./asteroids/mountClassicAsteroids";
import { useGameActive } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { useGameScore } from "@/hooks/useGameScore";
import { GameTouchBar } from "@/components/GameTouchBar";

const GAME_SLUG = "asteroids";
const GAME_W = 760;
const GAME_H = 570;

/** Açelya asteroids.html ile aynı canvas yerleşimi */
function useAsteroidsCanvasFit(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  hudRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = () => {
      const hudBottom = hudRef.current?.getBoundingClientRect().bottom ?? 0;
      const touchBar = canvas
        .closest(".asteroids-game")
        ?.querySelector(".game-touch-bar") as HTMLElement | null;
      const touchH = touchBar?.offsetHeight ?? 0;
      const padX = 20;
      const padY = 16;
      const availW = window.innerWidth - padX;
      const availH = window.innerHeight - hudBottom - touchH - padY;
      const scale = Math.min(availW / GAME_W, availH / GAME_H) * 0.98;
      const w = Math.max(280, GAME_W * scale);
      const h = w * (GAME_H / GAME_W);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    fit();
    window.addEventListener("resize", fit);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      vv?.removeEventListener("resize", fit);
    };
  }, [canvasRef, hudRef]);
}

export function Asteroids() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const scoreGame = useGameScore(GAME_SLUG);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const submitted = useRef(false);

  const runningRef = useRef(running);
  const activeRef = useRef(active);
  runningRef.current = running;
  activeRef.current = active;

  useAsteroidsCanvasFit(canvasRef, hudRef);

  useEffect(() => {
    bestRef.current = scoreGame.selfHigh;
  }, [scoreGame.selfHigh]);

  const hooksRef = useRef<AsteroidsHooks>({
    onScore: () => {},
    onGameOver: () => {},
    onNewGame: () => {},
    getHighScore: () => 0,
    setHighScore: () => {},
  });

  hooksRef.current = {
    onScore: (s) => {
      scoreRef.current = s;
      setScore(s);
      if (s > 0 && s % 200 < 50) void scoreGame.checkMilestone(s);
    },
    onGameOver: (s) => {
      scoreRef.current = s;
      setScore(s);
      if (!submitted.current) {
        submitted.current = true;
        void scoreGame.submitFinal(s);
      }
    },
    onNewGame: () => {
      submitted.current = false;
      scoreRef.current = 0;
      setScore(0);
      scoreGame.resetMilestones();
    },
    getHighScore: () => bestRef.current,
    setHighScore: (n) => {
      bestRef.current = n;
    },
  };

  const bridgeRef = useRef<AsteroidsHooks>({
    onScore: (s) => hooksRef.current.onScore(s),
    onGameOver: (s) => hooksRef.current.onGameOver(s),
    onNewGame: () => hooksRef.current.onNewGame?.(),
    getHighScore: () => hooksRef.current.getHighScore(),
    setHighScore: (n) => hooksRef.current.setHighScore(n),
  });

  const isActive = useCallback(() => activeRef.current && runningRef.current, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return mountClassicAsteroids(canvas, bridgeRef.current, isActive);
  }, [isActive]);

  return (
    <div className="asteroids-game">
      <header ref={hudRef} className="asteroids-hud">
        <h1 className="asteroids-title">Asteroids 🚀</h1>
        <p className="asteroids-hint">← → dön · ↑ itiş · Space ateş</p>
        <p className="asteroids-rival">
          Puan: {score} · Rekor: {scoreGame.selfHigh} · {scoreGame.rivalName}:{" "}
          {scoreGame.rivalHigh}
        </p>
        {!active && (
          <p className="game-waiting asteroids-waiting">
            ℹ️ Başla&apos;ya basınca uzay savaşı başlar
          </p>
        )}
      </header>

      <div className="asteroids-stage">
        <canvas
          ref={canvasRef}
          width={GAME_W}
          height={GAME_H}
          className="asteroids-canvas"
          role="img"
          aria-label="Asteroids oyun alanı"
        />
      </div>

      <GameTouchBar gameId="asteroids" />
    </div>
  );
}
