"use client";

import { useMemo, useState } from "react";
import { useGameActive } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { shuffle } from "@/lib/utils";

const PAIRS = ["🍎", "🐶", "⭐", "🌸", "🎈", "🦋", "🍊", "🐟"];

type Card = { id: number; emoji: string; matched: boolean };

export function MemoryGame() {
  const active = useGameActive();
  const running = useGameRunning();
  const [cards, setCards] = useState<Card[]>(() =>
    shuffle([...PAIRS, ...PAIRS]).map((emoji, id) => ({ id, emoji, matched: false }))
  );
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const won = useMemo(() => cards.every((c) => c.matched), [cards]);

  const flip = (idx: number) => {
    if (!running || locked || flipped.includes(idx) || cards[idx].matched) return;
    sounds.tap();
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [a, b] = next;
      if (cards[a].emoji === cards[b].emoji) {
        sounds.success();
        setCards((prev) =>
          prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c))
        );
        setFlipped([]);
        setLocked(false);
      } else {
        sounds.wrong();
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 700);
      }
    }
  };

  if (won) {
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">🃏</div>
        <h2>Eşleştirdin!</h2>
        <p className="result-score">{moves} hamle</p>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Tekrar oyna
        </button>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <p className="round-label">Hamle: {moves}</p>
      {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca kartları çevir</p>}
      <div className="memory-grid">
        {cards.map((c, i) => {
          const show = c.matched || flipped.includes(i);
          return (
            <button
              key={`${c.id}-${i}`}
              type="button"
              className={`memory-card ${show ? "flipped" : ""} ${c.matched ? "matched" : ""}`}
              onClick={() => flip(i)}
              disabled={locked && !flipped.includes(i)}
            >
              <span className="card-back">?</span>
              <span className="card-front">{c.emoji}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
