"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";

type Plat = { x: number; y: number; w: number };
type Coin = { x: number; y: number; taken: boolean };

const W = 320;
const H = 440;
const PW = 0.22;

export function PlatformJump() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);

  const px = useRef(0.5);
  const py = useRef(0.7);
  const vy = useRef(0);
  const vx = useRef(0);
  const camY = useRef(0);
  const plats = useRef<Plat[]>([]);
  const coins = useRef<Coin[]>([]);
  const scoreRef = useRef(0);
  const overRef = useRef(false);
  const leftHeld = useRef(false);
  const rightHeld = useRef(false);
  const wasFalling = useRef(true);

  const initWorld = useCallback(() => {
    plats.current = [{ x: 0.39, y: 0.75, w: PW }];
    for (let i = 1; i < 12; i++) {
      plats.current.push({
        x: 0.08 + Math.random() * (1 - PW - 0.16),
        y: 0.75 - i * 0.09,
        w: PW,
      });
      if (Math.random() > 0.35) {
        coins.current.push({
          x: plats.current[i].x + PW / 2 - 0.03,
          y: plats.current[i].y - 0.06,
          taken: false,
        });
      }
    }
  }, []);

  const reset = useCallback(() => {
    px.current = 0.5;
    py.current = 0.7;
    vy.current = -0.018;
    vx.current = 0;
    camY.current = 0;
    coins.current = [];
    scoreRef.current = 0;
    overRef.current = false;
    initWorld();
    setScore(0);
    setOver(false);
  }, [initWorld]);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || over) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") leftHeld.current = true;
      if (e.key === "ArrowRight" || e.key === "d") rightHeld.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") leftHeld.current = false;
      if (e.key === "ArrowRight" || e.key === "d") rightHeld.current = false;
    };
    const onTouchSide = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      leftHeld.current = x < rect.width / 2;
      rightHeld.current = x >= rect.width / 2;
    };
    const onTouchEnd = () => {
      leftHeld.current = false;
      rightHeld.current = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("touchstart", onTouchSide, { passive: true });
    canvas.addEventListener("touchmove", onTouchSide, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);

    let raf = 0;
    const loop = () => {
      if (overRef.current) return;

      if (leftHeld.current) vx.current = Math.max(vx.current - 0.0008, -0.012);
      else if (rightHeld.current) vx.current = Math.min(vx.current + 0.0008, 0.012);
      else vx.current *= 0.92;

      px.current += vx.current;
      if (px.current < 0.05) px.current = 0.05;
      if (px.current > 0.95) px.current = 0.95;

      vy.current += 0.00055;
      py.current += vy.current;

      const highest = plats.current.reduce((m, p) => Math.min(m, p.y), 1);
      if (py.current < highest - 0.5) {
        overRef.current = true;
        setOver(true);
        sounds.wrong();
      }

      plats.current.forEach((p) => {
        const platTop = p.y;
        const inX = px.current > p.x - 0.04 && px.current < p.x + p.w + 0.04;
        if (inX && vy.current > 0 && py.current >= platTop - 0.02 && py.current <= platTop + 0.04) {
          py.current = platTop;
          vy.current = -0.019;
          if (wasFalling.current) sounds.jump();
          wasFalling.current = false;
        }
      });
      if (vy.current < 0) wasFalling.current = true;

      if (py.current < 0.35 + camY.current) {
        const shift = 0.35 + camY.current - py.current;
        camY.current -= shift;
        py.current += shift;
        plats.current.forEach((p) => (p.y += shift));
        coins.current.forEach((c) => (c.y += shift));
        scoreRef.current += Math.floor(shift * 200);
        setScore(scoreRef.current);

        while (plats.current[plats.current.length - 1].y > -0.1) {
          const top = plats.current[plats.current.length - 1].y;
          const np: Plat = {
            x: 0.08 + Math.random() * (1 - PW - 0.16),
            y: top - (0.07 + Math.random() * 0.04),
            w: PW,
          };
          plats.current.push(np);
          if (Math.random() > 0.3) {
            coins.current.push({ x: np.x + PW / 2 - 0.03, y: np.y - 0.06, taken: false });
          }
        }
        plats.current = plats.current.filter((p) => p.y < 1.2);
        coins.current = coins.current.filter((c) => c.y < 1.2);
      }

      coins.current.forEach((c) => {
        if (c.taken) return;
        if (Math.hypot(px.current - c.x, py.current - c.y) < 0.06) {
          c.taken = true;
          scoreRef.current += 25;
          setScore(scoreRef.current);
          sounds.star();
        }
      });

      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#38bdf8");
      sky.addColorStop(0.6, "#a5f3fc");
      sky.addColorStop(1, "#86efac");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      ctx.font = "28px serif";
      ctx.textAlign = "center";
      ctx.fillText("☁️", 50, 60);
      ctx.fillText("☁️", W - 60, 100);

      plats.current.forEach((p) => {
        const sx = p.x * W;
        const sy = p.y * H;
        const sw = p.w * W;
        const grd = ctx.createLinearGradient(sx, sy, sx, sy + 14);
        grd.addColorStop(0, "#4ade80");
        grd.addColorStop(1, "#16a34a");
        ctx.fillStyle = grd;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") ctx.roundRect(sx, sy, sw, 14, 6);
        else ctx.rect(sx, sy, sw, 14);
        ctx.fill();
        ctx.fillStyle = "#14532d";
        ctx.fillRect(sx + 4, sy + 10, sw - 8, 3);
      });

      coins.current.forEach((c) => {
        if (c.taken) return;
        ctx.font = "22px serif";
        ctx.fillText("⭐", c.x * W, c.y * H);
      });

      ctx.font = "30px serif";
      ctx.fillText("🦸", px.current * W, py.current * H);

      ctx.fillStyle = "#1e3a5f";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Yükseklik: ${scoreRef.current}`, 10, 22);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("touchstart", onTouchSide);
      canvas.removeEventListener("touchmove", onTouchSide);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [over, reset]);

  return (
    <div className="game-panel canvas-game">
      <p className="round-label">Ada platformlarında zıpla, yıldızları topla!</p>
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas" />
      <div className="dpad">
        <div className="dpad-mid">
          <button
            type="button"
            aria-label="Sol"
            onTouchStart={() => (leftHeld.current = true)}
            onTouchEnd={() => (leftHeld.current = false)}
            onMouseDown={() => (leftHeld.current = true)}
            onMouseUp={() => (leftHeld.current = false)}
            onMouseLeave={() => (leftHeld.current = false)}
          >
            ◀
          </button>
          <button
            type="button"
            aria-label="Sağ"
            onTouchStart={() => (rightHeld.current = true)}
            onTouchEnd={() => (rightHeld.current = false)}
            onMouseDown={() => (rightHeld.current = true)}
            onMouseUp={() => (rightHeld.current = false)}
            onMouseLeave={() => (rightHeld.current = false)}
          >
            ▶
          </button>
        </div>
      </div>
      {over && (
        <div className="game-over">
          <p>🏝️ Düştün! Skor: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
