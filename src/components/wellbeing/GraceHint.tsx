"use client";

import { BearAvatar } from "@/components/home/BearAvatar";
import { VOICE, VOICE_CLIPS, WB_LINES } from "@/content/voice";
import { dismissGraceHint } from "@/lib/sessionClock";
import { speak } from "@/lib/speech";
import { HoneyJar } from "./HoneyJar";
import { useOverlayVoice } from "./useOverlayVoice";

/** Tanışma günlerinin son günü, bir kez: kavanozun nasıl çalıştığı tek cümleyle. */
export function GraceHint() {
  const voice = useOverlayVoice([{ say: VOICE.graceHint, clip: VOICE_CLIPS.graceHint }]);
  return (
    <div
      className="wb-overlay wb-grace"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wb-grace-title"
      onPointerDown={voice.onPointerDown}
    >
      <div className="wb-grace-scene">
        <BearAvatar pose="wave" size={120} />
        <span className="wb-point" aria-hidden>
          👉
        </span>
        <HoneyJar size="md" />
      </div>
      <h2 className="wb-title" id="wb-grace-title">
        {VOICE.graceHint}
      </h2>
      <div className="wb-actions">
        <button type="button" className="wb-btn wb-btn-ghost" onClick={voice.replay} aria-label="Tekrar dinle">
          🔊
        </button>
        <button
          type="button"
          className="wb-btn wb-btn-primary"
          onClick={() => {
            speak(WB_LINES.graceOk.say, { clip: WB_LINES.graceOk.clip });
            dismissGraceHint();
          }}
        >
          Tamam ▶
        </button>
      </div>
    </div>
  );
}
