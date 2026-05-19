"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { spawnBurst, type Particle } from "@/lib/particles";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { sounds } from "@/lib/sounds";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";

const GAME_SLUG = "yilan-oyunu";

const GRID = 14;
const CELL = 22;

type Pt = { x: number; y: number };

export function SnakeGame() {
  const active = useGameActive();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);
  const particles = useRef<Particle[]>([]);
  const state = useRef({
    snake: [{ x: 7, y: 7 }] as Pt[],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 10, y: 7 },
    tick: 0,
  });

  const reset = useCallback(() => {
    state.current = {
      snake: [{ x: 7, y: 7 }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 10, y: 7 },
      tick: 0,
    };
    particles.current = [];
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
    const { snake, food } = state.current;
    const size = GRID * CELL;
    ctx.fillStyle = "#1a2744";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillStyle = "rgba(255,255,255,0.03)";
          ctx.fillRect(i * CELL, j * CELL, CELL, CELL);
        }
      }
    }
    ctx.font = `${CELL - 4}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "#4ecdc4" : "#6ee7b7";
      ctx.fillRect(s.x * CELL + 2, s.y * CELL + 2, CELL - 4, CELL - 4);
      if (i === 0) {
        ctx.fillStyle = "#fff";
        ctx.fillText("🐍", s.x * CELL + CELL / 2, s.y * CELL + CELL / 2);
      }
    });
    ctx.fillText("🍎", food.x * CELL + CELL / 2, food.y * CELL + CELL / 2);
  }, []);

  const step = useCallback(() => {
    if (!active || over) return;
    const st = state.current;
    st.dir = st.nextDir;
    const head = { x: st.snake[0].x + st.dir.x, y: st.snake[0].y + st.dir.y };
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
      setOver(true);
      sounds.wrong();
      return;
    }
    if (st.snake.some((s) => s.x === head.x && s.y === head.y)) {
      setOver(true);
      sounds.wrong();
      return;
    }
    st.snake.unshift(head);
    if (head.x === st.food.x && head.y === st.food.y) {
      sounds.pop();
      spawnBurst(particles.current, head.x * CELL + CELL / 2, head.y * CELL + CELL / 2, 8, [
        "#4ade80",
        "#fde047",
      ]);
      setScore((s) => {
        const ns = s + 10;
        scoreGame.checkMilestone(ns);
        return ns;
      });
      st.food = spawnFood(st.snake);
    } else {
      st.snake.pop();
    }
    draw();
  }, [active, draw, over, spawnFood, scoreGame]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(step, 180);
    return () => clearInterval(id);
  }, [active, step]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = state.current;
      const d = st.dir;
      if (e.key === "ArrowUp" && d.y !== 1) st.nextDir = { x: 0, y: -1 };
      if (e.key === "ArrowDown" && d.y !== -1) st.nextDir = { x: 0, y: 1 };
      if (e.key === "ArrowLeft" && d.x !== 1) st.nextDir = { x: -1, y: 0 };
      if (e.key === "ArrowRight" && d.x !== -1) st.nextDir = { x: 1, y: 0 };
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const touchDir = (dx: number, dy: number) => {
    const st = state.current;
    const d = st.dir;
    if (dx === 0 && dy === -1 && d.y !== 1) st.nextDir = { x: 0, y: -1 };
    if (dx === 0 && dy === 1 && d.y !== -1) st.nextDir = { x: 0, y: 1 };
    if (dx === -1 && dy === 0 && d.x !== 1) st.nextDir = { x: -1, y: 0 };
    if (dx === 1 && dy === 0 && d.x !== -1) st.nextDir = { x: 1, y: 0 };
    sounds.tap();
  };

  const size = GRID * CELL;

  return (
    <div className="game-panel canvas-game">
      <ScoreHud
        score={score}
        selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
      />
      {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca yılan hareket eder</p>}
      <canvas ref={canvasRef} width={size} height={size} className="game-canvas" />
      {over && (
        <div className="game-over">
          <p>Oyun bitti!</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
      <div className="dpad">
        <button type="button" aria-label="Yukarı" onClick={() => touchDir(0, -1)}>
          ▲
        </button>
        <div className="dpad-mid">
          <button type="button" aria-label="Sol" onClick={() => touchDir(-1, 0)}>
            ◀
          </button>
          <button type="button" aria-label="Sağ" onClick={() => touchDir(1, 0)}>
            ▶
          </button>
        </div>
        <button type="button" aria-label="Aşağı" onClick={() => touchDir(0, 1)}>
          ▼
        </button>
      </div>
    </div>
  );
}
