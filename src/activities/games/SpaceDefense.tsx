"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";

type Bullet = { x: number; y: number };
type Rock = { x: number; y: number; r: number; vy: number; spin: number };

const W = 320;
const H = 440;

export function SpaceDefense() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [over, setOver] = useState(false);

  const shipX = useRef(0.5);
  const bullets = useRef<Bullet[]>([]);
  const rocks = useRef<Rock[]>([]);
  const stars = useRef<{ x: number; y: number; s: number }[]>([]);
  const frame = useRef(0);
  const shootCd = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const overRef = useRef(false);

  const reset = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = 3;
    overRef.current = false;
    bullets.current = [];
    rocks.current = [];
    stars.current = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 0.5 + Math.random() * 2,
    }));
    setScore(0);
    setLives(3);
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
      if (overRef.current || shootCd.current > 0) return;
      bullets.current.push({ x: shipX.current, y: 0.88 });
      sounds.shoot();
      shootCd.current = 12;
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

      stars.current.forEach((st) => {
        st.y += 0.002 * st.s;
        if (st.y > 1) st.y = 0;
      });

      if (frame.current % 55 === 0) {
        rocks.current.push({
          x: 0.12 + Math.random() * 0.76,
          y: -0.05,
          r: 14 + randInt(0, 10),
          vy: 0.004 + scoreRef.current * 0.00003,
          spin: Math.random() * 0.1 - 0.05,
        });
      }

      bullets.current = bullets.current
        .map((b) => ({ ...b, y: b.y - 0.025 }))
        .filter((b) => b.y > -0.05);

      rocks.current = rocks.current.filter((rock) => {
        rock.y += rock.vy;
        rock.x += rock.spin * 0.01;

        let hit = false;
        bullets.current = bullets.current.filter((b) => {
          const dx = (b.x - rock.x) * W;
          const dy = (b.y - rock.y) * H;
          if (Math.hypot(dx, dy) < rock.r + 8) {
            hit = true;
            return false;
          }
          return true;
        });
        if (hit) {
          sounds.pop();
          scoreRef.current += 15;
          setScore(scoreRef.current);
          return false;
        }

        const sx = shipX.current * W;
        const sy = H - 42;
        const rx = rock.x * W;
        const ry = rock.y * H;
        if (Math.hypot(sx - rx, sy - ry) < rock.r + 22) {
          sounds.wrong();
          livesRef.current -= 1;
          setLives(livesRef.current);
          if (livesRef.current <= 0) {
            overRef.current = true;
            setOver(true);
            sounds.win();
          }
          return false;
        }
        return rock.y < 1.1;
      });

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#0b1026");
      grad.addColorStop(0.5, "#1a1f4e");
      grad.addColorStop(1, "#2d1b69");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#fff";
      stars.current.forEach((st) => {
        ctx.globalAlpha = 0.4 + st.s * 0.2;
        ctx.beginPath();
        ctx.arc(st.x * W, st.y * H, st.s, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      rocks.current.forEach((rock) => {
        const rx = rock.x * W;
        const ry = rock.y * H;
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.arc(rx, ry, rock.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fdba74";
        ctx.beginPath();
        ctx.arc(rx - rock.r * 0.25, ry - rock.r * 0.2, rock.r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = "#fde047";
      bullets.current.forEach((b) => {
        ctx.beginPath();
        ctx.ellipse(b.x * W, b.y * H, 3, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.font = "32px serif";
      ctx.textAlign = "center";
      ctx.fillText("🚀", shipX.current * W, H - 28);

      ctx.fillStyle = "#e0e7ff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Puan: ${scoreRef.current}`, 10, 22);
      ctx.fillText("❤️".repeat(Math.max(0, livesRef.current)), 10, 42);

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
      <p className="round-label">Kaydır: roket · Dokun: ateş · Meteorları vur!</p>
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas space-canvas" />
      {over && (
        <div className="game-over">
          <p>🌟 Uzay kahramanı! Puan: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}

