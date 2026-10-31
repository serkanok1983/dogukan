"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { SayButton } from "@/components/SayButton";
import type { CapsuleChoice, CapsuleEpisode } from "@/lib/capsules";
import { praise } from "@/lib/praise";
import { trackEvent } from "@/lib/progress/events";
import {
  notifyNaturalPause,
  requestCoplay,
  setClockContext,
} from "@/lib/sessionClock";
import { sounds } from "@/lib/sounds";
import { cancelSpeech, speak, unlockAudio } from "@/lib/speech";
import { CapsuleCardView, isPlayCard, type CardRuntime } from "./CapsuleCard";
import "./capsule.css";

type Props = {
  episode: CapsuleEpisode;
  /** Category colour for `--topic-color` (lab stages use it). */
  color?: string;
  /** Called once when the child taps "Başla" (the route latches the daily cap). */
  onStart?: () => void;
};

function freshRuntime(): CardRuntime {
  return { phase: "idle", pickedId: null, preset: null, feedback: null };
}

/** If the TTS engine never fires `onend`, still reveal the question (never advance). */
function revealFallbackMs(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(2500, words * 650 + 1200);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  );
}

/**
 * Full-screen, finite capsule feed (parent-wellbeing F7 rules 1–5):
 * exactly the episode's 12 cards, a 12-dot rail, voice starts on the gesture
 * that revealed a card, the tap appears after the voice ends, the next card is
 * rendered only after the tap, and the end screen has no next-episode control.
 */
