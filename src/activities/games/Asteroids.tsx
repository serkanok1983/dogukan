"use client";

import { useEffect, useRef, useState } from "react";
import { mountClassicAsteroids } from "./asteroids/mountClassicAsteroids";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { useGameScore } from "@/hooks/useGameScore";
import { useCanvasFit } from "@/hooks/useCanvasFit";
import { ScoreHud } from "@/components/ScoreHud";
import { GameTouchBar } from "@/components/GameTouchBar";

const GAME_SLUG = "asteroids";
const GAME_W = 760;
const GAME_H = 570;

export function Asteroids() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const scoreGame = useGameScore(GAME_SLUG);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const submitted = useRef(false);

  useCanvasFit(canvasRef, GAME_W, GAME_H, { hudRef, minWidth: 280 });

  useEffect(() => {
    bestRef.current = scoreGame.selfHigh;
    setBest(scoreGame.selfHigh);
  }, [scoreGame.selfHigh]);

  const reset = () => {
    scoreRef.current = 0;
    submitted.current = false;
    setScore(0);
    setOver(false);
    setGameKey((k) => k + 1);
    scoreGame.resetMilestones();
  };

  useGameBoot(reset);

  useEffect(() => {
    if (over && !submitted.current) {
      submitted.current = true;
      void scoreGame.submitFinal(score);
    }
  }, [over, score, scoreGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cleanup = mountClassicAsteroids(
      canvas,
      {
        onScore: (s) => {
          scoreRef.current = s;
          setScore(s);
        },
        onGameOver: (s) => {
          scoreRef.current = s;
          setScore(s);
          setOver(true);
          if (!submitted.current) {
            submitted.current = true;
            void scoreGame.submitFinal(s);
          }
        },
        getHighScore: () => bestRef.current,
        setHighScore: (n) => {
          bestRef.current = n;
          setBest(n);
        },
      },
      () => running && !over,
    );

    return cleanup;
  }, [running, over, gameKey, scoreGame]);

  return (
    <div className="game-panel canvas-game acelya-game asteroids-game fullscreen-game">
      <div ref={hudRef} className="acelya-hud">
        <ScoreHud
          score={score}
          selfHigh={scoreGame.selfHigh}
          rivalHigh={scoreGame.rivalHigh}
          rivalName={scoreGame.rivalName}
        />
        <p className="round-label">
          En iyi: {Math.max(best, score)} · ← → dön · ↑ itiş · Space ateş
        </p>
        {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca uzay savaşı başlar</p>}
      </div>
      <div className="acelya-game-stage">
        <canvas
          ref={canvasRef}
          width={GAME_W}
          height={GAME_H}
          className="game-canvas touch-canvas asteroids-canvas"
        />
      </div>
      <GameTouchBar gameId="asteroids" />
      {over && (
        <div className="game-over">
          <p>☄️ Oyun bitti! Skor: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
