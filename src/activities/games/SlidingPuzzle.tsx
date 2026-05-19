"use client";

import { useCallback, useMemo, useState } from "react";
import { useGameActive } from "@/lib/gameSession";
import { sounds } from "@/lib/sounds";

const GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const EMOJI = ["🚀", "🌟", "🍎", "🐶", "🎈", "🌸", "⭐", "🦋"];

function shuffleBoard(): number[] {
  const b = [...GOAL];
  for (let i = 0; i < 40; i++) {
    const empty = b.indexOf(0);
    const moves = [empty - 1, empty + 1, empty - 3, empty + 3].filter(
      (m) => m >= 0 && m < 9 && Math.abs((m % 3) - (empty % 3)) <= 1,
    );
    const pick = moves[Math.floor(Math.random() * moves.length)];
    [b[empty], b[pick]] = [b[pick], b[empty]];
  }
  return b;
}

function canMove(board: number[], index: number): boolean {
  const empty = board.indexOf(0);
  const er = Math.floor(empty / 3);
  const ec = empty % 3;
  const r = Math.floor(index / 3);
  const c = index % 3;
  return (
    (Math.abs(er - r) === 1 && ec === c) || (Math.abs(ec - c) === 1 && er === r)
  );
}

export function SlidingPuzzle() {
  const active = useGameActive();
  const [board, setBoard] = useState(shuffleBoard);
  const [moves, setMoves] = useState(0);

  const won = board.every((v, i) => v === GOAL[i]);

  const reset = useCallback(() => {
    setBoard(shuffleBoard());
    setMoves(0);
  }, []);

  const tap = (i: number) => {
    if (!active || board[i] === 0) return;
    if (!canMove(board, i)) {
      sounds.wrong();
      return;
    }
    const empty = board.indexOf(0);
    const next = [...board];
    [next[empty], next[i]] = [next[i], next[empty]];
    setBoard(next);
    setMoves((m) => m + 1);
    sounds.tap();
    if (next.every((v, idx) => v === GOAL[idx])) sounds.win();
  };

  const movable = useMemo(() => {
    const set = new Set<number>();
    board.forEach((v, i) => {
      if (v !== 0 && canMove(board, i)) set.add(i);
    });
    return set;
  }, [board]);

  if (won) {
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">🧩</div>
        <h2>Puzzle tamam!</h2>
        <p className="result-score">{moves} hamlede bitirdin</p>
        <button type="button" className="btn-primary" onClick={reset}>
          Tekrar oyna
        </button>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <p className="round-label puzzle-goal-text">
        <strong>Amaç:</strong> Emojileri aşağıdaki sıraya getir · Boş kare sağ altta
      </p>
      {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca puzzle karışır</p>}

      <div className="puzzle-goal-wrap" aria-label="Hedef sıra">
        <span className="puzzle-goal-label">Hedef 🎯</span>
        <div className="puzzle-grid puzzle-grid-goal">
          {GOAL.map((v, i) => (
            <div key={`goal-${i}`} className={`puzzle-tile puzzle-tile-goal ${v === 0 ? "empty" : ""}`}>
              {v !== 0 ? EMOJI[v - 1] : ""}
            </div>
          ))}
        </div>
      </div>

      <p className="hint-text puzzle-hint">Boş kareye <strong>yanındaki</strong> parlayan emojiye dokun</p>
      <p className="round-label">Hamle: {moves}</p>

      <div className="puzzle-grid">
        {board.map((v, i) => (
          <button
            key={i}
            type="button"
            className={`puzzle-tile ${v === 0 ? "empty" : ""} ${movable.has(i) ? "can-move" : ""} ${v !== 0 && GOAL[i] === v ? "in-place" : ""}`}
            onClick={() => tap(i)}
            disabled={v === 0}
            aria-label={v === 0 ? "Boş kare" : `${EMOJI[v - 1]}${movable.has(i) ? ", kaydırılabilir" : ""}`}
          >
            {v !== 0 ? EMOJI[v - 1] : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

