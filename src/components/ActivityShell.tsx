"use client";

import "./game/game-frame.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GameFrame } from "./game/GameFrame";
import { StartCard } from "./game/StartCard";
import { findActivity } from "@/lib/menu";
import { getActivityInfo } from "@/lib/worlds";
import { GameSessionProvider, useRestartRegistry } from "@/lib/gameSession";
import { CelebrationProvider } from "@/components/CelebrationProvider";
import { RewardSheet } from "@/components/progress/RewardSheet";
import { HoneyGate } from "@/components/progress/HoneyGate";
import { NoticeToaster } from "@/components/progress/NoticeToaster";
import { useLastRunResult } from "@/components/progress/useRunResult";
import { useWellbeing } from "@/hooks/useWellbeing";
import { VOICE } from "@/content/voice";
import { sounds } from "@/lib/sounds";
import { unlockAudio } from "@/lib/speech";
import type { ActivityLearning } from "@/lib/activityLearning.types";

type Props = {
  slug: string;
  title: string;
  children: React.ReactNode;
  learning: ActivityLearning;
};

/**
 * Etkinlik kabuğu (CONTRACT §10.3, MASTER_PLAN §2.5). Sahibi S4.
 *
 * StartCard → GameFrame (⏸ üst çubuk, duraklatma, iki dokunuşla çıkış) →
 * amiral oyunlarda RewardSheet. Bilgi paneli ve 💡/ℹ️ çocuğa gösterilmez
 * (veriler /bilgi'de).
 */
export function ActivityShell({ slug, title, children, learning }: Props) {
  const router = useRouter();
  const info = getActivityInfo(slug);
  const meta = findActivity(slug);
  const wellbeing = useWellbeing();
  const guide = learning.guide;
  const emoji = meta?.emoji ?? "🎮";
  const isArcade = info?.kind === "arcade";

  // Egzersiz oturumlarında StartCard atlanır.
  const [started, setStarted] = useState(info?.exercise === true);

  const registry = useRestartRegistry();
  const { result, dismiss } = useLastRunResult(slug);
  const sheetOpen = registry.has && result !== null;

  useEffect(() => {
    sounds.setMasterGain(wellbeing.evening ? 0.5 : 1);
  }, [wellbeing.evening]);

  const goMap = () => router.push("/");

  const start = () => {
    unlockAudio();
    sounds.unlock();
    setStarted(true);
  };

  const restart = () => {
    sounds.unlock();
    dismiss();
    registry.restart();
  };

  let gate: React.ReactNode = null;
  if (!started) {
    if (isArcade && wellbeing.evening) {
      gate = (
        <StartCard
          emoji="😴"
          line={VOICE.eveningTile}
          title={title}
          variant="sleep"
          onMap={goMap}
        />
      );
    } else if (isArcade && wellbeing.jarEmpty) {
      gate = (
        <StartCard emoji="🍯" line={VOICE.jarEmpty} title={title} onMap={goMap}>
          <HoneyGate onFilled={start} onMap={goMap} />
        </StartCard>
      );
    } else {
      gate = (
        <StartCard
          emoji={emoji}
          line={guide.short ?? guide.intro}
          title={title}
          onStart={start}
          onMap={goMap}
        />
      );
    }
  }

  return (
    <div className={`activity-page gf-page${sheetOpen ? " gf-sheet-open" : ""}`}>
      <div className="sky-gradient" aria-hidden />
      <CelebrationProvider>
        <GameSessionProvider
          active={started && !wellbeing.blocking && !sheetOpen}
          registry={registry}
        >
          <GameFrame
            slug={slug}
            kind={info?.kind ?? "learning"}
            title={title}
            emoji={emoji}
            started={started}
            onExit={goMap}
          >
            {children}
          </GameFrame>
        </GameSessionProvider>
      </CelebrationProvider>
      {sheetOpen && result && (
        <RewardSheet slug={slug} result={result} onRestart={restart} onMap={goMap} />
      )}
      {gate}
      <NoticeToaster />
    </div>
  );
}
