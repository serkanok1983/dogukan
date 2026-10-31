"use client";

import { useState } from "react";
import { BearAvatar } from "@/components/home/BearAvatar";
import { StickerAlbum } from "@/components/progress/StickerAlbum";
import { MISSIONS, TOMORROW, VOICE, VOICE_CLIPS, WB_LINES, type Line } from "@/content/voice";
import { useTodayUsage } from "@/hooks/useProgress";
import { getEpisode } from "@/lib/capsules";
import { findActivity } from "@/lib/menu";
import { getProgress } from "@/lib/progress/store";
import { addDays, dayKey, daysBetween } from "@/lib/progress/time";
import { grantExtension, requestCoplay } from "@/lib/sessionClock";
import { speak } from "@/lib/speech";
import type { WorldId } from "@/lib/worlds";
import { ParentGear } from "./ParentGear";
import { useOverlayVoice } from "./useOverlayVoice";

const TOMORROW_ROTATION: readonly WorldId[] = ["sayi", "harf", "merak", "sekil", "blok", "macera"];

function dayIndex(day: string): number {
  return Math.abs(daysBetween("2026-01-01", day));
}

function tomorrowLine(today: string): Line {
  const world = TOMORROW_ROTATION[dayIndex(addDays(today, 1)) % TOMORROW_ROTATION.length] ?? "sayi";
  return TOMORROW[world];
}

/** Bugün bir kapsül bitti ise onun görev kartı, değilse günün görevi. */
function missionLine(today: string): Line {
  const topics = getProgress().topics;
  for (const [topic, st] of Object.entries(topics)) {
    if (st.capsuleDoneAt && dayKey(st.capsuleDoneAt) === today) {
      const mission = getEpisode(topic)?.cards.at(-1);
      if (mission) return { say: mission.say, clip: `cap-${topic}-mission` };
    }
  }
  return MISSIONS[dayIndex(today) % MISSIONS.length] ?? MISSIONS[0];
}

/** Günlük sınır: uyuyan ayı, bugünün yıldızları, yarın önizlemesi, tek görev kartı. */
export function LimitScreen() {
  const [lines] = useState(() => {
    const today = dayKey();
    return { tomorrow: tomorrowLine(today), mission: missionLine(today) };
  });
  const [album, setAlbum] = useState(false);
  const usage = useTodayUsage();
  const voice = useOverlayVoice([{ say: VOICE.limit, clip: VOICE_CLIPS.limit }, lines.tomorrow]);

  const starred = Object.entries(usage.plays)
    .filter(([, p]) => p.stars > 0)
    .slice(0, 6)
    .map(([slug, p]) => ({ slug, stars: p.stars, emoji: findActivity(slug)?.emoji ?? "🎮" }));

  return (
    <div
      className="wb-overlay wb-limit"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wb-limit-title"
      onPointerDown={voice.onPointerDown}
    >
      <ParentGear>
        {(close) => (
          <button
            type="button"
            className="wb-btn wb-btn-primary"
            onClick={() => {
              grantExtension(10);
              close();
            }}
          >
            +10 dk
          </button>
        )}
      </ParentGear>

      <div className="wb-bear-sleep">
        <BearAvatar pose="sleep" size={140} />
        <span className="wb-zzz" aria-hidden>
          💤
        </span>
      </div>
      <h2 className="wb-title" id="wb-limit-title">
        {VOICE.limit}
      </h2>

      {starred.length > 0 ? (
        <button
          type="button"
          className="wb-stars-row"
          onClick={() => speak(WB_LINES.limitStars.say, { clip: WB_LINES.limitStars.clip })}
          aria-label={WB_LINES.limitStars.say}
        >
          {starred.map((s) => (
            <span key={s.slug} className="wb-star-item">
              <span aria-hidden>{s.emoji}</span>
              <span aria-hidden>{"⭐".repeat(s.stars)}</span>
            </span>
          ))}
        </button>
      ) : null}

      <button
        type="button"
        className="wb-tomorrow"
        onClick={() => speak(lines.tomorrow.say, { clip: lines.tomorrow.clip })}
      >
        <span aria-hidden>🌅</span> {lines.tomorrow.say}
      </button>

      <div className="wb-mission">
        <button
          type="button"
          className="wb-mission-text"
          onClick={() => speak(lines.mission.say, { clip: lines.mission.clip })}
        >
          {lines.mission.say}
        </button>
        <button type="button" className="wb-btn wb-bell" onClick={requestCoplay} aria-label="Babanı çağır">
          🔔
        </button>
      </div>

      <div className="wb-actions">
        <button
          type="button"
          className="wb-btn"
          onClick={() => {
            speak(WB_LINES.albumOpen.say, { clip: WB_LINES.albumOpen.clip });
            setAlbum(true);
          }}
        >
          📒 Çıkartmalarım
        </button>
      </div>

      {album ? <StickerAlbum onClose={() => setAlbum(false)} /> : null}
    </div>
  );
}
