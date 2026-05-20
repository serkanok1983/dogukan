"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { GameTouchBar } from "@/components/GameTouchBar";
import { useCanvasFit } from "@/hooks/useCanvasFit";

const GAME_SLUG = "pinball-space-cadet";
const W = 900;
const H = 560;
const GRAVITY = 980;
const LEFT_FLIPPER_X = 320;
const RIGHT_FLIPPER_X = 580;
const FLIPPER_Y = 500;

type Ball = { x: number; y: number; vx: number; vy: number; r: number; active: boolean };
type Bumper = { x: number; y: number; r: number; score: number; color: string };

const BUMPERS: Bumper[] = [
  { x: 270, y: 160, r: 36, score: 80, color: "#f59e0b" },
  { x: 470, y: 118, r: 30, score: 70, color: "#22d3ee" },
  { x: 650, y: 178, r: 34, score: 80, color: "#f472b6" },
  { x: 370, y: 264, r: 28, score: 60, color: "#4ade80" },
  { x: 555, y: 304, r: 28, score: 60, color: "#fb7185" },
];

export function PinballCadet() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  useCanvasFit(canvasRef, W, H, { hudRef, minWidth: 300 });
  const juiceRef = useRef(createGameJuice());
  const scoreGame = useGameScore(GAME_SLUG);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [over, setOver] = useState(false);
  const submitted = useRef(false);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const overRef = useRef(false);
  const lastTs = useRef(0);
  const leftHeld = useRef(false);
  const rightHeld = useRef(false);
  const launchHeld = useRef(false);
  const launchPower = useRef(0);
  const flashRef = useRef(0);
  const ballRef = useRef<Ball>({ x: W - 42, y: H - 54, vx: 0, vy: 0, r: 9, active: false });

  const resetBall = () => {
    ballRef.current = { x: W - 42, y: H - 54, vx: 0, vy: 0, r: 9, active: false };
    launchPower.current = 0;
  };

  const reset = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    overRef.current = false;
    setOver(false);
    submitted.current = false;
    flashRef.current = 0;
    resetBall();
    scoreGame.resetMilestones();
  }, [scoreGame]);

  useGameBoot(reset);

  useEffect(() => {
    if (over && !submitted.current) {
      submitted.current = true;
      void scoreGame.submitFinal(score);
    }
  }, [over, score, scoreGame]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (e.code === "ArrowLeft" || e.code === "KeyZ") leftHeld.current = down;
      if (e.code === "ArrowRight" || e.code === "KeyX") rightHeld.current = down;
      if (e.code === "Space") launchHeld.current = down;
      if (!down && e.code === "Space" && !ballRef.current.active && !overRef.current) {
        const p = 0.35 + Math.min(1, launchPower.current);
        ballRef.current.active = true;
        ballRef.current.vx = -160 - p * 120;
        ballRef.current.vy = -620 - p * 260;
        sounds.shoot();
        juiceRef.current.shakeScreen(4);
        launchPower.current = 0;
      }
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const fx = juiceRef.current;

    const addScore = (v: number, x: number, y: number) => {
      scoreRef.current += v;
      setScore(scoreRef.current);
      fx.popScore(x, y, `+${v}`);
      if (scoreRef.current % 200 === 0) void scoreGame.checkMilestone(scoreRef.current);
    };

    let raf = 0;
    const loop = (ts: number) => {
      const dt = Math.min(0.024, lastTs.current ? (ts - lastTs.current) / 1000 : 1 / 60);
      lastTs.current = ts;
      if (running && !overRef.current) {
        const b = ballRef.current;
        if (!b.active) {
          b.x = W - 42;
          b.y = H - 54;
          if (launchHeld.current) launchPower.current = Math.min(1, launchPower.current + dt * 1.6);
          else launchPower.current = Math.max(0, launchPower.current - dt * 2.4);
        } else {
          b.vy += GRAVITY * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.vx *= 0.999;

          if (b.x < b.r) {
            b.x = b.r;
            b.vx = Math.abs(b.vx) * 0.98;
            sounds.tap();
          }
          if (b.x > W - 64 - b.r) {
            b.x = W - 64 - b.r;
            b.vx = -Math.abs(b.vx) * 0.98;
            sounds.tap();
          }
          if (b.y < b.r) {
            b.y = b.r;
            b.vy = Math.abs(b.vy) * 0.97;
            sounds.tap();
          }

          for (const bp of BUMPERS) {
            const dx = b.x - bp.x;
            const dy = b.y - bp.y;
            const d = Math.hypot(dx, dy);
            if (d < b.r + bp.r) {
              const nx = dx / (d || 1);
              const ny = dy / (d || 1);
              const speed = Math.max(520, Math.hypot(b.vx, b.vy) * 1.04);
              b.x = bp.x + nx * (b.r + bp.r + 0.2);
              b.y = bp.y + ny * (b.r + bp.r + 0.2);
              b.vx = nx * speed + (Math.random() - 0.5) * 44;
              b.vy = ny * speed;
              addScore(bp.score, bp.x, bp.y - bp.r - 8);
              fx.burst(bp.x, bp.y, bp.color, 16);
              fx.flashScreen(0.08);
              sounds.pop();
              flashRef.current = 6;
            }
          }

          const leftPivot = { x: LEFT_FLIPPER_X, y: FLIPPER_Y };
          const rightPivot = { x: RIGHT_FLIPPER_X, y: FLIPPER_Y };
          const leftAngle = leftHeld.current ? -0.62 : -0.22;
          const rightAngle = rightHeld.current ? Math.PI + 0.62 : Math.PI + 0.22;
          const flipperHit = (pivot: { x: number; y: number }, angle: number) => {
            const tip = { x: pivot.x + Math.cos(angle) * 104, y: pivot.y + Math.sin(angle) * 104 };
            const lx = tip.x - pivot.x;
            const ly = tip.y - pivot.y;
            const t = Math.max(0, Math.min(1, ((b.x - pivot.x) * lx + (b.y - pivot.y) * ly) / (lx * lx + ly * ly)));
            const cx = pivot.x + lx * t;
            const cy = pivot.y + ly * t;
            const d = Math.hypot(b.x - cx, b.y - cy);
            if (d < b.r + 11) {
              const nx = (b.x - cx) / (d || 1);
              const ny = (b.y - cy) / (d || 1);
              const boost = (pivot === leftPivot ? leftHeld.current : rightHeld.current) ? 1.25 : 1;
              const speed = Math.max(520, Math.hypot(b.vx, b.vy) * boost);
              b.vx = nx * speed + Math.cos(angle) * 170;
              b.vy = ny * speed + Math.sin(angle) * 170 - 120;
              b.x = cx + nx * (b.r + 11.5);
              b.y = cy + ny * (b.r + 11.5);
              addScore(15, cx, cy - 8);
              fx.burst(cx, cy, "#fef08a", 8);
              sounds.tap();
            }
          };
          flipperHit(leftPivot, leftAngle);
          flipperHit(rightPivot, rightAngle);

          if (b.y > H + 32) {
            livesRef.current -= 1;
            setLives(livesRef.current);
            fx.shakeScreen(10);
            fx.flashScreen(0.25);
            sounds.gameOver();
            if (livesRef.current <= 0) {
              overRef.current = true;
              setOver(true);
            } else {
              resetBall();
            }
          }
        }
      }

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#111827");
      bg.addColorStop(1, "#1f2937");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(W - 64, 0, 64, H);
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(W - 63, H - 120 + (1 - launchPower.current) * 98, 62, 20);

      for (const bp of BUMPERS) {
        ctx.beginPath();
        ctx.fillStyle = bp.color;
        ctx.arc(bp.x, bp.y, bp.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.arc(bp.x - 8, bp.y - 8, bp.r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      const drawFlipper = (x: number, y: number, angle: number, color: string) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.fillRect(0, -11, 104, 22);
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawFlipper(LEFT_FLIPPER_X, FLIPPER_Y, leftHeld.current ? -0.62 : -0.22, "#f59e0b");
      drawFlipper(RIGHT_FLIPPER_X, FLIPPER_Y, rightHeld.current ? Math.PI + 0.62 : Math.PI + 0.22, "#22d3ee");

      if (ballRef.current.active || !overRef.current) {
        const b = ballRef.current;
        ctx.beginPath();
        ctx.fillStyle = "#f8fafc";
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (flashRef.current > 0) {
        flashRef.current--;
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(0, 0, W, H);
      }

      fx.update();
      fx.draw(ctx, W, H);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px var(--font-nunito), sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Can: ${livesRef.current}`, 16, 24);
      ctx.fillText("← / → flipper · Space launch", 16, H - 14);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, scoreGame]);

  return (
    <div className="game-panel canvas-game acelya-game fullscreen-game">
      <div ref={hudRef} className="acelya-hud">
        <ScoreHud score={score} selfHigh={scoreGame.selfHigh} />
        <p className="round-label">Pinball Cadet · klasik masa · 3 can</p>
        {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca masa aktif olur</p>}
      </div>
      <div className="acelya-game-stage">
        <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas" />
      </div>
      <GameTouchBar gameId="pinball" />
      {over && (
        <div className="game-over">
          <p>🛰️ Game Over · Skor: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Yeniden başla
          </button>
        </div>
      )}
    </div>
  );
}
