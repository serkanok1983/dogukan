"use client";

import { useMemo, useState } from "react";
import { sounds } from "@/lib/sounds";
import { randInt, shuffle } from "@/lib/utils";

type Level = {
  prompt: string;
  target: string;
  emoji: string;
  parts: { color: string; label: string }[];
  answer: string;
};

const LEVELS: Level[] = [
  { prompt: "Mavi + Sarı = ?", target: "#22c55e", emoji: "🎨", parts: [{ color: "#3b82f6", label: "Mavi" }, { color: "#eab308", label: "Sarı" }], answer: "Yeşil" },
  { prompt: "Kırmızı + Sarı = ?", target: "#f97316", emoji: "🎨", parts: [{ color: "#ef4444", label: "Kırmızı" }, { color: "#eab308", label: "Sarı" }], answer: "Turuncu" },
  { prompt: "Kırmızı + Mavi = ?", target: "#a855f7", emoji: "🎨", parts: [{ color: "#ef4444", label: "Kırmızı" }, { color: "#3b82f6", label: "Mavi" }], answer: "Mor" },
  { prompt: "Kırmızı + Beyaz = ?", target: "#f9a8d4", emoji: "🎨", parts: [{ color: "#ef4444", label: "Kırmızı" }, { color: "#ffffff", label: "Beyaz" }], answer: "Pembe" },
  { prompt: "Mavi + Yeşil = ?", target: "#06b6d4", emoji: "🎨", parts: [{ color: "#3b82f6", label: "Mavi" }, { color: "#22c55e", label: "Yeşil" }], answer: "Turkuaz" },
  { prompt: "Siyah + Beyaz = ?", target: "#9ca3af", emoji: "🎨", parts: [{ color: "#000000", label: "Siyah" }, { color: "#ffffff", label: "Beyaz" }], answer: "Gri" },
  { prompt: "Kırmızı + Yeşil = ?", target: "#854d0e", emoji: "🎨", parts: [{ color: "#ef4444", label: "Kırmızı" }, { color: "#22c55e", label: "Yeşil" }], answer: "Kahverengi" },
  { prompt: "Sarı + Turuncu = ?", target: "#f59e0b", emoji: "🎨", parts: [{ color: "#eab308", label: "Sarı" }, { color: "#f97316", label: "Turuncu" }], answer: "Altın Sarısı" },
];

const OPTIONS = [
  { color: "#22c55e", name: "Yeşil" },
  { color: "#f97316", name: "Turuncu" },
  { color: "#a855f7", name: "Mor" },
  { color: "#f9a8d4", name: "Pembe" },
  { color: "#06b6d4", name: "Turkuaz" },
  { color: "#9ca3af", name: "Gri" },
  { color: "#854d0e", name: "Kahverengi" },
  { color: "#f59e0b", name: "Altın Sarısı" },
  { color: "#3b82f6", name: "Mavi" },
  { color: "#ef4444", name: "Kırmızı" },
  { color: "#eab308", name: "Sarı" },
  { color: "#ffffff", name: "Beyaz" },
  { color: "#000000", name: "Siyah" },
  { color: "#ec4899", name: "Parlak Pembe" },
  { color: "#14b8a6", name: "Deniz Yeşili" },
];

function getFakeOptions(correct: string, count: number): string[] {
  const names = OPTIONS.filter((o) => o.name !== correct).map((o) => o.name);
  const picked: string[] = [];
  while (picked.length < count && names.length > 0) {
    const idx = randInt(0, names.length - 1);
    picked.push(names[idx]);
    names.splice(idx, 1);
  }
  return picked;
}

export function ColorWorkshop() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "ok" | "bad">("idle");
  const [done, setDone] = useState(false);

  const level = LEVELS[round % LEVELS.length];

  const options = useMemo(() => {
    const correct = level.answer;
    const fakes = getFakeOptions(correct, 3);
    return shuffle([correct, ...fakes]);
  }, [round, level.answer]);

  const pick = (name: string) => {
    if (feedback !== "idle") return;
    if (name === level.answer) {
      sounds.success();
      setScore((s) => s + 1);
      setFeedback("ok");
      setTimeout(() => {
        if (round + 1 >= LEVELS.length) {
          setDone(true);
          sounds.win();
        } else {
          setRound((r) => r + 1);
          setFeedback("idle");
        }
      }, 700);
    } else {
      sounds.wrong();
      setFeedback("bad");
      setTimeout(() => setFeedback("idle"), 600);
    }
  };

  const restart = () => {
    setRound(0);
    setScore(0);
    setFeedback("idle");
    setDone(false);
  };

  if (done) {
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">🖌️</div>
        <h2>Renk Ustası!</h2>
        <p className="result-score">{score} / {LEVELS.length}</p>
        <button type="button" className="btn-primary" onClick={restart}>
          Tekrar Oyna
        </button>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <p className="round-label">
        Tur {round + 1}/{LEVELS.length} · ⭐ {score}
      </p>
      <div className="color-mix-demo">
        <div className="color-mix-parts">
          {level.parts.map((p) => (
            <div key={p.color} className="color-mix-part">
              <div
                className="color-mix-swatch"
                style={{ background: p.color, border: p.color === "#ffffff" ? "2px solid #d1d5db" : "none" }}
              />
              <span className="color-mix-label">{p.label}</span>
            </div>
          ))}
        </div>
        <span className="color-mix-plus">+</span>
        <span className="color-mix-eq">= ?</span>
      </div>
      <p className="round-label" style={{ marginTop: 8, fontSize: "1.1rem" }}>{level.prompt}</p>
      <div
        className="color-workshop-options"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          maxWidth: 380,
          margin: "16px auto 0",
        }}
      >
        {options.map((name) => {
          const opt = OPTIONS.find((o) => o.name === name);
          const isCorrect = feedback === "ok" && name === level.answer;
          const isWrong = feedback === "bad" && name === level.answer;
          return (
            <button
              key={name}
              type="button"
              className="option-btn"
              style={{
                padding: "18px 10px",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: isCorrect ? "#dcfce7" : isWrong ? "#fecaca" : undefined,
                border: isCorrect ? "2px solid #22c55e" : isWrong ? "2px solid #ef4444" : undefined,
                opacity: feedback !== "idle" && name !== level.answer ? 0.5 : 1,
              }}
              onClick={() => pick(name)}
              disabled={feedback !== "idle"}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: opt?.color ?? "#ccc",
                  border: opt?.color === "#ffffff" ? "2px solid #d1d5db" : "none",
                  flexShrink: 0,
                }}
              />
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}