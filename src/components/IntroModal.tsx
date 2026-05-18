"use client";

import type { Guide } from "@/lib/guides";

type Props = {
  title: string;
  emoji: string;
  guide: Guide;
  onStart: () => void;
  onNever: () => void;
};

export function IntroModal({ title, emoji, guide, onStart, onNever }: Props) {
  return (
    <div className="intro-overlay" role="dialog" aria-labelledby="intro-title">
      <div className="intro-card">
        <span className="intro-badge">
          {emoji} {guide.type}
        </span>
        <h2 id="intro-title">{title}</h2>
        <p>
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
          <button type="button" className="btn-primary" onClick={onStart}>
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