export function CapsuleFeed({ episode, color, onStart }: Props) {
  const total = episode.cards.length;
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [current, setCurrent] = useState(0);
  const [reached, setReached] = useState(0);
  const [runtimes, setRuntimes] = useState<CardRuntime[]>(() =>
    episode.cards.map(freshRuntime),
  );

  // Mirrors for event handlers (written only in handlers, never during render).
  const runtimesRef = useRef<CardRuntime[]>(runtimes);
  const currentRef = useRef(0);
  const furthestRef = useRef(0);
  const speechToken = useRef(0);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardEls = useRef<(HTMLElement | null)[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const commit = (index: number, patch: Partial<CardRuntime>) => {
    const next = runtimesRef.current.map((rt, i) =>
      i === index ? { ...rt, ...patch } : rt,
    );
    runtimesRef.current = next;
    setRuntimes(next);
  };

  const clearRevealTimer = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = null;
  };

  /** Speaks a card's line; the tap question appears when the voice ends. */
  const playCard = (index: number) => {
    const card = episode.cards[index];
    if (!card) return;
    const token = ++speechToken.current;
    clearRevealTimer();
    const wasAnswered = runtimesRef.current[index]?.phase === "answered";
    if (!wasAnswered) commit(index, { phase: "speaking" });

    const reveal = () => {
      if (speechToken.current !== token) return;
      clearRevealTimer();
      if (runtimesRef.current[index]?.phase !== "speaking") return;
      commit(index, { phase: "ask" });
      if (card.tap.prompt) speak(card.tap.prompt);
    };
    speak(card.say, { rate: card.kind === "word" ? 0.7 : undefined, onEnd: reveal });
    revealTimer.current = setTimeout(reveal, revealFallbackMs(card.say));
  };

  const unlockNext = (index: number) => {
    if (index + 1 < total) setReached((r) => Math.max(r, index + 1));
  };

  const handleStart = () => {
    unlockAudio();
    sounds.unlock();
    sounds.tap();
    setStarted(true);
    onStart?.();
    playCard(0);
  };

  const handlePick = (index: number, choice: CapsuleChoice) => {
    const card = episode.cards[index];
    const rt = runtimesRef.current[index];
    if (!card || !rt) return;
    const play = isPlayCard(card);
    if (rt.phase !== "ask" && !(play && rt.phase === "answered")) return;
    speechToken.current++;
    clearRevealTimer();
    const { tap, visual } = card;
    const labTarget =
      visual.type === "lab" && visual.from !== undefined ? visual.preset : null;

    if (tap.type === "choose") {
      const correct = choice.id === tap.answerId;
      const explain = tap.explain ?? "";
      if (correct) sounds.success();
      else sounds.softWrong();
      commit(index, {
        phase: "answered",
        pickedId: choice.id,
        preset: labTarget,
        feedback: correct
          ? { tone: "yes", text: explain || praise("correct_first") }
          : { tone: "look", text: `Birlikte bakalım. ${explain}`.trim() },
      });
      speak(
        correct
          ? `${choice.say} ${praise("correct_first")} ${explain}`
          : `${choice.say} Birlikte bakalım. ${explain}`,
      );
    } else {
      sounds.tap();
      const preset = choice.preset ?? labTarget;
      const explain =
        choice.preset !== undefined ? undefined : (tap.explain ?? "Bakalım!");
      commit(index, {
        phase: "answered",
        pickedId: choice.id,
        preset: preset ?? rt.preset,
        feedback: explain ? { tone: "info", text: explain } : null,
      });
      speak(explain ? `${choice.say} ${explain}` : choice.say);
    }
    unlockNext(index);
  };

  const handleListened = (index: number) => {
    const card = episode.cards[index];
    if (!card) return;
    speechToken.current++;
    clearRevealTimer();
    sounds.tap();
    commit(index, { phase: "answered" });
    speak(card.say, { rate: 0.7 });
    unlockNext(index);
  };

  const handleReplay = (index: number) => {
    const card = episode.cards[index];
    if (card) speak(card.say, { rate: card.kind === "word" ? 0.7 : undefined });
  };

  const goTo = (index: number, scroll: boolean) => {
    if (index < 0 || index >= total || index === currentRef.current) return;
    if (index > furthestRef.current) {
      furthestRef.current = index;
      notifyNaturalPause("card_end");
    }
    currentRef.current = index;
    setCurrent(index);
    if (scroll) {
      cardEls.current[index]?.scrollIntoView?.({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    }
    playCard(index);
  };

  const handleNext = (index: number) => {
    if (runtimesRef.current[index]?.phase !== "answered") return;
    sounds.tap();
    goTo(index + 1, true);
  };

  const mission = episode.cards[total - 1];
  const endLine = `Bölüm bitti! ${mission?.say ?? ""}`.trim();

  const handleDone = () => {
    if (finished) return;
    speechToken.current++;
    clearRevealTimer();
    trackEvent({ type: "capsule_end", topic: episode.topic });
    notifyNaturalPause("episode_end");
    sounds.win();
    setFinished(true);
    speak(endLine);
  };

  // A swipe that settles on another card counts as the revealing gesture.
  const onCardVisible = useEffectEvent((index: number) => {
    if (!started || finished) return;
    goTo(index, false);
  });

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (Number.isInteger(index)) onCardVisible(index);
        }
      },
      { root, threshold: [0.6] },
    );
    for (const el of cardEls.current.slice(0, reached + 1))
      if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [reached]);

  useEffect(() => {
    setClockContext({ slug: null, kind: "capsule", running: true });
    const token = speechToken;
    const timer = revealTimer;
    return () => {
      token.current++;
      if (timer.current) clearTimeout(timer.current);
      cancelSpeech();
      setClockContext({ slug: null, kind: "capsule", running: false });
    };
  }, []);

  const style = color
    ? ({ "--topic-color": color } as React.CSSProperties)
    : undefined;

  if (finished) {
    return (
      <div className="cap-feed cap-end" style={style}>
        <div className="cap-end-card" role="status">
          <span className="cap-end-emoji" aria-hidden>
            🎉{episode.emoji}
          </span>
          <h1 className="cap-end-title">Bölüm bitti!</h1>
          {mission ? (
            <p className="cap-end-mission">{mission.text ?? mission.say}</p>
          ) : null}
          <p className="cap-end-honey">
            <span aria-hidden>🍯</span> +1
          </p>
          <div className="cap-end-actions">
            <SayButton text={endLine} size={72} />
            <Link href="/" className="cap-map">
              <span aria-hidden>🗺️</span> Harita
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cap-feed" style={style}>
      <Link href="/" className="cap-exit" aria-label="Haritaya dön">
        <span aria-hidden>🗺️</span>
      </Link>
      <ol className="cap-rail" aria-label={`${total} karttan ${current + 1}.`}>
        {episode.cards.map((card, i) => (
          <li
            key={card.id}
            className={
              i === current
                ? "is-current"
                : runtimes[i]?.phase === "answered"
                  ? "is-done"
                  : undefined
            }
          />
        ))}
      </ol>
      <div className="cap-scroller" ref={scrollerRef}>
        {episode.cards.slice(0, reached + 1).map((card, i) => (
          <CapsuleCardView
            key={card.id}
            card={card}
            index={i}
            total={total}
            runtime={runtimes[i] ?? freshRuntime()}
            showStart={i === 0 && !started}
            cardRef={(el) => {
              cardEls.current[i] = el;
            }}
            onStart={handleStart}
            onReplay={() => handleReplay(i)}
            onPick={(choice) => handlePick(i, choice)}
            onListened={() => handleListened(i)}
            onNext={() => handleNext(i)}
            onCallParent={() => {
              sounds.tap();
              requestCoplay();
            }}
            onDone={handleDone}
          />
        ))}
      </div>
    </div>
  );
}
