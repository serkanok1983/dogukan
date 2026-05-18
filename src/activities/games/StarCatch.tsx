"use client";

import { useEffect, useRef, useState } from "react";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";

type Star = { x: number; y: number; emoji: string; vy: number };

export function StarCatch() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const basket = useRef(0.5);
  const stars = useRef<Star[]>([]);
  const over = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      basket.current = Math.max(0.08, Math.min(0.92, (clientX - rect.left) / rect.width));
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onMove, { passive: true });

    let frame = 0;
    let raf = 0;
    const loop = () => {
      if (over.current) return;
      frame++;
      if (frame % 45 === 0) {
        stars.current.push({
          x: Math.random() * 0.85 + 0.05,
          y: 0,
          emoji: ["⭐", "🌟", "✨", "🍎", "7", "3"][randInt(0, 5)],
          vy: 0.008 + Math.random() * 0.006,
        });
      }
      ctx.fillStyle = "#0f2847";
      ctx.fillRect(0, 0, W, H);
      const bx = basket.current * W;
      ctx.font = "28px serif";
      ctx.textAlign = "center";
      ctx.fillText("🧺", bx, H - 24);

      stars.current = stars.current.filter((s) => {
        s.y += s.vy;
        const sx = s.x * W;
        const sy = s.y * H;
        ctx.fillText(s.emoji, sx, sy);
        if (s.y > 0.88 && Math.abs(s.x - basket.current) < 0.1) {
          sounds.pop();
          setScore((sc) => sc + 10);
          return false;
        }
        if (s.y > 1) {
          setMissed((m) => {
            const nm = m + 1;
            if (nm >= 5) over.current = true;
            return nm;
          });
          return false;
        }
        return true;
      });

      ctx.fillStyle = "#fff";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Puan: ${score}`, 8, 20);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchmove", onMove);
    };
  }, [score]);

  return (
    <div className="game-panel canvas-game">
      <p className="round-label">Yıldızları sepete yakala! Kaçırma: {missed}/5</p>
      <canvas ref={canvasRef} width={320} height={400} className="game-canvas touch-canvas" />
      {missed >= 5 && (
        <div className="game-over">
          <p>Puan: {score}</p>
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            Tekrar
          </button>
        </div>
      )}
    </div>
  );
}
