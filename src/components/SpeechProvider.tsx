"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cancelSpeech, primeSpeech } from "@/lib/speech";

/**
 * Kök düzende bir kez bağlanır (S8). Rota değişince ve sayfa gizlenince
 * konuşmayı keser; sayfa yeniden görünür olunca sessiz bir konuşmayla TTS'i
 * yeniden hazırlar (MASTER_PLAN §3.6-4). C0 yazdı; sahibi S2.
 */
export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    cancelSpeech();
  }, [pathname]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") cancelSpeech();
      else primeSpeech();
    };
    const onPageHide = () => cancelSpeech();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  return children;
}
