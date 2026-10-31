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
import { useGameLoop } from "@/hooks/useGameLoop";
import { useActivityStats } from "@/hooks/useProgress";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { GameTouchBar } from "@/components/GameTouchBar";
import { canvasFont } from "@/lib/canvasFont";

const GAME_SLUG = "flappy-bird";

const W = 320;
const H = 480;
// Kare başına (60 Hz) sabitler; döngü `dt` ile ölçekler.
const GRAVITY = 0.42;
const FLAP = -7.2;
const PIPE_W = 52;
const BIRD_X = 72;
const BIRD_R = 18;
/** İlk iki boru daha geniş açıklıklı: ısınma. */
const WARMUP_PIPES = 2;
const WARMUP_EXTRA_GAP = 40;

/** MASTER_PLAN §3.5: ease 0.6–1.0 → açıklık 152–128 px, hız 1.92–2.4. */
export function flappyTuning(ease: number) {
  const e = Math.min(1, Math.max(0.6, Number.isFinite(ease) ? ease : 0.7));
  return { pipeGap: 128 + 60 * (1 - e), pipeSpd: 2.4 - 1.2 * (1 - e) };
}

type Pipe = { x: number; gapY: number; gap: number; scored: boolean };

function movePipes(list: Pipe[], dx: number) {
  for (const pipe of list) pipe.x -= dx;
}

function markScored(pipe: Pipe) {
  pipe.scored = true;
}

