// STUB (C0) — owner: S5. Replace body, keep signature (docs/plan/CONTRACT.md §10.4).
import type { Stars } from "./types";

export function starsForRun(slug: string, run: { score: number; level?: number }): Stars {
  void slug;
  if (run.score >= 200) return 3;
  if (run.score >= 50) return 2;
  if (run.score >= 1) return 1;
  return 0;
}
