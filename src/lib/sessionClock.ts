// STUB (C0) — owner: S6. Replace body, keep signature (docs/plan/CONTRACT.md §10.2).
import type { ClockKind } from "@/lib/progress/types";

export function setClockContext(ctx: { slug: string | null; kind: ClockKind; running: boolean }): void {
  void ctx;
}

export function notifyNaturalPause(reason: "run_end" | "set_end" | "card_end" | "episode_end"): void {
  void reason;
}

export function requestCoplay(): void {}

export function isCoplayActive(): boolean {
  return false;
}
