"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import {
  drawParticles,
  spawnBurst,
  updateParticles,
  type Particle,
} from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameBoot, useRegisterRestart } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { useCanvasFit } from "@/hooks/useCanvasFit";
import { useCanvasPointer } from "@/hooks/useCanvasPointer";
import { FRAME_MS, useGameLoop } from "@/hooks/useGameLoop";
import { sounds } from "@/lib/sounds";
import { randInt, pickRandom } from "@/lib/utils";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { canvasFont } from "@/lib/canvasFont";

const GAME_SLUG = "kostebek-vur";
const W = 360;
const H = 440;
const COLS = 3;
const ROWS = 3;
const HOLE_R = 28;
const MOLE_R = 22;
const DURATION = 30;
const HIT_MARKER_FRAMES = 20;

type Mole = {
  col: number;
  row: number;
  ttl: number; // frames (60 Hz) remaining before mole hides
  bad: boolean;
  color: string;
  cheek: string;
};

type HitMarker = { x: number; y: number; ttl: number };

const GOOD_COLORS = ["#8B4513", "#A0522D", "#6B3410"];
const BAD_COLORS = ["#2d2d2d", "#4a4a4a"];
const CHEEK_COLORS = ["#f4a7b9", "#f48fb1", "#f06292"];

const HOLE_CENTERS: { cx: number; cy: number }[] = (() => {
  const gapX = W / (COLS + 1);
  const gapY = H / (ROWS + 2);
  const topPad = 70;
  const centers: { cx: number; cy: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      centers.push({ cx: gapX * (c + 1), cy: topPad + gapY * (r + 0.5) });
    }
  }
  return centers;
})();

/** Köstebekleri yaşlandırır, süresi dolanları çıkarır. */
function ageMoles(list: Mole[], dt: number) {
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].ttl -= dt;
    if (list[i].ttl <= 0) list.splice(i, 1);
  }
}

function tickMarker(hm: HitMarker, dt: number) {
  hm.ttl -= dt;
}

