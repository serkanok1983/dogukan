"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { spawnBurst, updateParticles, drawParticles, type Particle } from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";

const GAME_SLUG = "royal-match";

/* ── grid & layout ────────────────────────────────── */
const COLS = 7;
const ROWS = 7;
const MARGIN_X = 14;
const MARGIN_Y = 52;
const CELL = 44;
const W = MARGIN_X * 2 + CELL * COLS;
const H = MARGIN_Y + CELL * ROWS + 36;
const GEM_KINDS = 6;
const MOVE_LIMIT = 30;

type Gem = {
  kind: number; // 0..5
  row: number;
  col: number;
  /** visual y offset for fall animation, 0 = settled */
  visualY: number;
  opacity: number;
  /** unique id for list stability */
  id: number;
};

const GEM_COLORS = [
  "#ef4444", // red ruby
  "#3b82f6", // blue sapphire
  "#22c55e", // green emerald
  "#f59e0b", // yellow topaz
  "#8b5cf6", // purple amethyst
  "#f472b6", // pink diamond
];

const GEM_SHAPES = ["◆", "●", "▲", "★", "⬟", "♥"];

/* ── helpers ──────────────────────────────────────── */
let _idSeq = 0;
function nextId() { return ++_idSeq; }

function buildGrid(): Gem[][] {
  const grid: Gem[][] = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      let kind = randInt(0, GEM_KINDS - 1);
      // avoid initial matches
      while (
        (c >= 2 && grid[r][c - 1].kind === kind && grid[r][c - 2].kind === kind) ||
        (r >= 2 && grid[r - 1][c].kind === kind && grid[r - 2][c].kind === kind)
      ) {
        kind = randInt(0, GEM_KINDS - 1);
      }
      grid[r][c] = { kind, row: r, col: c, visualY: 0, opacity: 1, id: nextId() };
    }
  }
  return grid;
}

