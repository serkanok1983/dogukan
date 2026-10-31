"use client";

import { useEffect, useEffectEvent } from "react";

/** 60 Hz'de bir karenin süresi (ms). */
export const FRAME_MS = 1000 / 60;

/**
 * requestAnimationFrame döngüsü (CONTRACT §10.3).
 *
 * - `dt` 60 Hz birimindedir (kare süresi / 16.667 ms): 60 Hz'de 1, 120 Hz'de 0.5.
 *   Kare başına yazılmış sabitler `v * dt` ile her ekranda aynı hızda çalışır.
 * - Tek kare `maxDtMs` (50 ms) ile sınırlanır: takılma sonrası ışınlanma olmaz.
 * - `running` false iken ya da belge gizliyken adım atılmaz; dönüşte ilk kare
 *   yeni bir zaman tabanı alır (birikmiş süre atlanır).
 * - `step` her render'da değişebilir; döngü her zaman en günceli çağırır.
 */
export function useGameLoop(
  running: boolean,
  step: (dt: number, nowMs: number) => void,
  opts: { maxDtMs?: number } = {},
): void {
  const maxDtMs = opts.maxDtMs ?? 50;
  const onStep = useEffectEvent((dt: number, now: number) => step(dt, now));

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = -1;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) {
        last = -1;
        return;
      }
      if (last < 0) {
        last = now;
        return;
      }
      const ms = Math.min(maxDtMs, now - last);
      last = now;
      if (ms <= 0) return;
      onStep(ms / FRAME_MS, now);
    };

    const onVisibility = () => {
      last = -1;
    };

    raf = requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [running, maxDtMs]);
}

/** `rate` kare başına çarpan (ör. sürtünme 0.72) → dt'ye göre eşdeğeri. */
export function decay(rate: number, dt: number): number {
  return Math.pow(rate, dt);
}

/** Kare başına `t` oranlı yumuşak takip (ör. kamera 0.12) → dt'ye göre eşdeğeri. */
export function lerpFactor(t: number, dt: number): number {
  return 1 - Math.pow(1 - t, dt);
}
