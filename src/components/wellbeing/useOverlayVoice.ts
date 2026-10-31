"use client";

import { useCallback, useEffect, useRef } from "react";
import { isSpeaking, speak, unlockAudio } from "@/lib/speech";

export type VoiceStep = { say: string; clip?: string; gapMs?: number };

function speakSteps(
  steps: readonly VoiceStep[],
  i: number,
  alive: { current: boolean },
): void {
  const step = steps[i];
  if (!step || !alive.current) return;
  speak(step.say, {
    clip: step.clip,
    interrupt: i === 0,
    onEnd: () => {
      if (!alive.current) return;
      const next = steps[i + 1];
      if (!next) return;
      if (next.gapMs) setTimeout(() => speakSteps(steps, i + 1, alive), next.gapMs);
      else speakSteps(steps, i + 1, alive);
    },
  });
}

/**
 * Bir kaplamanın sesli satırları. Açılışta bir kez okunur (ses daha önce bir
 * dokunuşla açıldıysa çalışır). iOS dokunuş kuralı için: kaplamadaki ilk
 * dokunuşta ses açılır ve satır o an konuşulmuyorsa yeniden okunur.
 * Kapanınca zincir durur; kapatan eylem kendi satırını `interrupt` ile söyler.
 */
export function useOverlayVoice(steps: readonly VoiceStep[]): {
  onPointerDown: () => void;
  replay: () => void;
} {
  const sig = JSON.stringify(steps);
  const alive = useRef(true);
  const gestured = useRef(false);

  useEffect(() => {
    alive.current = true;
    speakSteps(JSON.parse(sig) as VoiceStep[], 0, alive);
    return () => {
      alive.current = false;
    };
  }, [sig, alive]);

  const replay = useCallback(() => {
    alive.current = true;
    speakSteps(JSON.parse(sig) as VoiceStep[], 0, alive);
  }, [sig, alive]);

  const onPointerDown = useCallback(() => {
    if (gestured.current) return;
    gestured.current = true;
    unlockAudio();
    if (!isSpeaking()) replay();
  }, [replay]);

  return { onPointerDown, replay };
}
