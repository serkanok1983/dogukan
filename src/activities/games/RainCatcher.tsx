"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";

const GAME_SLUG = "yagmur-damlasi";

type Drop = { x: number; y: number; vy: number; kind: "rain" | "hail"; r: number };

const W = 320;
const H = 480;
const DURATION = 55;

export function RainCatcher() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [done, setDone] = useState(false);
  const [combo, setCombo] = useState(0);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const umbrellaX = useRef(0.5);
  const drops = useRef<Drop[]>([]);
  const particles = useRef<Particle[]>([]);
  const juiceRef = useRef(createGameJuice());
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const frame = useRef(0);
  const overRef = useRef(false);
  const timeLeftRef = useRef(DURATION);

  const reset = useCallback(() => {
    umbrellaX.current = 0.5;
    drops.current = [];
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
      if (!running || overRef.current || done) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      umbrellaX.current = Math.max(0.06, Math.min(0.94, (clientX - rect.left) / rect.width));
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onMove, { passive: true });

    let raf = 0;
    const loop = () => {
      if (!running || overRef.current || done) return;
      frame.current++;

      const speed = 0.006 + scoreRef.current * 0.00004;
      if (frame.current % 14 === 0) {
        const isHail = Math.random() < 0.15;
        drops.current.push({
          x: Math.random() * 0.9 + 0.05,
          y: -0.02,
          vy: speed + (isHail ? 0.005 : Math.random() * 0.004),
          kind: isHail ? "hail" : "rain",
          r: isHail ? 10 : 7,
        });
      }

      // Draw sky
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#374151");
      bg.addColorStop(0.5, "#4b5563");
      bg.addColorStop(1, "#1f2937");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Draw clouds
      ctx.fillStyle = "rgba(107,114,128,0.5)";
      ctx.beginPath();
      ctx.ellipse(W * 0.25, 30, 50, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(W * 0.7, 20, 60, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Update and draw drops
      drops.current = drops.current.filter((d) => {
        d.y += d.vy;
        const dx = d.x * W;
        const dy = d.y * H;
        const ux = umbrellaX.current * W;
        const uy = H - 55;

        if (d.y > 0.82 && d.y < 0.92 && Math.abs(d.x - umbrellaX.current) < 0.1) {
          if (d.kind === "rain") {
            comboRef.current += 1;
            const pts = 5 + Math.min(comboRef.current, 10);
            scoreRef.current += pts;
            setScore(scoreRef.current);
            scoreGame.checkMilestone(scoreRef.current);
            setCombo(comboRef.current);
            sounds.coin();
            spawnBurst(particles.current, dx, dy, 6, ["#60a5fa", "#93c5fd", "#fff"]);
            juiceRef.current.popScore(dx, dy - 10, `+${pts}`, "#60a5fa");
            if (comboRef.current % 5 === 0) sounds.combo(comboRef.current);
          } else {
            comboRef.current = 0;
            setCombo(0);
            scoreRef.current = Math.max(0, scoreRef.current - 15);
            setScore(scoreRef.current);
            sounds.wrong();
            juiceRef.current.shakeScreen(5);
            spawnBurst(particles.current, dx, dy, 8, ["#9ca3af", "#6b7280"]);
          }
          return false;
        }

        if (d.kind === "rain") {
          ctx.fillStyle = "#60a5fa";
          ctx.beginPath();
          ctx.ellipse(dx, dy, 3, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(147,197,253,0.6)";
          ctx.beginPath();
          ctx.ellipse(dx, dy, 2, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#9ca3af";
          ctx.beginPath();
          ctx.arc(dx, dy, d.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = "14px serif";
          ctx.textAlign = "center";
          ctx.fillText("❄️", dx, dy + 5);
        }

        return d.y < 1.05;
      });

      // Draw umbrella
      const ux = umbrellaX.current * W;
      const uy = H - 55;
      ctx.font = "52px serif";
      ctx.textAlign = "center";
      ctx.fillText("☂️", ux, uy + 30);

      updateParticles(particles.current);
      drawParticles(ctx, particles.current);
      const fx = juiceRef.current;
      fx.update();
      fx.draw(ctx, W, H);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`☂️ ${scoreRef.current}`, 12, 30);
      ctx.fillText(`⏱ ${timeLeftRef.current}s`, 12, 52);
      if (comboRef.current >= 3) {
        ctx.fillStyle = "#60a5fa";
        ctx.textAlign = "right";
        ctx.fillText(`🔥 x${comboRef.current}`, W - 12, 30);
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
      <ScoreHud score={score} selfHigh={scoreGame.selfHigh} rivalHigh={scoreGame.rivalHigh} rivalName={scoreGame.rivalName} playerName={scoreGame.playerName} />
      <p className="round-label">Şemsiyeyi kaydır, yağmur damlalarını yakala! ❄️ doludan kaçın</p>
      {!active && <p className="game-waiting">ℹ️ Başla{"'"}ya basınca oyun başlar</p>}
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas" />
      {done && (
        <div className="game-over">
          <p>☂️ Süre doldu! Puan: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>Tekrar oyna</button>
        </div>
      )}
    </div>
  );
}