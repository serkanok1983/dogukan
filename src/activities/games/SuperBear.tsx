"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { useCanvasFit } from "@/hooks/useCanvasFit";
import { sounds } from "@/lib/sounds";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { GameTouchBar } from "@/components/GameTouchBar";

const GAME_SLUG = "super-ayi";
const VIEW_W = 360;
const VIEW_H = 520;
const LEVEL_W = 3200;
const GROUND_Y = VIEW_H - 72;
const GRAVITY = 0.55;
const JUMP = -12.5;
const JUMP2 = -10;
const MOVE = 4.8;
const PLAYER_W = 34;
const PLAYER_H = 38;
const ATTACK_FRAMES = 14;

type Plat = { x: number; y: number; w: number; h: number; kind: "grass" | "log" | "stone" };
type Enemy = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  minX: number;
  maxX: number;
  kind: "wolf" | "bee";
};
type Pickup = { x: number; y: number; kind: "honey" | "star"; taken: boolean };

function buildLevel(): { plats: Plat[]; enemies: Enemy[]; pickups: Pickup[]; goalX: number } {
  const plats: Plat[] = [
    { x: 0, y: GROUND_Y, w: 520, h: 72, kind: "grass" },
    { x: 480, y: GROUND_Y - 88, w: 100, h: 20, kind: "log" },
    { x: 620, y: GROUND_Y, w: 280, h: 72, kind: "grass" },
    { x: 780, y: GROUND_Y - 110, w: 90, h: 18, kind: "log" },
    { x: 920, y: GROUND_Y - 175, w: 110, h: 18, kind: "stone" },
    { x: 1080, y: GROUND_Y, w: 340, h: 72, kind: "grass" },
    { x: 1280, y: GROUND_Y - 95, w: 85, h: 18, kind: "log" },
    { x: 1420, y: GROUND_Y - 155, w: 100, h: 18, kind: "stone" },
    { x: 1580, y: GROUND_Y - 220, w: 120, h: 18, kind: "log" },
    { x: 1750, y: GROUND_Y, w: 400, h: 72, kind: "grass" },
    { x: 1980, y: GROUND_Y - 100, w: 95, h: 18, kind: "log" },
    { x: 2140, y: GROUND_Y - 165, w: 110, h: 18, kind: "stone" },
    { x: 2300, y: GROUND_Y, w: 500, h: 72, kind: "grass" },
    { x: 2520, y: GROUND_Y - 120, w: 100, h: 18, kind: "log" },
    { x: 2680, y: GROUND_Y - 190, w: 130, h: 18, kind: "stone" },
    { x: 2860, y: GROUND_Y, w: 400, h: 72, kind: "grass" },
  ];

  const enemies: Enemy[] = [
    { x: 700, y: GROUND_Y - 44, w: 36, h: 32, vx: 1.2, minX: 640, maxX: 860, kind: "wolf" },
    { x: 1150, y: GROUND_Y - 44, w: 36, h: 32, vx: -1.4, minX: 1100, maxX: 1380, kind: "wolf" },
    { x: 1320, y: GROUND_Y - 139, w: 28, h: 28, vx: 0.9, minX: 1290, maxX: 1350, kind: "bee" },
    { x: 1880, y: GROUND_Y - 44, w: 36, h: 32, vx: 1.5, minX: 1780, maxX: 2100, kind: "wolf" },
    { x: 2200, y: GROUND_Y - 209, w: 28, h: 28, vx: -1.1, minX: 2150, maxX: 2230, kind: "bee" },
    { x: 2400, y: GROUND_Y - 44, w: 36, h: 32, vx: -1.3, minX: 2320, maxX: 2750, kind: "wolf" },
    { x: 2750, y: GROUND_Y - 234, w: 28, h: 28, vx: 1, minX: 2690, maxX: 2790, kind: "bee" },
  ];

  const pickups: Pickup[] = [
    { x: 520, y: GROUND_Y - 130, kind: "honey", taken: false },
    { x: 850, y: GROUND_Y - 155, kind: "star", taken: false },
    { x: 1000, y: GROUND_Y - 210, kind: "honey", taken: false },
    { x: 1350, y: GROUND_Y - 190, kind: "honey", taken: false },
    { x: 1620, y: GROUND_Y - 255, kind: "star", taken: false },
    { x: 2050, y: GROUND_Y - 145, kind: "honey", taken: false },
    { x: 2220, y: GROUND_Y - 210, kind: "honey", taken: false },
    { x: 2580, y: GROUND_Y - 165, kind: "star", taken: false },
    { x: 2720, y: GROUND_Y - 235, kind: "honey", taken: false },
    { x: 2950, y: GROUND_Y - 120, kind: "star", taken: false },
  ];

  return { plats, enemies, pickups, goalX: LEVEL_W - 120 };
}

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function SuperBear() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const px = useRef(80);
  const py = useRef(GROUND_Y - PLAYER_H);
  const vx = useRef(0);
  const vy = useRef(0);
  const facing = useRef(1);
  const grounded = useRef(true);
  const jumpsLeft = useRef(2);
  const camX = useRef(0);
  const plats = useRef<Plat[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const pickups = useRef<Pickup[]>([]);
  const goalX = useRef(LEVEL_W - 120);
  const particles = useRef<Particle[]>([]);
  const juiceRef = useRef(createGameJuice());
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const overRef = useRef(false);
  const wonRef = useRef(false);
  const invUntil = useRef(0);
  const attackT = useRef(0);
  const leftHeld = useRef(false);
  const rightHeld = useRef(false);
  const frame = useRef(0);
  const parallax = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      x: i * 180,
      y: 40 + (i % 4) * 35,
      s: 0.6 + (i % 3) * 0.2,
      layer: i % 3,
    })),
  );

  useCanvasFit(canvasRef, VIEW_W, VIEW_H, { hudRef, minWidth: 300 });

  const reset = useCallback(() => {
    const level = buildLevel();
    plats.current = level.plats;
    enemies.current = level.enemies.map((e) => ({ ...e }));
    pickups.current = level.pickups.map((p) => ({ ...p }));
    goalX.current = level.goalX;
    px.current = 80;
    py.current = GROUND_Y - PLAYER_H;
    vx.current = 0;
    vy.current = 0;
    facing.current = 1;
    grounded.current = true;
    jumpsLeft.current = 2;
    camX.current = 0;
    particles.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    overRef.current = false;
    wonRef.current = false;
    invUntil.current = 0;
    attackT.current = 0;
    leftHeld.current = false;
    rightHeld.current = false;
    frame.current = 0;
    setScore(0);
    setLives(3);
    setWon(false);
    setOver(false);
    submitted.current = false;
    scoreGame.resetMilestones();
  }, [scoreGame]);

  useGameBoot(reset);

  useEffect(() => {
    if ((over || won) && !submitted.current) {
      submitted.current = true;
      void scoreGame.submitFinal(score);
    }
  }, [over, won, score, scoreGame]);

  const jump = useCallback(() => {
    if (!running || overRef.current || wonRef.current) return;
    if (jumpsLeft.current > 0) {
      vy.current = jumpsLeft.current === 2 ? JUMP : JUMP2;
      grounded.current = false;
      jumpsLeft.current--;
      sounds.jump();
      juiceRef.current.burst(px.current, py.current + PLAYER_H, "#fde047", 8, 3);
    }
  }, [running]);

  const punch = useCallback(() => {
    if (!running || overRef.current || wonRef.current || attackT.current > 0) return;
    attackT.current = ATTACK_FRAMES;
    sounds.shoot();
  }, [running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!running || !canvas || over || won) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fx = juiceRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") leftHeld.current = true;
      if (e.key === "ArrowRight" || e.key === "d") rightHeld.current = true;
      if (e.key === "ArrowUp" || e.key === " " || e.key === "w") {
        e.preventDefault();
        jump();
      }
      if (e.key === "Shift" || e.key === "z" || e.key === "x") {
        e.preventDefault();
        punch();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") leftHeld.current = false;
      if (e.key === "ArrowRight" || e.key === "d") rightHeld.current = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let raf = 0;
    const loop = () => {
      if (!running || overRef.current || wonRef.current) return;
      frame.current++;

      if (leftHeld.current) {
        vx.current = -MOVE;
        facing.current = -1;
      } else if (rightHeld.current) {
        vx.current = MOVE;
        facing.current = 1;
      } else {
        vx.current *= 0.72;
      }

      if (attackT.current > 0) attackT.current--;

      const prevVy = vy.current;
      vy.current += GRAVITY;
      px.current += vx.current;
      py.current += vy.current;

      grounded.current = false;
      for (const p of plats.current) {
        const feet = py.current + PLAYER_H;
        const wasAbove = feet - vy.current <= p.y + 4;
        if (
          wasAbove &&
          feet >= p.y &&
          feet <= p.y + p.h + 8 &&
          px.current + PLAYER_W > p.x + 4 &&
          px.current < p.x + p.w - 4
        ) {
          py.current = p.y - PLAYER_H;
          vy.current = 0;
          grounded.current = true;
          jumpsLeft.current = 2;
          if (Math.abs(vy.current) > 8) {
            juiceRef.current.burst(px.current + PLAYER_W / 2, p.y, "#86efac", 6, 2.5);
          }
          break;
        }
      }

      if (py.current > VIEW_H + 40) {
        livesRef.current--;
        setLives(livesRef.current);
        juiceRef.current.shakeScreen(10);
        fx.flashScreen(0.35);
        sounds.wrong();
        if (livesRef.current <= 0) {
          overRef.current = true;
          setOver(true);
          sounds.gameOver();
        } else {
          px.current = Math.max(40, camX.current + 60);
          py.current = GROUND_Y - PLAYER_H;
          vy.current = 0;
          invUntil.current = frame.current + 90;
        }
      }

      px.current = Math.max(8, Math.min(LEVEL_W - PLAYER_W - 8, px.current));

      const targetCam = Math.max(0, Math.min(LEVEL_W - VIEW_W, px.current - VIEW_W * 0.38));
      camX.current += (targetCam - camX.current) * 0.12;

      for (const e of enemies.current) {
        e.x += e.vx;
        if (e.x < e.minX || e.x > e.maxX) e.vx *= -1;
      }

      const hitBox = () => {
        const ax = px.current + (facing.current > 0 ? PLAYER_W - 4 : -28);
        return { x: ax, y: py.current + 8, w: 32, h: 24 };
      };

      if (attackT.current > 0 && attackT.current > ATTACK_FRAMES - 4) {
        const hb = hitBox();
        for (let i = enemies.current.length - 1; i >= 0; i--) {
          const e = enemies.current[i];
          if (rectsOverlap(hb.x, hb.y, hb.w, hb.h, e.x, e.y, e.w, e.h)) {
            const ex = e.x + e.w / 2;
            const ey = e.y + e.h / 2;
            spawnBurst(particles.current, ex, ey, 16, ["#f97316", "#fde047", "#fff"]);
            fx.burst(ex, ey, "#fbbf24", 18);
            fx.popScore(ex, ey - 20, "+50");
            fx.shakeScreen(4);
            scoreRef.current += 50;
            setScore(scoreRef.current);
            sounds.success();
            enemies.current.splice(i, 1);
          }
        }
      }

      for (let i = enemies.current.length - 1; i >= 0; i--) {
        const e = enemies.current[i];
        if (frame.current < invUntil.current) continue;
        if (
          rectsOverlap(px.current + 4, py.current + 8, PLAYER_W - 8, PLAYER_H - 8, e.x, e.y, e.w, e.h)
        ) {
          const stomp = prevVy > 2 && py.current + PLAYER_H < e.y + e.h * 0.55;
          if (stomp) {
            const ex = e.x + e.w / 2;
            spawnBurst(particles.current, ex, e.y, 14, ["#a3e635", "#fde047"]);
            fx.burst(ex, e.y, "#86efac", 16);
            fx.popScore(ex, e.y, "Zıpla! +50");
            scoreRef.current += 50;
            setScore(scoreRef.current);
            sounds.star();
            vy.current = JUMP2;
            enemies.current.splice(i, 1);
          } else {
            livesRef.current--;
            setLives(livesRef.current);
            invUntil.current = frame.current + 90;
            fx.shakeScreen(8);
            fx.flashScreen(0.3);
            sounds.wrong();
            if (livesRef.current <= 0) {
              overRef.current = true;
              setOver(true);
              sounds.gameOver();
            }
          }
        }
      }

      for (const p of pickups.current) {
        if (p.taken) continue;
        const pr = 18;
        if (rectsOverlap(px.current, py.current, PLAYER_W, PLAYER_H, p.x - pr, p.y - pr, pr * 2, pr * 2)) {
          p.taken = true;
          const pts = p.kind === "star" ? 80 : 30;
          scoreRef.current += pts;
          setScore(scoreRef.current);
          if (frame.current % 20 === 0) void scoreGame.checkMilestone(scoreRef.current);
          spawnBurst(particles.current, p.x, p.y, 12, ["#fbbf24", "#fde047", "#fff"]);
          fx.burst(p.x, p.y, p.kind === "star" ? "#fde047" : "#f59e0b", 14);
          fx.popScore(p.x, p.y - 16, `+${pts}`);
          sounds.coin();
        }
      }

      if (px.current + PLAYER_W > goalX.current - 20 && !wonRef.current) {
        wonRef.current = true;
        setWon(true);
        scoreRef.current += 200;
        setScore(scoreRef.current);
        for (let i = 0; i < 6; i++) {
          spawnBurst(particles.current, px.current + i * 20, py.current, 20, [
            "#fde047",
            "#f472b6",
            "#60a5fa",
            "#4ade80",
          ]);
        }
        fx.flashScreen(0.4);
        sounds.win();
      }

      updateParticles(particles.current);

      const cx = camX.current;
      const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      sky.addColorStop(0, "#7dd3fc");
      sky.addColorStop(0.45, "#bae6fd");
      sky.addColorStop(1, "#bbf7d0");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      for (const cloud of parallax.current) {
        const pxCloud = ((cloud.x - cx * (0.15 + cloud.layer * 0.1)) % (VIEW_W + 120)) - 60;
        ctx.globalAlpha = 0.35 + cloud.layer * 0.15;
        ctx.font = `${28 + cloud.layer * 8}px serif`;
        ctx.fillText("☁️", pxCloud, cloud.y);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#4ade80";
      ctx.fillRect(0, GROUND_Y + 40 - (cx * 0) % 1, VIEW_W, VIEW_H - GROUND_Y);

      for (let x = -((cx * 0.3) % 80); x < VIEW_W + 80; x += 80) {
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.ellipse(x, GROUND_Y + 52, 36, 18, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(-cx, 0);

      for (const p of plats.current) {
        if (p.x + p.w < cx - 40 || p.x > cx + VIEW_W + 40) continue;
        if (p.kind === "grass") {
          ctx.fillStyle = "#65a30d";
          ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.fillStyle = "#84cc16";
          ctx.fillRect(p.x, p.y, p.w, 12);
        } else if (p.kind === "log") {
          ctx.fillStyle = "#92400e";
          ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.fillStyle = "#b45309";
          ctx.fillRect(p.x, p.y, p.w, 6);
        } else {
          ctx.fillStyle = "#64748b";
          ctx.fillRect(p.x, p.y, p.w, p.h);
        }
      }

      for (const p of pickups.current) {
        if (p.taken) continue;
        if (p.x < cx - 40 || p.x > cx + VIEW_W + 40) continue;
        const bob = Math.sin(frame.current * 0.08 + p.x) * 4;
        ctx.font = "26px serif";
        ctx.textAlign = "center";
        ctx.fillText(p.kind === "star" ? "⭐" : "🍯", p.x, p.y + bob);
      }

      const gx = goalX.current;
      ctx.font = "42px serif";
      ctx.textAlign = "center";
      ctx.fillText("🏁", gx, GROUND_Y - 8);

      for (const e of enemies.current) {
        if (e.x + e.w < cx - 40 || e.x > cx + VIEW_W + 40) continue;
        ctx.font = e.kind === "bee" ? "28px serif" : "32px serif";
        ctx.textAlign = "center";
        ctx.fillText(e.kind === "bee" ? "🐝" : "🐺", e.x + e.w / 2, e.y + e.h / 2 + 6);
      }

      const blink = frame.current < invUntil.current && frame.current % 8 < 4;
      if (!blink) {
        const squash = grounded.current ? 1 : 0.92 + Math.min(0.08, Math.abs(vy.current) * 0.01);
        const sx = px.current + PLAYER_W / 2;
        const sy = py.current + PLAYER_H;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(facing.current * (attackT.current > 0 ? 1.08 : 1), squash);
        ctx.font = attackT.current > 0 ? "38px serif" : "34px serif";
        ctx.textAlign = "center";
        ctx.fillText(attackT.current > 0 ? "🐻💥" : jumpsLeft.current < 2 && !grounded.current ? "🐻✨" : "🐻", 0, -4);
        ctx.restore();
        if (attackT.current > 0) {
          ctx.font = "20px serif";
          ctx.fillText("👊", sx + facing.current * 28, sy - 22);
        }
      }

      ctx.restore();

      fx.update();
      fx.draw(ctx, VIEW_W, VIEW_H);

      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(8, 8, 120, 44);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px var(--font-nunito), sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`🍯 ${scoreRef.current}`, 16, 26);
      ctx.fillText(`❤️ ${livesRef.current}`, 16, 44);

      const prog = Math.min(1, px.current / goalX.current);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(8, VIEW_H - 22, VIEW_W - 16, 10);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(8, VIEW_H - 22, (VIEW_W - 16) * prog, 10);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [running, over, won, jump, punch, scoreGame]);

  return (
    <div className="game-panel canvas-game super-bear-game fullscreen-game">
      <div ref={hudRef} className="super-bear-hud">
        <ScoreHud
          score={score}
          selfHigh={scoreGame.selfHigh}
          rivalHigh={scoreGame.rivalHigh}
          rivalName={scoreGame.rivalName}
        />
        <p className="round-label">
          Süper Ayı Macerası · ← → hareket · ↑ zıpla (çift zıplama) · Shift yumruk · 🏁&apos;ye ulaş!
        </p>
        {!active && (
          <p className="game-waiting">ℹ️ Başla&apos;ya basınca macera başlar</p>
        )}
      </div>

      <div className="acelya-game-stage">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          className="game-canvas touch-canvas super-bear-canvas"
        />
      </div>

      <GameTouchBar gameId="super-ayi" />

      {won && (
        <div className="game-over">
          <p>🐻 Harika Doğukan! Seviyeyi tamamladın! +200 bonus</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
      {over && (
        <div className="game-over">
          <p>🐻 Oyun bitti! Skor: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar dene
          </button>
        </div>
      )}
    </div>
  );
}
