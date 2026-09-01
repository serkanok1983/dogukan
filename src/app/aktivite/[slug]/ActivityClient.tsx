"use client";

import { useEffect } from "react";
import { ActivityShell } from "@/components/ActivityShell";
import { getActivity } from "@/activities/registry";
import { logDogukanVisit } from "@/lib/activityLog";
import type { ActivityLearning } from "@/lib/activityLearning.types";

type Props = {
  slug: string;
  title: string;
  learning: ActivityLearning;
};

export function ActivityClient({ slug, title, learning }: Props) {
  useEffect(() => {
    logDogukanVisit(slug, title);
  }, [slug, title]);

  const Activity = getActivity(slug);

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
      {Activity()}
    </ActivityShell>
  );
}
