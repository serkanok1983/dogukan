"use client";

import { useEffect, useRef, useState } from "react";
import { acelyaSounds } from "@/lib/acelyaSounds";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { GameTouchBar } from "@/components/GameTouchBar";
import { useCanvasFit } from "@/hooks/useCanvasFit";

const GAME_SLUG = "tugla-kir";
const GAME_W = 900;
const GAME_H = 560;
const BRICK_COLS = 10;
const BRICK_ROWS = 6;
const BRICK_GAP = 8;

type Brick = { x: number; y: number; w: number; h: number; color: string; status: number };

export function Breakout() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  useCanvasFit(canvasRef, GAME_W, GAME_H, { hudRef, minWidth: 300 });
  const juiceRef = useRef(createGameJuice());
  const keysRef = useRef({ left: false, right: false });
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const paddleRef = useRef({ x: GAME_W / 2 - 64, y: GAME_H - 34, w: 128, h: 14, speed: 610 });
  const ballRef = useRef({ x: GAME_W / 2, y: GAME_H - 58, dx: 320, dy: -320, r: 9 });
  const bricksRef = useRef<Brick[]>([]);
  const scoreRef = useRef(0);
  const overRef = useRef(false);
  const lastTs = useRef(0);

  const createBricks = () => {
    const bricks: Brick[] = [];
    const totalGap = BRICK_GAP * (BRICK_COLS - 1);
    const brickW = Math.floor((GAME_W - 44 - totalGap) / BRICK_COLS);
    const brickH = 24;
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: 22 + c * (brickW + BRICK_GAP),
          y: 44 + r * (brickH + BRICK_GAP),
          w: brickW,
          h: brickH,
          color: `hsl(${(r * 48 + c * 12) % 360} 90% 58%)`,
          status: 1,
        });
      }
    }
    bricksRef.current = bricks;
  };

  const reset = () => {
    paddleRef.current = { x: GAME_W / 2 - 64, y: GAME_H - 34, w: 128, h: 14, speed: 610 };
    ballRef.current = { x: GAME_W / 2, y: GAME_H - 58, dx: 320, dy: -320, r: 9 };
    scoreRef.current = 0;
    overRef.current = false;
    submitted.current = false;
    lastTs.current = 0;
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

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft") keysRef.current.left = true;
      if (e.code === "ArrowRight") keysRef.current.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft") keysRef.current.left = false;
      if (e.code === "ArrowRight") keysRef.current.right = false;
    };
    const cssToX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * GAME_W;
    };
    const onPointer = (e: PointerEvent) => {
      const p = paddleRef.current;
      const x = cssToX(e.clientX);
      p.x = Math.max(0, Math.min(GAME_W - p.w, x - p.w / 2));
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointer);
    canvas.addEventListener("pointermove", onPointer);

    let raf = 0;
    const loop = (ts: number) => {
      const dt = Math.min(0.025, lastTs.current ? (ts - lastTs.current) / 1000 : 1 / 60);
      lastTs.current = ts;
      if (running && !overRef.current) {
        const ball = ballRef.current;
        const paddle = paddleRef.current;
        const keys = keysRef.current;
        const move = paddle.speed * dt;
        if (keys.left) paddle.x = Math.max(0, paddle.x - move);
        if (keys.right) paddle.x = Math.min(GAME_W - paddle.w, paddle.x + move);

        ball.x += ball.dx * dt;
        ball.y += ball.dy * dt;

        if (ball.x < ball.r) {
          ball.x = ball.r;
          ball.dx = Math.abs(ball.dx);
          acelyaSounds.hit();
        } else if (ball.x > GAME_W - ball.r) {
          ball.x = GAME_W - ball.r;
          ball.dx = -Math.abs(ball.dx);
          acelyaSounds.hit();
        }
        if (ball.y < ball.r) {
          ball.y = ball.r;
          ball.dy = Math.abs(ball.dy);
          acelyaSounds.hit();
        }
        if (ball.y - ball.r > GAME_H) {
          overRef.current = true;
          setOver(true);
          fx.shakeScreen(14);
          fx.flashScreen(0.26);
          acelyaSounds.explode();
        }

        if (
          ball.dy > 0 &&
          ball.y + ball.r >= paddle.y &&
          ball.y + ball.r <= paddle.y + paddle.h + 8 &&
          ball.x >= paddle.x - ball.r &&
          ball.x <= paddle.x + paddle.w + ball.r
        ) {
          const rel = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
          const angle = rel * 1.05;
          const speed = Math.min(560, Math.hypot(ball.dx, ball.dy) * 1.015);
          ball.dx = Math.sin(angle) * speed;
          ball.dy = -Math.abs(Math.cos(angle) * speed);
          ball.y = paddle.y - ball.r - 1;
          acelyaSounds.hit();
          fx.burst(ball.x, paddle.y, "#fca5a5", 8);
        }

        for (const b of bricksRef.current) {
          if (!b.status) continue;
          if (
            ball.x + ball.r > b.x &&
            ball.x - ball.r < b.x + b.w &&
            ball.y + ball.r > b.y &&
            ball.y - ball.r < b.y + b.h
          ) {
            const fromLeft = Math.abs(ball.x + ball.r - b.x);
            const fromRight = Math.abs(b.x + b.w - (ball.x - ball.r));
            const fromTop = Math.abs(ball.y + ball.r - b.y);
            const fromBottom = Math.abs(b.y + b.h - (ball.y - ball.r));
            const m = Math.min(fromLeft, fromRight, fromTop, fromBottom);
            if (m === fromLeft || m === fromRight) ball.dx *= -1;
            else ball.dy *= -1;
            b.status = 0;
            acelyaSounds.explode();
            fx.burst(b.x + b.w / 2, b.y + b.h / 2, b.color, 18);
            fx.popScore(b.x + b.w / 2, b.y - 6, "+10");
            scoreRef.current += 10;
            setScore(scoreRef.current);
            if (scoreRef.current % 100 === 0) void scoreGame.checkMilestone(scoreRef.current);
            break;
          }
        }

        if (bricksRef.current.every((b) => b.status === 0)) {
          overRef.current = true;
          setWon(true);
          setOver(true);
          fx.flashScreen(0.4);
          fx.shakeScreen(10);
          acelyaSounds.explode();
        }
      }

      const bg = ctx.createLinearGradient(0, 0, 0, GAME_H);
      bg.addColorStop(0, "#1e1b4b");
      bg.addColorStop(1, "#0f172a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      fx.wrapDraw(ctx, GAME_W, GAME_H, () => {
        const paddle = paddleRef.current;
        const ball = ballRef.current;
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(paddle.x + 8, paddle.y + 2, paddle.w - 16, 3);
        ctx.beginPath();
        ctx.fillStyle = "#fff";
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();
        for (const b of bricksRef.current) {
          if (!b.status) continue;
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.fillStyle = "rgba(255,255,255,0.28)";
          ctx.fillRect(b.x + 3, b.y + 3, b.w - 6, 4);
        }
      });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("pointermove", onPointer);
    };
  }, [running, scoreGame]);

  return (
    <div className="game-panel canvas-game acelya-game fullscreen-game">
      <div ref={hudRef} className="acelya-hud">
        <ScoreHud score={score} selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
        playerName={scoreGame.playerName} />
        <p className="round-label">Breakout · hassas raket · hızlı refleks</p>
        {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca oyun başlar</p>}
      </div>
      <div className="acelya-game-stage">
        <canvas ref={canvasRef} width={GAME_W} height={GAME_H} className="game-canvas touch-canvas breakout-canvas" />
      </div>
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
