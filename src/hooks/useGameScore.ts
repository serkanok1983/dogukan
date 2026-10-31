"use client";

/**
 * Oyunların sonuç bildirdiği tek kanca (CONTRACT §4). Sahibi S5.
 *
 * - `resetMilestones()` = yeni koşu: `run_start` yayar ve bir koşu jetonu açar.
 * - `submitFinal()` açık koşu başına tam bir `run_end` yayar; aynı koşudaki
 *   ikinci çağrı yok sayılır (Tetris'in çift gönderimi burada düzelir).
 * - Kutlamalar `toast()` ile; baba/rakip metni yalnızca `settings.rivalVisible`.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerId } from "@/lib/auth";
import { getPlayerDisplayName, getPlayerId, getRivalId } from "@/lib/auth";
import {
  checkLiveMilestone,
  fetchGameScores,
  recordScore,
  subscribeGameScores,
  type LiveMilestone,
  type ScoreResult,
} from "@/lib/leaderboard";
import { praise } from "@/lib/praise";
import { trackEvent } from "@/lib/progress/events";
import { getSettings, useSettings, type Settings } from "@/lib/settings";
import { useCelebration } from "@/components/CelebrationProvider";

const MILESTONE_GAP_MS = 12_000;

type RunToken = { startAt: number; submitted: boolean; level: number };

const selectRivalVisible = (s: Settings) => s.rivalVisible;

function selfMilestoneLine(m: LiveMilestone): string {
  if (m.kind === "record") return `🚀 ${praise("persisted")}`;
  return `⭐ ${m.mark}! ${praise("correct_first")}`;
}

export function useGameScore(gameSlug: string) {
  const { toast } = useCelebration();
  const [player] = useState<PlayerId | null>(() => getPlayerId());
  const rivalVisible = useSettings(selectRivalVisible);
  const rival = player ? getRivalId(player) : null;
  const lastMilestone = useRef(0);
  const lastCheckAt = useRef(0);
  const run = useRef<RunToken>({ startAt: 0, submitted: false, level: 0 });
  const [highs, setHighs] = useState<Record<PlayerId, number>>({
    dogukan: 0,
    serkan: 0,
  });

  useEffect(() => {
    // Hiç `resetMilestones` çağrılmazsa süre bağlanmadan ölçülür.
    if (run.current.startAt === 0) run.current.startAt = Date.now();
  }, []);

  useEffect(() => {
    if (!player) return;
    void fetchGameScores(gameSlug).then(setHighs);
    const unsub = subscribeGameScores(gameSlug, setHighs);
    return () => {
      unsub?.();
    };
  }, [gameSlug, player]);

  const selfHigh = player ? (highs[player] ?? 0) : 0;
  const rivalHigh = rivalVisible && rival ? (highs[rival] ?? 0) : 0;

  const submitFinal = useCallback(
    async (
      score: number,
      opts?: { level?: number },
    ): Promise<ScoreResult | undefined> => {
      if (!player || score < 0) return;
      const token = run.current;
      if (token.submitted) return;
      token.submitted = true;
      const now = Date.now();
      const level = opts?.level ?? (token.level > 0 ? token.level : undefined);
      trackEvent({
        type: "run_end",
        slug: gameSlug,
        score,
        durationMs: Math.max(0, now - (token.startAt || now)),
        ...(level !== undefined ? { level } : {}),
      });
      const showRival = getSettings().rivalVisible;
      const result = await recordScore(gameSlug, player, score, {
        rivalVisible: showRival,
      });
      const updated = await fetchGameScores(gameSlug);
      setHighs(updated);
      if (result.celebrate) {
        toast(showRival ? result.message : `${result.message} ${praise("run_end")}`);
      }
      return result;
    },
    [gameSlug, player, toast],
  );

  const checkMilestone = useCallback(
    async (currentScore: number): Promise<void> => {
      if (!player) return;
      const now = Date.now();
      if (now - lastCheckAt.current < MILESTONE_GAP_MS) return;
      lastCheckAt.current = now;
      const showRival = getSettings().rivalVisible;
      const m = await checkLiveMilestone(
        gameSlug,
        player,
        currentScore,
        lastMilestone.current,
        {
          rivalVisible: showRival,
        },
      );
      if (!m.celebrate) return;
      lastMilestone.current = m.mark;
      toast(showRival ? m.message : selfMilestoneLine(m));
    },
    [gameSlug, player, toast],
  );

  const resetMilestones = useCallback(() => {
    lastMilestone.current = 0;
    run.current = { startAt: Date.now(), submitted: false, level: 0 };
    trackEvent({ type: "run_start", slug: gameSlug });
  }, [gameSlug]);

  const reportLevel = useCallback(
    (level: number) => {
      run.current.level = Math.max(run.current.level, level);
      trackEvent({ type: "level_complete", slug: gameSlug, level });
    },
    [gameSlug],
  );

  return {
    player,
    playerName: getPlayerDisplayName(player),
    rivalName: rivalVisible && rival ? getPlayerDisplayName(rival) : "",
    selfHigh,
    rivalHigh,
    submitFinal,
    checkMilestone,
    resetMilestones,
    reportLevel,
  };
}
