"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { matchGameKey } from "@/lib/gameKeys";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { useCanvasFit } from "@/hooks/useCanvasFit";
import { GameTouchBar } from "@/components/GameTouchBar";

const GAME_SLUG = "yilan-oyunu";
const GRID = 24;
const CELL = 24;
const GAME_SIZE = GRID * CELL;

type Pt = { x: number; y: number };

export function SnakeGame() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  useCanvasFit(canvasRef, GAME_SIZE, GAME_SIZE, { hudRef, minWidth: 300 });
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);
  const juiceRef = useRef(createGameJuice());
  const lastTs = useRef(0);
  const accRef = useRef(0);
  const particles = useRef<Particle[]>([]);
  const state = useRef({
    snake: [{ x: 12, y: 12 }] as Pt[],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 15, y: 12 },
  });

  const reset = useCallback(() => {
    state.current = {
      snake: [{ x: 12, y: 12 }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 15, y: 12 },
    };
    particles.current = [];
    accRef.current = 0;
    lastTs.current = 0;
    setScore(0);
    setOver(false);
    submitted.current = false;
    scoreGame.resetMilestones();
  }, [scoreGame]);

  useGameBoot(reset);

  useEffect(() => {
    if (over && !submitted.current) {
      submitted.current = true;
      scoreGame.submitFinal(score);
    }
  }, [over, score, scoreGame]);

  const spawnFood = useCallback((snake: Pt[]) => {
    let f: Pt;
    do {
      f = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (snake.some((s) => s.x === f.x && s.y === f.y));
    return f;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const fx = juiceRef.current;
    const { snake, food } = state.current;
    const pulse = 0.7 + Math.sin(performance.now() * 0.008) * 0.3;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, GAME_SIZE, GAME_SIZE);
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillStyle = "rgba(255,255,255,0.025)";
          ctx.fillRect(i * CELL, j * CELL, CELL, CELL);
        }
      }
    }
    fx.wrapDraw(ctx, GAME_SIZE, GAME_SIZE, () => {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? "#22d3ee" : "#34d399";
        ctx.fillRect(s.x * CELL + 2, s.y * CELL + 2, CELL - 4, CELL - 4);
      });
      const head = snake[0];
      ctx.fillStyle = "#fff";
      ctx.font = `${CELL - 5}px serif`;
      ctx.fillText("🐍", head.x * CELL + CELL / 2, head.y * CELL + CELL / 2);
      ctx.globalAlpha = 0.35 + pulse * 0.35;
      ctx.font = `${CELL - 4}px serif`;
      ctx.fillText("🍎", food.x * CELL + CELL / 2, food.y * CELL + CELL / 2);
      ctx.globalAlpha = 1;
    });
    updateParticles(particles.current, 1);
    drawParticles(ctx, particles.current);
  }, []);

  const step = useCallback(() => {
    if (!running || over) return;
    const st = state.current;
    st.dir = st.nextDir;
    const head = { x: st.snake[0].x + st.dir.x, y: st.snake[0].y + st.dir.y };
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
      setOver(true);
      juiceRef.current.shakeScreen(10);
      juiceRef.current.flashScreen(0.25);
      sounds.wrong();
      return;
    }
    if (st.snake.some((s) => s.x === head.x && s.y === head.y)) {
      setOver(true);
      juiceRef.current.shakeScreen(10);
      juiceRef.current.flashScreen(0.25);
      sounds.wrong();
      return;
    }
    st.snake.unshift(head);
    if (head.x === st.food.x && head.y === st.food.y) {
      sounds.pop();
      spawnBurst(particles.current, head.x * CELL + CELL / 2, head.y * CELL + CELL / 2, 8, [
        "#4ade80",
        "#fde047",
        "#fff",
      ]);
      juiceRef.current.burst(head.x * CELL + CELL / 2, head.y * CELL + CELL / 2, "#34d399", 10);
      juiceRef.current.popScore(head.x * CELL + CELL / 2, head.y * CELL, "+10");
      setScore((s) => {
        const ns = s + 10;
        void scoreGame.checkMilestone(ns);
        return ns;
      });
      st.food = spawnFood(st.snake);
    } else {
      st.snake.pop();
    }
    draw();
  }, [running, draw, over, spawnFood, scoreGame]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const loop = (ts: number) => {
      const dt = lastTs.current ? ts - lastTs.current : 16;
      lastTs.current = ts;
      accRef.current += dt;
      const speedMs = Math.max(68, 150 - (state.current.snake.length - 1) * 2.2);
      while (accRef.current >= speedMs) {
        accRef.current -= speedMs;
        step();
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, step, draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = state.current;
      const d = st.dir;
      if (matchGameKey(e, "ArrowUp") && d.y !== 1) st.nextDir = { x: 0, y: -1 };
      if (matchGameKey(e, "ArrowDown") && d.y !== -1) st.nextDir = { x: 0, y: 1 };
      if (matchGameKey(e, "ArrowLeft") && d.x !== 1) st.nextDir = { x: -1, y: 0 };
      if (matchGameKey(e, "ArrowRight") && d.x !== -1) st.nextDir = { x: 1, y: 0 };
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="game-panel canvas-game acelya-game fullscreen-game">
      <div ref={hudRef} className="acelya-hud">
        <ScoreHud score={score} selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
        playerName={scoreGame.playerName} />
        <p className="round-label">Snake · daha büyük alan · daha akıcı juice</p>
        {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca yılan hareket eder</p>}
      </div>
      <div className="acelya-game-stage">
        <canvas ref={canvasRef} width={GAME_SIZE} height={GAME_SIZE} className="game-canvas touch-canvas" />
      </div>
      {over && (
        <div className="game-over">
          <p>💥 Oyun bitti! Skor: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
      <GameTouchBar gameId="snake" />
    </div>
  );
}