/* ── component ────────────────────────────────────── */
export function RoyalMatch() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(MOVE_LIMIT);
  const [done, setDone] = useState(false);
  const [combo, setCombo] = useState(0);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  /* mutable refs for animation loop */
  const gridRef = useRef<Gem[][]>(buildGrid());
  const particles = useRef<Particle[]>([]);
  const juiceRef = useRef(createGameJuice());
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const movesLeftRef = useRef(MOVE_LIMIT);
  const messageRef = useRef("");
  const selectedRef = useRef<[number, number] | null>(null);
  const swapping = useRef(false);
  const settling = useRef(false);
  const frameRef = useRef(0);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  /* ── core logic ─────────────────────────────── */
  const getGemsInLine = (grid: Gem[][], startR: number, startC: number, dr: number, dc: number): [number, number][] => {
    const kind = grid[startR]?.[startC]?.kind;
    if (kind === undefined) return [];
    const cells: [number, number][] = [[startR, startC]];
    for (let i = 1; i < Math.max(ROWS, COLS); i++) {
      const nr = startR + dr * i;
      const nc = startC + dc * i;
      if (grid[nr]?.[nc]?.kind === kind && grid[nr][nc].opacity > 0) cells.push([nr, nc]);
      else break;
    }
    return cells;
  };

  const findAllMatches = (grid: Gem[][]): Set<string> => {
    const matched = new Set<string>();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c].opacity <= 0) continue;
        // horizontal
        const h = getGemsInLine(grid, r, c, 0, 1);
        if (h.length >= 3) h.forEach(([rr, cc]) => matched.add(`${rr},${cc}`));
        // vertical
        const v = getGemsInLine(grid, r, c, 1, 0);
        if (v.length >= 3) v.forEach(([rr, cc]) => matched.add(`${rr},${cc}`));
      }
    }
    return matched;
  };

  const removeAndCollapse = (grid: Gem[][], matched: Set<string>): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (matched.size === 0) { resolve(); return; }

      // mark matched as removed (opacity 0)
      for (const key of matched) {
        const [r, c] = key.split(",").map(Number);
        grid[r][c].opacity = 0;
      }

      // collapse columns
      for (let c = 0; c < COLS; c++) {
        let writeRow = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (grid[r][c].opacity > 0) {
            if (r !== writeRow) {
              grid[writeRow][c] = { ...grid[r][c], row: writeRow, visualY: -(writeRow - r) * CELL };
              grid[r][c] = { kind: -1, row: r, col: c, visualY: 0, opacity: 0, id: -1 };
            }
            writeRow--;
          }
        }
        // fill empty spots from top
        for (let r = writeRow; r >= 0; r--) {
          const kind = randInt(0, GEM_KINDS - 1);
          grid[r][c] = { kind, row: r, col: c, visualY: -(writeRow - r + 1) * CELL, opacity: 1, id: nextId() };
        }
      }

      // animate fall
      settling.current = true;
      const animate = () => {
        let allSettled = true;
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const g = grid[r][c];
            if (g.visualY < 0) {
              g.visualY += 12;
              if (g.visualY >= 0) g.visualY = 0;
              else allSettled = false;
            }
          }
        }
        if (!allSettled) {
          requestAnimationFrame(animate);
        } else {
          settling.current = false;
          // check for chain matches
          const newMatches = findAllMatches(grid);
          if (newMatches.size > 0) {
            const bonus = newMatches.size * 5;
            scoreRef.current += bonus;
            setScore(scoreRef.current);
            scoreGame.checkMilestone(scoreRef.current);
            comboRef.current++;
            setCombo(comboRef.current);
            setMessage(`🔥 Zincir! +${bonus}`);
            messageRef.current = `🔥 Zincir! +${bonus}`;
            sounds.combo(comboRef.current);
            juiceRef.current.shakeScreen(4 + comboRef.current * 2);
            // burst at match locations
            for (const key of newMatches) {
              const [mr, mc] = key.split(",").map(Number);
              const cx = MARGIN_X + mc * CELL + CELL / 2;
              const cy = MARGIN_Y + mr * CELL + CELL / 2;
              spawnBurst(particles.current, cx, cy, 8, [GEM_COLORS[grid[mr][mc].kind], "#fff"], 3);
              juiceRef.current.popScore(cx, cy - 8, `+${Math.floor(bonus / newMatches.size)}`);
            }
            setTimeout(() => removeAndCollapse(grid, newMatches).then(resolve), 200);
          } else {
            resolve();
          }
        }
      };
      requestAnimationFrame(animate);
    });
  };

  const clearMessage = () => { messageRef.current = ""; setMessage(""); };

  const trySwap = useCallback(async (r1: number, c1: number, r2: number, c2: number) => {
    if (swapping.current || settling.current) return;
    swapping.current = true;
    const grid = gridRef.current;
    const g1 = grid[r1]?.[c1];
    const g2 = grid[r2]?.[c2];
    if (!g1 || !g2 || g1.opacity <= 0 || g2.opacity <= 0) { swapping.current = false; return; }

    // swap
    [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
    grid[r1][c1].row = r1; grid[r1][c1].col = c1;
    grid[r2][c2].row = r2; grid[r2][c2].col = c2;

    const matches = findAllMatches(grid);
    if (matches.size > 0) {
      movesLeftRef.current--;
      setMovesLeft(movesLeftRef.current);
      sounds.success();
      comboRef.current = 0;
      const pts = matches.size * 10;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      scoreGame.checkMilestone(scoreRef.current);
      clearMessage();

      // burst effects
      for (const key of matches) {
        const [mr, mc] = key.split(",").map(Number);
        const cx = MARGIN_X + mc * CELL + CELL / 2;
        const cy = MARGIN_Y + mr * CELL + CELL / 2;
        spawnBurst(particles.current, cx, cy, 10, [GEM_COLORS[grid[mr][mc].kind], "#fff", "#fef08a"], 4);
      }
      juiceRef.current.popScore(MARGIN_X + c2 * CELL + CELL / 2, MARGIN_Y + r2 * CELL - 6, `+${pts}`);
      juiceRef.current.flashScreen(0.15);

      await removeAndCollapse(grid, matches);

      if (movesLeftRef.current <= 0) {
        setDone(true);
        sounds.win();
        setMessage("🎉 Harika! Oyun Bitti");
        messageRef.current = "🎉 Harika! Oyun Bitti";
      }
    } else {
      // swap back
      [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
      grid[r1][c1].row = r1; grid[r1][c1].col = c1;
      grid[r2][c2].row = r2; grid[r2][c2].col = c2;
      sounds.wrong();
      juiceRef.current.shakeScreen(5);
      setMessage("Geçersiz hamle!");
      messageRef.current = "Geçersiz hamle!";
      setTimeout(clearMessage, 1000);
    }
    swapping.current = false;
    selectedRef.current = null;
    setSelected(null);
  }, [scoreGame]);

  /* ── pointer / drag ─────────────────────────── */
  const cellFromXY = (clientX: number, clientY: number): [number, number] | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    const col = Math.floor((x - MARGIN_X) / CELL);
    const row = Math.floor((y - MARGIN_Y) / CELL);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
    return [row, col];
  };

  const reset = useCallback(() => {
    _idSeq = 0;
    gridRef.current = buildGrid();
    particles.current = [];
    juiceRef.current = createGameJuice();
    scoreRef.current = 0;
    comboRef.current = 0;
    movesLeftRef.current = MOVE_LIMIT;
    messageRef.current = "";
    swapping.current = false;
    settling.current = false;
    selectedRef.current = null;
    dragStart.current = null;
    setScore(0);
    setCombo(0);
    setMovesLeft(MOVE_LIMIT);
    setDone(false);
    setMessage("");
    setSelected(null);
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

  /* ── render loop ────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!running || !canvas || done) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleDown = (e: MouseEvent | TouchEvent) => {
      if (done || swapping.current || settling.current) return;
      const pt = "touches" in e ? e.touches[0] : e;
      const cell = cellFromXY(pt.clientX, pt.clientY);
      if (!cell) return;
      dragStart.current = { x: pt.clientX, y: pt.clientY };
      const [row, col] = cell;
      if (selectedRef.current) {
        const [sr, sc] = selectedRef.current;
        const dr = Math.abs(row - sr);
        const dc = Math.abs(col - sc);
        if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
          trySwap(sr, sc, row, col);
          return;
        }
      }
      selectedRef.current = [row, col];
      setSelected([row, col]);
    };

    const handleUp = (e: MouseEvent | TouchEvent) => {
      if (!dragStart.current || done || swapping.current || settling.current) return;
      const pt = "changedTouches" in e ? (e as TouchEvent).changedTouches[0] : e;
      const dx = pt.clientX - dragStart.current.x;
      const dy = pt.clientY - dragStart.current.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 16 && selectedRef.current) {
        // detect swipe direction
        const [sr, sc] = selectedRef.current;
        let tr = sr, tc = sc;
        if (Math.abs(dx) > Math.abs(dy)) {
          tc = dx > 0 ? sc + 1 : sc - 1;
        } else {
          tr = dy > 0 ? sr + 1 : sr - 1;
        }
        if (tr >= 0 && tr < ROWS && tc >= 0 && tc < COLS) {
          trySwap(sr, sc, tr, tc);
        }
      }
      dragStart.current = null;
    };

    canvas.addEventListener("mousedown", handleDown);
    canvas.addEventListener("touchstart", handleDown, { passive: true });
    canvas.addEventListener("mouseup", handleUp);
    canvas.addEventListener("touchend", handleUp);

    let raf = 0;
    const loop = () => {
      if (!running || done) return;
      frameRef.current++;

      updateParticles(particles.current);

      const ctx2 = ctx;
      ctx2.save();

      // Background - deep royal gradient
      const bg = ctx2.createRadialGradient(W / 2, H * 0.4, H * 0.1, W / 2, H / 2, H * 1.2);
      bg.addColorStop(0, "#1e1b4b");
      bg.addColorStop(0.5, "#0f0d2e");
      bg.addColorStop(1, "#020016");
      ctx2.fillStyle = bg;
      ctx2.fillRect(0, 0, W, H);

      // Grid area with subtle frame
      ctx2.fillStyle = "rgba(255,255,255,0.04)";
      ctx2.strokeStyle = "rgba(255,255,255,0.12)";
      ctx2.lineWidth = 2;
      const gx = MARGIN_X - 4;
      const gy = MARGIN_Y - 4;
      const gw = COLS * CELL + 8;
      const gh = ROWS * CELL + 8;
      ctx2.beginPath();
      ctx2.roundRect(gx, gy, gw, gh, 8);
      ctx2.fill();
      ctx2.stroke();

      // Cell backgrounds
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cx = MARGIN_X + c * CELL;
          const cy = MARGIN_Y + r * CELL;
          ctx2.fillStyle = (r + c) % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)";
          ctx2.fillRect(cx + 1, cy + 1, CELL - 2, CELL - 2);
        }
      }

      // Draw gems
      const sel = selectedRef.current;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const g = gridRef.current[r][c];
          if (g.opacity <= 0) continue;
          const cx = MARGIN_X + c * CELL + CELL / 2;
          const cy = MARGIN_Y + r * CELL + CELL / 2 + g.visualY;
          const radius = CELL / 2 - 4;

          ctx2.save();
          ctx2.globalAlpha = g.opacity;

          // Glow
          const glow = ctx2.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius * 1.4);
          glow.addColorStop(0, GEM_COLORS[g.kind] + "99");
          glow.addColorStop(1, "transparent");
          ctx2.fillStyle = glow;
          ctx2.beginPath();
          ctx2.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
          ctx2.fill();

          // Gem body
          const gemGrad = ctx2.createRadialGradient(cx - radius * 0.25, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
          gemGrad.addColorStop(0, "#ffffff");
          gemGrad.addColorStop(0.35, GEM_COLORS[g.kind]);
          gemGrad.addColorStop(1, GEM_COLORS[g.kind] + "66");
          ctx2.fillStyle = gemGrad;
          ctx2.beginPath();
          ctx2.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx2.fill();
          ctx2.strokeStyle = "rgba(255,255,255,0.3)";
          ctx2.lineWidth = 1.5;
          ctx2.stroke();

          // Inner highlight
          const hl = ctx2.createRadialGradient(cx - radius * 0.3, cy - radius * 0.35, 0, cx, cy, radius * 0.7);
          hl.addColorStop(0, "rgba(255,255,255,0.5)");
          hl.addColorStop(1, "transparent");
          ctx2.fillStyle = hl;
          ctx2.beginPath();
          ctx2.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx2.fill();

          // Emoji / shape
          ctx2.fillStyle = "rgba(255,255,255,0.85)";
          ctx2.font = `${radius * 0.9}px serif`;
          ctx2.textAlign = "center";
          ctx2.textBaseline = "middle";
          ctx2.fillText(GEM_SHAPES[g.kind], cx, cy + 1);

          // Selection highlight
          if (sel && sel[0] === r && sel[1] === c) {
            ctx2.strokeStyle = "#fbbf24";
            ctx2.lineWidth = 3;
            ctx2.shadowColor = "#fbbf24";
            ctx2.shadowBlur = 12;
            ctx2.beginPath();
            ctx2.arc(cx, cy, radius + 2, 0, Math.PI * 2);
            ctx2.stroke();
            ctx2.shadowBlur = 0;
          }

          ctx2.restore();
        }
      }

      // Particles
      drawParticles(ctx2, particles.current);

      // Juice effects
      const fx = juiceRef.current;
      fx.update();
      fx.draw(ctx2, W, H);

      // HUD
      ctx2.fillStyle = "#f8fafc";
      ctx2.font = "bold 15px var(--font-nunito), system-ui, sans-serif";
      ctx2.textAlign = "left";
      ctx2.fillText(`💎 ${scoreRef.current}`, 8, 22);

      ctx2.font = "bold 13px var(--font-nunito), system-ui, sans-serif";
      ctx2.textAlign = "right";
      const moveColor = movesLeftRef.current <= 5 ? "#ef4444" : "#fbbf24";
      ctx2.fillStyle = moveColor;
      ctx2.fillText(`Hamle: ${movesLeftRef.current}`, W - 8, 22);

      if (comboRef.current >= 2) {
        ctx2.fillStyle = "#f97316";
        ctx2.font = "bold 14px var(--font-nunito), system-ui, sans-serif";
        ctx2.textAlign = "center";
        ctx2.fillText(`🔥 Combo x${comboRef.current}`, W / 2, 22);
      }

      if (messageRef.current) {
        ctx2.fillStyle = "#fef08a";
        ctx2.font = "bold 16px var(--font-nunito), system-ui, sans-serif";
        ctx2.textAlign = "center";
        ctx2.fillText(messageRef.current, W / 2, H - 8);
      }

      ctx2.restore();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousedown", handleDown);
      canvas.removeEventListener("touchstart", handleDown);
      canvas.removeEventListener("mouseup", handleUp);
      canvas.removeEventListener("touchend", handleUp);
    };
  }, [running, done, trySwap, scoreGame]);

  return (
    <div className="game-panel canvas-game">
      <ScoreHud
        score={score}
        selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
        playerName={scoreGame.playerName}
      />
      <p className="round-label">
        Komşu taşları kaydırarak 3 veya daha fazlasını eşleştir! {MOVE_LIMIT} hamlen var.
      </p>
      {!active && <p className="game-waiting">{"ℹ️ Başla’ya basınca oyun aktif olur"}</p>}
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas" />
      {message && !done && (
        <div className="game-message">{message}</div>
      )}
      {done && (
        <div className="game-over">
          <p>👑 Muhteşem! Puan: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}