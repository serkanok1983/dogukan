// STUB (C0) — owner: S2. Replace body, keep signature (docs/plan/CONTRACT.md §10.1).
"use client";

import Link from "next/link";
import type { SkillId } from "@/lib/skills";

export type ExerciseSessionResult = { correct: number; total: number; firstTry: number };

export function ExerciseSession(props: {
  slug: string;
  skill: SkillId;
  mode?: "session" | "gate";
  onDone?: (r: ExerciseSessionResult) => void;
  onExit?: () => void;
}) {
  return (
    <div className="game-panel" data-slug={props.slug} data-skill={props.skill}>
      <p style={{ fontSize: 48, margin: 0 }} aria-hidden>🚧</p>
      <p>Bu etkinlik yenileniyor.</p>
      <Link href="/" className="btn-primary">🗺️ Harita</Link>
    </div>
  );
}
