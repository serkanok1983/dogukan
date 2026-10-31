"use client";

/**
 * Son koşunun sonucu (CONTRACT §10.4). Sahibi S5.
 * `run_end` olayını dinler; yıldız öncesi/sonrası olayın uygulandığı duruma göre hesaplanır.
 * Aynı slug için yeni bir `run_start` gelince sonuç kendiliğinden temizlenir.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { onEvent } from "@/lib/progress/events";
import { starsForRun } from "@/lib/progress/starRules";
import { getProgress } from "@/lib/progress/store";
import type { Stars } from "@/lib/progress/types";
import "./session";

export type RunResult = {
  slug: string;
  score: number;
  durationMs: number;
  starsBefore: Stars;
  starsAfter: Stars;
  isNewStar: boolean;
  /** S5 (ek): bu koşunun yıldızı (en iyiden bağımsız). */
  runStars?: Stars;
  level?: number;
};

export function useLastRunResult(slug: string): {
  result: RunResult | null;
  dismiss(): void;
} {
  const [result, setResult] = useState<RunResult | null>(null);

  useEffect(() => {
    let before: Stars = getProgress().activities[slug]?.stars ?? 0;
    const offEnd = onEvent("run_end", (e, next) => {
      if (e.slug !== slug) return;
      const after: Stars = next.activities[slug]?.stars ?? 0;
      const isNewStar = next.inbox.some((n) => n.id === `${e.id}:new_star`);
      const starsBefore = (
        isNewStar ? Math.max(0, Math.min(before, after - 1)) : after
      ) as Stars;
      before = after;
      setResult({
        slug,
        score: e.score,
        durationMs: e.durationMs,
        starsBefore,
        starsAfter: after,
        isNewStar,
        runStars: starsForRun(slug, { score: e.score, level: e.level }),
        ...(e.level !== undefined ? { level: e.level } : {}),
      });
    });
    const offStart = onEvent("run_start", (e) => {
      if (e.slug === slug) setResult(null);
    });
    return () => {
      offEnd();
      offStart();
    };
  }, [slug]);

  const dismiss = useCallback(() => setResult(null), []);
  return useMemo(() => ({ result, dismiss }), [result, dismiss]);
}