export function WhackMole() {
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);
  const toLogical = useCanvasPointer(canvasRef, W, H);
  const submitted = useRef(false);

  const molesRef = useRef<Mole[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const juiceRef = useRef(createGameJuice());
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(DURATION);
  const spawnCdRef = useRef(0);
  const overRef = useRef(false);
  const hitMarkerRef = useRef<HitMarker | null>(null);

  useCanvasFit(canvasRef, W, H, { hudRef, minWidth: 240, dpr: "auto" });

  const reset = useCallback(() => {
    molesRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    spawnCdRef.current = 0;
    overRef.current = false;
    timeLeftRef.current = DURATION;
    hitMarkerRef.current = null;
    setScore(0);
    setDone(false);
    submitted.current = false;
    scoreGame.resetMilestones();
  }, [scoreGame]);

  useGameBoot(reset);
  useRegisterRestart(reset);

  useEffect(() => {
    if (done && !submitted.current) {
      submitted.current = true;
      void scoreGame.submitFinal(score);
    }
  }, [done, score, scoreGame]);

  const draw = (ctx: CanvasRenderingContext2D, dt: number) => {
    // Draw scene
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#86efac");
    grad.addColorStop(0.5, "#fde047");
    grad.addColorStop(1, "#facc15");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = "#65a30d";
    ctx.fillRect(0, H - 30, W, 30);

    // Grass patches
    ctx.fillStyle = "#4d7c0f";
    for (let x = 0; x < W; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, H - 30);
      ctx.lineTo(x + 6, H - 42);
      ctx.lineTo(x + 12, H - 30);
      ctx.fill();
    }

    // Draw holes
    for (const hc of HOLE_CENTERS) {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(hc.cx, hc.cy + 6, HOLE_R, HOLE_R * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.ellipse(hc.cx, hc.cy + 2, HOLE_R, HOLE_R * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#78350f";
      ctx.beginPath();
      ctx.ellipse(hc.cx, hc.cy, HOLE_R + 4, (HOLE_R + 4) * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#2d1306";
      ctx.beginPath();
      ctx.ellipse(
        hc.cx,
        hc.cy + 2,
        HOLE_R - 4,
        (HOLE_R - 4) * 0.35,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // Draw moles
    for (const m of molesRef.current) {
      const hc = HOLE_CENTERS[m.row * COLS + m.col];
      if (!hc) continue;
      const t = Math.min(1, (80 - m.ttl) / 15);
      const popY = hc.cy - 14 - Math.max(0, t * 30);
      const mx = hc.cx;
      const my = popY;

      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(mx, my, MOLE_R, 0, Math.PI * 2);
      ctx.fill();

      const eyeY = my - 6;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(mx - 7, eyeY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mx + 7, eyeY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(mx - 6, eyeY + 1, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mx + 8, eyeY + 1, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(mx - 7, eyeY - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mx + 6, eyeY - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = m.bad ? "#4ade80" : "#f472b6";
      ctx.beginPath();
      ctx.arc(mx, my + 4, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = m.cheek;
      ctx.beginPath();
      ctx.arc(mx - 12, my + 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mx + 12, my + 2, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my + 6, 7, 0.3, Math.PI - 0.3);
      ctx.stroke();

      if (m.bad) {
        ctx.fillStyle = "#4ade80";
        ctx.font = "16px serif";
        ctx.textAlign = "center";
        ctx.fillText("💀", mx, my - MOLE_R - 6);
      }

      if (t > 0.8) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(mx - 3, my + 4, 3, 5);
        ctx.fillRect(mx + 1, my + 4, 3, 5);
      }
    }

    // Hit marker
    const hm = hitMarkerRef.current;
    if (hm) {
      tickMarker(hm, dt);
      if (hm.ttl > 0) {
        const alpha = hm.ttl / HIT_MARKER_FRAMES;
        ctx.strokeStyle = `rgba(253,224,71,${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hm.x, hm.y, HOLE_R + 8, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const r1 = HOLE_R + 10;
          const r2 = HOLE_R + 18;
          ctx.beginPath();
          ctx.moveTo(hm.x + Math.cos(angle) * r1, hm.y + Math.sin(angle) * r1);
          ctx.lineTo(hm.x + Math.cos(angle) * r2, hm.y + Math.sin(angle) * r2);
          ctx.stroke();
        }
      } else {
        hitMarkerRef.current = null;
      }
    }

    updateParticles(particlesRef.current, dt);
    drawParticles(ctx, particlesRef.current);

    const fx = juiceRef.current;
    fx.update(dt);
    fx.draw(ctx, W, H);

    // HUD
    ctx.font = canvasFont("bold 20px var(--font-nunito), sans-serif");
    ctx.textAlign = "left";
    ctx.fillStyle = "#14532d";
    ctx.fillText(`🔨 ${scoreRef.current}`, 10, 28);
    ctx.textAlign = "right";
    const secs = Math.ceil(timeLeftRef.current);
    ctx.fillStyle = secs <= 5 ? "#dc2626" : "#14532d";
    ctx.fillText(`⏱ ${secs}`, W - 10, 28);
  };

  const step = (dt: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    if (!overRef.current) {
      // Süre döngüden sayılır: ⏸, iyi oluş katmanı ve arka plan sırasında durur.
      timeLeftRef.current = Math.max(
        0,
        timeLeftRef.current - (dt * FRAME_MS) / 1000,
      );
      if (timeLeftRef.current === 0) {
        overRef.current = true;
        molesRef.current = [];
        setDone(true);
        sounds.win();
        juiceRef.current.haptic("win");
      }
    }

    if (!overRef.current) {
      const speedLevel = Math.floor(scoreRef.current / 80);
      const spawnInterval = Math.max(25, 55 - speedLevel * 3);
      const moleTtl = Math.max(35, 80 - speedLevel * 4);

      spawnCdRef.current -= dt;
      if (spawnCdRef.current <= 0 && molesRef.current.length < 3) {
        const c = randInt(0, COLS - 1);
        const r = randInt(0, ROWS - 1);
        const occupied = molesRef.current.some((m) => m.col === c && m.row === r);
        if (!occupied) {
          const bad = Math.random() < 0.12;
          molesRef.current.push({
            col: c,
            row: r,
            ttl: moleTtl,
            bad,
            color: bad ? pickRandom(BAD_COLORS) : pickRandom(GOOD_COLORS),
            cheek: pickRandom(CHEEK_COLORS),
          });
          spawnCdRef.current = spawnInterval;
        }
      }

      ageMoles(molesRef.current, dt);
    }

    draw(ctx, dt);
  };

  const loopOn = running && !done;
  useGameLoop(loopOn, step);

  // Döngü durunca (başlamadan önce, ⏸, bitiş) tahtayı bir kez çiz: boş ekran kalmasın.
  const drawIdle = useEffectEvent(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, 0);
  });

  useEffect(() => {
    if (loopOn) return;
    const raf = requestAnimationFrame(() => drawIdle());
    return () => cancelAnimationFrame(raf);
  }, [loopOn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !running || done) return;

    const onPointer = (e: PointerEvent) => {
      e.preventDefault();
      if (overRef.current) return;
      const { x: mx, y: my } = toLogical(e);
      const fx = juiceRef.current;

      for (let i = molesRef.current.length - 1; i >= 0; i--) {
        const m = molesRef.current[i];
        const hc = HOLE_CENTERS[m.row * COLS + m.col];
        if (!hc) continue;
        const dx = mx - hc.cx;
        const dy = my - (hc.cy - 14);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < HOLE_R + 4) {
          if (m.bad) {
            scoreRef.current = Math.max(0, scoreRef.current - 20);
            setScore(scoreRef.current);
            sounds.wrong();
            fx.haptic("fail");
            spawnBurst(particlesRef.current, hc.cx, hc.cy - 14, 12, [
              "#4ade80",
              "#a3e635",
              "#fff",
            ]);
            fx.burst(hc.cx, hc.cy - 14, "#ef4444", 10);
            fx.popScore(hc.cx, hc.cy - 30, "-20", "#ef4444");
            fx.shakeScreen(6);
          } else {
            const bonus = Math.min(Math.floor(scoreRef.current / 50), 3);
            const gained = 10 + bonus;
            scoreRef.current += gained;
            setScore(scoreRef.current);
            sounds.coin();
            fx.haptic("hit");
            spawnBurst(particlesRef.current, hc.cx, hc.cy - 14, 14, [
              "#fde047",
              "#fbbf24",
              "#fff",
            ]);
            fx.burst(hc.cx, hc.cy - 14, "#fde047", 14);
            fx.popScore(hc.cx, hc.cy - 30, `+${gained}`);
            fx.shakeScreen(2);
            if (scoreRef.current % 60 < gained)
              void scoreGame.checkMilestone(scoreRef.current);
          }
          hitMarkerRef.current = { x: hc.cx, y: hc.cy - 14, ttl: HIT_MARKER_FRAMES };
          molesRef.current.splice(i, 1);
          return;
        }
      }
    };

    canvas.addEventListener("pointerdown", onPointer);
    return () => canvas.removeEventListener("pointerdown", onPointer);
  }, [running, done, scoreGame, toLogical]);

  return (
    <div className="game-panel canvas-game">
      <div ref={hudRef}>
        <ScoreHud
          score={score}
          selfHigh={scoreGame.selfHigh}
          rivalHigh={scoreGame.rivalHigh}
          rivalName={scoreGame.rivalName}
          playerName={scoreGame.playerName}
        />
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="game-canvas touch-canvas"
        style={{ cursor: "pointer" }}
      />
      {done ? (
        <div className="game-over">
          <p>🎉 Süre doldu! Puan: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      ) : null}
    </div>
  );
}
