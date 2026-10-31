"use client";

import { useEffect, useRef } from "react";
import { SayButton } from "@/components/SayButton";
import { speak } from "@/lib/speech";

type Props = {
  emoji: string;
  /** Tek sesli cümle (guide.short ?? guide.intro) */
  line: string;
  /** Erişilebilirlik başlığı (ebeveyn için; çocuğa okunmaz) */
  title: string;
  /** "sleep": akşam Macera Adası uyuyor (Başla yok) */
  variant?: "start" | "sleep";
  onStart?: () => void;
  onMap: () => void;
  children?: React.ReactNode;
};

/**
 * IntroModal'ın yerine (MASTER_PLAN §2.5): tek resim, tek sesli cümle,
 * dev bir Başla. Başla dokunuşu ses kilidini açar (çağıran tarafta).
 */
export function StartCard({ emoji, line, title, variant = "start", onStart, onMap, children }: Props) {
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // İstemci içi gezinmede kullanıcı etkinliği sürer; konuşma çoğu cihazda başlar.
    // Başlamazsa 🔊 düğmesi aynı cümleyi tekrar okur.
    speak(line);
    startRef.current?.focus();
  }, [line]);

  const sleeping = variant === "sleep";

  return (
    <div
      className={`gf-start${sleeping ? " gf-start-sleep" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button type="button" className="gf-start-map" onClick={onMap} aria-label="Haritaya dön">
        <span aria-hidden>🗺️</span>
      </button>
      <div className="gf-start-card">
        <div className="gf-start-emoji" aria-hidden>
          {emoji}
        </div>
        <div className="gf-start-line">
          <p>{line}</p>
          <SayButton text={line} size={56} />
        </div>
        {children}
        {!sleeping && onStart && (
          <button ref={startRef} type="button" className="gf-start-go" onClick={onStart}>
            Başla <span aria-hidden>▶</span>
          </button>
        )}
        {sleeping && (
          <button type="button" className="gf-start-go gf-start-go-map" onClick={onMap}>
            <span aria-hidden>🗺️</span> Harita
          </button>
        )}
      </div>
    </div>
  );
}
