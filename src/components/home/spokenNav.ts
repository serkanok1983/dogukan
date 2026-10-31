"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { haptic } from "@/lib/haptics";
import { speak } from "@/lib/speech";

/** Kutucuk konuşması (MASTER_PLAN K18): söyle, `onEnd` ya da en geç 600 ms sonra git. */
export const SPOKEN_NAV_MAX_MS = 600;

// Bekleyen bir gezinme, sonraki herhangi bir dokunuşla geçersiz olur
// (speak() önceki sözü iptal eder ve onun onEnd'ini tetikler).
let navToken = 0;

/** Yalnızca söyler; bekleyen gezinmeyi iptal eder (🔊 çipi, kapılar). */
export function sayOnly(text: string): void {
  navToken++;
  speak(text);
}

export function useSpokenNav(): (text: string, href: string) => void {
  const router = useRouter();
  return useCallback(
    (text: string, href: string) => {
      const token = ++navToken;
      const go = () => {
        if (token !== navToken) return;
        navToken++;
        router.push(href);
      };
      haptic("tick");
      speak(text, { onEnd: go });
      setTimeout(go, SPOKEN_NAV_MAX_MS);
    },
    [router],
  );
}
