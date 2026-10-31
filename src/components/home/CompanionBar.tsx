"use client";

import "./home.css";
import { useEffect, useRef, useState } from "react";
import { HoneyJar } from "@/components/wellbeing/HoneyJar";
import { shellLine, SHELL } from "@/content/shell";
import { useProgress } from "@/hooks/useProgress";
import { useWellbeing } from "@/hooks/useWellbeing";
import { totalStars } from "@/lib/progress/reducers";
import { useQuests } from "@/lib/quests";
import { useSettings } from "@/lib/settings";
import { BearAvatar, type BearPose } from "./BearAvatar";
import { selectCompanionName, selectEquipped, selectStreak } from "./mapData";
import { sayOnly } from "./spokenNav";

const PARENT_LONG_PRESS_MS = 3000;
const WAVE_MS = 1600;

/**
 * Üst çubuk: ayı (dokun → bugünkü görevi ya da selamı söyler), 🍯 kavanoz,
 * ⭐ toplam yıldız, 🔥 seri, 📒 çıkartmalar. Ayının şapka köşesine 3 sn basmak
 * ebeveyn kapısını açar (uzun basma yalnızca ebeveyn içindir).
 */
export function CompanionBar({
  onParent,
  onAlbum,
  pose: poseOverride,
}: {
  onParent: () => void;
  onAlbum: () => void;
  pose?: BearPose;
}) {
  const stars = useProgress(totalStars);
  const streak = useProgress(selectStreak);
  const equipped = useProgress(selectEquipped);
  const companionName = useSettings(selectCompanionName);
  const { items } = useQuests();
  const { evening } = useWellbeing();
  const [waving, setWaving] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  useEffect(
    () => () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
    },
    [],
  );

  const pose: BearPose =
    poseOverride ?? (waving ? "wave" : evening ? "yawn" : "idle");

  const talk = () => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    const next = items.find((q) => !q.done);
    sayOnly(
      next ? shellLine(SHELL.bearQuest, { gorev: next.say }) : SHELL.bearGreeting,
    );
    setWaving(true);
    setTimeout(() => setWaving(false), WAVE_MS);
  };

  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  const startPress = () => {
    cancelPress();
    longPressFired.current = false;
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      longPressFired.current = true;
      onParent();
    }, PARENT_LONG_PRESS_MS);
  };

  return (
    <header className="home-bar">
      <button
        type="button"
        className="home-bear-btn"
        onClick={talk}
        aria-label={companionName}
      >
        <BearAvatar pose={pose} size={56} cosmetic={equipped} />
        <span
          className="home-bear-corner"
          aria-hidden
          onPointerDown={startPress}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onPointerCancel={cancelPress}
          onContextMenu={(e) => e.preventDefault()}
        />
      </button>

      <div className="home-bar-stats">
        <HoneyJar size="sm" />
        <button
          type="button"
          className="home-stat"
          onClick={() => sayOnly(shellLine(SHELL.stars, { n: stars }))}
          aria-label={shellLine(SHELL.stars, { n: stars })}
        >
          <span aria-hidden>⭐</span> {stars}
        </button>
        <button
          type="button"
          className="home-stat"
          onClick={() =>
            sayOnly(
              streak > 0 ? shellLine(SHELL.streak, { n: streak }) : SHELL.streakZero,
            )
          }
          aria-label={
            streak > 0 ? shellLine(SHELL.streak, { n: streak }) : SHELL.streakZero
          }
        >
          <span aria-hidden>🔥</span> {streak}
        </button>
      </div>

      <button
        type="button"
        className="home-album-btn"
        onClick={() => {
          sayOnly(SHELL.album);
          onAlbum();
        }}
        aria-label={SHELL.album}
      >
        <span aria-hidden>📒</span>
      </button>
    </header>
  );
}
