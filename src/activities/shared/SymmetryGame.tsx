"use client";

import { useState } from "react";
import { sounds } from "@/lib/sounds";

const LEVELS = [
  { left: "🦋", right: "🦋", wrong: "🐶" },
  { left: "❤️", right: "❤️", wrong: "⭐" },
  { left: "🏠", right: "🏠", wrong: "🌳" },
];

export function SymmetryGame() {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const lv = LEVELS[idx % LEVELS.length];

  const pick = (correct: boolean) => {
    if (finished) return;
    if (!correct) {
      sounds.wrong();
      return;
    }
    sounds.success();
    const ns = score + 1;
    setScore(ns);
    if (idx + 1 >= LEVELS.length) {
      setFinished(true);
      sounds.win();
    } else {
      setIdx((i) => i + 1);
    }
  };

  if (finished) {
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">🪞</div>
        <h2>Simetri ustası!</h2>
        <p className="result-score">{score} / {LEVELS.length}</p>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Tekrar
        </button>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <p className="round-label">
        Tur {idx + 1}/{LEVELS.length} · ⭐ {score}
      </p>
      <p className="count-prompt">Hangisi aynı (simetrik)?</p>
      <div className="symmetry-options">
        <button type="button" className="sym-option" onClick={() => pick(true)}>
          {lv.left}
        </button>
        <button type="button" className="sym-option" onClick={() => pick(false)}>
          {lv.wrong}
        </button>
        <button type="button" className="sym-option" onClick={() => pick(true)}>
          {lv.right}
        </button>
      </div>
      <p className="hint-text">🪞 Simetride iki taraf birbirinin aynasıdır</p>
    </div>
  );
}
