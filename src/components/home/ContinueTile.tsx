"use client";

import { useEffect, useState } from "react";
import { shellLine, SHELL } from "@/content/shell";
import { voiceLine } from "@/content/voice";
import { useProgress } from "@/hooks/useProgress";
import { useWellbeing } from "@/hooks/useWellbeing";
import { findActivity } from "@/lib/menu";
import { getActivityInfo } from "@/lib/worlds";
import { DEFAULT_CONTINUE_SLUG, loadContinueRecord, mostRecentSlug, selectActivities } from "./mapData";
import { sayOnly } from "./spokenNav";
import { SpokenTile } from "./SpokenTile";

/** "Devam et ▶": son oynanan görünür etkinlik; 1. gün Süper Ayı ve rekoru. */
export function ContinueTile() {
  const activities = useProgress(selectActivities);
  const { evening } = useWellbeing();
  const [record, setRecord] = useState(0);

  useEffect(() => {
    let alive = true;
    void loadContinueRecord().then((n) => {
      if (alive) setRecord(n);
    });
    return () => {
      alive = false;
    };
  }, []);

  const slug = mostRecentSlug(activities);
  const meta = findActivity(slug);
  const label = meta?.label ?? slug;
  const sleeping = evening && getActivityInfo(slug)?.kind === "arcade";
  const showRecord = slug === DEFAULT_CONTINUE_SLUG && record > 0;
  const chipSay = showRecord
    ? `${shellLine(SHELL.continueSay, { etkinlik: label })} ${voiceLine("continueRecord", { skor: record })}`
    : shellLine(SHELL.continueSay, { etkinlik: label });

  return (
    <SpokenTile
      href={`/aktivite/${slug}/`}
      label={label}
      chipSay={chipSay}
      className={sleeping ? "home-continue is-sleeping" : "home-continue"}
      badge={sleeping ? "💤" : undefined}
      onActivate={sleeping ? () => sayOnly(SHELL.activitySleeping) : undefined}
      visual={
        <>
          <span className="home-continue-kicker">{SHELL.continueLabel} ▶</span>
          <span className="home-tile-emoji" aria-hidden>
            {meta?.emoji ?? "▶️"}
          </span>
        </>
      }
    >
      {showRecord && (
        <span className="home-continue-record" aria-label={`Rekor ${record}`}>
          <span aria-hidden>🏆</span> {record}
        </span>
      )}
    </SpokenTile>
  );
}
