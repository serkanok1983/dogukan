"use client";

import { useState } from "react";
import { useGameActive } from "@/lib/gameSession";
import { sounds } from "@/lib/sounds";

const GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const EMOJI = ["🚀", "🌟", "🍎", "🐶", "🎈", "🌸", "⭐", "🦋", ""];

function shuffleBoard(): number[] {
  const b = [...GOAL];
  for (let i = 0; i < 40; i++) {
    const empty = b.indexOf(0);
    const moves = [empty - 1, empty + 1, empty - 3, empty + 3].filter(
      (m) => m >= 0 && m < 9 && Math.abs((m % 3) - (empty % 3)) <= 1
    );
    const pick = moves[Math.floor(Math.random() * moves.length)];
    [b[empty], b[pick]] = [b[pick], b[empty]];
  }
  return b;
}

export function SlidingPuzzle() {
  const active = useGameActive();
  const [board, setBoard] = useState(shuffleBoard);
  const [moves, setMoves] = useState(0);

  const won = board.every((v, i) => v === GOAL[i]);

  const tap = (i: number) => {
    if (!active) return;
    const empty = board.indexOf(0);
    const er = Math.floor(empty / 3);
    const ec = empty % 3;
    const r = Math.floor(i / 3);
    const c = i % 3;
    if ((Math.abs(er - r) === 1 && ec === c) || (Math.abs(ec - c) === 1 && er === r)) {
      const next = [...board];
      [next[empty], next[i]] = [next[i], next[empty]];
      setBoard(next);
      setMoves((m) => m + 1);
      sounds.tap();
      if (next.every((v, idx) => v === GOAL[idx])) sounds.win();
    }
  };

  if (won) {
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">🧩</div>
        <h2>Puzzle tamam!</h2>
        <p className="result-score">{moves} hamle</p>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Tekrar
        </button>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <p className="round-label">Hamle: {moves}</p>
      <div className="puzzle-grid">
        {board.map((v, i) => (
          <button
            key={i}
            type="button"
            className={`puzzle-tile ${v === 0 ? "empty" : ""}`}
            onClick={() => v !== 0 && tap(i)}
            disabled={v === 0}
          >
            {v !== 0 ? EMOJI[v - 1] : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
