"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { pickRandom, randInt } from "@/lib/utils";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";

const GAME_SLUG = "meyve-bicagi";

type Fruit = {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  pts: number;
  sliced: boolean;
  bomb?: boolean;
};

const FRUITS = [
  { emoji: "🍉", pts: 15, r: 28 },
  { emoji: "🍎", pts: 10, r: 24 },
  { emoji: "🍊", pts: 12, r: 24 },
  { emoji: "🍋", pts: 10, r: 22 },
  { emoji: "🍌", pts: 10, r: 22 },
  { emoji: "🍇", pts: 8, r: 20 },
  { emoji: "🥝", pts: 15, r: 24 },
  { emoji: "🍑", pts: 12, r: 24 },
];

const W = 360;
const H = 500;
const DURATION = 50;
const MAX_FRUITS = 6;

export function FruitSlice() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [done, setDone] = useState(false);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const fruits = useRef<Fruit[]>([]);
  const particles = useRef<Particle[]>([]);
  const juiceRef = useRef(createGameJuice());
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const livesRef = useRef(3);
  const frame = useRef(0);
  const overRef = useRef(false);
  const timeLeftRef = useRef(DURATION);
  const nextId = useRef(0);
  const trail = useRef<{ x: number; y: number }[]>([]);
  const slicing = useRef(false);

  const reset = useCallback(() => {
    fruits.current = [];
    particles.current = [];
    trail.current = [];
    slicing.current = false;
    scoreRef.current = 0;
    comboRef.current = 0;
    livesRef.current = 3;
    frame.current = 0;
    overRef.current = false;
    nextId.current = 0;
    setScore(0);
    setCombo(0);
    setLives(3);
    timeLeftRef.current = DURATION;
    setTimeLeft(DURATION);
    setDone(false);
    submitted.current = false;
    scoreGame.resetMilestones();
  }, [scoreGame]);

  useGameBoot(reset);

  useEffect(() => {
    if (done && !submitted.current) {
      submitted.current = true;
      scoreGame.submitFinal(score);
    }
  }, [done, score, scoreGame]);

  useEffect(() => {
    if (!running || done) return;
    const t = setInterval(() => {
      setTimeLeft((tm) => {
        const next = tm <= 1 ? 0 : tm - 1;
        timeLeftRef.current = next;
        if (tm <= 1) {
          overRef.current = true;
          setDone(true);
          sounds.win();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, done]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!running || !canvas || done) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const getPos = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      const pt = "touches" in e ? e.touches[0] : e;
      return {
        x: ((pt.clientX - rect.left) / rect.width) * W,
        y: ((pt.clientY - rect.top) / rect.height) * H,
      };
    };

    const onStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      slicing.current = true;
      trail.current = [getPos(e)];
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!slicing.current) return;
      const pos = getPos(e);
      trail.current.push(pos);
      if (trail.current.length > 20) trail.current.shift();

      // Check slice against fruits
      if (trail.current.length >= 2) {
        const prev = trail.current[trail.current.length - 2];
        for (const f of fruits.current) {
          if (f.sliced) continue;
          if (lineIntersectsCircle(prev.x, prev.y, pos.x, pos.y, f.x, f.y, f.r)) {
            f.sliced = true;
            if (f.bomb) {
              sounds.explode();
              livesRef.current = Math.max(0, livesRef.current - 1);
              setLives(livesRef.current);
              juiceRef.current.shakeScreen(12);
              juiceRef.current.flashScreen(0.4);
              spawnBurst(particles.current, f.x, f.y, 20, ["#ef4444", "#f97316", "#000"]);
              if (livesRef.current <= 0) {
                overRef.current = true;
                setDone(true);
                sounds.gameOver();
              }
            } else {
              comboRef.current += 1;
              const bonus = Math.min(comboRef.current, 10) * 2;
              const pts = f.pts + bonus;
              scoreRef.current += pts;
              setScore(scoreRef.current);
              scoreGame.checkMilestone(scoreRef.current);
              setCombo(comboRef.current);
              sounds.coin();
              if (comboRef.current % 5 === 0) sounds.combo(comboRef.current);
              spawnBurst(particles.current, f.x, f.y, 10, ["#fde047", "#fbbf24", "#fff"]);
              juiceRef.current.popScore(f.x, f.y - 14, `+${pts}`);
            }
          }
        }
      }
    };
    const onEnd = () => {
      slicing.current = false;
      trail.current = [];
    };

    canvas.addEventListener("mousedown", onStart);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onEnd);
    canvas.addEventListener("mouseleave", onEnd);
    canvas.addEventListener("touchstart", onStart, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onEnd);

    let raf = 0;
    const loop = () => {
      if (!running || overRef.current || done) return;
      frame.current++;

      // Spawn fruits
      const spawnEvery = 18 - Math.min(8, Math.floor(scoreRef.current / 100));
      if (frame.current % Math.max(6, spawnEvery) === 0 && fruits.current.length < MAX_FRUITS) {
        const isBomb = Math.random() < 0.08;
        const fruit = isBomb
          ? { emoji: "💣", pts: 0, r: 26 }
          : pickRandom(FRUITS);
        const id = nextId.current++;
        fruits.current.push({
          id,
          emoji: fruit.emoji,
          x: randInt(50, W - 50),
          y: H + 30,
          vx: (Math.random() - 0.5) * 4,
          vy: -(8 + Math.random() * 7),
          r: fruit.r,
          pts: fruit.pts,
          sliced: false,
          bomb: isBomb,
        });
      }

      // Update fruits
      fruits.current = fruits.current.filter((f) => {
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.18; // gravity
        return f.y < H + 60 && f.x > -60 && f.x < W + 60;
      });

      updateParticles(particles.current);

      // Draw
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#832561");
      bg.addColorStop(0.4, "#b83b5e");
      bg.addColorStop(1, "#f08a5d");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Draw trail
      if (trail.current.length >= 2) {
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(trail.current[0].x, trail.current[0].y);
        for (let i = 1; i < trail.current.length; i++) {
          ctx.lineTo(trail.current[i].x, trail.current[i].y);
        }
        ctx.stroke();

        // Glow
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 8;
        ctx.stroke();
      }

      // Draw fruits
      fruits.current.forEach((f) => {
        ctx.save();
        ctx.font = `${f.r * 2}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(f.emoji, f.x, f.y);

        if (f.sliced) {
          ctx.globalAlpha = 0.3;
          ctx.fillText(f.emoji, f.x, f.y);
        }
        ctx.restore();
      });

      drawParticles(ctx, particles.current);
      const fx = juiceRef.current;
      fx.update();
      fx.draw(ctx, W, H);

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, 0, W, 50);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`🍉 ${scoreRef.current}`, 12, 34);
      ctx.textAlign = "right";
      ctx.fillText(`⏱ ${timeLeftRef.current}s`, W - 12, 34);
      if (comboRef.current >= 3) {
        ctx.fillStyle = "#fde047";
        ctx.textAlign = "center";
        ctx.fillText(`🔥 x${comboRef.current}`, W / 2, 34);
      }
      // Lives
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.font = "20px serif";
      ctx.fillText("❤️".repeat(Math.max(0, livesRef.current)), 12, 70);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousedown", onStart);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onEnd);
      canvas.removeEventListener("mouseleave", onEnd);
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onEnd);
    };
  }, [running, done, reset, scoreGame]);

  return (
    <div className="game-panel canvas-game">
      <ScoreHud
        score={score}
        selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
        playerName={scoreGame.playerName}
      />
      <p className="round-label">Parmağını kaydırarak meyveleri kes! 💣 bombalardan kaçın</p>
      {!active && <p className="game-waiting">ℹ️ Başla{"'"}ya basınca oyun başlar</p>}
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas" />
      {done && (
        <div className="game-over">
          <p>{lives <= 0 ? "💥 Oyun bitti! " : "🎉 Süre doldu! "}Puan: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}

function lineIntersectsCircle(
  x1: number, y1: number, x2: number, y2: number,
  cx: number, cy: number, r: number,
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  let det = b * b - 4 * a * c;
  if (det < 0) return false;
  det = Math.sqrt(det);
  const t1 = (-b - det) / (2 * a);
  const t2 = (-b + det) / (2 * a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1);
}