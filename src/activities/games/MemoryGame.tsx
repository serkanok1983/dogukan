"use client";

import { useMemo, useState } from "react";
import { useGameActive } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { shuffle } from "@/lib/utils";

const EASY = ["🍎", "🐶", "⭐", "🌸", "🎈", "🦋"];
const MEDIUM = ["🍎", "🐶", "⭐", "🌸", "🎈", "🦋", "🍊", "🐟", "🚗", "🌈"];
const HARD = ["🍎", "🐶", "⭐", "🌸", "🎈", "🦋", "🍊", "🐟", "🚗", "🌈", "🦄", "🍕", "⚽", "🎸"];

type Level = { name: string; pairs: string[]; cols: number };
const LEVELS: Level[] = [
  { name: "Kolay", pairs: EASY, cols: 3 },
  { name: "Orta", pairs: MEDIUM, cols: 4 },
  { name: "Zor", pairs: HARD, cols: 4 },
];

type Card = { id: number; emoji: string; matched: boolean };

export function MemoryGame() {
  const active = useGameActive();
  const running = useGameRunning();
  const [levelIdx, setLevelIdx] = useState<number | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const level = levelIdx !== null ? LEVELS[levelIdx] : null;

  const startLevel = (idx: number) => {
    const lv = LEVELS[idx];
    const deck = shuffle([...lv.pairs, ...lv.pairs]).map((emoji, id) => ({ id, emoji, matched: false }));
    setLevelIdx(idx);
    setCards(deck);
    setFlipped([]);
    setMoves(0);
    setLocked(false);
    sounds.tap();
  };

  const won = level && cards.length > 0 && cards.every((c) => c.matched);

  const backToMenu = () => {
    setLevelIdx(null);
    setCards([]);
    setFlipped([]);
  };

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

  if (level === null) {
    return (
      <div className="game-panel">
        <h2 className="count-prompt">Zorluk seviyesini seç!</h2>
        <div className="options-grid" style={{ maxWidth: 360, margin: "0 auto" }}>
          {LEVELS.map((lv, i) => (
            <button
              key={lv.name}
              type="button"
              className="option-btn"
              style={{ padding: "18px 12px", fontSize: "1.15rem" }}
              onClick={() => startLevel(i)}
            >
              {lv.name === "Kolay" ? "🐣" : lv.name === "Orta" ? "🐥" : "🦅"}{" "}
              {lv.name} ({lv.pairs.length} çift)
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (won) {
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">🃏</div>
        <h2>Hepsini Eşleştirdin!</h2>
        <p className="result-score">{moves} hamle — {level.name}</p>
        <button type="button" className="btn-primary" onClick={backToMenu} style={{ marginRight: 8 }}>
          Seviye Seç
        </button>
        <button type="button" className="btn-primary" onClick={() => startLevel(levelIdx!)}>
          Tekrar Oyna
        </button>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <p className="round-label">{level.name} · Hamle: {moves}</p>
      {!active && <p className="game-waiting">ℹ️ Başla{"'"}ya basınca kartları çevir</p>}
      <div
        className="memory-grid"
        style={{
          gridTemplateColumns: `repeat(${level.cols}, 1fr)`,
          maxWidth: level.cols === 3 ? 300 : 380,
        }}
      >
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
      <button type="button" className="btn-ghost clear-btn" onClick={backToMenu} style={{ marginTop: 12 }}>
        ← Seviye Seç
      </button>
    </div>
  );
}