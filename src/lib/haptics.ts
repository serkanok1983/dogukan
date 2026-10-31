/**
 * Titreşim (CONTRACT §8.3). Yalnızca olay anında çağrılır, kare başına asla.
 * iOS Safari'de `navigator.vibrate` yoktur; bu durumda sessizce hiçbir şey yapmaz.
 * C0 yazdı; sahibi S4.
 */
import { getSettings } from "@/lib/settings";

export type HapticKind = "tick" | "hit" | "fail" | "win" | "sticker";

const PATTERNS: Record<HapticKind, number | number[]> = {
  tick: 10,
  hit: 25,
  fail: [30, 30, 60],
  win: [20, 40, 20],
  sticker: [20, 40, 20],
};

function reducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function haptic(kind: HapticKind): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (!getSettings().hapticsOn || reducedMotion()) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    /* yok say */
  }
}
