// STUB (C0) — owner: S6. Replace body, keep signature (docs/plan/CONTRACT.md §10.2).
"use client";

import type { Phase } from "@/lib/wellbeing";

export type OverlayKind = "mola" | "limit" | "night" | "grace-hint" | "coplay";

export type WellbeingState = {
  phase: Phase;
  honey: { left: number; capacity: number };
  jarEmpty: boolean;
  blocking: boolean;
  overlay: OverlayKind | null;
  coplay: boolean;
  evening: boolean;
};

const DEFAULT_STATE: WellbeingState = {
  phase: "play",
  honey: { left: 8, capacity: 13 },
  jarEmpty: false,
  blocking: false,
  overlay: null,
  coplay: false,
  evening: false,
};

export function useWellbeing(): WellbeingState {
  return DEFAULT_STATE;
}
