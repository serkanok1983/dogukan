"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { acelyaSounds } from "@/lib/acelyaSounds";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { GameTouchBar } from "@/components/GameTouchBar";
import { useCanvasFit } from "@/hooks/useCanvasFit";

const GAME_SLUG = "tetris";
const GAME_W = 400;
const GAME_H = 720;
const COLS = 10;
const ROWS = 20;
const CELL = 32;
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;
const OFFSET_X = (GAME_W - BOARD_W) / 2;

const SHAPES = {
  I: { color: "#00f0f0", m: [[1, 1, 1, 1]] },
  O: { color: "#f0f000", m: [[1, 1], [1, 1]] },
  T: { color: "#a000f0", m: [[0, 1, 0], [1, 1, 1]] },
  S: { color: "#00f000", m: [[0, 1, 1], [1, 1, 0]] },
  Z: { color: "#f00000", m: [[1, 1, 0], [0, 1, 1]] },
  J: { color: "#0000f0", m: [[1, 0, 0], [1, 1, 1]] },
  L: { color: "#f0a000", m: [[0, 0, 1], [1, 1, 1]] },
} as const;
const KEYS = Object.keys(SHAPES) as (keyof typeof SHAPES)[];

type Piece = { key: string; color: string; matrix: number[][]; x: number; y: number };

