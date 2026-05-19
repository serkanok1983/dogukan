"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";

const GAME_SLUG = "ziplama-adasi";

type Plat = {
  x: number;
  y: number;
  w: number;
  kind: "normal" | "spring" | "moving";
  movePhase?: number;
};

const W = 320;
const H = 480;
const PW = 72;
const START_W = 100;
const GRAVITY = 0.42;
const JUMP = -12.5;
const SPRING_JUMP = -17;
const PLAYER_R = 16;

function clearInput(leftHeld: React.MutableRefObject<boolean>, rightHeld: React.MutableRefObject<boolean>) {
  leftHeld.current = false;
  rightHeld.current = false;
}

export function PlatformJump() {
  const active = useGameActive();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [combo, setCombo] = useState(0);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const px = useRef(W / 2);
  const py = useRef(0);
  const vy = useRef(0);
  const vx = useRef(0);
  const plats = useRef<Plat[]>([]);
  const particles = useRef<Particle[]>([]);
  const clouds = useRef<{ x: number; y: number; s: number }[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const overRef = useRef(false);
  const leftHeld = useRef(false);
  const rightHeld = useRef(false);
  const frame = useRef(0);

  const addPlatformsAbove = useCallback((fromY: number, count: number) => {
    let y = fromY;
    for (let i = 0; i < count; i++) {
      y -= randInt(58, 76);
      const kindRoll = Math.random();
      const kind: Plat["kind"] =
        kindRoll > 0.9 ? "spring" : kindRoll > 0.82 ? "moving" : "normal";
      plats.current.push({
        x: randInt(16, W - PW - 16),
        y,
        w: PW,
        kind,
        movePhase: Math.random() * Math.PI * 2,
      });
    }
  }, []);

  const reset = useCallback(() => {
    const groundY = H - 72;
    plats.current = [
      {
        x: (W - START_W) / 2,
        y: groundY,
        w: START_W,
        kind: "normal",
      },
    ];
    addPlatformsAbove(groundY, 13);

    const startPlat = plats.current[0];
    px.current = startPlat.x + startPlat.w / 2;
    py.current = startPlat.y - PLAYER_R - 1;
    vy.current = 0;
    vx.current = 0;
    clearInput(leftHeld, rightHeld);

    particles.current = [];
    clouds.current = Array.from({ length: 6 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.55,
      s: 0.3 + Math.random() * 0.5,
    }));
    scoreRef.current = 0;
    comboRef.current = 0;
    overRef.current = false;
    frame.current = 0;
    setScore(0);
    setCombo(0);
    setOver(false);
    submitted.current = false;
    scoreGame.resetMilestones();
  }, [addPlatformsAbove, scoreGame]);

  useGameBoot(reset);

  useEffect(() => {
    if (over && !submitted.current) {
      submitted.current = true;
      scoreGame.submitFinal(score);
    }
  }, [over, score, scoreGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas || over) return;
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
    const clearTouch = () => clearInput(leftHeld, rightHeld);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("touchstart", onTouchSide, { passive: true });
    canvas.addEventListener("touchmove", onTouchSide, { passive: true });
    canvas.addEventListener("touchend", clearTouch);
    canvas.addEventListener("touchcancel", clearTouch);

    let raf = 0;
    const loop = () => {
      if (!active || overRef.current) return;
      frame.current++;

      if (leftHeld.current) vx.current = Math.max(vx.current - 0.5, -4.5);
      else if (rightHeld.current) vx.current = Math.min(vx.current + 0.5, 4.5);
      else vx.current *= 0.85;

      px.current += vx.current;
      if (px.current < PLAYER_R) {
        px.current = PLAYER_R;
        if (vx.current < 0) vx.current = 0;
      }
      if (px.current > W - PLAYER_R) {
        px.current = W - PLAYER_R;
        if (vx.current > 0) vx.current = 0;
      }

      vy.current += GRAVITY;
      py.current += vy.current;

      plats.current.forEach((p) => {
        if (p.kind === "moving") {
          p.movePhase = (p.movePhase ?? 0) + 0.035;
          p.x = (W - p.w) / 2 + Math.sin(p.movePhase) * (W / 2 - p.w - 20);
        }
      });

      if (vy.current > 0) {
        for (const p of plats.current) {
          const feet = py.current + PLAYER_R;
          if (
            feet >= p.y - 6 &&
            feet <= p.y + 14 &&
            px.current > p.x + 6 &&
            px.current < p.x + p.w - 6
          ) {
            py.current = p.y - PLAYER_R;
            vy.current = p.kind === "spring" ? SPRING_JUMP : JUMP;
            if (p.kind === "spring") {
              sounds.spring();
              spawnBurst(particles.current, px.current, py.current + PLAYER_R, 14, [
                "#fde047",
                "#fbbf24",
                "#fff",
              ]);
            } else {
              sounds.jump();
              spawnBurst(particles.current, px.current, py.current + PLAYER_R, 6, [
                "#86efac",
                "#4ade80",
              ]);
            }
            comboRef.current += 1;
            if (comboRef.current % 5 === 0) {
              sounds.combo(comboRef.current);
              setCombo(comboRef.current);
            }
            break;
          }
        }
      }

      const scrollLine = H * 0.42;
      if (py.current < scrollLine) {
        const shift = scrollLine - py.current;
        py.current = scrollLine;
        plats.current.forEach((p) => (p.y += shift));
        clouds.current.forEach((c) => {
          c.y += shift * 0.3;
          if (c.y > H + 40) c.y = -20;
        });
        scoreRef.current += Math.floor(shift);
        setScore(scoreRef.current);
        if (frame.current % 25 === 0) scoreGame.checkMilestone(scoreRef.current);

        let topY = plats.current.reduce((m, p) => Math.min(m, p.y), H);
        while (topY > 55) {
          topY -= randInt(58, 76);
          const kindRoll = Math.random();
          plats.current.push({
            x: randInt(16, W - PW - 16),
            y: topY,
            w: PW,
            kind: kindRoll > 0.9 ? "spring" : kindRoll > 0.82 ? "moving" : "normal",
            movePhase: Math.random() * Math.PI * 2,
          });
        }
        plats.current = plats.current.filter((p) => p.y < H + 80);
      }

      const lowest = plats.current.reduce((m, p) => Math.max(m, p.y), 0);
      if (py.current - PLAYER_R > lowest + 100) {
        overRef.current = true;
        setOver(true);
        clearInput(leftHeld, rightHeld);
        sounds.gameOver();
      }

      updateParticles(particles.current);

      const hue = (scoreRef.current / 8) % 360;
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, `hsl(${220 + hue * 0.1}, 80%, 55%)`);
      sky.addColorStop(0.55, `hsl(${200 + hue * 0.08}, 75%, 70%)`);
      sky.addColorStop(1, `hsl(${140 + hue * 0.05}, 70%, 75%)`);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      clouds.current.forEach((c) => {
        c.x += c.s * 0.3;
        if (c.x > W + 50) c.x = -50;
        ctx.font = `${28 + c.s * 20}px serif`;
        ctx.textAlign = "center";
        ctx.fillText("☁️", c.x, c.y);
      });

      plats.current.forEach((p) => {
        const colors =
          p.kind === "spring"
            ? ["#fde047", "#f59e0b"]
            : p.kind === "moving"
              ? ["#a78bfa", "#7c3aed"]
              : ["#4ade80", "#16a34a"];
        const grd = ctx.createLinearGradient(p.x, p.y, p.x, p.y + 16);
        grd.addColorStop(0, colors[0]);
        grd.addColorStop(1, colors[1]);
        ctx.fillStyle = grd;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") ctx.roundRect(p.x, p.y, p.w, 16, 8);
        else ctx.rect(p.x, p.y, p.w, 16);
        ctx.fill();
        if (p.kind === "spring") {
          ctx.font = "14px serif";
          ctx.textAlign = "center";
          ctx.fillText("🚀", p.x + p.w / 2, p.y - 4);
        }
      });

      drawParticles(ctx, particles.current);

      ctx.font = "32px serif";
      ctx.textAlign = "center";
      ctx.fillText("🦸", px.current, py.current + 4);

      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`⬆️ ${scoreRef.current}`, 10, 22);
      ctx.fillText(`🏆 ${Math.max(scoreGame.selfHigh, scoreRef.current)}`, 10, 40);
      if (comboRef.current >= 5) {
        ctx.textAlign = "right";
        ctx.fillStyle = "#fbbf24";
        ctx.fillText(`🔥 x${comboRef.current}`, W - 10, 22);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("touchstart", onTouchSide);
      canvas.removeEventListener("touchmove", onTouchSide);
      canvas.removeEventListener("touchend", clearTouch);
      canvas.removeEventListener("touchcancel", clearTouch);
    };
  }, [active, over, reset, scoreGame]);

  const restart = () => {
    clearInput(leftHeld, rightHeld);
    reset();
  };

  return (
    <div className="game-panel canvas-game">
      <ScoreHud
        score={score}
        selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
      />
      <p className="round-label">
        Adalara zıpla · 🚀 yaylı ada süper zıplar · Düşme!
      </p>
      {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca oyun başlar</p>}
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas" />
      <div className="dpad">
        <div className="dpad-mid">
          <button
            type="button"
            aria-label="Sol"
            onPointerDown={() => (leftHeld.current = true)}
            onPointerUp={() => (leftHeld.current = false)}
            onPointerLeave={() => (leftHeld.current = false)}
          >
            ◀
          </button>
          <button
            type="button"
            aria-label="Sağ"
            onPointerDown={() => (rightHeld.current = true)}
            onPointerUp={() => (rightHeld.current = false)}
            onPointerLeave={() => (rightHeld.current = false)}
          >
            ▶
          </button>
        </div>
      </div>
      {over && (
        <div className="game-over">
          <p>🏝️ Skor: {score}</p>
          {score > scoreGame.selfHigh && score > 0 && (
            <p className="hint-text success">🎉 Yeni rekor!</p>
          )}
          <button type="button" className="btn-primary" onClick={restart}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
