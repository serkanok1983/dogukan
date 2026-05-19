"use client";

import { useEffect } from "react";
import { ActivityShell } from "@/components/ActivityShell";
import { getActivity } from "@/activities/registry";
import { logDogukanVisit } from "@/lib/activityLog";

type Props = {
  slug: string;
  title: string;
};

export function ActivityClient({ slug, title }: Props) {
  useEffect(() => {
    logDogukanVisit(slug, title);
  }, [slug, title]);

  const Activity = getActivity(slug);

  if (!Activity) {
    return (
      <ActivityShell slug={slug} title={title}>
        <div className="game-panel">
          <p>Bu aktivite bulunamadı.</p>
        </div>
      </ActivityShell>
    );
  }

  return <ActivityShell slug={slug} title={title}>{Activity()}</ActivityShell>;
}
