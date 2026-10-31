import type { PlayerId } from "@/lib/auth";
import type { DayKey, DayUsage, Progress } from "./types";

export const TIME_ZONE = "Europe/Istanbul";
export const DAY_MS = 86_400_000;

const dayFormat = new Intl.DateTimeFormat("sv-SE", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const partsFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

/** "YYYY-MM-DD", İstanbul saatiyle. */
export function dayKey(ms: number = Date.now()): DayKey {
  return dayFormat.format(new Date(ms));
}

function dayToUtcMs(day: DayKey): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(day: DayKey, n: number): DayKey {
  const t = new Date(dayToUtcMs(day) + n * DAY_MS);
  return t.toISOString().slice(0, 10);
}

/** b − a, tam gün olarak. */
export function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round((dayToUtcMs(b) - dayToUtcMs(a)) / DAY_MS);
}

/** ISO hafta anahtarı, ör. "2026-W44". */
export function weekKey(ms: number = Date.now()): string {
  const day = dayKey(ms);
  const date = new Date(dayToUtcMs(day));
  const weekday = (date.getUTCDay() + 6) % 7; // Pazartesi = 0
  date.setUTCDate(date.getUTCDate() - weekday + 3); // o haftanın perşembesi
  const isoYear = date.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstWeekday = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstWeekday + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * DAY_MS));
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

function parts(ms: number) {
  const out: Record<string, string> = {};
  for (const p of partsFormat.formatToParts(new Date(ms))) out[p.type] = p.value;
  return out;
}

export function isWeekend(ms: number = Date.now()): boolean {
  const wd = parts(ms).weekday;
  return wd === "Sat" || wd === "Sun";
}

export function minutesOfDay(ms: number = Date.now()): number {
  const p = parts(ms);
  return Number(p.hour) * 60 + Number(p.minute);
}

/** "20:30" → 1230. Geçersizse NaN. */
export function parseHHMM(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return Number.NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function emptyDay(): DayUsage {
  return {
    totalSec: 0,
    arcadeSec: 0,
    learningSec: 0,
    capsuleSec: 0,
    creativeSec: 0,
    coplaySec: 0,
    breakSec: 0,
    sinceBreakSec: 0,
    honeyEarned: 0,
    setsDone: 0,
    episodesDone: 0,
    breaksTaken: 0,
    breaksSkippedByParent: 0,
    opens: 0,
    extensions: 0,
    extensionMinutes: 0,
    limitReached: false,
    bedtimeBlocks: 0,
    togetherDone: false,
    clockJumps: 0,
    sessionsEndedBy: { run_end: 0, map: 0, limit: 0, bedtime: 0, background: 0 },
    plays: {},
  };
}

export function emptyProgress(player: PlayerId, now: number = Date.now()): Progress {
  return {
    v: 1,
    player,
    createdAt: now,
    installDay: dayKey(now),
    updatedAt: now,
    activities: {},
    skills: {},
    topics: {},
    days: {},
    rewards: {
      stickers: {},
      cosmetics: { owned: [], equipped: null },
      starsSpent: 0,
      streak: { count: 0, lastDay: null, freezeUsedWeek: null },
    },
    quests: { day: null, items: [] },
    inbox: [],
    seenEventIds: [],
  };
}