export function Tetris() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const juiceRef = useRef(createGameJuice());
  useCanvasFit(canvasRef, GAME_W, GAME_H, { hudRef, minWidth: 240 });
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [over, setOver] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const boardRef = useRef<string[][]>([]);
  const pieceRef = useRef<Piece | null>(null);
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);
  const dropMsRef = useRef(600);
  const lastDropRef = useRef(0);
  const overRef = useRef(false);

  const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill("") as string[]);

  const randomPiece = (): Piece => {
    const k = KEYS[Math.floor(Math.random() * KEYS.length)];
    const s = SHAPES[k];
    return { key: k, color: s.color, matrix: s.m.map((r) => [...r]), x: 3, y: 0 };
  };

  const rotate = (m: number[][]) => {
    const rows = m.length;
    const cols = m[0].length;
    const out = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) out[c][rows - 1 - r] = m[r][c];
    return out;
  };

  const collides = (px: number, py: number, matrix: number[][]) => {
    const board = boardRef.current;
    for (let r = 0; r < matrix.length; r++)
      for (let c = 0; c < matrix[r].length; c++) {
        if (!matrix[r][c]) continue;
        const br = py + r;
        const bc = px + c;
        if (bc < 0 || bc >= COLS || br >= ROWS) return true;
        if (br >= 0 && board[br][bc]) return true;
      }
    return false;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const fx = juiceRef.current;
    const board = boardRef.current;
    const piece = pieceRef.current;

    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.strokeRect(OFFSET_X + 0.5, 0.5, BOARD_W - 1, BOARD_H - 1);

    const drawCell = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(OFFSET_X + x * CELL, y * CELL, CELL - 1, CELL - 1);
    };

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) if (board[r][c]) drawCell(c, r, board[r][c]);

    if (piece) {
      const m = piece.matrix;
      for (let r = 0; r < m.length; r++)
        for (let c = 0; c < m[r].length; c++)
          if (m[r][c] && piece.y + r >= 0) drawCell(piece.x + c, piece.y + r, piece.color);
    }

    if (overRef.current) {
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(OFFSET_X, 0, BOARD_W, BOARD_H);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px var(--font-display), system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Oyun Bitti", GAME_W / 2, BOARD_H / 2);
    }
    fx.update();
    fx.draw(ctx, GAME_W, GAME_H);
  }, []);

  const clearLines = () => {
    const board = boardRef.current;
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((cell) => cell)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(""));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      const pts = [0, 100, 300, 500, 800][cleared] * levelRef.current;
      scoreRef.current += pts;
      linesRef.current += cleared;
      levelRef.current = 1 + Math.floor(linesRef.current / 10);
      dropMsRef.current = Math.max(80, 600 - (levelRef.current - 1) * 50);
      setScore(scoreRef.current);
      setLines(linesRef.current);
      setLevel(levelRef.current);
      acelyaSounds.explode();
      const fx = juiceRef.current;
      fx.shakeScreen(4 + cleared * 2);
      fx.flashScreen(0.12 * cleared);
      fx.popScore(GAME_W / 2, BOARD_H / 2, `+${pts}`);
      void scoreGame.checkMilestone(scoreRef.current);
    }
  };

  const spawn = useCallback(() => {
    pieceRef.current = randomPiece();
    const piece = pieceRef.current;
    if (collides(piece.x, piece.y, piece.matrix)) {
      if (!overRef.current) {
        acelyaSounds.explode();
        juiceRef.current.shakeScreen(14);
        juiceRef.current.flashScreen(0.28);
        void scoreGame.submitFinal(scoreRef.current);
        overRef.current = true;
        setOver(true);
      }
    }
  }, [scoreGame]);

  const lock = useCallback(() => {
    const piece = pieceRef.current;
    if (!piece) return;
    const m = piece.matrix;
    const board = boardRef.current;
    for (let r = 0; r < m.length; r++)
      for (let c = 0; c < m[r].length; c++)
        if (m[r][c] && piece.y + r >= 0) board[piece.y + r][piece.x + c] = piece.color;
    clearLines();
    acelyaSounds.hit();
    spawn();
    draw();
  }, [draw, spawn]);

  const tryMove = (dx: number, dy: number, matrix?: number[][]) => {
    const piece = pieceRef.current;
    if (!piece) return false;
    const m = matrix ?? piece.matrix;
    if (!collides(piece.x + dx, piece.y + dy, m)) {
      piece.x += dx;
      piece.y += dy;
      return true;
    }
    return false;
  };

  const tick = useCallback(() => {
    if (overRef.current || !running) return;
    if (!tryMove(0, 1)) lock();
    else draw();
  }, [running, draw, lock]);

  const hardDrop = () => {
    while (tryMove(0, 1)) {
      /* drop */
    }
    lock();
  };

  const reset = useCallback(() => {
    boardRef.current = emptyBoard();
    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    dropMsRef.current = 600;
    overRef.current = false;
    submitted.current = false;
    setScore(0);
    setLines(0);
    setLevel(1);
    setOver(false);
    scoreGame.resetMilestones();
    spawn();
    lastDropRef.current = performance.now();
    draw();
  }, [draw, scoreGame, spawn]);

  useGameBoot(reset);

  useEffect(() => {
    if (over && !submitted.current) {
      submitted.current = true;
      void scoreGame.submitFinal(score);
    }
  }, [over, score, scoreGame]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!running || overRef.current) return;
      if (e.key === "ArrowLeft") {
        tryMove(-1, 0);
        draw();
        e.preventDefault();
      }
      if (e.key === "ArrowRight") {
        tryMove(1, 0);
        draw();
        e.preventDefault();
      }
      if (e.key === "ArrowDown") {
        tick();
        e.preventDefault();
      }
      if (e.key === "ArrowUp") {
        const piece = pieceRef.current;
        if (piece) {
          const rot = rotate(piece.matrix);
          if (!collides(piece.x, piece.y, rot)) piece.matrix = rot;
          draw();
        }
        e.preventDefault();
      }
      if (e.code === "Space") {
        hardDrop();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [running, draw, tick]);

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      if (running && !overRef.current && now - lastDropRef.current > dropMsRef.current) {
        lastDropRef.current = now;
        tick();
      } else draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, draw, tick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let touchX = 0;
    const onStart = (e: TouchEvent) => {
      touchX = e.touches[0].clientX;
      e.preventDefault();
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchX;
      const piece = pieceRef.current;
      if (!piece || overRef.current) return;
      if (Math.abs(dx) < 30) {
        const rot = rotate(piece.matrix);
        if (!collides(piece.x, piece.y, rot)) piece.matrix = rot;
      } else if (dx > 40) tryMove(1, 0);
      else if (dx < -40) tryMove(-1, 0);
      draw();
      e.preventDefault();
    };
    canvas.addEventListener("touchstart", onStart, { passive: false });
    canvas.addEventListener("touchend", onEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchend", onEnd);
    };
  }, [draw]);

  return (
    <div className="game-panel canvas-game acelya-game fullscreen-game">
      <div ref={hudRef} className="acelya-hud">
        <ScoreHud score={score} selfHigh={scoreGame.selfHigh} rivalHigh={scoreGame.rivalHigh} rivalName={scoreGame.rivalName} />
        <p className="round-label">
          Skor: {score} · Satır: {lines} · Seviye: {level}
        </p>
        {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca Tetris başlar</p>}
      </div>
      <div className="acelya-game-stage">
        <canvas ref={canvasRef} width={GAME_W} height={GAME_H} className="game-canvas touch-canvas tetris-canvas" />
      </div>
      <GameTouchBar gameId="tetris" />
      {over && (
        <div className="game-over">
          <p>🧱 Skor: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
