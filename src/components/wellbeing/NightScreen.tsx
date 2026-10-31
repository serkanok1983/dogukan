"use client";

import Link from "next/link";
import { BearAvatar } from "@/components/home/BearAvatar";
import { VOICE, VOICE_CLIPS } from "@/content/voice";
import { allowNightFor } from "@/lib/sessionClock";
import { fillTemplate } from "@/lib/speech";
import { ParentGear } from "./ParentGear";
import { useOverlayVoice } from "./useOverlayVoice";

const STARS = ["✦", "✧", "✦", "✧", "✦", "✧", "✦"];

/** Gece: yatma saati ile uyanma saati arası. Yalnızca ebeveyn çarkı yanıt verir. */
export function NightScreen() {
  const voice = useOverlayVoice([{ say: VOICE.night, clip: VOICE_CLIPS.night }]);
  return (
    <div
      className="wb-overlay wb-night"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wb-night-title"
      onPointerDown={voice.onPointerDown}
    >
      <div className="wb-sky" aria-hidden>
        {STARS.map((s, i) => (
          <span key={i} className={`wb-twinkle wb-twinkle-${i}`}>
            {s}
          </span>
        ))}
      </div>
      <ParentGear>
        {(close) => (
          <>
            <button
              type="button"
              className="wb-btn wb-btn-primary"
              onClick={() => {
                allowNightFor(30);
                close();
              }}
            >
              Bu akşam 30 dk aç
            </button>
            <Link className="wb-btn" href="/bilgi/">
              Ebeveyn paneli
            </Link>
          </>
        )}
      </ParentGear>
      <div className="wb-bear-sleep">
        <BearAvatar pose="sleep" size={150} />
        <span className="wb-zzz" aria-hidden>
          💤
        </span>
      </div>
      <h2 className="wb-title" id="wb-night-title">
        {fillTemplate(VOICE.night)}
      </h2>
    </div>
  );
}
