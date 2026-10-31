"use client";

/**
 * İyi oluş durumu (CONTRACT §10.2). `sessionClock` tekilinin üzerinde
 * `useSyncExternalStore`; anlık görüntü yalnızca bir alan değişince yenilenir.
 * Sahibi S6.
 */
import { useSyncExternalStore } from "react";
import {
  getOverlayDetails,
  getServerOverlayDetails,
  getServerWellbeingSnapshot,
  getWellbeingSnapshot,
  subscribeWellbeing,
  type OverlayDetails,
  type WellbeingState,
} from "@/lib/sessionClock";

export type {
  OverlayDetails,
  OverlayKind,
  WellbeingState,
} from "@/lib/sessionClock";

export function useWellbeing(): WellbeingState {
  return useSyncExternalStore(
    subscribeWellbeing,
    getWellbeingSnapshot,
    getServerWellbeingSnapshot,
  );
}

/** Kaplamalar için: açık molanın kartı, ilk mola mı, gece izni var mı. */
export function useOverlayDetails(): OverlayDetails {
  return useSyncExternalStore(
    subscribeWellbeing,
    getOverlayDetails,
    getServerOverlayDetails,
  );
}
