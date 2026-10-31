"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  getProgress,
  getServerProgress,
  subscribeProgress,
} from "@/lib/progress/store";
import { dayKey, emptyDay } from "@/lib/progress/time";
import type { ActivityStats, DayUsage, Progress } from "@/lib/progress/types";

/** Seçici sonucunu kaynak durum başına önbelleğe alan anlık görüntü fonksiyonları. */
function createSnapshots<T>(
  selector: (p: Progress) => T,
  isEqual: (a: T, b: T) => boolean,
) {
  let cache: { source: Progress; value: T } | null = null;
  const select = (source: Progress): T => {
    if (cache && cache.source === source) return cache.value;
    const value = selector(source);
    if (cache && isEqual(cache.value, value)) {
      cache = { source, value: cache.value };
      return cache.value;
    }
    cache = { source, value };
    return value;
  };
  return [() => select(getProgress()), () => select(getServerProgress())] as const;
}

/**
 * Depodan seçici ile okur (CONTRACT §3.6). Seçici sonucu önbelleğe alınır;
 * bileşen yalnızca `isEqual(önceki, yeni)` false olduğunda yeniden çizilir.
 */
export function useProgress<T>(
  selector: (p: Progress) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const [getSnapshot, getServerSnapshot] = useMemo(
    () => createSnapshots(selector, isEqual),
    [selector, isEqual],
  );

  return useSyncExternalStore(subscribeProgress, getSnapshot, getServerSnapshot);
}

export function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  const ka = Object.keys(a) as (keyof T)[];
  const kb = Object.keys(b) as (keyof T)[];
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.is(a[k], b[k]));
}

const EMPTY_DAY: DayUsage = emptyDay();

function selectToday(p: Progress): DayUsage {
  return p.days[dayKey()] ?? EMPTY_DAY;
}

export function useTodayUsage(): DayUsage {
  return useProgress(selectToday);
}

export function useActivityStats(slug: string): ActivityStats | undefined {
  const selector = useCallback((p: Progress) => p.activities[slug], [slug]);
  return useProgress(selector);
}
