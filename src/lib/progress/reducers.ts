/**
 * Saf ilerleme reducer'ı ve çok cihazlı birleştirme (CONTRACT §3.5).
 * C0 yazdı; sahibi S5 (çıkartma/görev/kozmetik genişletmeleri).
 */
import { applyExercise } from "@/lib/mastery";
import type { SkillId } from "@/lib/skills";
import { getActivityInfo } from "@/lib/worlds";
import { reduceDay } from "./dayReducer";
import { starsForRun } from "./starRules";
import { dayKey, daysBetween, emptyDay, weekKey } from "./time";
import type {
  ActivityStats,
  DayUsage,
  Notice,
  NoticeKind,
  Progress,
  ProgressEvent,
  Stars,
  TopicState,
} from "./types";

const SEEN_CAP = 300;
const EASE_START = 0.7;
const EASE_MIN = 0.6;
const EASE_MAX = 1;
const STREAK_MILESTONES = [3, 7, 14, 30];

function emptyStats(at: number): ActivityStats {
  return {
    plays: 0,
    best: 0,
    bestLevel: 0,
    stars: 0,
    ease: EASE_START,
    consecutiveLow: 0,
    seconds: 0,
    lastAt: at,
  };
}

function emptyTopic(at: number): TopicState {
  return { capsuleDone: false, favorite: false, complete: false, lastAt: at };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function setStars(correct: number, total: number): Stars {
  if (total <= 0) return 0;
  const r = correct / total;
  if (r >= 1) return 3;
  if (r >= 5 / 6) return 2;
  if (r >= 4 / 6) return 1;
  return 0;
}

export function totalStars(p: Progress): number {
  let n = 0;
  for (const s of Object.values(p.activities)) n += s.stars;
  return n;
}

function notice(
  e: ProgressEvent,
  kind: NoticeKind,
  extra: Partial<Notice> = {},
): Notice {
  return { id: `${e.id}:${kind}`, kind, at: e.at, ...extra };
}

function tickStreak(
  p: Progress,
  e: ProgressEvent,
  inbox: Notice[],
): Progress["rewards"]["streak"] {
  const s = p.rewards.streak;
  const today = dayKey(e.at);
  if (s.lastDay === today) return s;
  let count: number;
  let freezeUsedWeek = s.freezeUsedWeek;
  if (s.lastDay === null || daysBetween(s.lastDay, today) === 1) {
    count = s.count + 1;
  } else {
    const missed = daysBetween(s.lastDay, today) - 1;
    if (missed === 1 && freezeUsedWeek !== weekKey(e.at)) {
      count = s.count + 1;
      freezeUsedWeek = weekKey(e.at);
    } else {
      count = Math.max(0, s.count - Math.max(0, missed)) + 1;
    }
  }
  if (STREAK_MILESTONES.some((m) => s.count < m && count >= m)) {
    inbox.push(notice(e, "streak", { streak: count }));
  }
  return { count, lastDay: today, freezeUsedWeek };
}

function bumpStars(
  stats: ActivityStats,
  newStars: Stars,
  e: ProgressEvent,
  slug: string,
  inbox: Notice[],
): Stars {
  if (newStars > stats.stars) {
    inbox.push(notice(e, "new_star", { slug, stars: newStars }));
    return newStars;
  }
  return stats.stars;
}

export function reduceProgress(p: Progress, e: ProgressEvent): Progress {
  if (p.seenEventIds.includes(e.id)) return p;

  const inbox = [...p.inbox];
  let next: Progress = {
    ...p,
    updatedAt: Math.max(p.updatedAt, e.at),
    seenEventIds: [...p.seenEventIds, e.id].slice(-SEEN_CAP),
  };
  let runStars: Stars | undefined;

  switch (e.type) {
    case "run_end": {
      const stats = p.activities[e.slug] ?? emptyStats(e.at);
      runStars = starsForRun(e.slug, { score: e.score, level: e.level });
      let { ease, consecutiveLow } = stats;
      if (runStars === 3) {
        ease = round2(Math.min(EASE_MAX, ease + 0.05));
        consecutiveLow = 0;
      } else if (runStars === 0) {
        consecutiveLow += 1;
        if (consecutiveLow >= 3) {
          ease = round2(Math.max(EASE_MIN, ease - 0.05));
          consecutiveLow = 0;
        }
      } else {
        consecutiveLow = 0;
      }
      const updated: ActivityStats = {
        ...stats,
        plays: stats.plays + 1,
        best: Math.max(stats.best, e.score),
        bestLevel: Math.max(stats.bestLevel, e.level ?? 0),
        stars: bumpStars(stats, runStars, e, e.slug, inbox),
        ease,
        consecutiveLow,
        lastAt: e.at,
      };
      next = { ...next, activities: { ...p.activities, [e.slug]: updated } };
      if (getActivityInfo(e.slug)?.kind === "arcade") {
        const refleks: SkillId = "ef.refleks";
        const cur = p.skills[refleks];
        const { next: skill } = applyExercise(cur, {
          level: cur?.level ?? 1,
          firstTry: runStars >= 1,
          correct: runStars >= 1,
          review: false,
          at: e.at,
        });
        next = { ...next, skills: { ...next.skills, [refleks]: skill } };
      }
      break;
    }
    case "level_complete": {
      const stats = p.activities[e.slug] ?? emptyStats(e.at);
      next = {
        ...next,
        activities: {
          ...p.activities,
          [e.slug]: {
            ...stats,
            bestLevel: Math.max(stats.bestLevel, e.level),
            lastAt: e.at,
          },
        },
      };
      break;
    }
    case "activity_open": {
      const stats = p.activities[e.slug] ?? emptyStats(e.at);
      next = {
        ...next,
        activities: { ...p.activities, [e.slug]: { ...stats, lastAt: e.at } },
      };
      break;
    }
    case "exercise_item": {
      const { next: skill, leveledUp } = applyExercise(p.skills[e.skill], {
        level: e.level,
        firstTry: e.firstTry,
        correct: e.correct,
        review: e.review,
        at: e.at,
      });
      if (leveledUp) inbox.push(notice(e, "level_up", { skill: e.skill }));
      next = { ...next, skills: { ...p.skills, [e.skill]: skill } };
      break;
    }
    case "exercise_set_end": {
      const stats = p.activities[e.slug] ?? emptyStats(e.at);
      const updated: ActivityStats = {
        ...stats,
        plays: stats.plays + 1,
        best: Math.max(stats.best, e.correct),
        stars: bumpStars(stats, setStars(e.correct, e.total), e, e.slug, inbox),
        lastAt: e.at,
      };
      next = { ...next, activities: { ...p.activities, [e.slug]: updated } };
      if (e.mode === "session") {
        next = {
          ...next,
          rewards: { ...next.rewards, streak: tickStreak(p, e, inbox) },
        };
      }
      break;
    }
    case "capsule_end": {
      const topic = p.topics[e.topic] ?? emptyTopic(e.at);
      next = {
        ...next,
        topics: {
          ...p.topics,
          [e.topic]: {
            ...topic,
            capsuleDone: true,
            capsuleDoneAt: e.at,
            lastAt: e.at,
          },
        },
        rewards: { ...next.rewards, streak: tickStreak(p, e, inbox) },
      };
      break;
    }
    case "usage": {
      if (e.slug && e.kind !== "break" && e.kind !== "map") {
        const stats = p.activities[e.slug] ?? emptyStats(e.at);
        next = {
          ...next,
          activities: {
            ...p.activities,
            [e.slug]: { ...stats, seconds: stats.seconds + e.sec },
          },
        };
      }
      break;
    }
    case "topic_flag": {
      const topic = p.topics[e.slug] ?? emptyTopic(e.at);
      next = {
        ...next,
        topics: {
          ...p.topics,
          [e.slug]: {
            ...topic,
            favorite: e.favorite ?? topic.favorite,
            complete: e.complete ?? topic.complete,
            lastAt: e.at,
          },
        },
      };
      break;
    }
    case "quests_set":
      next = { ...next, quests: { day: e.day, items: e.items } };
      break;
    case "cosmetic_buy": {
      const c = p.rewards.cosmetics;
      if (
        c.owned.includes(e.cosmeticId) ||
        totalStars(p) - p.rewards.starsSpent < e.price
      )
        break;
      next = {
        ...next,
        rewards: {
          ...p.rewards,
          cosmetics: { ...c, owned: [...c.owned, e.cosmeticId] },
          starsSpent: p.rewards.starsSpent + e.price,
        },
      };
      break;
    }
    case "cosmetic_equip": {
      const c = p.rewards.cosmetics;
      if (e.cosmeticId !== null && !c.owned.includes(e.cosmeticId)) break;
      next = {
        ...next,
        rewards: { ...p.rewards, cosmetics: { ...c, equipped: e.cosmeticId } },
      };
      break;
    }
    case "notices_ack": {
      const drop = new Set(e.ids);
      next = { ...next, inbox: inbox.filter((n) => !drop.has(n.id)) };
      return withDay(next, e, runStars);
    }
    default:
      break;
  }

  next = { ...next, inbox };
  return withDay(next, e, runStars);
}

function withDay(
  p: Progress,
  e: ProgressEvent,
  runStars: Stars | undefined,
): Progress {
  const key = e.type === "usage" ? e.day : dayKey(e.at);
  const before = p.days[key] ?? emptyDay();
  const after = reduceDay(before, e, p, runStars);
  if (after === before && p.days[key]) return p;
  return { ...p, days: { ...p.days, [key]: after } };
}

// ---------------- Birleştirme ----------------

function maxBy<T>(a: T, b: T, key: (x: T) => number): T {
  return key(b) > key(a) ? b : a;
}

function mergeNumbers<T extends Record<string, unknown>>(a: T, b: T): T {
  const out: Record<string, unknown> = { ...a };
  for (const [k, vb] of Object.entries(b)) {
    const va = out[k];
    if (typeof va === "number" && typeof vb === "number") out[k] = Math.max(va, vb);
    else if (typeof va === "boolean" && typeof vb === "boolean") out[k] = va || vb;
    else if (
      va &&
      vb &&
      typeof va === "object" &&
      typeof vb === "object" &&
      !Array.isArray(va)
    ) {
      out[k] = mergeNumbers(
        va as Record<string, unknown>,
        vb as Record<string, unknown>,
      );
    } else if (va === undefined) out[k] = vb;
  }
  return out as T;
}

function mergeRecord<V>(
  a: Record<string, V>,
  b: Record<string, V>,
  f: (x: V, y: V) => V,
): Record<string, V> {
  const out: Record<string, V> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = k in out ? f(out[k] as V, v) : v;
  return out;
}

function mergeActivity(a: ActivityStats, b: ActivityStats): ActivityStats {
  const rank = (x: ActivityStats) => [x.lastAt, x.ease, x.consecutiveLow] as const;
  const [la, ea, ca] = rank(a);
  const [lb, eb, cb] = rank(b);
  const newer =
    lb !== la ? (lb > la ? b : a) : eb !== ea ? (eb > ea ? b : a) : cb > ca ? b : a;
  return {
    plays: Math.max(a.plays, b.plays),
    best: Math.max(a.best, b.best),
    bestLevel: Math.max(a.bestLevel, b.bestLevel),
    stars: Math.max(a.stars, b.stars) as Stars,
    seconds: Math.max(a.seconds, b.seconds),
    lastAt: Math.max(a.lastAt, b.lastAt),
    ease: newer.ease,
    consecutiveLow: newer.consecutiveLow,
  };
}

function sortedUnion(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])].sort();
}

