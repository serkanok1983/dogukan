"use client";

import type { Ref } from "react";
import { LabStage } from "@/components/encyclopedia/InteractiveLab";
import type { CapsuleCard, CapsuleChoice } from "@/lib/capsules";

/** idle → (Başla / arrival) speaking → (voice end) ask → (tap) answered */
export type CardPhase = "idle" | "speaking" | "ask" | "answered";

export type CardRuntime = {
  phase: CardPhase;
  pickedId: string | null;
  /** Lab stage override after a pick; null = `visual.from ?? visual.preset`. */
  preset: number | null;
  feedback: { tone: "yes" | "look" | "info"; text: string } | null;
};

type Props = {
  card: CapsuleCard;
  index: number;
  total: number;
  runtime: CardRuntime;
  /** Choice whose label is being read aloud right now (highlighted). */
  readingId?: string | null;
  showStart: boolean;
  cardRef?: Ref<HTMLElement>;
  onStart: () => void;
  onReplay: () => void;
  onPick: (choice: CapsuleChoice) => void;
  onListened: () => void;
  onNext: () => void;
  onCallParent: () => void;
  onDone: () => void;
};

/** True for "play" lab cards whose choices move the stage; they may be tapped again. */
export function isPlayCard(card: CapsuleCard): boolean {
  return Boolean(card.tap.choices?.some((c) => c.preset !== undefined));
}

function Visual({ card, runtime }: { card: CapsuleCard; runtime: CardRuntime }) {
  const visual = card.visual;
  if (visual.type === "lab") {
    const preset = runtime.preset ?? visual.from ?? visual.preset;
    return (
      <div className="cap-visual cap-visual-lab">
        <LabStage mode={visual.mode} preset={preset} />
      </div>
    );
  }
  return (
    <div className="cap-visual cap-visual-emoji" aria-hidden>
      <span>{visual.scene}</span>
    </div>
  );
}

function choiceClass(
  card: CapsuleCard,
  runtime: CardRuntime,
  choice: CapsuleChoice,
  readingId: string | null,
): string {
  const classes = ["cap-choice"];
  if (runtime.pickedId === choice.id) classes.push("is-picked");
  if (readingId === choice.id) classes.push("is-reading");
  if (runtime.phase === "answered" && card.tap.type === "choose" && choice.id === card.tap.answerId) {
    classes.push("is-answer");
  }
  return classes.join(" ");
}

export function CapsuleCardView({
  card,
  index,
  total,
  runtime,
  readingId = null,
  showStart,
  cardRef,
  onStart,
  onReplay,
  onPick,
  onListened,
  onNext,
  onCallParent,
  onDone,
}: Props) {
  const { phase } = runtime;
  const tap = card.tap;
  const asking = phase === "ask" || phase === "answered";
  const answered = phase === "answered";
  const playCard = isPlayCard(card);
  const isLast = index === total - 1;
  const caption = card.text ?? card.say;

  return (
    <section
      ref={cardRef}
      className={`cap-card cap-kind-${card.kind}`}
      data-index={index}
      aria-label={`${index + 1}. kart`}
    >
      <Visual card={card} runtime={runtime} />

      <p className={card.kind === "word" ? "cap-say cap-say-word" : "cap-say"}>{caption}</p>

      <div className="cap-tap">
        {showStart ? (
          <button type="button" className="cap-start" onClick={onStart}>
            Başla <span aria-hidden>▶</span>
          </button>
        ) : null}

        {!showStart && phase === "speaking" ? (
          <span className="cap-listening" role="status" aria-label="Dinle">
            <span aria-hidden>👂</span>
          </span>
        ) : null}

        {asking && tap.prompt ? <p className="cap-prompt">{tap.prompt}</p> : null}

        {asking && (tap.type === "predict" || tap.type === "choose") && tap.choices ? (
          <div className="cap-choices" role="group" aria-label={tap.prompt ?? card.say}>
            {tap.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className={choiceClass(card, runtime, choice, readingId)}
                aria-pressed={runtime.pickedId === choice.id}
                disabled={answered && !playCard}
                onClick={() => onPick(choice)}
              >
                <span className="cap-choice-emoji" aria-hidden>
                  {choice.emoji}
                </span>
                <span className="cap-choice-label">{choice.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        {asking && tap.type === "listen" ? (
          <div className="cap-actions">
            <button type="button" className="cap-action" onClick={onListened}>
              <span aria-hidden>🔊</span> Bir daha
            </button>
            <button type="button" className="cap-action" onClick={onListened}>
              <span aria-hidden>🗣️</span> Söyledim
            </button>
          </div>
        ) : null}

        {asking && tap.type === "done" ? (
          <div className="cap-actions">
            <button type="button" className="cap-action cap-call" onClick={onCallParent}>
              <span aria-hidden>🔔</span> Babanı çağır
            </button>
            <button type="button" className="cap-action cap-done" onClick={onDone}>
              <span aria-hidden>✅</span> Bitti!
            </button>
          </div>
        ) : null}

        {runtime.feedback ? (
          <p className={`cap-feedback is-${runtime.feedback.tone}`} role="status" aria-live="polite">
            {runtime.feedback.text}
          </p>
        ) : null}

        {answered && !isLast ? (
          <button type="button" className="cap-next" aria-label="Sonraki kart" onClick={onNext}>
            <span aria-hidden>▶</span>
          </button>
        ) : null}
      </div>

      {!showStart && phase !== "idle" ? (
        <button type="button" className="cap-replay" aria-label="Tekrar dinle" onClick={onReplay}>
          <span aria-hidden>🔊</span>
        </button>
      ) : null}
    </section>
  );
}
