"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cancelSpeech } from "@/lib/speech";

/**
 * Kök düzende bir kez bağlanır (S8). Rota değişince ve sayfa gizlenince
 * konuşmayı keser. C0 yazdı; sahibi S2.
 */
export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    cancelSpeech();
  }, [pathname]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") cancelSpeech();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return children;
}
