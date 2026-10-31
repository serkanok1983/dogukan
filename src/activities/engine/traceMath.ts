/** TraceCanvas için saf geometri: yeniden örnekleme ve vuruş toleransı denetimi. */
import type { Pt, Stroke } from "./letterPaths";

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function strokeLength(stroke: readonly Pt[]): number {
  let len = 0;
  for (let i = 1; i < stroke.length; i++) len += dist(stroke[i - 1] as Pt, stroke[i] as Pt);
  return len;
}

/** Yol üzerinde 0–1 arası `t` konumundaki nokta. */
export function pointAt(stroke: readonly Pt[], t: number): Pt {
  const first = stroke[0];
  if (!first) return [50, 50];
  const total = strokeLength(stroke);
  if (total === 0 || t <= 0) return first;
  let target = Math.min(1, t) * total;
  for (let i = 1; i < stroke.length; i++) {
    const a = stroke[i - 1] as Pt;
    const b = stroke[i] as Pt;
    const seg = dist(a, b);
    if (target <= seg && seg > 0) {
      const k = target / seg;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    target -= seg;
  }
  return stroke[stroke.length - 1] as Pt;
}

/** Yaklaşık `step` aralıklı noktalar. */
export function resample(stroke: readonly Pt[], step = 4): Pt[] {
  const total = strokeLength(stroke);
  if (stroke.length < 2 || total === 0) return stroke.slice(0, 1);
  const n = Math.max(2, Math.ceil(total / step) + 1);
  return Array.from({ length: n }, (_, i) => pointAt(stroke, i / (n - 1)));
}

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return dist(p, [a[0] + t * dx, a[1] + t * dy]);
}

export function distToPolyline(p: Pt, poly: readonly Pt[]): number {
  if (poly.length === 0) return Infinity;
  if (poly.length === 1) return dist(p, poly[0] as Pt);
  let best = Infinity;
  for (let i = 1; i < poly.length; i++) {
    best = Math.min(best, distToSegment(p, poly[i - 1] as Pt, poly[i] as Pt));
  }
  return best;
}

export function isDot(stroke: Stroke): boolean {
  return stroke.length < 2 || strokeLength(stroke) < 2;
}

/**
 * Çizilen vuruş hedefe yeterince yakın mı? 6 yaşında parmakla çizim için
 * cömert: hedefin ≥ %75'i `tol` içinde örtülmeli, çizimin ortalama sapması
 * ≤ tol, ve açık vuruşlarda başlangıç bitişten çok başlangıca yakın olmalı.
 * Nokta vuruşu: herhangi bir dokunuş noktaya `tol * 1.5` yakınsa yeterli.
 */
export function checkStroke(target: Stroke, drawn: readonly Pt[], tol = 14): boolean {
  const start = target[0];
  const first = drawn[0];
  if (!start || !first) return false;
  if (isDot(target)) {
    return drawn.some((p) => dist(p, start) <= tol * 1.5) && strokeLength(drawn) < 30;
  }
  if (drawn.length < 2) return false;
  const targetLen = strokeLength(target);
  if (strokeLength(drawn) < targetLen * 0.5) return false;

  const samples = resample(target, 4);
  const covered = samples.filter((s) => distToPolyline(s, drawn) <= tol).length / samples.length;
  if (covered < 0.75) return false;

  const drawnSamples = resample(drawn, 4);
  const mean = drawnSamples.reduce((sum, p) => sum + distToPolyline(p, target), 0) / drawnSamples.length;
  if (mean > tol) return false;

  const end = target[target.length - 1] as Pt;
  const closed = dist(start, end) < tol;
  if (!closed && dist(first, start) > dist(first, end)) return false;
  return true;
}
