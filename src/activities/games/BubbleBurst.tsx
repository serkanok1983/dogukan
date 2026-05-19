"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";

type Bubble = {
  x: number;
  y: number;
  r: number;
  vy: number;
  color: string;
  hue: number;
};

const COLORS = ["#f472b6", "#60a5fa", "#4ade80", "#fbbf24", "#a78bfa", "#fb7185"];
const W = 320;
const H = 480;
const ROUND = 45;

export function BubbleBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND);
  const [done, setDone] = useState(false);
  const [combo, setCombo] = useState(0);

  const bubbles = useRef<Bubble[]>([]);
  const particles = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const frame = useRef(0);
  const timeLeftRef = useRef(ROUND);

  const reset = useCallback(() => {
    bubbles.current = [];
    particles.current = [];
    scoreRef.current = 0;
    comboRef.current = 0;
    frame.current = 0;
    setScore(0);
    setCombo(0);
    timeLeftRef.current = ROUND;
    setTimeLeft(ROUND);
    setDone(false);
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (done) return;
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
  }, [done]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || done) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const popAt = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * W;
      const y = ((clientY - rect.top) / rect.height) * H;
      for (let i = bubbles.current.length - 1; i >= 0; i--) {
        const b = bubbles.current[i];
        if (Math.hypot(x - b.x, y - b.y) < b.r + 8) {
          spawnBurst(particles.current, b.x, b.y, 12, [b.color, "#fff"]);
          bubbles.current.splice(i, 1);
          comboRef.current += 1;
          const bonus = comboRef.current * 3;
          scoreRef.current += 10 + bonus;
          setScore(scoreRef.current);
          setCombo(comboRef.current);
          sounds.pop();
          if (comboRef.current % 5 === 0) sounds.combo(comboRef.current);
          return;
        }
      }
    };

    const onPointer = (e: MouseEvent | TouchEvent) => {
      const pt = "touches" in e ? e.touches[0] : e;
      popAt(pt.clientX, pt.clientY);
    };
    canvas.addEventListener("mousedown", onPointer);
    canvas.addEventListener("touchstart", onPointer, { passive: true });

    let raf = 0;
    const loop = () => {
      frame.current++;
      if (frame.current % 28 === 0) {
        bubbles.current.push({
          x: randInt(30, W - 30),
          y: H + 20,
          r: randInt(18, 32),
          vy: -(0.6 + Math.random() * 0.8 + scoreRef.current * 0.001),
          color: COLORS[randInt(0, COLORS.length - 1)],
          hue: randInt(0, 360),
        });
      }

      bubbles.current = bubbles.current.filter((b) => {
        b.y += b.vy;
        b.x += Math.sin(frame.current * 0.05 + b.hue) * 0.4;
        return b.y > -40;
      });

      updateParticles(particles.current);

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0ea5e9");
      bg.addColorStop(0.5, "#38bdf8");
      bg.addColorStop(1, "#bae6fd");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      bubbles.current.forEach((b) => {
        const g = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 0, b.x, b.y, b.r);
        g.addColorStop(0, "rgba(255,255,255,0.9)");
        g.addColorStop(0.45, b.color);
        g.addColorStop(1, "rgba(0,0,0,0.15)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      drawParticles(ctx, particles.current);

      ctx.fillStyle = "#0c4a6e";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`🫧 ${scoreRef.current}`, 10, 24);
      ctx.fillText(`⏱ ${timeLeftRef.current}s`, 10, 44);
      if (comboRef.current >= 3) {
        ctx.fillStyle = "#be185d";
        ctx.textAlign = "right";
        ctx.fillText(`🔥 x${comboRef.current}`, W - 10, 24);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousedown", onPointer);
      canvas.removeEventListener("touchstart", onPointer);
    };
  }, [done, reset]);

  return (
    <div className="game-panel canvas-game">
      <p className="round-label">Baloncuklara dokun, patlat! Seri yap, bonus kazan.</p>
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas" />
      {done && (
        <div className="game-over">
          <p>🫧 Harika! Puan: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
