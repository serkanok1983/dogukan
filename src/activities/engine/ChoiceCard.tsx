"use client";

import { PressButton } from "./PressButton";
import type { RendererProps } from "./rendererTypes";

/**
 * 2–4 resim/harf/sayı seçeneği (her biri ≥ 96 px). `bigTap` ya da 2 seçenek →
 * iki dev düğme. Uzun basınca seçenek okunur; cevap gösterildikten sonra da.
 */
export function ChoiceCard({
  ex,
  phase,
  faded,
  wrong,
  disabled,
  onAnswer,
  say,
}: RendererProps) {
  const choices = ex.choices ?? [];
  const answer = ex.answerIds[0];
  const showAnswer = phase === "correct" || phase === "reveal";
  const big = ex.bigTap === true || choices.length <= 2;
  const cls = [
    "ex-choices",
    big ? "ex-choices--big" : "",
    `ex-choices--n${choices.length}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} role="group" aria-label="Seçenekler">
      {choices.map((c) => {
        const isFaded = faded.includes(c.id);
        const isWrong = wrong.includes(c.id);
        const isRight = showAnswer && c.id === answer;
        const className = [
          "ex-choice",
          c.emoji && !c.text ? "is-emoji" : "",
          isFaded ? "is-faded" : "",
          isWrong ? "is-wrong" : "",
          isRight ? "is-right" : "",
          showAnswer && !isRight ? "is-dim" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <PressButton
            key={c.id}
            className={className}
            disabled={isFaded}
            inert={disabled}
            label={c.say}
            onPress={() => onAnswer([c.id])}
            onLongPress={() => say(c.say)}
          >
            {c.emoji ? (
              <span className="ex-choice-emoji" aria-hidden>
                {c.emoji}
              </span>
            ) : null}
            {c.text ? (
              <span className="ex-choice-text" aria-hidden>
                {c.text}
              </span>
            ) : null}
          </PressButton>
        );
      })}
    </div>
  );
}
