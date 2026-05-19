"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { GameTouchBar } from "@/components/GameTouchBar";

const GAME_SLUG = "flappy-bird";

const W = 320;
const H = 480;
const GRAVITY = 0.42;
const FLAP = -7.2;
const PIPE_W = 52;
const PIPE_GAP = 128;
const PIPE_SPD = 2.4;
const BIRD_X = 72;
const BIRD_R = 18;

type Pipe = { x: number; gapY: number; scored: boolean };

export function FlappyBird() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [ready, setReady] = useState(true);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const by = useRef(H / 2);
  const vy = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const particles = useRef<Particle[]>([]);
  const juiceRef = useRef(createGameJuice());
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const overRef = useRef(false);
  const readyRef = useRef(true);
  const frame = useRef(0);
  const flapAnim = useRef(0);
  const groundOff = useRef(0);

  const reset = useCallback(() => {
    by.current = H / 2 - 20;
    vy.current = 0;
    pipes.current = [{ x: W + 80, gapY: randInt(100, H - PIPE_GAP - 120), scored: false }];
    particles.current = [];
    scoreRef.current = 0;
    overRef.current = false;
    readyRef.current = true;
    frame.current = 0;
    flapAnim.current = 0;
    groundOff.current = 0;
    setScore(0);
    setOver(false);
    setReady(true);
    submitted.current = false;
    scoreGame.resetMilestones();
  }, [scoreGame]);

  useGameBoot(reset);

  useEffect(() => {
    bestRef.current = Math.max(bestRef.current, scoreGame.selfHigh);
    setBest(scoreGame.selfHigh);
  }, [scoreGame.selfHigh]);

  useEffect(() => {
    if (over && !submitted.current) {
      submitted.current = true;
      void scoreGame.submitFinal(score);
    }
  }, [over, score, scoreGame]);

  const flap = useCallback(() => {
    if (!running || overRef.current) return;
    if (readyRef.current) {
      readyRef.current = false;
      setReady(false);
    }
    vy.current = FLAP;
    flapAnim.current = 8;
    sounds.jump();
    juiceRef.current.burst(BIRD_X, by.current, "#fde047", 6, 2.5);
  }, [running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!running || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        flap();
      }
    };
    const onTap = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      flap();
    };

    window.addEventListener("keydown", onKey);
    canvas.addEventListener("mousedown", onTap);
    canvas.addEventListener("touchstart", onTap, { passive: false });

    let raf = 0;
    const loop = () => {
      if (!running) return;
      frame.current++;
      groundOff.current = (groundOff.current + PIPE_SPD) % 24;

      if (!overRef.current && !readyRef.current) {
        vy.current += GRAVITY;
        by.current += vy.current;

        for (const pipe of pipes.current) {
          pipe.x -= PIPE_SPD;
        }
        if (pipes.current[0]?.x < -PIPE_W - 20) {
          pipes.current.shift();
        }
        const last = pipes.current[pipes.current.length - 1];
        if (!last || last.x < W - 180) {
          pipes.current.push({
            x: W + randInt(40, 100),
            gapY: randInt(90, H - PIPE_GAP - 100),
            scored: false,
          });
        }

        const bx = BIRD_X;
        const byPos = by.current;
        const birdTop = byPos - BIRD_R;
        const birdBot = byPos + BIRD_R;

        if (birdTop < 24 || birdBot > H - 64) {
          overRef.current = true;
          setOver(true);
          juiceRef.current.shakeScreen(12);
          juiceRef.current.flashScreen(0.35);
          spawnBurst(particles.current, bx, byPos, 20, ["#ef4444", "#f97316", "#fde047"]);
          sounds.gameOver();
        }

        for (const pipe of pipes.current) {
          const gapTop = pipe.gapY;
          const gapBot = pipe.gapY + PIPE_GAP;
          const hitX = bx + BIRD_R > pipe.x && bx - BIRD_R < pipe.x + PIPE_W;
          if (hitX && (birdTop < gapTop || birdBot > gapBot)) {
            overRef.current = true;
            setOver(true);
            juiceRef.current.shakeScreen(12);
            juiceRef.current.flashScreen(0.35);
            spawnBurst(particles.current, bx, byPos, 20, ["#ef4444", "#f97316", "#fde047"]);
            sounds.gameOver();
          }
          if (!pipe.scored && pipe.x + PIPE_W < bx - BIRD_R) {
            pipe.scored = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            if (scoreRef.current > bestRef.current) {
              bestRef.current = scoreRef.current;
              setBest(scoreRef.current);
            }
            if (scoreRef.current % 5 === 0) void scoreGame.checkMilestone(scoreRef.current);
            sounds.coin();
            juiceRef.current.popScore(bx, byPos - 24, "+1");
            juiceRef.current.burst(bx, byPos, "#4ade80", 10, 3);
          }
        }
      } else if (readyRef.current) {
        by.current = H / 2 - 20 + Math.sin(frame.current * 0.06) * 10;
      }

      if (flapAnim.current > 0) flapAnim.current--;

      updateParticles(particles.current);
      const fx = juiceRef.current;

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
        const botY = pipe.gapY + PIPE_GAP;
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
        ctx.fillStyle = (x / 24) % 2 === 0 ? "#a16207" : "#ca8a04";
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

      fx.update();
      fx.draw(ctx, W, H);

      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 3;
      ctx.font = "bold 42px var(--font-nunito), sans-serif";
      ctx.textAlign = "center";
      ctx.strokeText(String(scoreRef.current), W / 2, 56);
      ctx.fillText(String(scoreRef.current), W / 2, 56);

      if (readyRef.current && !overRef.current) {
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = "bold 16px var(--font-nunito), sans-serif";
        ctx.fillText("Dokun veya Space — uç! 🐤", W / 2, H / 2 + 60);
      }

      if (overRef.current) {
        ctx.fillStyle = "rgba(15,23,42,0.55)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 22px var(--font-nunito), sans-serif";
        ctx.fillText("Oyun bitti!", W / 2, H / 2 - 20);
        ctx.font = "16px var(--font-nunito), sans-serif";
        ctx.fillText(`Skor: ${scoreRef.current} · En iyi: ${bestRef.current}`, W / 2, H / 2 + 12);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("mousedown", onTap);
      canvas.removeEventListener("touchstart", onTap);
    };
  }, [running, flap, scoreGame]);

  return (
    <div className="game-panel canvas-game flappy-game">
      <ScoreHud
        score={score}
        selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
      />
      <p className="round-label">
        Flappy Bird · Dokun / Space ile zıpla · Boruların arasından geç!
      </p>
      {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca oyun başlar</p>}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="game-canvas touch-canvas flappy-canvas"
      />
      <GameTouchBar gameId="flappy-bird" />
      {over && (
        <div className="game-over">
          <p>🐤 Skor: {score} · En iyi: {Math.max(best, score)}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
