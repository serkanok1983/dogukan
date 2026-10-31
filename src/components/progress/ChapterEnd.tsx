"use client";

/**
 * Günün görevleri bitti: doğal bölüm sonu (CONTRACT §10.4, parent-wellbeing F2.4). Sahibi S5.
 * "Çanta doldu! Bugünlük bu kadar mı, devam mı?" sesli; iki EŞİT düğme.
 */
import "./progress.css";
import { useEffect } from "react";
import { VOICE } from "@/content/voice";
import { haptic } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { speak } from "@/lib/speech";

export function ChapterEnd(props: { onContinue: () => void; onDone: () => void }) {
  const { onContinue, onDone } = props;

  useEffect(() => {
    sounds.levelUp();
    haptic("win");
    speak(VOICE.chapterEnd);
  }, []);

  return (
    <div
      className="pr-chapter"
      role="dialog"
      aria-modal="true"
      aria-label={VOICE.chapterEnd}
    >
      <div className="pr-chapter-card">
        <button
          type="button"
          className="pr-bag"
          onClick={() => speak(VOICE.chapterEnd)}
          aria-label={VOICE.chapterEnd}
        >
          <span className="pr-bag-item pr-bag-item--1" aria-hidden>
            ⭐
          </span>
          <span className="pr-bag-item pr-bag-item--2" aria-hidden>
            📖
          </span>
          <span className="pr-bag-item pr-bag-item--3" aria-hidden>
            🔢
          </span>
          <span className="pr-bag-body" aria-hidden>
            🎒
          </span>
        </button>
        <p className="pr-line">{VOICE.chapterEnd}</p>
        <div className="pr-actions">
          <button type="button" className="pr-btn pr-btn--map" onClick={onContinue}>
            🗺️ Devam
          </button>
          <button type="button" className="pr-btn pr-btn--bye" onClick={onDone}>
            👋 Bugünlük bu kadar
          </button>
        </div>
      </div>
    </div>
  );
}
