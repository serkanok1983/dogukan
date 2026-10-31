"use client";

import { useState } from "react";
import { ChoiceCard } from "./ChoiceCard";
import { numberWord } from "./numbers";
import type { RendererProps } from "./rendererTypes";
import { CountVisual } from "./visuals/CountVisual";

/**
 * Bire bir eşleme (MEB): çocuk her nesneye bir kez dokunur, ses birlikte sayar
 * ("bir, iki, üç…"). Hepsi sayılınca sayı seçenekleri gelir; cevap `[String(n)]`.
 * Nesneler `prompt.visual` (type "count") içinden gelir; yoksa ⭐ × cevap.
 */
export function TapCount(props: RendererProps) {
  const { ex, phase, disabled, say } = props;
  const visual = ex.prompt.visual?.type === "count" ? ex.prompt.visual : null;
  const n = Math.max(0, Math.floor(visual?.n ?? Number(ex.answerIds[0] ?? 0)));
  const emoji = visual?.emoji ?? "⭐";
  const layout = visual?.layout ?? (n > 10 ? "tenframe" : "rows5");
  const [tapOrder, setTapOrder] = useState<number[]>([]);
  const counted = tapOrder.length >= n;
  const showChoices = counted || phase !== "ask";

  const tap = (i: number) => {
    if (disabled || tapOrder.includes(i)) return;
    const next = [...tapOrder, i];
    setTapOrder(next);
    say(numberWord(next.length), 1);
  };

  return (
    <div className="ex-tapcount">
      <CountVisual emoji={emoji} n={n} layout={layout} tapOrder={tapOrder} onTap={tap} disabled={disabled} />
      {showChoices ? (
        <div className="ex-tapcount-choices">
          <ChoiceCard {...props} />
        </div>
      ) : (
        <p className="ex-tapcount-hint" aria-hidden>
          👆
        </p>
      )}
    </div>
  );
}
