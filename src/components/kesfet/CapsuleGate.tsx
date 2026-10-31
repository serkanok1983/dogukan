"use client";

import Link from "next/link";
import { useState } from "react";
import { SayButton } from "@/components/SayButton";
import { useTodayUsage } from "@/hooks/useProgress";
import { useSession } from "@/lib/auth";
import type { CapsuleEpisode } from "@/lib/capsules";
import { useSettings, type Settings } from "@/lib/settings";
import { canStartEpisode } from "@/lib/wellbeing";
import { CapsuleFeed } from "./CapsuleFeed";
import "./capsule.css";

const selectSettings = (s: Settings) => s;
const TOMORROW_LINE = "Bugünlük bu kadar. Yarın yeni bölüm var!";
const MAP_LINE = "Önce haritaya git.";

type Props = { episode: CapsuleEpisode; color?: string };

/**
 * Daily episode cap (CONTRACT §10.5): before "Başla", `canStartEpisode` decides
 * between the feed and the "Yarın yeni bölüm" card. Once started, the feed is
 * latched so finishing (episodesDone + 1) never swaps the end screen out.
 *
 * Replay policy: an episode already finished today may be watched again, but
 * only while `canStartEpisode` is true; a replay counts as an episode
 * (capsule_end → episodesDone + 1, honey + 1), so the daily cap still bounds it.
 *
 * Without a logged-in player `capsule_end` cannot be recorded, so the cap could
 * not hold; the child is sent to the map (which owns login) instead.
 */
export function CapsuleGate({ episode, color }: Props) {
  const session = useSession();
  const settings = useSettings(selectSettings);
  const today = useTodayUsage();
  const [latched, setLatched] = useState(false);

  if (!session.ready) {
    return <div className="cap-feed cap-loading" aria-busy="true" />;
  }

  if (!session.player) {
    return (
      <StopCard color={color} emoji="🐻🗺️" title="Haritaya git" line={MAP_LINE} />
    );
  }

  if (!latched && !canStartEpisode(settings, today)) {
    return (
      <StopCard
        color={color}
        emoji={episode.previewEmoji}
        title="Yarın yeni bölüm"
        line={TOMORROW_LINE}
        preview
      />
    );
  }

  return (
    <CapsuleFeed episode={episode} color={color} onStart={() => setLatched(true)} />
  );
}

function StopCard({
  color,
  emoji,
  title,
  line,
  preview = false,
}: {
  color?: string;
  emoji: string;
  title: string;
  line: string;
  preview?: boolean;
}) {
  return (
    <div
      className="cap-feed cap-end"
      style={color ? ({ "--topic-color": color } as React.CSSProperties) : undefined}
    >
      <div className="cap-end-card" role="status">
        <span
          className={preview ? "cap-end-emoji cap-preview" : "cap-end-emoji"}
          aria-hidden
        >
          {emoji}
        </span>
        <h1 className="cap-end-title">{title}</h1>
        <div className="cap-end-actions">
          <SayButton text={line} size={72} />
          <Link href="/" className="cap-map">
            <span aria-hidden>🗺️</span> Harita
          </Link>
        </div>
      </div>
    </div>
  );
}
