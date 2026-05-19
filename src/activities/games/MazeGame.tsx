"use client";

import { useState } from "react";
import { useGameActive } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";

const MAZE = [
  "###########",
  "#S...#....#",
  "#.##.#.##.#",
  "#....#....#",
  "###.####..#",
  "#.....#...#",
  "#.###.#.###",
  "#...#...#G#",
  "###########",
];

type Pos = { r: number; c: number };

export function MazeGame() {
  const active = useGameActive();
  const running = useGameRunning();
  const [pos, setPos] = useState<Pos>(() => {
    for (let r = 0; r < MAZE.length; r++)
      for (let c = 0; c < MAZE[r].length; c++) if (MAZE[r][c] === "S") return { r, c };
    return { r: 1, c: 1 };
  });
  const [won, setWon] = useState(false);
  const [steps, setSteps] = useState(0);

  const move = (dr: number, dc: number) => {
    if (!running || won) return;
    const nr = pos.r + dr;
    const nc = pos.c + dc;
    if (MAZE[nr]?.[nc] === "#") {
      sounds.wrong();
      return;
    }
    sounds.tap();
    setSteps((s) => s + 1);
    setPos({ r: nr, c: nc });
    if (MAZE[nr][nc] === "G") {
      sounds.win();
      setWon(true);
    }
  };

  if (won) {
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">🏁</div>
        <h2>Labirenti bitirdin!</h2>
        <p className="result-score">{steps} adım</p>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Tekrar
        </button>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <p className="round-label">Adım: {steps} — 🐶 hedefe ulaş!</p>
      <div className="maze-grid">
        {MAZE.map((row, r) =>
          row.split("").map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`maze-cell ${cell === "#" ? "wall" : "path"} ${pos.r === r && pos.c === c ? "player" : ""}`}
            >
              {pos.r === r && pos.c === c ? "🐶" : cell === "G" ? "🏁" : ""}
            </div>
          ))
        )}
      </div>
      <div className="dpad">
        <button type="button" onClick={() => move(-1, 0)}>
          ▲
        </button>
        <div className="dpad-mid">
          <button type="button" onClick={() => move(0, -1)}>
            ◀
          </button>
          <button type="button" onClick={() => move(0, 1)}>
            ▶
          </button>
        </div>
        <button type="button" onClick={() => move(1, 0)}>
          ▼
        </button>
      </div>
    </div>
  );
}
