"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { matchGameKey } from "@/lib/gameKeys";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";

const GAME_SLUG = "kosu-macera";

type Obs = { x: number; w: number; h: number; kind: "cactus" | "coin" | "bird"; yOffset: number };

const W = 320;
const H = 400;
const GROUND = H - 56;
const DURATION = 60;

export function RunnerDash() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [done, setDone] = useState(false);
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
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(DURATION);
  const overRef = useRef(false);

  const reset = useCallback(() => {
    py.current = GROUND;
    vy.current = 0;
    grounded.current = true;
    obs.current = [];
    particles.current = [];
    speed.current = 5;
    frame.current = 0;
    scoreRef.current = 0;
    overRef.current = false;
    timeLeftRef.current = DURATION;
    setScore(0);
    setTimeLeft(DURATION);
    setDone(false);
    submitted.current = false;
    scoreGame.resetMilestones();
  }, [scoreGame]);

  useGameBoot(reset);

  useEffect(() => {
    if (done && !submitted.current) {
      submitted.current = true;
      scoreGame.submitFinal(score);
    }
  }, [done, score, scoreGame]);

  useEffect(() => {
    if (!running || done) return;
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
  }, [running, done]);

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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const onKey = (e: KeyboardEvent) => {
      if (matchGameKey(e, "Space") || matchGameKey(e, "ArrowUp")) {
        e.preventDefault();
        jump();
      }
    };
    const onTap = () => jump();
    window.addEventListener("keydown", onKey);
    canvas.addEventListener("pointerdown", onTap);

    let raf = 0;
    const loop = () => {
      if (!running || overRef.current || done) return;
      frame.current++;
      speed.current = Math.min(11, 5 + scoreRef.current * 0.008);

      if (frame.current % Math.max(28, 50 - speed.current * 2) === 0) {
        const roll = Math.random();
        obs.current.push({
          x: W + 20,
          w: roll > 0.85 ? 28 : 22,
          h: roll > 0.85 ? 36 : 28,
          kind: roll > 0.75 ? "coin" : roll > 0.55 ? "bird" : "cactus",
          yOffset: roll > 0.75 ? 0 : roll > 0.55 ? -36 : 0,
        });
      }

      vy.current += 0.55;
      py.current += vy.current;
      if (py.current >= GROUND) {
        py.current = GROUND;
        vy.current = 0;
        grounded.current = true;
      }

      const px = 72;
      const ph = 40;

      obs.current = obs.current.filter((o) => {
        o.x -= speed.current;
        const oy = GROUND - o.h + o.yOffset;
        if (o.kind === "coin") {
          if (
            o.x < px + 30 &&
            o.x + o.w > px &&
            py.current - ph < oy + o.h &&
            py.current > oy
          ) {
            scoreRef.current += 25;
            setScore(scoreRef.current);
            sounds.coin();
            const cx = o.x + o.w / 2;
            const cy = oy + o.h / 2;
            spawnBurst(particles.current, cx, cy, 10, ["#fde047", "#fff"]);
            juiceRef.current.burst(cx, cy, "#fde047", 12);
            juiceRef.current.popScore(cx, cy - 14, "+25");
            return false;
          }
        } else if (
          o.x < px + 26 &&
          o.x + o.w > px + 8 &&
          py.current - ph + 8 < oy + o.h &&
          py.current - 4 > oy
        ) {
          overRef.current = true;
          setDone(true);
          sounds.gameOver();
          spawnBurst(particles.current, px, py.current - 20, 16, ["#ef4444", "#f97316"]);
          return false;
        }
        return o.x > -40;
      });

      scoreRef.current += 1;
      if (frame.current % 12 === 0) {
        setScore(scoreRef.current);
        scoreGame.checkMilestone(scoreRef.current);
      }

      updateParticles(particles.current);

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
      const fx = juiceRef.current;
      fx.update();
      fx.draw(ctx, W, H);

      ctx.font = "34px serif";
      ctx.textAlign = "center";
      ctx.fillText(grounded.current ? "🏃" : "🏃‍♂️", px, py.current);

      ctx.fillStyle = "#1e3a5f";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`🏁 ${scoreRef.current}`, 10, 22);
      ctx.fillText(`⏱ ${timeLeftRef.current}s`, 10, 40);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onTap);
    };
  }, [running, done, jump, scoreGame]);

  return (
    <div className="game-panel canvas-game">
      <ScoreHud
        score={score}
        selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
        playerName={scoreGame.playerName}
      />
      <p className="round-label">Dokun = zıpla · 🪙 topla · 🌵🦅 kaç · 60 saniye!</p>
      {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca koşu başlar</p>}
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas" />
      {done && (
        <div className="game-over">
          <p>{overRef.current ? "💥 Takıldın! " : "🏆 Süre bitti! "}Skor: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
