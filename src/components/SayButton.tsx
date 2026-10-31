"use client";

import { speak } from "@/lib/speech";

type Props = {
  text: string;
  clip?: string;
  size?: 56 | 72 | 96;
  label?: string;
  className?: string;
};

/** Metni tekrar okutan 🔊 düğmesi (CONTRACT §8.1). C0 yazdı; sahibi S2. */
export function SayButton({ text, clip, size = 56, label = "Tekrar dinle", className }: Props) {
  return (
    <button
      type="button"
      className={className ? `say-btn ${className}` : "say-btn"}
      aria-label={label}
      style={{ width: size, height: size, minWidth: size, fontSize: size * 0.45 }}
      onClick={() => speak(text, { clip })}
    >
      <span aria-hidden>🔊</span>
    </button>
  );
}
