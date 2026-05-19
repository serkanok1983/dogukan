"use client";

import { useEffect, useRef, useState } from "react";
import { mountClassicAsteroids } from "./asteroids/mountClassicAsteroids";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { GameTouchBar } from "@/components/GameTouchBar";

const GAME_SLUG = "asteroids";
const GAME_W = 760;
const GAME_H = 570;

export function Asteroids() {
  const active = useGameActive();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const scoreGame = useGameScore(GAME_SLUG);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const submitted = useRef(false);

  useEffect(() => {
    bestRef.current = scoreGame.selfHigh;
    setBest(scoreGame.selfHigh);
  }, [scoreGame.selfHigh]);

  const reset = () => {
    scoreRef.current = 0;
    submitted.current = false;
    setScore(0);
    scoreGame.resetMilestones();
  };

  useGameBoot(reset);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cleanup = mountClassicAsteroids(
      canvas,
      {
        onScore: (s) => {
          scoreRef.current = s;
          setScore(s);
          void scoreGame.checkMilestone(s);
        },
        onGameOver: (s) => {
          scoreRef.current = s;
          setScore(s);
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
      () => active,
    );

    return cleanup;
  }, [active, scoreGame]);

  return (
    <div className="game-panel canvas-game acelya-game asteroids-game">
      <ScoreHud score={score} selfHigh={scoreGame.selfHigh} rivalHigh={scoreGame.rivalHigh} rivalName={scoreGame.rivalName} />
      <p className="round-label">
        En iyi: {Math.max(best, score)} · ← → dön · ↑ itiş · Space ateş
      </p>
      {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca uzay savaşı başlar</p>}
      <canvas ref={canvasRef} width={GAME_W} height={GAME_H} className="game-canvas touch-canvas asteroids-canvas" />
      <GameTouchBar gameId="asteroids" />
    </div>
  );
}
