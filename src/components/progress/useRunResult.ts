// STUB (C0) — owner: S5. Replace body, keep signature (docs/plan/CONTRACT.md §10.4).
"use client";

import type { Stars } from "@/lib/progress/types";

export type RunResult = {
  slug: string;
  score: number;
  durationMs: number;
  starsBefore: Stars;
  starsAfter: Stars;
  isNewStar: boolean;
};

const NONE = { result: null, dismiss() {} };

export function useLastRunResult(slug: string): { result: RunResult | null; dismiss(): void } {
  void slug;
  return NONE;
}
