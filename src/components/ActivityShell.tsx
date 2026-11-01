"use client";

import "./game/game-frame.css";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GameFrame } from "./game/GameFrame";
import { StartCard } from "./game/StartCard";
import { findActivity } from "@/lib/menu";
import { getActivityInfo } from "@/lib/worlds";
import { GameSessionProvider, useRestartRegistry } from "@/lib/gameSession";
import { CelebrationProvider } from "@/components/CelebrationProvider";
import { JAR_MAP_LINE, RewardSheet } from "@/components/progress/RewardSheet";
import { HoneyGate } from "@/components/progress/HoneyGate";
import { NoticeToaster } from "@/components/progress/NoticeToaster";
import { canOfferHoney, markHoneyOffered } from "@/components/progress/session";
import { useLastRunResult } from "@/components/progress/useRunResult";
import { useWellbeing } from "@/hooks/useWellbeing";
import { VOICE } from "@/content/voice";
import { canStartArcadeNow } from "@/lib/sessionClock";
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
 * Kavanoz boş StartCard'ı (K1/K4). "Bal topla" oturumda en fazla 2 kez sunulur
 * (RewardSheet ile ortak sayaç), tavan dolmuşsa hiç sunulmaz; o zaman yalnız 🗺️ Harita.
 * Bal topla bitince oyun yalnızca kavanozda gerçekten hücre varsa başlar.
 */
function JarGate({
  title,
  refill,
  onStart,
  onMap,
}: {
  title: string;
  refill: boolean;
  onStart: () => void;
  onMap: () => void;
}) {
  const [mode, setMode] = useState<"honey" | "map">(() =>
    refill && canOfferHoney() ? "honey" : "map",
  );
  const counted = useRef(false);

  useEffect(() => {
    if (mode !== "honey" || counted.current) return;
    counted.current = true;
    markHoneyOffered();
  }, [mode]);

  if (mode === "map") {
    return (
      <StartCard
        emoji="🍯"
        line={JAR_MAP_LINE}
        title={title}
        variant="map"
        onMap={onMap}
      />
    );
  }
  return (
    <StartCard emoji="🍯" line={VOICE.jarEmpty} title={title} onMap={onMap}>
      <HoneyGate
        onFilled={() => (canStartArcadeNow() ? onStart() : setMode("map"))}
        onMap={onMap}
      />
    </StartCard>
  );
}

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

  // `canStartArcade`: birlikte oyunda ne akşam ne kavanoz kapıdır.
  const arcadeClosed = isArcade && !wellbeing.arcadeOpen;
  let gate: React.ReactNode = null;
  if (!started) {
    if (arcadeClosed && wellbeing.evening) {
      gate = (
        <StartCard
          emoji="😴"
          line={VOICE.eveningTile}
          title={title}
          variant="sleep"
          onMap={goMap}
        />
      );
    } else if (arcadeClosed && wellbeing.jarEmpty) {
      gate = (
        <JarGate
          title={title}
          refill={wellbeing.honeyRefill}
          onStart={start}
          onMap={goMap}
        />
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
            sheetOpen={sheetOpen}
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
