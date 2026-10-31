"use client";

import { useCallback, type RefObject } from "react";

type Point = { x: number; y: number };
type ClientPoint = { clientX: number; clientY: number };

/** Saf eşleme: istemci (CSS) koordinatı → mantıksal oyun koordinatı. */
export function clientToLogical(
  el: HTMLCanvasElement | null,
  logicalW: number,
  logicalH: number,
  e: ClientPoint,
): Point {
  if (!el) return { x: 0, y: 0 };
  const rect = el.getBoundingClientRect();
  const w = rect.width || logicalW;
  const h = rect.height || logicalH;
  return {
    x: ((e.clientX - rect.left) / w) * logicalW,
    y: ((e.clientY - rect.top) / h) * logicalH,
  };
}

function mapFromRef(
  canvas: RefObject<HTMLCanvasElement | null>,
  logicalW: number,
  logicalH: number,
  e: ClientPoint,
): Point {
  return clientToLogical(canvas.current, logicalW, logicalH, e);
}

/**
 * İstemci (CSS) koordinatlarını oyunun mantıksal koordinatlarına çevirir
 * (CONTRACT §10.3). Canvas ne kadar büyütülmüş / DPR'li olursa olsun doğru çalışır.
 */
export function useCanvasPointer(
  canvas: RefObject<HTMLCanvasElement | null>,
  logicalW: number,
  logicalH: number,
): (e: ClientPoint) => Point {
  return useCallback(
    (e: ClientPoint) => mapFromRef(canvas, logicalW, logicalH, e),
    [canvas, logicalW, logicalH],
  );
}
