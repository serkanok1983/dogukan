/**
 * Yürüyen ayının saf adım mantığı. Ayı yapının üst yüzeyinde durur; bir adımda
 * en fazla MAX_CLIMB hücre tırmanır, istediği kadar aşağı atlar.
 */
import { GRID_H, GRID_W, surfaceY, type Grid } from "./engine";

export const MAX_CLIMB = 3;

export type Dir = 1 | -1;

/** Ayının durduğu satır (yüzeyin bir üstü). Sütun tamamen doluysa 0. */
export function standRow(grid: Grid, col: number): number {
  return Math.max(0, surfaceY(grid, col) - 1);
}

/** Ayı `from` sütunundan `to` sütununa geçebilir mi? */
export function canStep(grid: Grid, from: number, to: number): boolean {
  if (to < 0 || to >= GRID_W) return false;
  if (surfaceY(grid, to) === 0) return false; // sütun tavana kadar dolu
  return standRow(grid, from) - standRow(grid, to) <= MAX_CLIMB;
}

/**
 * Sıradaki adım: önce `dir` yönü, olmazsa ters yön. İkisi de kapalıysa `null`.
 */
export function nextStep(grid: Grid, col: number, dir: Dir): { col: number; dir: Dir } | null {
  if (canStep(grid, col, col + dir)) return { col: col + dir, dir };
  const back = (dir === 1 ? -1 : 1) as Dir;
  if (canStep(grid, col, col + back)) return { col: col + back, dir: back };
  return null;
}

/** Sıçrama yayı dahil, adımın `p` (0..1) anındaki ayı konumu (hücre birimi, kesirli). */
export function bearPoseAt(
  grid: Grid,
  from: number,
  to: number,
  p: number,
): { x: number; y: number } {
  const t = Math.min(1, Math.max(0, p));
  const ya = standRow(grid, from);
  const yb = standRow(grid, to);
  const hop = from === to ? 0 : 0.35 + Math.max(0, ya - yb) * 0.45;
  const y = ya + (yb - ya) * t - hop * Math.sin(Math.PI * t);
  return { x: from + (to - from) * t, y: Math.max(-0.6, Math.min(GRID_H - 1, y)) };
}
