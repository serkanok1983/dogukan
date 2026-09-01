"use client";

import { useState } from "react";
import { sounds } from "@/lib/sounds";

export type QuizQuestion = {
  prompt: string;
  emoji?: string;
  answer: string;
  options: string[];
  hint?: string;
  explanation?: string;
};

type Props = { questions: QuizQuestion[] };

const MAX_QUESTIONS_PER_SESSION = 10;

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function rotate<T>(items: T[], amount: number): T[] {
  if (items.length === 0) return items;
  const offset = amount % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function makeOptions(question: QuizQuestion): string[] {
  const wrong = question.options.filter((o) => o !== question.answer);
  const seed = stableHash(`${question.prompt}|${question.answer}`);
  const selectedWrong = rotate(wrong, seed).slice(0, 3);
  return rotate([question.answer, ...selectedWrong], seed >>> 3);
}

function getSession(questions: QuizQuestion[], start: number): QuizQuestion[] {
  return questions.slice(start, start + MAX_QUESTIONS_PER_SESSION);
}

function getNextSessionStart(total: number, start: number, sessionLength: number): number {
  return start + sessionLength >= total ? 0 : start + sessionLength;
}

export function QuizGame({ questions }: Props) {
  const [sessionStart, setSessionStart] = useState(0);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [opts, setOpts] = useState<string[]>(() =>
    questions[0] ? makeOptions(questions[0]) : [],
  );
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const sessionQuestions = getSession(questions, sessionStart);
  const sessionLength = sessionQuestions.length;
  const q = sessionQuestions[idx];

  if (done) {
    const pct = sessionLength > 0 ? Math.round((score / sessionLength) * 100) : 0;
    const nextSessionStart = getNextSessionStart(
      questions.length,
      sessionStart,
      sessionLength,
    );
    const nextSession = getSession(questions, nextSessionStart);
    const hasMoreQuestions = questions.length > sessionLength;
    const wrappedToStart = nextSessionStart === 0;

    return (
      <div className="game-panel result-panel" role="status" aria-live="polite">
        <div className="result-emoji" aria-hidden="true">
          {pct >= 80 ? "🏆" : pct >= 50 ? "⭐" : "💪"}
        </div>
        <h2>Tebrikler!</h2>
        <p className="result-score">
          {score} / {sessionLength} doğru
        </p>
        <p className="result-msg">
          {pct >= 80 ? "Harika iş çıkardın!" : pct >= 50 ? "Güzel! Bir daha dene!" : "Pratik yap, başaracaksın!"}
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setSessionStart(nextSessionStart);
            setIdx(0);
            setScore(0);
            setFeedback("idle");
            setSelectedChoice(null);
            setOpts(nextSession[0] ? makeOptions(nextSession[0]) : []);
            setDone(false);
          }}
        >
          {hasMoreQuestions && !wrappedToStart
            ? "Tekrar oyna · sıradaki sorular →"
            : "Baştan tekrar oyna 🔄"}
        </button>
      </div>
    );
  }

  if (!q) return null;

  const pick = (choice: string) => {
    if (feedback !== "idle") return;
    setSelectedChoice(choice);
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
    const nextIndex = idx + 1;
    if (nextIndex >= sessionLength) {
      setDone(true);
      sounds.win();
      return;
    }
    setIdx(nextIndex);
    setOpts(makeOptions(sessionQuestions[nextIndex]));
    setFeedback("idle");
    setSelectedChoice(null);
  };

  const explanation =
    q.explanation ??
    q.hint ??
    `Doğru eşleşme “${q.answer}”. Sorudaki ipucuyla bu seçeneği karşılaştır.`;
  const questionId = `quiz-question-${sessionStart}-${idx}`;

  return (
    <div className="game-panel">
      <div
        className="progress-bar"
        role="progressbar"
        aria-label="Soru ilerlemesi"
        aria-valuemin={1}
        aria-valuemax={sessionLength}
        aria-valuenow={idx + 1}
      >
        <div className="progress-fill" style={{ width: `${((idx + 1) / sessionLength) * 100}%` }} />
      </div>
      <p className="round-label">
        Soru {idx + 1} / {sessionLength} · ⭐ {score}
        {questions.length > sessionLength ? ` · Havuz ${questions.length}` : ""}
      </p>
      <div className={`question-card ${feedback !== "idle" ? feedback : ""}`}>
        {q.emoji && <span className="q-emoji" aria-hidden="true">{q.emoji}</span>}
        <h2 id={questionId}>{q.prompt}</h2>
        <div className="quiz-feedback" role="status" aria-live="polite" aria-atomic="true">
          {feedback === "wrong" ? (
            <p className="hint-text">
              <strong>Henüz değil.</strong> Sen “{selectedChoice}” seçtin; doğru yanıt “{q.answer}”. {explanation}
            </p>
          ) : null}
          {feedback === "correct" ? (
            <p className="hint-text success">
              <strong>Doğru! 🎉</strong> {explanation}
            </p>
          ) : null}
        </div>
      </div>
      <div className="options-grid" role="group" aria-labelledby={questionId}>
        {opts.map((o, optionIndex) => (
          <button
            key={`${o}-${optionIndex}`}
            type="button"
            className={`option-btn ${
              feedback !== "idle" && o === q.answer
                ? "correct"
                : feedback === "wrong" && o === selectedChoice
                  ? "wrong"
                  : ""
            }`}
            onClick={() => pick(o)}
            disabled={feedback !== "idle"}
          >
            {o}
          </button>
        ))}
      </div>
      {feedback !== "idle" && (
        <button type="button" className="btn-primary next-btn" onClick={next}>
          {idx + 1 >= sessionLength ? "Bitir" : "Sonraki →"}
        </button>
      )}
    </div>
  );
}
