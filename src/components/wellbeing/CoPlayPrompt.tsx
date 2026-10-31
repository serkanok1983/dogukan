"use client";

import { useEffect, useState } from "react";
import { ArithmeticGate } from "@/components/auth/ParentGate";
import { WB_LINES } from "@/content/voice";
import { closeCoplayPrompt, startCoplay } from "@/lib/sessionClock";
import { sounds } from "@/lib/sounds";
import { cancelSpeech, speak } from "@/lib/speech";
import { useOverlayVoice } from "./useOverlayVoice";

/** 🔔 → zil sesi → yetişkin kartı "Baba buradayım" + aritmetik kapı → 30 dk birlikte oyun. */
export function CoPlayPrompt() {
  const [gate, setGate] = useState(false);
  const voice = useOverlayVoice([WB_LINES.coplayCalled]);

  useEffect(() => {
    sounds.countdown();
    const id = setTimeout(() => sounds.honey(), 280);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      className="wb-overlay wb-coplay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wb-coplay-title"
      onPointerDown={voice.onPointerDown}
    >
      <p className="wb-bell-big" aria-hidden>
        🔔
      </p>
      <h2 className="wb-title" id="wb-coplay-title">
        {WB_LINES.coplayCalled.say}
      </h2>

      <section className="wb-adult-card" aria-label="Yetişkin için">
        <p className="wb-adult-note">Yetişkin için: birlikte oynarken bal kavanozu boşalmaz (30 dk).</p>
        <button type="button" className="wb-btn wb-btn-primary" onClick={() => setGate(true)}>
          👨 Baba buradayım
        </button>
      </section>

      <div className="wb-actions">
        <button
          type="button"
          className="wb-btn wb-btn-ghost"
          onClick={() => {
            cancelSpeech();
            closeCoplayPrompt();
          }}
        >
          Vazgeç
        </button>
      </div>

      {gate ? (
        <ArithmeticGate
          title="Baba buradayım"
          onCancel={() => setGate(false)}
          onPass={() => {
            setGate(false);
            speak(WB_LINES.coplayStart.say, { clip: WB_LINES.coplayStart.clip });
            startCoplay();
          }}
        />
      ) : null}
    </div>
  );
}
