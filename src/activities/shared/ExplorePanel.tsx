"use client";

import { useEffect, useRef, useState } from "react";
import { SayButton } from "@/components/SayButton";
import { useGameActive } from "@/lib/gameSession";
import { sounds } from "@/lib/sounds";
import { speak } from "@/lib/speech";

export type ExploreItem = {
  id: string;
  emoji: string;
  title: string;
  fact: string;
};

type Props = { items: ExploreItem[]; title: string };

/** "1 · Merkür" → "Merkür": sıra numarası yazıda kalır, okunmaz. */
function spokenTitle(title: string): string {
  return title.replace(/^\s*\d+\s*·\s*/, "");
}

function itemSay(item: ExploreItem): string {
  return `${spokenTitle(item.title)}. ${item.fact}`;
}

/** Dokununca öğenin adı ve bilgisi okunur; panel açılınca başlık ve ilk öğe okunur. */
export function ExplorePanel({ items, title }: Props) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const gameActive = useGameActive();
  const greeted = useRef(false);

  const current = items.find((i) => i.id === active) ?? items[0];

  // StartCard dokunuşu sesi açtı; yalnızca etkinken ve bir kez.
  useEffect(() => {
    if (!gameActive || greeted.current || !current) return;
    greeted.current = true;
    speak(`${title}. ${itemSay(current)}`);
  }, [gameActive, title, current]);

  return (
    <div className="game-panel explore-panel">
      <div className="explore-head">
        <SayButton text={title} size={56} label="Başlığı dinle" />
        <h2 className="explore-title">{title}</h2>
      </div>
      <div className="explore-stage">
        <span className="explore-big" aria-hidden="true">
          {current?.emoji}
        </span>
        <div className="explore-head">
          {current ? <SayButton text={itemSay(current)} size={56} /> : null}
          <h3>{current?.title}</h3>
        </div>
        <p>{current?.fact}</p>
      </div>
      <div className="explore-tabs">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            className={`explore-tab ${active === it.id ? "active" : ""}`}
            aria-label={spokenTitle(it.title)}
            aria-pressed={active === it.id}
            onClick={() => {
              if (!gameActive) return;
              sounds.tap();
              setActive(it.id);
              speak(itemSay(it));
            }}
          >
            <span aria-hidden="true">{it.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
