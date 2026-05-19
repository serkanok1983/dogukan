"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";

type Bullet = { x: number; y: number };
type Rock = { x: number; y: number; r: number; vy: number; hp: number; kind: "normal" | "fast" | "big" };
type PowerUp = { x: number; y: number; kind: "life" | "rapid" };

const W = 320;
const H = 480;

export function SpaceDefense() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [over, setOver] = useState(false);

  const shipX = useRef(0.5);
  const bullets = useRef<Bullet[]>([]);
  const rocks = useRef<Rock[]>([]);
  const powerUps = useRef<PowerUp[]>([]);
  const particles = useRef<Particle[]>([]);
  const stars = useRef<{ x: number; y: number; s: number }[]>([]);
  const frame = useRef(0);
  const shootCd = useRef(0);
  const rapidUntil = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const waveRef = useRef(1);
  const killsRef = useRef(0);
  const overRef = useRef(false);

  const reset = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = 3;
    waveRef.current = 1;
    killsRef.current = 0;
    overRef.current = false;
    bullets.current = [];
    rocks.current = [];
    powerUps.current = [];
    particles.current = [];
    rapidUntil.current = 0;
    stars.current = Array.from({ length: 50 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 0.4 + Math.random() * 2,
    }));
    setScore(0);
    setLives(3);
    setWave(1);
    setOver(false);
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || over) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      shipX.current = Math.max(0.1, Math.min(0.9, (cx - rect.left) / rect.width));
    };
    const shoot = () => {
      if (overRef.current) return;
      const cd = frame.current < rapidUntil.current ? 6 : 12;
      if (shootCd.current > 0) return;
      bullets.current.push({ x: shipX.current, y: 0.88 });
      bullets.current.push({ x: shipX.current - 0.04, y: 0.86 });
      bullets.current.push({ x: shipX.current + 0.04, y: 0.86 });
      sounds.shoot();
      shootCd.current = cd;
    };
    const onTap = (e: TouchEvent) => {
      onMove(e);
      shoot();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        shoot();
      }
      if (e.key === "ArrowLeft") shipX.current = Math.max(0.1, shipX.current - 0.06);
      if (e.key === "ArrowRight") shipX.current = Math.min(0.9, shipX.current + 0.06);
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("click", shoot);
    canvas.addEventListener("touchstart", onTap, { passive: true });
    window.addEventListener("keydown", onKey);

    let raf = 0;
    const loop = () => {
      if (overRef.current) return;
      frame.current++;
      if (shootCd.current > 0) shootCd.current--;

      const spawnRate = Math.max(22, 50 - waveRef.current * 3);
      if (frame.current % spawnRate === 0) {
        const roll = Math.random();
        const kind: Rock["kind"] = roll > 0.9 ? "big" : roll > 0.7 ? "fast" : "normal";
        rocks.current.push({
          x: 0.1 + Math.random() * 0.8,
          y: -0.05,
          r: kind === "big" ? 22 : kind === "fast" ? 12 : 14 + randInt(0, 6),
          vy: (kind === "fast" ? 0.007 : 0.005) + waveRef.current * 0.0004,
          hp: kind === "big" ? 3 : 1,
          kind,
        });
      }

      if (frame.current % 400 === 0) {
        waveRef.current += 1;
        setWave(waveRef.current);
        sounds.levelUp();
      }

      stars.current.forEach((st) => {
        st.y += 0.0015 * st.s;
        if (st.y > 1) st.y = 0;
      });

      bullets.current = bullets.current
        .map((b) => ({ ...b, y: b.y - 0.028 }))
        .filter((b) => b.y > -0.05);

      rocks.current = rocks.current.filter((rock) => {
        rock.y += rock.vy;
        let destroyed = false;
        bullets.current = bullets.current.filter((b) => {
          const dx = (b.x - rock.x) * W;
          const dy = (b.y - rock.y) * H;
          if (Math.hypot(dx, dy) < rock.r + 6) {
            rock.hp -= 1;
            if (rock.hp <= 0) destroyed = true;
            return false;
          }
          return true;
        });
        if (destroyed) {
          const rx = rock.x * W;
          const ry = rock.y * H;
          spawnBurst(particles.current, rx, ry, rock.kind === "big" ? 20 : 10, [
            "#f97316",
            "#fde047",
            "#fff",
          ]);
          sounds.explode();
          const pts = rock.kind === "big" ? 40 : rock.kind === "fast" ? 20 : 15;
          scoreRef.current += pts;
          killsRef.current += 1;
          setScore(scoreRef.current);
          if (killsRef.current % 12 === 0) {
            powerUps.current.push({
              x: rock.x,
              y: rock.y,
              kind: Math.random() > 0.5 ? "rapid" : "life",
            });
          }
          return false;
        }

        const sx = shipX.current * W;
        const sy = H - 48;
        if (Math.hypot(sx - rock.x * W, sy - rock.y * H) < rock.r + 20) {
          sounds.wrong();
          spawnBurst(particles.current, sx, sy, 12, ["#ef4444", "#fca5a5"]);
          livesRef.current -= 1;
          setLives(livesRef.current);
          if (livesRef.current <= 0) {
            overRef.current = true;
            setOver(true);
            sounds.gameOver();
          }
          return false;
        }
        return rock.y < 1.15;
      });

      powerUps.current = powerUps.current.filter((pu) => {
        pu.y += 0.004;
        if (Math.hypot(shipX.current - pu.x, 0.88 - pu.y) < 0.08) {
          if (pu.kind === "life") {
            livesRef.current = Math.min(5, livesRef.current + 1);
            setLives(livesRef.current);
            sounds.star();
          } else {
            rapidUntil.current = frame.current + 180;
            sounds.boost();
          }
          return false;
        }
        return pu.y < 1;
      });

      updateParticles(particles.current);

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#030712");
      grad.addColorStop(0.4, "#1e1b4b");
      grad.addColorStop(1, "#312e81");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#fff";
      stars.current.forEach((st) => {
        ctx.globalAlpha = 0.3 + st.s * 0.25;
        ctx.beginPath();
        ctx.arc(st.x * W, st.y * H, st.s, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      rocks.current.forEach((rock) => {
        const rx = rock.x * W;
        const ry = rock.y * H;
        ctx.fillStyle = rock.kind === "big" ? "#dc2626" : rock.kind === "fast" ? "#a855f7" : "#f97316";
        ctx.beginPath();
        ctx.arc(rx, ry, rock.r, 0, Math.PI * 2);
        ctx.fill();
        if (rock.hp > 1) {
          ctx.fillStyle = "#fff";
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(String(rock.hp), rx, ry + 4);
        }
      });

      powerUps.current.forEach((pu) => {
        ctx.font = "22px serif";
        ctx.textAlign = "center";
        ctx.fillText(pu.kind === "life" ? "💖" : "⚡", pu.x * W, pu.y * H);
      });

      drawParticles(ctx, particles.current);

      ctx.fillStyle = "#fde047";
      bullets.current.forEach((b) => {
        ctx.beginPath();
        ctx.ellipse(b.x * W, b.y * H, 3, 11, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.font = "34px serif";
      ctx.textAlign = "center";
      ctx.fillText(frame.current < rapidUntil.current ? "🛸" : "🚀", shipX.current * W, H - 32);

      ctx.fillStyle = "#e0e7ff";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`⭐ ${scoreRef.current}`, 10, 20);
      ctx.fillText(`Dalga ${waveRef.current}`, 10, 38);
      ctx.fillText("❤️".repeat(Math.max(0, livesRef.current)), 10, 56);
      if (frame.current < rapidUntil.current) {
        ctx.fillStyle = "#fde047";
        ctx.fillText("⚡ Hızlı ateş!", W - 100, 20);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("click", shoot);
      canvas.removeEventListener("touchstart", onTap);
      window.removeEventListener("keydown", onKey);
    };
  }, [over, reset]);

  return (
    <div className="game-panel canvas-game">
      <p className="round-label">Kaydır + dokun · Dalga dalga meteor · ⚡💗 güç topla!</p>
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas space-canvas" />
      {over && (
        <div className="game-over">
          <p>🌟 Dalga {wave} · Puan: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
