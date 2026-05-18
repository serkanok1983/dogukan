"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";

type Obstacle = { lane: number; y: number; kind: "rock" | "star" };
type Particle = { x: number; y: number; life: number; hue: number };

const W = 320;
const H = 440;
const LANES = [0.2, 0.5, 0.8];

export function LaneRacer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);

  const lane = useRef(1);
  const speed = useRef(0.012);
  const obs = useRef<Obstacle[]>([]);
  const parts = useRef<Particle[]>([]);
  const frame = useRef(0);
  const scoreRef = useRef(0);
  const overRef = useRef(false);

  const reset = useCallback(() => {
    lane.current = 1;
    speed.current = 0.012;
    obs.current = [];
    parts.current = [];
    frame.current = 0;
    scoreRef.current = 0;
    overRef.current = false;
    setScore(0);
    setOver(false);
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  const moveLane = (dir: -1 | 1) => {
    if (overRef.current) return;
    const next = lane.current + dir;
    if (next >= 0 && next <= 2) {
      lane.current = next;
      sounds.tap();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || over) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") moveLane(-1);
      if (e.key === "ArrowRight") moveLane(1);
    };
    window.addEventListener("keydown", onKey);

    let touchX = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchX = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 28) moveLane(dx < 0 ? -1 : 1);
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);

    let raf = 0;
    const loop = () => {
      if (overRef.current) return;
      frame.current++;
      speed.current = Math.min(0.022, 0.012 + scoreRef.current * 0.00002);

      if (frame.current % 45 === 0) {
        const ln = randInt(0, 2);
        obs.current.push({
          lane: ln,
          y: -0.05,
          kind: Math.random() > 0.75 ? "star" : "rock",
        });
      }

      obs.current = obs.current.filter((o) => {
        o.y += speed.current;
        const carLane = lane.current;
        if (o.y > 0.78 && o.y < 0.92 && o.lane === carLane) {
          if (o.kind === "star") {
            scoreRef.current += 30;
            setScore(scoreRef.current);
            sounds.star();
            for (let i = 0; i < 8; i++) {
              parts.current.push({
                x: LANES[carLane] * W,
                y: H * 0.85,
                life: 1,
                hue: randInt(40, 60),
              });
            }
            return false;
          }
          sounds.wrong();
          overRef.current = true;
          setOver(true);
          return false;
        }
        return o.y < 1.1;
      });

      scoreRef.current += 1;
      if (frame.current % 20 === 0) setScore(scoreRef.current);

      const roadGrad = ctx.createLinearGradient(0, 0, 0, H);
      roadGrad.addColorStop(0, "#1e293b");
      roadGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#334155";
      ctx.fillRect(W * 0.08, 0, W * 0.84, H);

      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.setLineDash([18, 18]);
      ctx.lineDashOffset = -frame.current * 2;
      [0.35, 0.65].forEach((lx) => {
        ctx.beginPath();
        ctx.moveTo(W * lx, 0);
        ctx.lineTo(W * lx, H);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      obs.current.forEach((o) => {
        const ox = LANES[o.lane] * W;
        const oy = o.y * H;
        ctx.font = o.kind === "star" ? "26px serif" : "28px serif";
        ctx.textAlign = "center";
        ctx.fillText(o.kind === "star" ? "⭐" : "🪨", ox, oy);
      });

      parts.current = parts.current
        .map((p) => ({ ...p, y: p.y - 2, life: p.life - 0.04 }))
        .filter((p) => p.life > 0);
      parts.current.forEach((p) => {
        ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x + (Math.random() - 0.5) * 20, p.y, 4 * p.life, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.font = "34px serif";
      ctx.textAlign = "center";
      ctx.fillText("🏎️", LANES[lane.current] * W, H * 0.86);

      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Mesafe: ${scoreRef.current}`, 10, 22);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [over, reset]);

  return (
    <div className="game-panel canvas-game">
      <p className="round-label">Şerit değiştir · Yıldızları topla · Kayalardan kaç!</p>
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas racer-canvas" />
      <div className="lane-controls">
        <button type="button" className="lane-btn" onClick={() => moveLane(-1)} aria-label="Sol şerit">
          ◀ Sol
        </button>
        <button type="button" className="lane-btn lane-btn-accent" onClick={() => moveLane(1)} aria-label="Sağ şerit">
          Sağ ▶
        </button>
      </div>
      {over && (
        <div className="game-over">
          <p>🏁 Yarış bitti! Mesafe: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
