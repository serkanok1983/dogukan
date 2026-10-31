// STUB (C0) — owner: S6. Replace body, keep signature (docs/plan/CONTRACT.md §10.2).
// `honeyCells`, `canStartEpisode` and `breakDue` are already the contract formulas.
import { dayKey } from "@/lib/progress/time";
import type { DayUsage } from "@/lib/progress/types";
import type { Settings } from "@/lib/settings";

export type Phase = "grace" | "play" | "warn5" | "warn1" | "limit" | "evening" | "night";

const CELL_SEC = 120;

export function computePhase(now: Date, s: Settings, d: DayUsage): Phase {
  void d;
  return s.graceUntil && dayKey(now.getTime()) <= s.graceUntil ? "grace" : "play";
}

export function honeyCells(s: Settings, d: DayUsage): { left: number; capacity: number } {
  const maxSec = s.arcadeMaxMinutes * 60;
  const budgetSec = Math.min(maxSec, s.arcadeMinutes * 60 + d.honeyEarned * CELL_SEC);
  return {
    left: Math.ceil(Math.max(0, budgetSec - d.arcadeSec) / CELL_SEC),
    capacity: Math.ceil(maxSec / CELL_SEC),
  };
}

export function canStartArcade(now: Date, s: Settings, d: DayUsage, coplay: boolean): boolean {
  if (coplay) return true;
  const phase = computePhase(now, s, d);
  if (phase === "night" || phase === "limit" || phase === "evening") return false;
  return phase === "grace" || honeyCells(s, d).left > 0;
}

export function canStartEpisode(s: Settings, d: DayUsage): boolean {
  return d.episodesDone < s.episodesPerDay;
}

export function breakDue(s: Settings, d: DayUsage): boolean {
  return d.sinceBreakSec >= s.breakEveryMinutes * 60;
}
