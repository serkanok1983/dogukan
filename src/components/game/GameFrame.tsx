"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { SayButton } from "@/components/SayButton";
import { VOICE } from "@/content/voice";
import { useGameActive, useGamePauseControl } from "@/lib/gameSession";
import {
  getWellbeingSnapshot,
  setClockContext,
  subscribeWellbeing,
} from "@/lib/sessionClock";
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
  /** RewardSheet açık mı (oyun zaten durmuştur; kaplama sonrası geri sayım gerekmez) */
  sheetOpen?: boolean;
  onExit: () => void;
  children: React.ReactNode;
};

const COUNT_WORDS = ["", "Bir", "İki", "Üç"];

/**
 * Oyun çerçevesi (MASTER_PLAN §2.5): 48 px'lik opak üst çubuk (yalnızca ⏸),
 * duraklatma katmanı ("Gidiyor muyuz?" ✅ Evet / ▶ Devam) ve devam ederken
 * sesli 3-2-1. Kazara çıkış yok: çıkmak için ⏸ + ✅ iki dokunuş gerekir.
 * GameSessionProvider'ın içinde çizilir.
 *
 * Saat yalnızca oyun gerçekten çalışırken (`useGameActive`: başladı, ⏸ yok, iyi oluş
 * kaplaması ve RewardSheet/Bal topla kapalı) `running` bildirir. Bir kaplama oyunu
 * keserse oyun duraklatılır ve kaplama kapanınca aynı 3-2-1 ile sürer.
 */
export function GameFrame({
  slug,
  kind,
  title,
  emoji,
  started,
  sheetOpen = false,
  onExit,
  children,
}: Props) {
  const { paused, pause, resume } = useGamePauseControl();
  const active = useGameActive();
  const [count, setCount] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const heldByOverlay = useRef(false);
  const running = started && active;

  useEffect(() => {
    setClockContext({ slug, kind, running });
  }, [slug, kind, running]);

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

  const countdown = () => {
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

  const onContinue = () => {
    if (count !== null) return;
    unlockAudio();
    sounds.unlock();
    countdown();
  };

  // İyi oluş kaplaması (mola, sınır, …) açılınca çalışan oyunu duraklat; kapanınca 3-2-1.
  const onOverlay = useEffectEvent((isBlocking: boolean) => {
    if (isBlocking) {
      if (!started || sheetOpen) return;
      if (paused && count === null) return; // çocuk ⏸ ile durdurmuştu: "Devam" bekler
      heldByOverlay.current = true;
      clearTimers();
      setCount(null);
      if (!paused) pause();
      return;
    }
    if (!heldByOverlay.current) return;
    heldByOverlay.current = false;
    if (started && paused) countdown();
  });

  useEffect(() => {
    let last = getWellbeingSnapshot().blocking;
    return subscribeWellbeing(() => {
      const blocking = getWellbeingSnapshot().blocking;
      if (blocking === last) return;
      last = blocking;
      onOverlay(blocking);
    });
  }, []);

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
