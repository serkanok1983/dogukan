"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  /** Dokunulamaz (söndürülmüş seçenek gibi); uzun basma da çalışmaz. */
  disabled?: boolean;
  /** Seçilemez ama uzun basınca yine okunur (cevap gösterildikten sonra). */
  inert?: boolean;
  label: string;
  onPress: () => void;
  onLongPress?: () => void;
  longPressMs?: number;
  children: React.ReactNode;
};

/** Uzun basınca `onLongPress` (seçeneği dinle), kısa dokununca `onPress`. */
export function PressButton({
  className,
  disabled,
  inert,
  label,
  onPress,
  onLongPress,
  longPressMs = 450,
  children,
}: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-disabled={inert || undefined}
      aria-label={label}
      onPointerDown={() => {
        fired.current = false;
        clear();
        if (!onLongPress) return;
        timer.current = setTimeout(() => {
          timer.current = null;
          fired.current = true;
          onLongPress();
        }, longPressMs);
      }}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (fired.current) {
          fired.current = false;
          return;
        }
        if (inert) return;
        onPress();
      }}
    >
      {children}
    </button>
  );
}
