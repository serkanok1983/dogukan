"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";

type Obstacle = { lane: number; y: number; kind: "rock" | "star" | "nitro" | "shield" };
type LaneParticle = Particle;

const W = 320;
const H = 480;
const LANES = [0.2, 0.5, 0.8];
const DURATION = 75;

export function LaneRacer() {
  const active = useGameActive();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [done, setDone] = useState(false);
  const [shield, setShield] = useState(false);

  const lane = useRef(1);
  const speed = useRef(0.012);
  const obs = useRef<Obstacle[]>([]);
  const particles = useRef<LaneParticle[]>([]);
  const frame = useRef(0);
  const scoreRef = useRef(0);
  const shieldRef = useRef(false);
  const nitroUntil = useRef(0);
  const overRef = useRef(false);
  const timeLeftRef = useRef(DURATION);

  const reset = useCallback(() => {
    lane.current = 1;
    speed.current = 0.012;
    obs.current = [];
    particles.current = [];
    frame.current = 0;
    scoreRef.current = 0;
    shieldRef.current = false;
    nitroUntil.current = 0;
    overRef.current = false;
    setScore(0);
    setShield(false);
    timeLeftRef.current = DURATION;
    setTimeLeft(DURATION);
    setDone(false);
  }, []);

  useGameBoot(reset);

  useEffect(() => {
    if (!active || done) return;
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
  }, [active, done]);

  const moveLane = (dir: -1 | 1) => {
    if (!active || overRef.current || done) return;
    const next = lane.current + dir;
    if (next >= 0 && next <= 2) {
      lane.current = next;
      sounds.tap();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas || done) return;
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
      if (!active || overRef.current || done) return;
      frame.current++;
      const nitro = frame.current < nitroUntil.current;
      speed.current = Math.min(0.028, (nitro ? 0.018 : 0.012) + scoreRef.current * 0.000015);

      const spawnEvery = nitro ? 32 : 40;
      if (frame.current % spawnEvery === 0) {
        const roll = Math.random();
        let kind: Obstacle["kind"] = "rock";
        if (roll > 0.92) kind = "shield";
        else if (roll > 0.85) kind = "nitro";
        else if (roll > 0.65) kind = "star";
        obs.current.push({ lane: randInt(0, 2), y: -0.05, kind });
      }

      obs.current = obs.current.filter((o) => {
        o.y += speed.current;
        const carLane = lane.current;
        if (o.y > 0.76 && o.y < 0.9 && o.lane === carLane) {
          const cx = LANES[carLane] * W;
          const cy = H * 0.86;
          if (o.kind === "star") {
            scoreRef.current += 40;
            setScore(scoreRef.current);
            sounds.star();
            spawnBurst(particles.current, cx, cy, 10, ["#fde047", "#fbbf24"]);
            return false;
          }
          if (o.kind === "nitro") {
            nitroUntil.current = frame.current + 120;
            sounds.boost();
            spawnBurst(particles.current, cx, cy, 8, ["#60a5fa", "#fff"]);
            return false;
          }
          if (o.kind === "shield") {
            shieldRef.current = true;
            setShield(true);
            sounds.success();
            spawnBurst(particles.current, cx, cy, 8, ["#a78bfa", "#fff"]);
            return false;
          }
          if (shieldRef.current) {
            shieldRef.current = false;
            setShield(false);
            sounds.wrong();
            spawnBurst(particles.current, cx, cy, 12, ["#93c5fd", "#fff"]);
            return false;
          }
          sounds.gameOver();
          overRef.current = true;
          setDone(true);
          return false;
        }
        return o.y < 1.1;
      });

      scoreRef.current += nitro ? 2 : 1;
      if (frame.current % 15 === 0) setScore(scoreRef.current);

      updateParticles(particles.current);

      const roadGrad = ctx.createLinearGradient(0, 0, 0, H);
      roadGrad.addColorStop(0, nitro ? "#7f1d1d" : "#1e293b");
      roadGrad.addColorStop(1, nitro ? "#450a0a" : "#0f172a");
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#475569";
      ctx.fillRect(W * 0.06, 0, W * 0.88, H);

      ctx.strokeStyle = nitro ? "#fca5a5" : "#fbbf24";
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 16]);
      ctx.lineDashOffset = -frame.current * (nitro ? 4 : 2);
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
        const emoji =
          o.kind === "star" ? "⭐" : o.kind === "nitro" ? "⚡" : o.kind === "shield" ? "🛡️" : "🪨";
        ctx.font = "28px serif";
        ctx.textAlign = "center";
        ctx.fillText(emoji, ox, oy);
      });

      drawParticles(ctx, particles.current);

      ctx.font = "36px serif";
      ctx.textAlign = "center";
      const car = nitro ? "🏎️💨" : shieldRef.current ? "🛡️🏎️" : "🏎️";
      ctx.fillText(car, LANES[lane.current] * W, H * 0.86);

      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`🏁 ${scoreRef.current}`, 10, 22);
      ctx.fillText(`⏱ ${timeLeftRef.current}s`, 10, 40);
      if (shield) ctx.fillText("🛡️ Kalkan aktif", 10, 58);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [active, done, reset, shield]);

  return (
    <div className="game-panel canvas-game">
      <p className="round-label">75 sn yarış · ⭐⚡🛡️ topla · Kayalardan kaç!</p>
      {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca yarış başlar</p>}
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas racer-canvas" />
      <div className="lane-controls">
        <button type="button" className="lane-btn" onClick={() => moveLane(-1)} aria-label="Sol şerit">
          ◀ Sol
        </button>
        <button type="button" className="lane-btn lane-btn-accent" onClick={() => moveLane(1)} aria-label="Sağ şerit">
          Sağ ▶
        </button>
      </div>
      {done && (
        <div className="game-over">
          <p>
            {overRef.current ? "💥 Çarptın! " : "🏆 Süre bitti! "}
            Mesafe: {score}
          </p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
