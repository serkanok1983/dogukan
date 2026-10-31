"use client";

import { useEffect } from "react";
import { ActivityShell } from "@/components/ActivityShell";
import { GameErrorBoundary } from "@/components/game/GameErrorBoundary";
import { ACTIVITY_MAP } from "@/activities/registry";
import { logDogukanVisit } from "@/lib/activityLog";
import { trackEvent } from "@/lib/progress/events";
import type { ActivityLearning } from "@/lib/activityLearning.types";

type Props = {
  slug: string;
  title: string;
  learning: ActivityLearning;
};

export function ActivityClient({ slug, title, learning }: Props) {
  useEffect(() => {
    trackEvent({ type: "activity_open", slug });
    logDogukanVisit(slug, title);
  }, [slug, title]);

  // Modül düzeyindeki sabit tablo: bileşen kimliği her slug için kararlıdır.
  const Activity = ACTIVITY_MAP[slug] ?? null;

  if (!Activity) {
    return (
      <ActivityShell key={slug} slug={slug} title={title} learning={learning}>
        <div className="game-panel">
          <p>Bu aktivite bulunamadı.</p>
        </div>
      </ActivityShell>
    );
  }

  return (
    <ActivityShell key={slug} slug={slug} title={title} learning={learning}>
      <GameErrorBoundary slug={slug}>
        <Activity />
      </GameErrorBoundary>
    </ActivityShell>
  );
}