export function mergeProgress(a: Progress, b: Progress): Progress {
  const newer = maxBy(a, b, (p) => p.updatedAt);
  const tieBreakNewer =
    a.updatedAt === b.updatedAt
      ? JSON.stringify(b) > JSON.stringify(a)
        ? b
        : a
      : newer;

  const skills: Progress["skills"] = { ...a.skills };
  for (const [id, sb] of Object.entries(b.skills) as [
    SkillId,
    NonNullable<Progress["skills"][SkillId]>,
  ][]) {
    const sa = skills[id];
    if (!sa) skills[id] = sb;
    else if (
      sb.attempts > sa.attempts ||
      (sb.attempts === sa.attempts && sb.lastAt > sa.lastAt)
    )
      skills[id] = sb;
    else if (
      sb.attempts === sa.attempts &&
      sb.lastAt === sa.lastAt &&
      JSON.stringify(sb) > JSON.stringify(sa)
    ) {
      skills[id] = sb;
    }
  }

  const topics = mergeRecord(a.topics, b.topics, (x, y) => ({
    capsuleDone: x.capsuleDone || y.capsuleDone,
    capsuleDoneAt:
      x.capsuleDoneAt === undefined
        ? y.capsuleDoneAt
        : y.capsuleDoneAt === undefined
          ? x.capsuleDoneAt
          : Math.max(x.capsuleDoneAt, y.capsuleDoneAt),
    favorite: x.favorite || y.favorite,
    complete: x.complete || y.complete,
    lastAt: Math.max(x.lastAt, y.lastAt),
  }));

  const days = mergeRecord<DayUsage>(a.days, b.days, (x, y) => mergeNumbers(x, y));

  const stickers = { ...a.rewards.stickers };
  for (const [id, at] of Object.entries(b.rewards.stickers)) {
    if (at === undefined) continue;
    const cur = stickers[id];
    stickers[id] = cur === undefined ? at : Math.min(cur, at);
  }

  const sa = a.rewards.streak;
  const sb = b.rewards.streak;
  const streak =
    (sa.lastDay ?? "") !== (sb.lastDay ?? "")
      ? (sa.lastDay ?? "") > (sb.lastDay ?? "")
        ? sa
        : sb
      : sb.count > sa.count ||
          (sb.count === sa.count &&
            (sb.freezeUsedWeek ?? "") > (sa.freezeUsedWeek ?? ""))
        ? sb
        : sa;

  let quests: Progress["quests"];
  if ((a.quests.day ?? "") !== (b.quests.day ?? "")) {
    quests = (a.quests.day ?? "") > (b.quests.day ?? "") ? a.quests : b.quests;
  } else {
    const doneB = new Set(b.quests.items.filter((q) => q.done).map((q) => q.id));
    const base = tieBreakNewer.quests;
    const doneA = new Set(a.quests.items.filter((q) => q.done).map((q) => q.id));
    quests = {
      day: base.day,
      items: base.items.map((q) => ({
        ...q,
        done: q.done || doneA.has(q.id) || doneB.has(q.id),
      })),
    };
  }

  const inboxMap = new Map<string, Notice>();
  for (const n of [...a.inbox, ...b.inbox]) inboxMap.set(n.id, n);
  const inbox = [...inboxMap.values()].sort(
    (x, y) => x.at - y.at || x.id.localeCompare(y.id),
  );

  return {
    v: 1,
    player: a.player,
    createdAt: Math.min(a.createdAt, b.createdAt),
    installDay: a.installDay < b.installDay ? a.installDay : b.installDay,
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
    activities: mergeRecord(a.activities, b.activities, mergeActivity),
    skills,
    topics,
    days,
    rewards: {
      stickers,
      cosmetics: {
        owned: sortedUnion(a.rewards.cosmetics.owned, b.rewards.cosmetics.owned),
        equipped: tieBreakNewer.rewards.cosmetics.equipped,
      },
      starsSpent: tieBreakNewer.rewards.starsSpent,
      streak,
    },
    quests,
    inbox,
    seenEventIds: sortedUnion(a.seenEventIds, b.seenEventIds).slice(-SEEN_CAP),
  };
}
