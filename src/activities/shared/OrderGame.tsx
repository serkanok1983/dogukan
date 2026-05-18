"use client";

import { useState } from "react";
import { sounds } from "@/lib/sounds";
import { shuffle } from "@/lib/utils";

type Props = {
  items: (number | string)[];
  label?: string;
};

export function OrderGame({ items, label = "Küçükten büyüğe sırala" }: Props) {
  const sorted = [...items].sort((a, b) => (a < b ? -1 : 1));
  const [picked, setPicked] = useState<(number | string)[]>([]);
  const [pool, setPool] = useState(() => shuffle(items));
  const [done, setDone] = useState(false);

  const tap = (item: number | string) => {
    const expected = sorted[picked.length];
    if (item === expected) {
      sounds.success();
      const np = [...picked, item];
      setPicked(np);
      setPool((p) => p.filter((x) => x !== item));
      if (np.length === sorted.length) {
        sounds.win();
        setDone(true);
      }
    } else {
      sounds.wrong();
    }
  };

  if (done) {
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">📊</div>
        <h2>Doğru sıra!</h2>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Tekrar
        </button>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <p className="round-label">{label}</p>
      <div className="order-slot">
        {picked.map((p, i) => (
          <span key={i} className="order-chip">
            {p}
          </span>
        ))}
        {picked.length === 0 && <span className="order-hint">Buraya sırayla dokun</span>}
      </div>
      <div className="options-grid">
        {pool.map((p) => (
          <button key={String(p)} type="button" className="option-btn" onClick={() => tap(p)}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
