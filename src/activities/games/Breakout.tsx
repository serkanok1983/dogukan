"use client";

import { useEffect, useRef, useState } from "react";
import { acelyaSounds } from "@/lib/acelyaSounds";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { GameTouchBar } from "@/components/GameTouchBar";

const GAME_SLUG = "tugla-kir";
const GAME_W = 800;
const GAME_H = 500;

type Brick = { x: number; y: number; w: number; h: number; color: string; status: number };

export function Breakout() {
  const active = useGameActive();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const juiceRef = useRef(createGameJuice());
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const paddleRef = useRef({ x: 350, y: 480, w: 100, h: 10, speed: 50 });
  const ballRef = useRef({ x: 400, y: 250, dx: 4, dy: -4, r: 8 });
  const bricksRef = useRef<Brick[]>([]);
  const scoreRef = useRef(0);
  const destroyedRef = useRef(0);
  const overRef = useRef(false);

  const createBricks = () => {
    const bricks: Brick[] = [];
    for (let c = 0; c < 8; c++) {
      for (let r = 0; r < 5; r++) {
        bricks.push({
          x: c * 100 + 10,
          y: r * 30 + 30,
          w: 80,
          h: 20,
          color: `hsl(${Math.random() * 360}, 100%, 50%)`,
          status: 1,
        });
      }
    }
    bricksRef.current = bricks;
    destroyedRef.current = 0;
  };

  const reset = () => {
    paddleRef.current = { x: 350, y: 480, w: 100, h: 10, speed: 50 };
    ballRef.current = { x: 400, y: 250, dx: 4, dy: -4, r: 8 };
    scoreRef.current = 0;
    overRef.current = false;
    submitted.current = false;
    createBricks();
    setScore(0);
    setOver(false);
    setWon(false);
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const fx = juiceRef.current;

    const onKey = (e: KeyboardEvent) => {
      const p = paddleRef.current;
      if (e.key === "ArrowLeft" && p.x > 0) p.x -= p.speed;
      if (e.key === "ArrowRight" && p.x < GAME_W - p.w) p.x += p.speed;
    };

    const cssToX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * GAME_W;
    };
    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      if (!e.touches.length) return;
      const x = cssToX(e.touches[0].clientX);
      const p = paddleRef.current;
      p.x = Math.max(0, Math.min(GAME_W - p.w, x - p.w / 2));
    };

    document.addEventListener("keydown", onKey);
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    canvas.addEventListener("touchmove", onTouch, { passive: false });

    let raf = 0;
    const loop = () => {
      if (active && !overRef.current) {
        const ball = ballRef.current;
        const paddle = paddleRef.current;
        ball.x += ball.dx;
        ball.y += ball.dy;

        if (ball.x < 0 || ball.x > GAME_W) ball.dx *= -1;
        if (ball.y < 0) ball.dy *= -1;

        if (ball.y > GAME_H) {
          overRef.current = true;
          setOver(true);
          fx.shakeScreen(12);
          acelyaSounds.explode();
        }

        if (
          ball.y > paddle.y - ball.r &&
          ball.x > paddle.x &&
          ball.x < paddle.x + paddle.w
        ) {
          ball.dy *= -1;
          acelyaSounds.hit();
        }

        for (const b of bricksRef.current) {
          if (
            b.status &&
            ball.x > b.x &&
            ball.x < b.x + b.w &&
            ball.y > b.y &&
            ball.y < b.y + b.h
          ) {
            ball.dy *= -1;
            b.status = 0;
            destroyedRef.current++;
            acelyaSounds.explode();
            fx.burst(b.x + b.w / 2, b.y + b.h / 2, b.color, 18);
            fx.popScore(b.x + b.w / 2, b.y, "+10");
            scoreRef.current += 10;
            setScore(scoreRef.current);
            void scoreGame.checkMilestone(scoreRef.current);
            if (destroyedRef.current % 10 === 0) {
              ball.dx *= 1.1;
              ball.dy *= 1.1;
            }
          }
        }

        if (bricksRef.current.every((b) => !b.status)) {
          overRef.current = true;
          setWon(true);
          setOver(true);
          fx.flashScreen(0.35);
          fx.shakeScreen(8);
          void scoreGame.submitFinal(scoreRef.current);
        }
      }

      ctx.clearRect(0, 0, GAME_W, GAME_H);
      ctx.fillStyle = "#1e3a8a";
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      fx.wrapDraw(ctx, GAME_W, GAME_H, () => {
        const paddle = paddleRef.current;
        const ball = ballRef.current;
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
        ctx.beginPath();
        ctx.fillStyle = "#fff";
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();
        for (const b of bricksRef.current) {
          if (b.status) {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);
          }
        }
      });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      canvas.removeEventListener("touchstart", onTouch);
      canvas.removeEventListener("touchmove", onTouch);
    };
  }, [active, scoreGame]);

  return (
    <div className="game-panel canvas-game acelya-game">
      <ScoreHud score={score} selfHigh={scoreGame.selfHigh} rivalHigh={scoreGame.rivalHigh} rivalName={scoreGame.rivalName} />
      <p className="round-label">Tuğlaları kır, topu düşürme!</p>
      {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca oyun başlar</p>}
      <canvas ref={canvasRef} width={GAME_W} height={GAME_H} className="game-canvas touch-canvas" />
      <GameTouchBar gameId="breakout" />
      {over && (
        <div className="game-over">
          <p>{won ? "🎉 Tüm tuğlaları kırdın!" : "💥 Top düştü!"} Skor: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
