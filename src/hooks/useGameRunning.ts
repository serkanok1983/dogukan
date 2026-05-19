"use client";

import { useGameActive } from "@/lib/gameSession";
import { useCelebration } from "@/components/CelebrationProvider";

/** Oyun döngüsü: yardım kapalı VE kutlama yokken true */
export function useGameRunning() {
  const active = useGameActive();
  const { isCelebrating } = useCelebration();
  return active && !isCelebrating;
}
