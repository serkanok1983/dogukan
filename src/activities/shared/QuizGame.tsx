"use client";

import { useEffect, useState } from "react";
import { sounds } from "@/lib/sounds";
import { shuffle } from "@/lib/utils";

export type QuizQuestion = {
  prompt: string;
  emoji?: string;
  answer: string;
  options: string[];
  hint?: string;
};

type Props = { questions: QuizQuestion[] };

function makeOptions(question: QuizQuestion): string[] {
  const wrong = question.options.filter((o) => o !== question.answer);
  return shuffle([question.answer, ...shuffle(wrong).slice(0, 3)]);
}

export function QuizGame({ questions }: Props) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [opts, setOpts] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [done, setDone] = useState(false);

  const q = questions[idx];

  useEffect(() => {
    if (q) setOpts(makeOptions(q));
  }, [idx, q]);

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">{pct >= 80 ? "🏆" : pct >= 50 ? "⭐" : "💪"}</div>
        <h2>Tebrikler!</h2>
        <p className="result-score">
          {score} / {questions.length} doğru
        </p>
        <p className="result-msg">
          {pct >= 80 ? "Harika iş çıkardın!" : pct >= 50 ? "Güzel! Bir daha dene!" : "Pratik yap, başaracaksın!"}
        </p>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Tekrar oyna 🔄
        </button>
      </div>
    );
  }

  if (!q) return null;

  const pick = (choice: string) => {
    if (feedback !== "idle") return;
    if (choice === q.answer) {
      sounds.success();
      setFeedback("correct");
      setScore((s) => s + 1);
    } else {
      sounds.wrong();
      setFeedback("wrong");
    }
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      setDone(true);
      sounds.win();
      return;
    }
    setIdx((i) => i + 1);
    setFeedback("idle");
  };

  return (
    <div className="game-panel">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="round-label">
        Soru {idx + 1} / {questions.length} · ⭐ {score}
      </p>
      <div className={`question-card ${feedback !== "idle" ? feedback : ""}`}>
        {q.emoji && <span className="q-emoji">{q.emoji}</span>}
        <h2>{q.prompt}</h2>
        {feedback === "wrong" && q.hint && <p className="hint-text">💡 {q.hint}</p>}
        {feedback === "correct" && <p className="hint-text success">Doğru! 🎉</p>}
      </div>
      <div className="options-grid">
        {opts.map((o) => (
          <button
            key={o}
            type="button"
            className={`option-btn ${feedback !== "idle" && o === q.answer ? "correct" : ""}`}
            onClick={() => pick(o)}
            disabled={feedback !== "idle"}
          >
            {o}
          </button>
        ))}
      </div>
      {feedback !== "idle" && (
        <button type="button" className="btn-primary next-btn" onClick={next}>
          {idx + 1 >= questions.length ? "Bitir" : "Sonraki →"}
        </button>
      )}
    </div>
  );
}
