"use client";

import { useState } from "react";
import { PressButton } from "./PressButton";
import type { RendererProps } from "./rendererTypes";

type Props = RendererProps & {
  /** İpucu: doğru sıranın ilk `lockedPrefix` kartı yerine konmuş gelir. */
  lockedPrefix?: number;
};

/**
 * Kartlara sırayla dokun; kartlar üstteki numaralı yuvalara dizilir. Yuvadaki
 * karta dokununca geri döner. Tüm yuvalar dolunca cevap = seçilen id sırası.
 * Motor her yanlış denemede bileşeni yeniden kurar (key), sıra sıfırlanır.
 */
export function OrderStrip({ ex, phase, disabled, onAnswer, say, lockedPrefix = 0 }: Props) {
  const choices = ex.choices ?? [];
  const [seq, setSeq] = useState<string[]>(() => ex.answerIds.slice(0, lockedPrefix));
  const shown = phase === "reveal" ? ex.answerIds : seq;
  const byId = new Map(choices.map((c) => [c.id, c]));
  const pool = choices.filter((c) => !shown.includes(c.id));

  const add = (id: string) => {
    if (disabled || seq.includes(id)) return;
    const next = [...seq, id];
    setSeq(next);
    const card = byId.get(id);
    if (next.length >= choices.length) onAnswer(next);
    else if (card) say(card.say);
  };

  const remove = (index: number) => {
    if (disabled || index < lockedPrefix) return;
    setSeq(seq.filter((_, i) => i !== index));
  };

  return (
    <div className="ex-order">
      <ol className="ex-order-slots" aria-label="Sıra">
        {ex.answerIds.map((_, i) => {
          const card = shown[i] ? byId.get(shown[i]) : undefined;
          if (!card) {
            return (
              <li key={i} className={i === shown.length ? "ex-slot is-next" : "ex-slot"}>
                <span className="ex-slot-num" aria-hidden>
                  {i + 1}
                </span>
              </li>
            );
          }
          const locked = i < lockedPrefix || phase === "reveal" || phase === "correct";
          return (
            <li key={i} className={phase === "reveal" ? "ex-slot is-filled is-right" : "ex-slot is-filled"}>
              <PressButton
                className="ex-card"
                inert={locked || disabled}
                label={card.say}
                onPress={() => remove(i)}
                onLongPress={() => say(card.say)}
              >
                {card.emoji ? <span aria-hidden>{card.emoji}</span> : null}
                {card.text ? <span className="ex-card-text" aria-hidden>{card.text}</span> : null}
              </PressButton>
            </li>
          );
        })}
      </ol>
      <div className="ex-order-pool" role="group" aria-label="Kartlar">
        {pool.map((c) => (
          <PressButton
            key={c.id}
            className="ex-card ex-card--pool"
            inert={disabled}
            label={c.say}
            onPress={() => add(c.id)}
            onLongPress={() => say(c.say)}
          >
            {c.emoji ? <span aria-hidden>{c.emoji}</span> : null}
            {c.text ? <span className="ex-card-text" aria-hidden>{c.text}</span> : null}
          </PressButton>
        ))}
      </div>
    </div>
  );
}
