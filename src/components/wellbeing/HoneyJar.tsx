// STUB (C0) — owner: S6. Replace body, keep signature (docs/plan/CONTRACT.md §10.2).
"use client";

import { useWellbeing } from "@/hooks/useWellbeing";

export function HoneyJar({ size = "md" }: { size?: "sm" | "md" }) {
  const { honey } = useWellbeing();
  return (
    <span className={`wb-jar wb-jar-${size}`} aria-label={`${honey.left} bal`}>
      <span aria-hidden>🍯</span> {honey.left}
    </span>
  );
}
