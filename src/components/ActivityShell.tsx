"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BubbleBg } from "./BubbleBg";
import { IntroModal } from "./IntroModal";
import { ActivityKnowledgePanel } from "./ActivityKnowledgePanel";
import { findActivity } from "@/lib/menu";
import { GameSessionProvider } from "@/lib/gameSession";
import { CelebrationProvider } from "@/components/CelebrationProvider";
import type { ActivityLearning } from "@/lib/activityLearning.types";

type Props = {
  slug: string;
  title: string;
  children: React.ReactNode;
  learning: ActivityLearning;
};

const GUIDE_PREFERENCE_VERSION = "v2";

function guidePreferenceKey(slug: string) {
  return `dogukan-guide:${GUIDE_PREFERENCE_VERSION}:${slug}`;
}

function shouldShowGuide(slug: string): boolean {
  try {
    const currentKey = guidePreferenceKey(slug);
    if (localStorage.getItem(currentKey) === "1") return false;

    // Önceki sürümdeki tercihi kaybetmeden yeni, sürümlü anahtara taşı.
    const legacyKey = `dogukan-guide-${slug}`;
    if (localStorage.getItem(legacyKey) === "1") {
      localStorage.setItem(currentKey, "1");
      localStorage.removeItem(legacyKey);
      return false;
    }
  } catch {
    // Depolama kapalıysa yardım kartını göstermek güvenli ve anlaşılır varsayımdır.
  }

  return true;
}

function rememberGuidePreference(slug: string) {
  try {
    localStorage.setItem(guidePreferenceKey(slug), "1");
  } catch {
    // Gizli gezinme veya kapalı depolama, etkinliğin kullanılmasını engellememeli.
  }
}

export function ActivityShell({ slug, title, children, learning }: Props) {
  const [showHelp, setShowHelp] = useState<boolean | null>(null);
  const meta = findActivity(slug);
  const guide = learning.guide;

  useEffect(() => {
    // İstemci depolaması SSR sırasında okunamaz; ilk tarayıcı eşitlemesi bilinçli olarak burada yapılır.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowHelp(shouldShowGuide(slug));
  }, [slug]);

  const dismissHelp = (neverAgain: boolean) => {
    if (neverAgain) rememberGuidePreference(slug);
    setShowHelp(false);
  };

  return (
    <div className="activity-page">
      <BubbleBg />
      <div className="sky-gradient" aria-hidden />
      <header className="activity-topbar">
        <Link href="/" className="back-btn">
          ← Ana sayfa
        </Link>
        <span className="activity-title">{title}</span>
        <div className="activity-topbar-actions">
          <a
            href="#oyunun-fikri"
            className="knowledge-jump-btn"
            title="Oyunun keşif kartı"
            aria-label="Bu oyunda keşfedilen fikre git"
          >
            💡
          </a>
          <button
            type="button"
            className="help-btn"
            onClick={() => setShowHelp(true)}
            title="Nasıl oynanır?"
            aria-label="Nasıl oynanır bilgisini aç"
            aria-expanded={showHelp === true}
          >
            ℹ️
          </button>
        </div>
      </header>
      <main className="activity-main">
        <CelebrationProvider>
          <GameSessionProvider active={showHelp === false}>{children}</GameSessionProvider>
        </CelebrationProvider>
      </main>
      <ActivityKnowledgePanel title={title} learning={learning} />
      {showHelp && (
        <IntroModal
          title={title}
          emoji={meta?.emoji ?? "🎮"}
          guide={guide}
          onStart={() => dismissHelp(false)}
          onNever={() => dismissHelp(true)}
        />
      )}
    </div>
  );
}
