"use client";

import "./wellbeing.css";
import { useWellbeing } from "@/hooks/useWellbeing";

/**
 * Bal kavanozu (MASTER_PLAN §2.11): 1 hücre = 2 dk arcade. Hücreler alttan dolar;
 * 2 hücre kalınca kavanoz bir kez sallanır (hareket azaltma tercihine uyar).
 */
export function HoneyJar({ size = "md" }: { size?: "sm" | "md" }) {
  const { honey, phase } = useWellbeing();
  const capacity = Math.max(1, honey.capacity);
  const left = Math.min(capacity, Math.max(0, honey.left));
  const wobble = left === 2 && phase !== "grace";
  const cells = Array.from({ length: capacity }, (_, i) => i < left);
  return (
    <span
      className={`wb-jar wb-jar-${size}${wobble ? " wb-jar-wobble" : ""}${left === 0 ? " is-empty" : ""}`}
      role="img"
      aria-label={`${left} bal kaldı`}
      data-left={left}
    >
      <span className="wb-jar-lid" aria-hidden />
      <span className="wb-jar-body" aria-hidden>
        {cells.map((full, i) => (
          <span key={i} className={full ? "wb-cell is-full" : "wb-cell"} />
        ))}
      </span>
    </span>
  );
}
