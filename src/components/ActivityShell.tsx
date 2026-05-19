"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BubbleBg } from "./BubbleBg";
import { IntroModal } from "./IntroModal";
import { findActivity } from "@/lib/menu";
import { getGuide } from "@/lib/guides";
import { GameSessionProvider } from "@/lib/gameSession";
import { CelebrationProvider } from "@/components/CelebrationProvider";

type Props = {
  slug: string;
  title: string;
  children: React.ReactNode;
};

export function ActivityShell({ slug, title, children }: Props) {
  const [showHelp, setShowHelp] = useState(false);
  const meta = findActivity(slug);
  const guide = getGuide(slug);

  useEffect(() => {
    const key = `dogukan-guide-${slug}`;
    if (localStorage.getItem(key) !== "1") setShowHelp(true);
  }, [slug]);

  const dismissHelp = (neverAgain: boolean) => {
    if (neverAgain) localStorage.setItem(`dogukan-guide-${slug}`, "1");
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
        <button type="button" className="help-btn" onClick={() => setShowHelp(true)} title="Yardım">
          ℹ️
        </button>
      </header>
      <main className="activity-main">
        <CelebrationProvider>
          <GameSessionProvider active={!showHelp}>{children}</GameSessionProvider>
        </CelebrationProvider>
      </main>
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
