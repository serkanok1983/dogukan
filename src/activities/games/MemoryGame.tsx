"use client";

import { useEffect, useRef, useState } from "react";
import { useRegisterRestart } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { useGameScore } from "@/hooks/useGameScore";
import { haptic } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { speak } from "@/lib/speech";
import { shuffle } from "@/lib/utils";

const GAME_SLUG = "hafiza-kartlari";

const EASY = ["🍎", "🐶", "⭐", "🌸", "🎈", "🦋"];
const MEDIUM = ["🍎", "🐶", "⭐", "🌸", "🎈", "🦋", "🍊", "🐟", "🚗", "🌈"];
const HARD = [
  "🍎",
  "🐶",
  "⭐",
  "🌸",
  "🎈",
  "🦋",
  "🍊",
  "🐟",
  "🚗",
  "🌈",
  "🦄",
  "🍕",
  "⚽",
  "🎸",
];

type Level = { name: string; emoji: string; pairs: string[]; cols: number };
const LEVELS: Level[] = [
  { name: "Kolay", emoji: "🐣", pairs: EASY, cols: 3 },
  { name: "Orta", emoji: "🐥", pairs: MEDIUM, cols: 4 },
  { name: "Zor", emoji: "🦅", pairs: HARD, cols: 4 },
];

type Card = { id: number; emoji: string; matched: boolean };

export function MemoryGame() {
  const running = useGameRunning();
  const scoreGame = useGameScore(GAME_SLUG);
  const [levelIdx, setLevelIdx] = useState<number | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const submitted = useRef(false);

  const level = levelIdx !== null ? LEVELS[levelIdx] : null;

  const startLevel = (idx: number) => {
    const lv = LEVELS[idx];
    const deck = shuffle([...lv.pairs, ...lv.pairs]).map((emoji, id) => ({
      id,
      emoji,
      matched: false,
    }));
    setLevelIdx(idx);
    setCards(deck);
    setFlipped([]);
    setMoves(0);
    setLocked(false);
    submitted.current = false;
    scoreGame.resetMilestones();
    sounds.tap();
  };

  // RewardSheet "Tekrar": aynı seviyeyi yeniden karıştır.
  useRegisterRestart(() => {
    if (levelIdx !== null) startLevel(levelIdx);
  });

  const won = level !== null && cards.length > 0 && cards.every((c) => c.matched);

  useEffect(() => {
    if (!won || submitted.current || levelIdx === null) return;
    submitted.current = true;
    // Skor = eşleşen çift sayısı (6 / 10 / 14), seviye = zorluk (1–3).
    void scoreGame.submitFinal(LEVELS[levelIdx].pairs.length, {
      level: levelIdx + 1,
    });
  }, [won, levelIdx, scoreGame]);

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
        const allDone = cards.every((c, i) => c.matched || i === a || i === b);
        if (allDone) {
          sounds.win();
          haptic("win");
        } else {
          sounds.success();
          haptic("tick");
        }
        setCards((prev) =>
          prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)),
        );
        setFlipped([]);
        setLocked(false);
      } else {
        sounds.softWrong();
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 700);
      }
    }
  };

  if (level === null) {
    return (
      <div className="game-panel gf-memory-menu">
        <h2 className="count-prompt">
          <span aria-hidden>🃏</span>
        </h2>
        <div className="gf-memory-levels">
          {LEVELS.map((lv, i) => (
            <button
              key={lv.name}
              type="button"
              className="option-btn gf-memory-level"
              onClick={() => {
                speak(lv.name);
                startLevel(i);
              }}
              aria-label={`${lv.name}, ${lv.pairs.length} çift`}
            >
              <span className="gf-memory-level-emoji" aria-hidden>
                {lv.emoji}
              </span>
              <span>{lv.pairs.length} 🃏</span>
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
        <p className="result-score">
          {moves} hamle — {level.name}
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={backToMenu}
          style={{ marginRight: 8 }}
        >
          Seviye Seç
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => startLevel(levelIdx!)}
        >
          Tekrar Oyna
        </button>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <p className="round-label">
        {level.emoji} · 👆 {moves}
      </p>
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
      <button
        type="button"
        className="btn-ghost clear-btn gf-memory-back"
        onClick={backToMenu}
        aria-label="Seviye seç"
      >
        <span aria-hidden>↩ 🐣🐥🦅</span>
      </button>
    </div>
  );
}
