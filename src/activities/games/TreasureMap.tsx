"use client";

import { useState } from "react";
import { sounds } from "@/lib/sounds";

const GRID = 5;

type Level = {
  target: [number, number];
  steps: string[];
  emoji: string;
};

const LEVELS: Level[] = [
  { target: [2, 0], steps: ["2 sağ"], emoji: "🗺️" },
  { target: [0, 2], steps: ["2 yukarı"], emoji: "🧭" },
  { target: [2, 2], steps: ["2 sağ", "2 aşağı"], emoji: "💎" },
  { target: [4, 0], steps: ["2 sağ", "2 sağ"], emoji: "🏴‍☠️" },
  { target: [0, 4], steps: ["2 aşağı", "2 aşağı"], emoji: "⚓" },
  { target: [2, 4], steps: ["2 sağ", "3 aşağı"], emoji: "🗝️" },
  { target: [4, 4], steps: ["2 sağ", "2 aşağı", "2 sağ"], emoji: "👑" },
  { target: [1, 3], steps: ["1 sağ", "3 aşağı"], emoji: "💍" },
];

function getDisplayGrid(target: [number, number]): string[][] {
  const grid: string[][] = Array.from({ length: GRID }, () => Array(GRID).fill("⬜"));
  // Draw path
  let cx = 0, cy = 0;
  grid[cy][cx] = "🐻";
  for (const step of LEVELS.flatMap((l) => l.steps)) {
    const parts = step.split(" ");
    const count = Number(parts[0]);
    const dir = parts[1];
    for (let i = 0; i < count; i++) {
      if (dir === "sağ") cx = Math.min(GRID - 1, cx + 1);
      else if (dir === "sol") cx = Math.max(0, cx - 1);
      else if (dir === "aşağı") cy = Math.min(GRID - 1, cy + 1);
      else if (dir === "yukarı") cy = Math.max(0, cy - 1);
    }
  }
  return grid;
}

export function TreasureMap() {
  const [round, setRound] = useState(0);
  const [playerPos, setPlayerPos] = useState<[number, number]>([0, 0]);
  const [stepsDone, setStepsDone] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "ok" | "bad">("idle");
  const [done, setDone] = useState(false);

  const level = LEVELS[round % LEVELS.length];

  const move = (dir: string) => {
    if (feedback !== "idle") return;
    const expected = level.steps[stepsDone];
    if (!expected) return;

    const [countStr, expDir] = expected.split(" ");
    if (dir !== expDir) {
      sounds.wrong();
      setFeedback("bad");
      setTimeout(() => setFeedback("idle"), 600);
      return;
    }

    sounds.tap();
    const [px, py] = playerPos;
    let nx = px, ny = py;
    if (dir === "sağ") nx = Math.min(GRID - 1, nx + 1);
    else if (dir === "sol") nx = Math.max(0, nx - 1);
    else if (dir === "aşağı") ny = Math.min(GRID - 1, ny + 1);
    else if (dir === "yukarı") ny = Math.max(0, ny - 1);
    setPlayerPos([nx, ny]);

    const newSteps = stepsDone + 1;
    setStepsDone(newSteps);

    if (newSteps >= level.steps.length) {
      // Check if reached target
      if (nx === level.target[0] && ny === level.target[1]) {
        sounds.success();
        setScore((s) => s + 1);
        setFeedback("ok");
        setTimeout(() => {
          if (round + 1 >= LEVELS.length) {
            setDone(true);
            sounds.win();
          } else {
            setRound((r) => r + 1);
            setPlayerPos([0, 0]);
            setStepsDone(0);
            setFeedback("idle");
          }
        }, 800);
      } else {
        sounds.wrong();
        setFeedback("bad");
        setTimeout(() => {
          setPlayerPos([0, 0]);
          setStepsDone(0);
          setFeedback("idle");
        }, 1000);
      }
    }
  };

  const restart = () => {
    setRound(0);
    setPlayerPos([0, 0]);
    setStepsDone(0);
    setScore(0);
    setFeedback("idle");
    setDone(false);
  };

  const progressPct = level.steps.length > 0 ? (stepsDone / level.steps.length) * 100 : 0;

  if (done) {
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">👑</div>
        <h2>Hazine Bulundu!</h2>
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: "1.2rem" }}>{level.emoji}</span>
        <span style={{ fontSize: "0.95rem", color: "#4b5563" }}>
          {level.steps.join(" → ")}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 300, margin: "0 auto 16px", height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progressPct}%`, background: "#4ade80", borderRadius: 4, transition: "width 0.2s" }} />
      </div>

      <p className="count-prompt">Haritayı takip et, hazineye ulaş!</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${GRID}, 1fr)`,
          gap: 4,
          maxWidth: 300,
          margin: "12px auto",
          background: "#fef3c7",
          padding: 8,
          borderRadius: 12,
          border: "3px solid #f59e0b",
        }}
      >
        {Array.from({ length: GRID }, (_, y) =>
          Array.from({ length: GRID }, (_, x) => {
            const [px, py] = playerPos;
            const [tx, ty] = level.target;
            const isPlayer = px === x && py === y;
            const isTarget = tx === x && ty === y;
            const isStart = x === 0 && y === 0;
            return (
              <div
                key={`${x}-${y}`}
                style={{
                  aspectRatio: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  background: isPlayer ? "#dbeafe" : isStart ? "#dcfce7" : "#fff",
                  borderRadius: 8,
                  border: isPlayer ? "3px solid #3b82f6" : isTarget ? "3px dashed #f59e0b" : "1px solid #fde68a",
                  transition: "all 0.2s",
                }}
              >
                {isPlayer ? "🐻" : isTarget ? level.emoji : isStart ? "🏁" : ""}
              </div>
            );
          })
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, maxWidth: 280, margin: "8px auto" }}>
        <button type="button" className="option-btn" onClick={() => move("yukarı")} disabled={feedback !== "idle"}>
          ⬆️ Yukarı
        </button>
        <button type="button" className="option-btn" onClick={() => move("aşağı")} disabled={feedback !== "idle"}>
          ⬇️ Aşağı
        </button>
        <button type="button" className="option-btn" onClick={() => move("sol")} disabled={feedback !== "idle"}>
          ⬅️ Sol
        </button>
        <button type="button" className="option-btn" onClick={() => move("sağ")} disabled={feedback !== "idle"}>
          ➡️ Sağ
        </button>
      </div>

      <p className="hint-text" style={{ marginTop: 8 }}>
        {feedback === "ok" ? "✅ Doğru!" : feedback === "bad" ? "❌ Tekrar dene!" : `Sıradaki: ${level.steps[stepsDone] ?? "🎉"}`}
      </p>
    </div>
  );
}