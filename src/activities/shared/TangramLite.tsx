"use client";

import { useState } from "react";
import { sounds } from "@/lib/sounds";

const PIECES = ["🔺", "🔷", "⬜", "🔺", "▱"];

export function TangramLite() {
  const [placed, setPlaced] = useState<string[]>([]);
  const [pool, setPool] = useState([...PIECES]);

  const place = (piece: string, i: number) => {
    sounds.tap();
    setPlaced((p) => [...p, piece]);
    setPool((p) => p.filter((_, j) => j !== i));
    if (placed.length + 1 >= PIECES.length) sounds.win();
  };

  const done = placed.length >= PIECES.length;

  return (
    <div className="game-panel">
      <p className="round-label">Parçaları ev şekline yerleştir</p>
      <div className="tangram-board">
        <div className="tangram-house">
          {placed.map((p, i) => (
            <span key={i} className="tangram-placed">
              {p}
            </span>
          ))}
        </div>
      </div>
      {!done ? (
        <div className="tangram-pool">
          {pool.map((p, i) => (
            <button key={`${p}-${i}`} type="button" className="tangram-piece" onClick={() => place(p, i)}>
              {p}
            </button>
          ))}
        </div>
      ) : (
        <div className="result-panel inner">
          <h2>Harika! 🏠</h2>
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            Tekrar
          </button>
        </div>
      )}
    </div>
  );
}
