"use client";

import { useEffect, useRef, useState } from "react";
import { SayButton } from "@/components/SayButton";
import { VOICE } from "@/content/voice";
import { useGamePauseControl } from "@/lib/gameSession";
import { setClockContext } from "@/lib/sessionClock";
import { sounds } from "@/lib/sounds";
import { speak, unlockAudio } from "@/lib/speech";
import type { ClockKind } from "@/lib/progress/types";

type Props = {
  slug: string;
  kind: ClockKind;
  title: string;
  emoji: string;
  /** StartCard geçildi mi */
  started: boolean;
  onExit: () => void;
  children: React.ReactNode;
};

const COUNT_WORDS = ["", "Bir", "İki", "Üç"];

/**
 * Oyun çerçevesi (MASTER_PLAN §2.5): 48 px'lik opak üst çubuk (yalnızca ⏸),
 * duraklatma katmanı ("Gidiyor muyuz?" ✅ Evet / ▶ Devam) ve devam ederken
 * sesli 3-2-1. Kazara çıkış yok: çıkmak için ⏸ + ✅ iki dokunuş gerekir.
 * GameSessionProvider'ın içinde çizilir.
 */
export function GameFrame({
  slug,
  kind,
  title,
  emoji,
  started,
  onExit,
  children,
}: Props) {
  const { paused, pause, resume } = useGamePauseControl();
  const [count, setCount] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setClockContext({ slug, kind, running: started && !paused });
  }, [slug, kind, started, paused]);

  useEffect(
    () => () => setClockContext({ slug, kind, running: false }),
    [slug, kind],
  );

  useEffect(() => {
    // Geri sayım sırasında telefon kilitlenirse sayımı iptal et; dönüşte yine ⏸ beklenir.
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      for (const t of timers.current) clearTimeout(t);
      timers.current = [];
      setCount(null);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      for (const t of timers.current) clearTimeout(t);
    };
  }, []);

  const clearTimers = () => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  };

  const onPause = () => {
    if (!started || paused) return;
    clearTimers();
    setCount(null);
    pause();
    speak(VOICE.exitAsk);
  };

  const tick = (n: number) => {
    setCount(n);
    sounds.countdown();
    speak(COUNT_WORDS[n] ?? String(n));
  };

  const onContinue = () => {
    if (count !== null) return;
    unlockAudio();
    sounds.unlock();
    clearTimers();
    tick(3);
    timers.current = [
      setTimeout(() => tick(2), 1000),
      setTimeout(() => tick(1), 2000),
      setTimeout(() => {
        setCount(null);
        timers.current = [];
        resume();
      }, 3000),
    ];
  };

  const onLeave = () => {
    clearTimers();
    onExit();
  };

  return (
    <>
      <header className="gf-topbar" aria-label={title}>
        <button
          type="button"
          className="gf-pause-btn"
          onClick={onPause}
          disabled={!started}
          aria-label="Durdur"
        >
          <span aria-hidden>⏸</span>
        </button>
        <span className="gf-topbar-emoji" aria-hidden>
          {emoji}
        </span>
      </header>
      <main className="activity-main">{children}</main>
      {started && paused && (
        <div
          className="gf-pause"
          role="dialog"
          aria-modal="true"
          aria-label="Oyun durdu"
        >
          {count !== null ? (
            <div className="gf-count" key={count} aria-live="assertive">
              {count}
            </div>
          ) : (
            <div className="gf-pause-card">
              <div className="gf-pause-icon" aria-hidden>
                ⏸
              </div>
              <div className="gf-pause-ask">
                <p>{VOICE.exitAsk}</p>
                <SayButton text={VOICE.exitAsk} size={56} />
              </div>
              <div className="gf-pause-actions">
                <button
                  type="button"
                  className="gf-btn gf-btn-yes"
                  onClick={onLeave}
                >
                  <span aria-hidden>✅</span> Evet
                </button>
                <button
                  type="button"
                  className="gf-btn gf-btn-go"
                  onClick={onContinue}
                >
                  <span aria-hidden>▶</span> Devam
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
