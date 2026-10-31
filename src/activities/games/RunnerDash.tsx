"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { matchGameKey } from "@/lib/gameKeys";
import {
  drawParticles,
  spawnBurst,
  updateParticles,
  type Particle,
} from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameBoot, useRegisterRestart } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { useCanvasFit } from "@/hooks/useCanvasFit";
import { FRAME_MS, useGameLoop } from "@/hooks/useGameLoop";
import { sounds } from "@/lib/sounds";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";

const GAME_SLUG = "kosu-macera";

type Obs = {
  x: number;
  w: number;
  h: number;
  kind: "cactus" | "coin" | "bird";
  yOffset: number;
};

const W = 320;
const H = 400;
const GROUND = H - 56;
const DURATION = 60;
/** Skor durumu (DOM) kaç karede bir güncellenir. */
const SCORE_SYNC_FRAMES = 12;

function moveObstacles(list: Obs[], dx: number) {
  for (const o of list) o.x -= dx;
}

export function RunnerDash() {
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [endReason, setEndReason] = useState<"crash" | "time" | null>(null);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const py = useRef(GROUND);
  const vy = useRef(0);
  const grounded = useRef(true);
  const obs = useRef<Obs[]>([]);
  const particles = useRef<Particle[]>([]);
  const juiceRef = useRef(createGameJuice());
  const speed = useRef(5);
  const frame = useRef(0);
  const spawnCd = useRef(0);
  const syncCd = useRef(0);
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(DURATION);
  const overRef = useRef(false);

  useCanvasFit(canvasRef, W, H, { hudRef, minWidth: 240, dpr: "auto" });

  const reset = useCallback(() => {
    py.current = GROUND;
    vy.current = 0;
    grounded.current = true;
    obs.current = [];
    particles.current = [];
    speed.current = 5;
    frame.current = 0;
    spawnCd.current = 0;
    syncCd.current = 0;
    scoreRef.current = 0;
    overRef.current = false;
    timeLeftRef.current = DURATION;
    setScore(0);
    setDone(false);
    setEndReason(null);
    submitted.current = false;
    scoreGame.resetMilestones();
  }, [scoreGame]);

  useGameBoot(reset);
  useRegisterRestart(reset);

  useEffect(() => {
    if (done && !submitted.current) {
      submitted.current = true;
      void scoreGame.submitFinal(score);
    }
  }, [done, score, scoreGame]);

  const jump = useCallback(() => {
    if (!running || overRef.current || done || !grounded.current) return;
    vy.current = -13;
    grounded.current = false;
    sounds.jump();
    spawnBurst(particles.current, 70, py.current, 6, ["#fff", "#fde047"]);
  }, [running, done]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!running || !canvas || done) return;

    const onKey = (e: KeyboardEvent) => {
      if (matchGameKey(e, "Space") || matchGameKey(e, "ArrowUp")) {
        e.preventDefault();
        jump();
      }
    };
    const onTap = () => jump();
    window.addEventListener("keydown", onKey);
    canvas.addEventListener("pointerdown", onTap);
    return () => {
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onTap);
    };
  }, [running, done, jump]);

  const finish = (reason: "crash" | "time") => {
    if (reason === "crash") overRef.current = true;
    setScore(Math.floor(scoreRef.current));
    setEndReason(reason);
    setDone(true);
  };

  const step = (dt: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || overRef.current) return;
    const fx = juiceRef.current;
    frame.current += dt;
    speed.current = Math.min(11, 5 + scoreRef.current * 0.008);

    // Süre döngüden sayılır: duraklayınca ve arka planda durur.
    timeLeftRef.current = Math.max(0, timeLeftRef.current - (dt * FRAME_MS) / 1000);
    if (timeLeftRef.current === 0) {
      sounds.win();
      fx.haptic("win");
      finish("time");
      return;
    }

    spawnCd.current -= dt;
    if (spawnCd.current <= 0) {
      spawnCd.current = Math.max(28, 50 - speed.current * 2);
      const roll = Math.random();
      obs.current.push({
        x: W + 20,
        w: roll > 0.85 ? 28 : 22,
        h: roll > 0.85 ? 36 : 28,
        kind: roll > 0.75 ? "coin" : roll > 0.55 ? "bird" : "cactus",
        yOffset: roll > 0.75 ? 0 : roll > 0.55 ? -36 : 0,
      });
    }

    vy.current += 0.55 * dt;
    py.current += vy.current * dt;
    if (py.current >= GROUND) {
      py.current = GROUND;
      vy.current = 0;
      grounded.current = true;
    }

    const px = 72;
    const ph = 40;

    moveObstacles(obs.current, speed.current * dt);
    obs.current = obs.current.filter((o) => {
      if (overRef.current) return true;
      const oy = GROUND - o.h + o.yOffset;
      if (o.kind === "coin") {
        if (
          o.x < px + 30 &&
          o.x + o.w > px &&
          py.current - ph < oy + o.h &&
          py.current > oy
        ) {
          scoreRef.current += 25;
          setScore(Math.floor(scoreRef.current));
          sounds.coin();
          fx.haptic("tick");
          const cx = o.x + o.w / 2;
          const cy = oy + o.h / 2;
          spawnBurst(particles.current, cx, cy, 10, ["#fde047", "#fff"]);
          fx.burst(cx, cy, "#fde047", 12);
          fx.popScore(cx, cy - 14, "+25");
          return false;
        }
      } else if (
        o.x < px + 26 &&
        o.x + o.w > px + 8 &&
        py.current - ph + 8 < oy + o.h &&
        py.current - 4 > oy
      ) {
        sounds.gameOver();
        fx.haptic("fail");
        fx.shakeScreen(10);
        spawnBurst(particles.current, px, py.current - 20, 16, [
          "#ef4444",
          "#f97316",
        ]);
        finish("crash");
        return false;
      }
      return o.x > -40;
    });

    scoreRef.current += dt;
    syncCd.current -= dt;
    if (syncCd.current <= 0) {
      syncCd.current = SCORE_SYNC_FRAMES;
      setScore(Math.floor(scoreRef.current));
      void scoreGame.checkMilestone(Math.floor(scoreRef.current));
    }

    updateParticles(particles.current, dt);

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#7dd3fc");
    sky.addColorStop(0.6, "#bae6fd");
    sky.addColorStop(1, "#fef08a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#a3e635";
    ctx.fillRect(0, GROUND + 4, W, H - GROUND);
    ctx.fillStyle = "#65a30d";
    ctx.fillRect(0, GROUND + 4, W, 8);

    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);
    ctx.lineDashOffset = -frame.current * speed.current * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 20);
    ctx.lineTo(W, GROUND + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    obs.current.forEach((o) => {
      const oy = GROUND - o.h + o.yOffset;
      if (o.kind === "coin") {
        ctx.font = "24px serif";
        ctx.textAlign = "center";
        ctx.fillText("🪙", o.x + o.w / 2, oy + o.h / 2 + 8);
      } else if (o.kind === "bird") {
        ctx.font = "26px serif";
        ctx.fillText("🦅", o.x + o.w / 2, oy + o.h / 2 + 8);
      } else {
        ctx.font = "28px serif";
        ctx.fillText("🌵", o.x + o.w / 2, oy + o.h);
      }
    });

    drawParticles(ctx, particles.current);
    fx.update(dt);
    fx.draw(ctx, W, H);

    ctx.font = "34px serif";
    ctx.textAlign = "center";
    ctx.fillText(grounded.current ? "🏃" : "🏃‍♂️", px, py.current);

    ctx.fillStyle = "#1e3a5f";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`🏁 ${Math.floor(scoreRef.current)}`, 10, 24);
    ctx.fillText(`⏱ ${Math.ceil(timeLeftRef.current)}`, 10, 46);
  };

  useGameLoop(running && !done, step);

  return (
    <div className="game-panel canvas-game">
      <div ref={hudRef}>
        <ScoreHud
          score={score}
          selfHigh={scoreGame.selfHigh}
          rivalHigh={scoreGame.rivalHigh}
          rivalName={scoreGame.rivalName}
          playerName={scoreGame.playerName}
        />
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="game-canvas touch-canvas"
      />
      {done && (
        <div className="game-over">
          <p>
            {endReason === "crash" ? "💥 Takıldın! " : "🏆 Süre bitti! "}Skor:{" "}
            {score}
          </p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
