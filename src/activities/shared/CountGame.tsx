"use client";

import { useState } from "react";
import { sounds } from "@/lib/sounds";
import { randInt, shuffle } from "@/lib/utils";

const EMOJIS = ["🍎", "⭐", "🐶", "🌸", "🎈", "🦋", "🍊", "🐟"];

function makeRound() {
  const count = randInt(1, 9);
  const emoji = EMOJIS[randInt(0, EMOJIS.length - 1)];
  const wrong = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => n !== count)).slice(0, 3);
  const options = shuffle([count, ...wrong]);
  return { count, emoji, options };
}

export function CountGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "ok" | "bad">("idle");
  // Yeni tur olay işleyicisinde üretilir; render sırasında rastgelelik yok.
  const [{ count, emoji, options }, setPuzzle] = useState(makeRound);

  const pick = (n: number) => {
    if (feedback !== "idle") return;
    if (n === count) {
      sounds.success();
      setFeedback("ok");
      setScore((s) => s + 1);
    } else {
      sounds.wrong();
      setFeedback("bad");
    }
  };

  const next = () => {
    setRound((r) => r + 1);
    setPuzzle(makeRound());
    setFeedback("idle");
  };

  const restart = () => {
    setRound(0);
    setScore(0);
    setPuzzle(makeRound());
    setFeedback("idle");
  };

  const done = round >= 8;

  if (done) {
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">🍎</div>
        <h2>Sayma ustası!</h2>
        <p className="result-score">{score} / 8 doğru</p>
        <button type="button" className="btn-primary" onClick={restart}>
          Tekrar oyna
        </button>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <p className="round-label">
        Tur {round + 1} / 8 · ⭐ {score}
      </p>
      <h2 className="count-prompt">Kaç tane var?</h2>
      <div className="count-grid" aria-label={`${count} adet ${emoji}`}>
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} className="count-item pop-in" style={{ animationDelay: `${i * 0.05}s` }}>
            {emoji}
          </span>
        ))}
      </div>
      <div className="options-grid num-grid">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            className={`option-btn ${feedback !== "idle" && n === count ? "correct" : ""}`}
            onClick={() => pick(n)}
            disabled={feedback !== "idle"}
          >
            {n}
          </button>
        ))}
      </div>
      {feedback !== "idle" && (
        <button type="button" className="btn-primary next-btn" onClick={next}>
          Sonraki →
        </button>
      )}
    </div>
  );
}
