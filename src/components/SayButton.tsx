"use client";

import { speak } from "@/lib/speech";

type Props = {
  text: string;
  clip?: string;
  size?: 56 | 72 | 96;
  label?: string;
  className?: string;
  /** Ek: okuma hızı (varsayılan speak() hızı). */
  rate?: number;
  /** Ek: konuşmadan hemen önce çağrılır (ör. motorun sıradaki konuşmalarını iptal etmek için). */
  onPress?: () => void;
  /** Ek: devre dışı. */
  disabled?: boolean;
};

/** Metni tekrar okutan 🔊 düğmesi (CONTRACT §8.1). C0 yazdı; sahibi S2. */
export function SayButton({
  text,
  clip,
  size = 56,
  label = "Tekrar dinle",
  className,
  rate,
  onPress,
  disabled,
}: Props) {
  return (
    <button
      type="button"
      className={className ? `say-btn ${className}` : "say-btn"}
      aria-label={label}
      disabled={disabled}
      style={{ width: size, height: size, minWidth: size, fontSize: size * 0.45 }}
      onClick={() => {
        onPress?.();
        speak(text, { clip, rate });
      }}
    >
      <span aria-hidden>🔊</span>
    </button>
  );
}
