/**
 * İlerleme deposunun tipleri (CONTRACT §2, §3.2).
 * DONDURULMUŞ: yalnızca ekleme yapılabilir ve CONTRACT.md aynı PR'da güncellenir.
 */
import type { PlayerId } from "@/lib/auth";
import type { SkillId, SkillLevel } from "@/lib/skills";

export type DayKey = string;
export type Stars = 0 | 1 | 2 | 3;
export type StickerId = string;
export type CosmeticId = string;
export type BreakId =
  "goz" | "zipla" | "gerin" | "flamingo" | "nefes" | "su" | "bul" | "saril";
export type ClockKind =
  "arcade" | "learning" | "capsule" | "creative" | "break" | "map";
export type SessionEndReason =
  "run_end" | "map" | "limit" | "bedtime" | "background";

export type ActivityStats = {
  plays: number;
  best: number;
  bestLevel: number;
  stars: Stars;
  ease: number;
  consecutiveLow: number;
  seconds: number;
  lastAt: number;
};

export type SkillState = {
  level: SkillLevel;
  streak: number;
  misses: number;
  attempts: number;
  correct: number;
  firstTryCorrect: number;
  box: 0 | 1 | 2 | 3 | 4;
  lastAt: number;
  nextDueAt: number;
  masteredAt?: number;
};

export type TopicState = {
  capsuleDone: boolean;
  capsuleDoneAt?: number;
  favorite: boolean;
  complete: boolean;
  lastAt: number;
};

export type DayPlay = { sec: number; runs: number; stars: Stars };

export type DayUsage = {
  totalSec: number;
  arcadeSec: number;
  learningSec: number;
  capsuleSec: number;
  creativeSec: number;
  coplaySec: number;
  breakSec: number;
  sinceBreakSec: number;
  honeyEarned: number;
  setsDone: number;
  episodesDone: number;
  breaksTaken: number;
  breaksSkippedByParent: number;
  opens: number;
  extensions: number;
  extensionMinutes: number;
  limitReached: boolean;
  bedtimeBlocks: number;
  togetherDone: boolean;
  clockJumps: number;
  sessionsEndedBy: Record<SessionEndReason, number>;
  plays: Record<string, DayPlay>;
};

export type QuestKind = "tr" | "mat" | "extra" | "review";

export type QuestState = {
  id: string;
  kind: QuestKind;
  slug?: string;
  skill?: SkillId;
  topic?: string;
  done: boolean;
};

export type NoticeKind =
  "new_star" | "level_up" | "sticker" | "quest_done" | "quests_all_done" | "streak";

export type Notice = {
  id: string;
  kind: NoticeKind;
  at: number;
  slug?: string;
  skill?: SkillId;
  stars?: Stars;
  stickerId?: StickerId;
  streak?: number;
};

export type Progress = {
  v: 1;
  player: PlayerId;
  createdAt: number;
  installDay: DayKey;
  updatedAt: number;
  activities: Record<string, ActivityStats>;
  skills: Partial<Record<SkillId, SkillState>>;
  topics: Record<string, TopicState>;
  days: Record<DayKey, DayUsage>;
  rewards: {
    stickers: Partial<Record<StickerId, number>>;
    cosmetics: { owned: CosmeticId[]; equipped: CosmeticId | null };
    starsSpent: number;
    streak: { count: number; lastDay: DayKey | null; freezeUsedWeek: string | null };
    /** S5 (ek alan): günün üç görevinin tamamlandığı günler (çıkartma tetikleyicisi). */
    questDays?: DayKey[];
  };
  quests: { day: DayKey | null; items: QuestState[] };
  inbox: Notice[];
  seenEventIds: string[];
};

export type ProgressEventInput =
  | { type: "app_open" }
  | { type: "activity_open"; slug: string }
  | { type: "run_start"; slug: string }
  | {
      type: "run_end";
      slug: string;
      score: number;
      durationMs: number;
      level?: number;
    }
  | { type: "level_complete"; slug: string; level: number }
  | {
      type: "exercise_item";
      slug: string;
      skill: SkillId;
      level: SkillLevel;
      firstTry: boolean;
      correct: boolean;
      review: boolean;
      ms: number;
    }
  | {
      type: "exercise_set_end";
      slug: string;
      skill: SkillId;
      correct: number;
      total: number;
      firstTry: number;
      mode: "session" | "gate";
    }
  | { type: "capsule_end"; topic: string }
  | {
      type: "usage";
      day: DayKey;
      kind: ClockKind;
      sec: number;
      coplay: boolean;
      slug?: string;
    }
  | { type: "break_done"; breakId: BreakId; skippedByParent: boolean }
  | { type: "limit_reached" }
  | { type: "extension"; minutes: number }
  | { type: "bedtime_block" }
  | { type: "session_end"; reason: SessionEndReason; slug?: string }
  | { type: "coplay_start" }
  | { type: "together_done" }
  | { type: "clock_jump"; deltaMs: number }
  | { type: "blocks_saved"; index: number; shared: boolean }
  | { type: "topic_flag"; slug: string; favorite?: boolean; complete?: boolean }
  | { type: "quests_set"; day: DayKey; items: QuestState[] }
  | { type: "cosmetic_buy"; cosmeticId: CosmeticId; price: number }
  | { type: "cosmetic_equip"; cosmeticId: CosmeticId | null }
  | { type: "notices_ack"; ids: string[] };

/** `id` ve `at` trackEvent tarafından damgalanır; girdi tiplerinde bu adlarla alan olamaz. */
export type ProgressEvent = ProgressEventInput & { id: string; at: number };
export type ProgressEventType = ProgressEvent["type"];