export function FlappyBird() {
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);
  const ease = useActivityStats(GAME_SLUG)?.ease ?? 0.7;
  const { pipeGap, pipeSpd } = flappyTuning(ease);
  const submitted = useRef(false);

  const by = useRef(H / 2);
  const vy = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const pipesSpawned = useRef(0);
  const particles = useRef<Particle[]>([]);
  const juiceRef = useRef(createGameJuice());
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const overRef = useRef(false);
  const readyRef = useRef(true);
  const frame = useRef(0);
  const flapAnim = useRef(0);
  const groundOff = useRef(0);

  useCanvasFit(canvasRef, W, H, { hudRef, minWidth: 240, dpr: "auto" });

  const spawnPipe = useCallback(
    (x: number) => {
      const gap =
        pipeGap + (pipesSpawned.current < WARMUP_PIPES ? WARMUP_EXTRA_GAP : 0);
      pipesSpawned.current += 1;
      pipes.current.push({
        x,
        gapY: randInt(90, H - gap - 100),
        gap,
        scored: false,
      });
    },
    [pipeGap],
  );

  const reset = useCallback(() => {
    by.current = H / 2 - 20;
    vy.current = 0;
    pipes.current = [];
    pipesSpawned.current = 0;
    spawnPipe(W + 80);
    particles.current = [];
    scoreRef.current = 0;
    overRef.current = false;
    readyRef.current = true;
    frame.current = 0;
    flapAnim.current = 0;
    groundOff.current = 0;
    setScore(0);
    setOver(false);
    submitted.current = false;
    scoreGame.resetMilestones();
  }, [scoreGame, spawnPipe]);

  useGameBoot(reset);
  useRegisterRestart(reset);

  useEffect(() => {
    bestRef.current = Math.max(bestRef.current, scoreGame.selfHigh);
  }, [scoreGame.selfHigh]);

  useEffect(() => {
    if (over && !submitted.current) {
      submitted.current = true;
      void scoreGame.submitFinal(score);
    }
  }, [over, score, scoreGame]);

  const flap = useCallback(() => {
    if (!running || overRef.current) return;
    readyRef.current = false;
    vy.current = FLAP;
    flapAnim.current = 8;
    sounds.jump();
    juiceRef.current.burst(BIRD_X, by.current, "#fde047", 6, 2.5);
  }, [running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!running || !canvas || over) return;

    const onKey = (e: KeyboardEvent) => {
      if (matchGameKey(e, "Space") || matchGameKey(e, "ArrowUp") || e.key === "w") {
        e.preventDefault();
        flap();
      }
    };
    const onTap = (e: PointerEvent) => {
      e.preventDefault();
      flap();
    };

    window.addEventListener("keydown", onKey);
    canvas.addEventListener("pointerdown", onTap);
    return () => {
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onTap);
    };
  }, [running, over, flap]);

  const die = (bx: number, byPos: number) => {
    const fx = juiceRef.current;
    overRef.current = true;
    setOver(true);
    fx.shakeScreen(12);
    fx.flashScreen(0.35);
    fx.haptic("fail");
    spawnBurst(particles.current, bx, byPos, 20, ["#ef4444", "#f97316", "#fde047"]);
    sounds.gameOver();
  };

  const step = (dt: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const fx = juiceRef.current;
    frame.current += dt;
    groundOff.current = (groundOff.current + pipeSpd * dt) % 24;

    if (!overRef.current && !readyRef.current) {
      vy.current += GRAVITY * dt;
      by.current += vy.current * dt;

      movePipes(pipes.current, pipeSpd * dt);
      if (pipes.current[0]?.x < -PIPE_W - 20) {
        pipes.current.shift();
      }
      const last = pipes.current[pipes.current.length - 1];
      if (!last || last.x < W - 180) {
        spawnPipe(W + randInt(40, 100));
      }

      const bx = BIRD_X;
      const byPos = by.current;
      const birdTop = byPos - BIRD_R;
      const birdBot = byPos + BIRD_R;

      if (birdTop < 24 || birdBot > H - 64) die(bx, byPos);

      for (const pipe of pipes.current) {
        if (overRef.current) break;
        const gapTop = pipe.gapY;
        const gapBot = pipe.gapY + pipe.gap;
        const hitX = bx + BIRD_R > pipe.x && bx - BIRD_R < pipe.x + PIPE_W;
        if (hitX && (birdTop < gapTop || birdBot > gapBot)) {
          die(bx, byPos);
          break;
        }
        if (!pipe.scored && pipe.x + PIPE_W < bx - BIRD_R) {
          markScored(pipe);
          scoreRef.current += 1;
          setScore(scoreRef.current);
          if (scoreRef.current > bestRef.current) bestRef.current = scoreRef.current;
          if (scoreRef.current % 5 === 0)
            void scoreGame.checkMilestone(scoreRef.current);
          sounds.coin();
          fx.haptic("tick");
          fx.popScore(bx, byPos - 24, "+1");
          fx.burst(bx, byPos, "#4ade80", 10, 3);
        }
      }
    } else if (readyRef.current) {
      by.current = H / 2 - 20 + Math.sin(frame.current * 0.06) * 10;
    }

    if (flapAnim.current > 0) flapAnim.current = Math.max(0, flapAnim.current - dt);

    updateParticles(particles.current, dt);

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#7dd3fc");
    sky.addColorStop(0.55, "#bae6fd");
    sky.addColorStop(1, "#dcfce7");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.5;
    ctx.font = "28px serif";
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 90 - frame.current * 0.3) % (W + 60)) - 30;
      ctx.fillText("☁️", cx, 50 + i * 22);
    }
    ctx.globalAlpha = 1;

    for (const pipe of pipes.current) {
      const topH = pipe.gapY;
      const botY = pipe.gapY + pipe.gap;
      const grad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0);
      grad.addColorStop(0, "#22c55e");
      grad.addColorStop(0.5, "#4ade80");
      grad.addColorStop(1, "#16a34a");
      ctx.fillStyle = grad;
      ctx.fillRect(pipe.x, 0, PIPE_W, topH);
      ctx.fillRect(pipe.x, botY, PIPE_W, H - botY - 56);
      ctx.fillStyle = "#15803d";
      ctx.fillRect(pipe.x - 4, topH - 22, PIPE_W + 8, 22);
      ctx.fillRect(pipe.x - 4, botY, PIPE_W + 8, 22);
      ctx.fillStyle = "#86efac";
      ctx.fillRect(pipe.x + 8, topH - 14, 12, 14);
      ctx.fillRect(pipe.x + 8, botY + 4, 12, 14);
    }

    ctx.fillStyle = "#ca8a04";
    ctx.fillRect(0, H - 56, W, 56);
    for (let x = -groundOff.current; x < W + 24; x += 24) {
      ctx.fillStyle =
        Math.round((x + groundOff.current) / 24) % 2 === 0 ? "#a16207" : "#ca8a04";
      ctx.fillRect(x, H - 56, 24, 12);
    }

    const tilt = Math.min(0.6, Math.max(-0.5, vy.current * 0.06));
    ctx.save();
    ctx.translate(BIRD_X, by.current);
    ctx.rotate(tilt);
    const scale = 1 + (flapAnim.current > 0 ? 0.12 : 0);
    ctx.scale(scale, scale);
    ctx.font = "36px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐤", 0, 2);
    ctx.restore();

    drawParticles(ctx, particles.current);
    fx.update(dt);
    fx.draw(ctx, W, H);

    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 3;
    ctx.font = canvasFont("bold 42px var(--font-nunito), sans-serif");
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.strokeText(String(scoreRef.current), W / 2, 56);
    ctx.fillText(String(scoreRef.current), W / 2, 56);

    if (readyRef.current && !overRef.current) {
      const pulse = 1 + Math.sin(frame.current * 0.12) * 0.08;
      ctx.save();
      ctx.translate(W / 2, H / 2 + 64);
      ctx.scale(pulse, pulse);
      ctx.font = "40px serif";
      ctx.fillText("👆", 0, 0);
      ctx.restore();
    }

    if (overRef.current) {
      ctx.fillStyle = "rgba(15,23,42,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.font = canvasFont("bold 40px var(--font-nunito), sans-serif");
      ctx.fillText(`⭐ ${scoreRef.current}`, W / 2, H / 2 - 10);
      ctx.font = canvasFont("bold 22px var(--font-nunito), sans-serif");
      ctx.fillText(`🏆 ${bestRef.current}`, W / 2, H / 2 + 28);
    }
  };

  useGameLoop(running && !over, step);

  return (
    <div className="game-panel canvas-game flappy-game">
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
        className="game-canvas touch-canvas flappy-canvas"
      />
      <GameTouchBar gameId="flappy-bird" />
      {over && (
        <div className="game-over">
          <p>
            🐤 Skor: {score} · En iyi: {Math.max(scoreGame.selfHigh, score)}
          </p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
