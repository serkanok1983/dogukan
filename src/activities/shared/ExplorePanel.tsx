"use client";

import { useState } from "react";
import { sounds } from "@/lib/sounds";

export type ExploreItem = {
  id: string;
  emoji: string;
  title: string;
  fact: string;
};

type Props = { items: ExploreItem[]; title: string };

export function ExplorePanel({ items, title }: Props) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  const current = items.find((i) => i.id === active) ?? items[0];

  return (
    <div className="game-panel explore-panel">
      <h2 className="explore-title">{title}</h2>
      <div className="explore-stage">
        <span className="explore-big">{current?.emoji}</span>
        <h3>{current?.title}</h3>
        <p>{current?.fact}</p>
      </div>
      <div className="explore-tabs">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            className={`explore-tab ${active === it.id ? "active" : ""}`}
            onClick={() => {
              sounds.tap();
              setActive(it.id);
            }}
          >
            {it.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
