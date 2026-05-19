"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerId } from "@/lib/auth";
import { getPlayerDisplayName, getPlayerId, getRivalId } from "@/lib/auth";
import {
  checkLiveMilestone,
  fetchGameScores,
  recordScore,
  subscribeGameScores,
} from "@/lib/leaderboard";
import { useCelebration } from "@/components/CelebrationProvider";

export function useGameScore(gameSlug: string) {
  const { show } = useCelebration();
  const player = getPlayerId();
  const rival = player ? getRivalId(player) : null;
  const lastMilestone = useRef(0);
  const lastCheckAt = useRef(0);
  const [highs, setHighs] = useState<Record<PlayerId, number>>({
    dogukan: 0,
    serkan: 0,
  });

  useEffect(() => {
    if (!player) return;
    void fetchGameScores(gameSlug).then(setHighs);
    const unsub = subscribeGameScores(gameSlug, setHighs);
    return () => {
      unsub?.();
    };
  }, [gameSlug, player]);

  const selfHigh = player ? (highs[player] ?? 0) : 0;
  const rivalHigh = rival ? (highs[rival] ?? 0) : 0;

  const submitFinal = useCallback(
    async (score: number) => {
      if (!player || score < 0) return;
      const result = await recordScore(gameSlug, player, score);
      const updated = await fetchGameScores(gameSlug);
      setHighs(updated);
      if (result.celebrate) show(result.message);
      return result;
    },
    [gameSlug, player, show],
  );

  const checkMilestone = useCallback(
    async (currentScore: number) => {
      if (!player) return;
      const now = Date.now();
      if (now - lastCheckAt.current < 12_000) return;
      lastCheckAt.current = now;
      const m = await checkLiveMilestone(gameSlug, player, currentScore, lastMilestone.current);
      if (m.celebrate) {
        lastMilestone.current = m.mark;
        show(m.message);
      }
    },
    [gameSlug, player, show],
  );

  const resetMilestones = useCallback(() => {
    lastMilestone.current = 0;
  }, []);

  return {
    player,
    playerName: getPlayerDisplayName(player),
    rivalName: rival ? getPlayerDisplayName(rival) : "",
    selfHigh,
    rivalHigh,
    submitFinal,
    checkMilestone,
    resetMilestones,
  };
}
