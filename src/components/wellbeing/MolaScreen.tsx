"use client";

import { useEffect, useMemo, useState } from "react";
import { BearAvatar } from "@/components/home/BearAvatar";
import { getBreak } from "@/content/breaks";
import { NUMBER_WORDS, WB_LINES, numberClip } from "@/content/voice";
import { praise, praiseClip } from "@/lib/praise";
import type { BreakId } from "@/lib/progress/types";
import { clearBreakContext, finishBreak, setClockContext } from "@/lib/sessionClock";
import { useSettings, type Settings } from "@/lib/settings";
import { cancelSpeech, speak } from "@/lib/speech";
import { ParentGear } from "./ParentGear";
import { useOverlayVoice, type VoiceStep } from "./useOverlayVoice";

const RING_R = 88;
const RING_C = 2 * Math.PI * RING_R;
const COUNT_GAP_MS = 900;

const selectBreakSeconds = (s: Settings) => s.breakSeconds;

/** Mola: bir Hareket Kartı, ayarlanabilir halka (30–45 sn), sesli sayım. */
export function MolaScreen({
  breakId,
  firstBreak,
}: {
  breakId: BreakId;
  firstBreak: boolean;
}) {
  const seconds = useSettings(selectBreakSeconds);
  const card = getBreak(breakId);
  const [elapsed, setElapsed] = useState(0);
  const done = elapsed >= seconds;

  const steps = useMemo<VoiceStep[]>(() => {
    const intro = firstBreak ? WB_LINES.firstBreak : WB_LINES.breakStart;
    const counts = Array.from({ length: card.count }, (_, i) => ({
      say: NUMBER_WORDS[i + 1] ?? String(i + 1),
      clip: numberClip(i + 1),
      gapMs: COUNT_GAP_MS,
    }));
    return [intro, { say: card.say, clip: card.clip }, ...counts];
  }, [card, firstBreak]);
  const voice = useOverlayVoice(steps);

  useEffect(() => {
    setClockContext({ slug: null, kind: "break", running: true });
    return () => clearBreakContext();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== "hidden") setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (done) speak(WB_LINES.breakReady.say, { clip: WB_LINES.breakReady.clip });
  }, [done]);

  const left = Math.max(0, seconds - elapsed);
  const offset = RING_C * Math.min(1, elapsed / Math.max(1, seconds));

  return (
    <div
      className="wb-overlay wb-mola"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wb-mola-title"
      onPointerDown={voice.onPointerDown}
    >
      <ParentGear>
        {() => (
          <button
            type="button"
            className="wb-btn"
            onClick={() => {
              cancelSpeech();
              finishBreak(true);
            }}
          >
            Molayı atla ⏭
          </button>
        )}
      </ParentGear>

      <p className="wb-kicker" id="wb-mola-title">
        <span aria-hidden>{card.emoji}</span> Mola · {card.title}
      </p>
      {firstBreak ? <p className="wb-hint">👨‍👦 Babanla birlikte!</p> : null}

      <div className="wb-ring-wrap">
        <svg className="wb-ring" viewBox="0 0 200 200" aria-hidden>
          <circle className="wb-ring-track" cx="100" cy="100" r={RING_R} />
          <circle
            className="wb-ring-fill"
            cx="100"
            cy="100"
            r={RING_R}
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C - offset}
          />
        </svg>
        <div className={`wb-ring-bear wb-bear-${card.bearFrame}`}>
          <BearAvatar pose={card.bearFrame} size={120} />
        </div>
        <span className="wb-ring-left" aria-label={`${left} saniye`}>
          {done ? "✓" : left}
        </span>
      </div>

      <p className="wb-caption">{card.say}</p>

      <div className="wb-actions">
        <button
          type="button"
          className="wb-btn wb-btn-ghost"
          onClick={voice.replay}
          aria-label="Tekrar dinle"
        >
          🔊
        </button>
        {done ? (
          <button
            type="button"
            className="wb-btn wb-btn-primary"
            onClick={() => {
              const line = praise("break_done");
              speak(line, { clip: praiseClip(line) });
              finishBreak(false);
            }}
          >
            Devam ▶
          </button>
        ) : null}
      </div>
    </div>
  );
}
