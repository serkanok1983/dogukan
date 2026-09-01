"use client";

import { useEffect, useRef } from "react";
import type { Guide } from "@/lib/guides";

type Props = {
  title: string;
  emoji: string;
  guide: Guide;
  onStart: () => void;
  onNever: () => void;
};

export function IntroModal({ title, emoji, guide, onStart, onNever }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    startButtonRef.current?.focus();

    return () => previouslyFocused?.focus();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onStart();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = cardRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="intro-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      aria-describedby="intro-summary"
      onKeyDown={handleKeyDown}
    >
      <div ref={cardRef} className="intro-card">
        <span className="intro-badge">
          {emoji} {guide.type}
        </span>
        <h2 id="intro-title">{title}</h2>
        <p id="intro-summary">
          <strong>Ne yapacaksın?</strong> {guide.intro}
        </p>
        <p>
          <strong>Nasıl oynanır?</strong>
        </p>
        <ul>
          {guide.controls.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p>
          <strong>Öğrenme notu:</strong> {guide.learn}
        </p>
        <div className="intro-actions">
          <button
            ref={startButtonRef}
            type="button"
            className="btn-primary"
            onClick={onStart}
          >
            Başla! 🚀
          </button>
          <button type="button" className="btn-ghost" onClick={onNever}>
            Bir daha gösterme
          </button>
        </div>
      </div>
    </div>
  );
}
