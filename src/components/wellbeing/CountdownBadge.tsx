"use client";

import { useEffect } from "react";
import { VOICE, VOICE_CLIPS, WB_LINES } from "@/content/voice";
import { dayKey } from "@/lib/progress/time";
import { speak } from "@/lib/speech";
import type { Phase } from "@/lib/wellbeing";

/** Gün içinde bir kez söylenen satırlar (oturum belleği; sayfa yenilenince sıfırlanır). */
const spoken = new Set<string>();

function speakOnce(id: string, say: string, clip: string): void {
  const key = `${dayKey()}:${id}`;
  if (spoken.has(key)) return;
  spoken.add(key);
  speak(say, { clip });
}

/**
 * −5 / −1 dk rozeti: ayı esner, son dakikada amber olur. Her uyarı günde bir kez
 * sesli. Kavanozda 2 hücre kalınca "Bal azalıyor" da bir kez söylenir.
 */
export function CountdownBadge({
  phase,
  honeyLow,
  hidden,
}: {
  phase: Phase;
  honeyLow: boolean;
  hidden: boolean;
}) {
  const warn = phase === "warn5" || phase === "warn1" ? phase : null;

  useEffect(() => {
    if (hidden || !warn) return;
    speakOnce(warn, VOICE[warn], VOICE_CLIPS[warn]);
  }, [warn, hidden]);

  useEffect(() => {
    if (hidden || !honeyLow) return;
    speakOnce("honeyLow", WB_LINES.honeyLow.say, WB_LINES.honeyLow.clip);
  }, [honeyLow, hidden]);

  if (hidden || !warn) return null;
  const line = VOICE[warn];
  return (
    <button
      type="button"
      className={`wb-badge wb-badge-${warn}`}
      aria-label={line}
      onClick={() => speak(line, { clip: VOICE_CLIPS[warn] })}
    >
      <span className="wb-badge-bear" aria-hidden>
        {warn === "warn1" ? "⏳" : "🥱"}
      </span>
      <span className="wb-badge-text">{warn === "warn1" ? "Son tur" : "5 dk"}</span>
    </button>
  );
}

/** @internal Testler için. */
export function _resetCountdownForTests(): void {
  spoken.clear();
}
