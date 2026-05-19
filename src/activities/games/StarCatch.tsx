"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { randInt, pickRandom } from "@/lib/utils";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";

const GAME_SLUG = "top-yakala";

type Item = { x: number; y: number; emoji: string; vy: number; pts: number; bad?: boolean };

const ITEMS = [
  { emoji: "⭐", pts: 15 },
  { emoji: "🌟", pts: 20 },
  { emoji: "✨", pts: 25 },
  { emoji: "🍎", pts: 10 },
  { emoji: "🍌", pts: 10 },
  { emoji: "🍇", pts: 12 },
  { emoji: "🎁", pts: 30 },
  { emoji: "💎", pts: 50 },
];
const BAD = ["💣", "🌧️"];

const W = 320;
const H = 440;
const DURATION = 60;

export function StarCatch() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [done, setDone] = useState(false);
  const [combo, setCombo] = useState(0);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const basket = useRef(0.5);
  const items = useRef<Item[]>([]);
  const particles = useRef<Particle[]>([]);
  const juiceRef = useRef(createGameJuice());
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const frame = useRef(0);
  const overRef = useRef(false);
  const timeLeftRef = useRef(DURATION);

  const reset = useCallback(() => {
    basket.current = 0.5;
    items.current = [];
    particles.current = [];
    scoreRef.current = 0;
    comboRef.current = 0;
    frame.current = 0;
    overRef.current = false;
    setScore(0);
    setCombo(0);
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

    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      basket.current = Math.max(0.08, Math.min(0.92, (clientX - rect.left) / rect.width));
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onMove, { passive: true });

    let raf = 0;
    const loop = () => {
      if (!running || overRef.current || done) return;
      frame.current++;
      const speed = 0.006 + Math.min(0.008, scoreRef.current * 0.00002);

      if (frame.current % 38 === 0) {
        if (Math.random() < 0.12) {
          items.current.push({
            x: Math.random() * 0.85 + 0.05,
            y: 0,
            emoji: pickRandom(BAD),
            vy: speed + 0.002,
            pts: 0,
            bad: true,
          });
        } else {
          const it = pickRandom(ITEMS);
          items.current.push({
            x: Math.random() * 0.85 + 0.05,
            y: 0,
            emoji: it.emoji,
            vy: speed + Math.random() * 0.004,
            pts: it.pts,
          });
        }
      }

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#1e3a8a");
      grad.addColorStop(1, "#7c3aed");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const bx = basket.current * W;
      ctx.font = "36px serif";
      ctx.textAlign = "center";
      ctx.fillText("🧺", bx, H - 28);

      items.current = items.current.filter((s) => {
        s.y += s.vy;
        const sx = s.x * W;
        const sy = s.y * H;
        ctx.font = s.bad ? "26px serif" : "28px serif";
        ctx.fillText(s.emoji, sx, sy);

        if (s.y > 0.86 && Math.abs(s.x - basket.current) < 0.12) {
          if (s.bad) {
            comboRef.current = 0;
            setCombo(0);
            scoreRef.current = Math.max(0, scoreRef.current - 20);
            setScore(scoreRef.current);
            scoreGame.checkMilestone(scoreRef.current);
            sounds.wrong();
            spawnBurst(particles.current, sx, sy, 10, ["#ef4444", "#000"]);
          } else {
            comboRef.current += 1;
            const bonus = Math.min(comboRef.current, 10) * 2;
            const gained = s.pts + bonus;
            scoreRef.current += gained;
            setScore(scoreRef.current);
            if (scoreRef.current % 80 < gained) void scoreGame.checkMilestone(scoreRef.current);
            setCombo(comboRef.current);
            sounds.coin();
            if (comboRef.current % 5 === 0) sounds.combo(comboRef.current);
            spawnBurst(particles.current, sx, sy, 10, ["#fde047", "#fbbf24", "#fff"]);
            juiceRef.current.burst(sx, sy, "#fde047", 12);
            juiceRef.current.popScore(sx, sy, `+${gained}`);
          }
          return false;
        }
        return s.y < 1.05;
      });

      updateParticles(particles.current);
      drawParticles(ctx, particles.current);
      const fx = juiceRef.current;
      fx.update();
      fx.draw(ctx, W, H);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`⭐ ${scoreRef.current}`, 8, 22);
      ctx.fillText(`⏱ ${timeLeftRef.current}s`, 8, 42);
      if (comboRef.current >= 3) {
        ctx.fillStyle = "#fde047";
        ctx.fillText(`🔥 x${comboRef.current}`, W - 70, 22);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchmove", onMove);
    };
  }, [running, done, reset, scoreGame]);

  return (
    <div className="game-panel canvas-game">
      <ScoreHud
        score={score}
        selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
      />
      <p className="round-label">60 saniye · Yıldız ve meyveleri yakala · 💣 kaçın!</p>
      {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca oyun başlar</p>}
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas" />
      {done ? (
        <div className="game-over">
          <p>🎉 Süre doldu! Puan: {score}</p>
          {combo > 0 && <p className="hint-text">En uzun seri: {combo}</p>}
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      ) : null}
    </div>
  );
}
