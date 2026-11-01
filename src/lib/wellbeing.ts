/**
 * İyi oluş kuralları (CONTRACT §10.2, MASTER_PLAN §2.11). Saf fonksiyonlar; sahibi S6.
 *
 * - Faz önceliği: night > limit > warn1 > warn5 > evening > grace > play.
 * - Gece: `bedtime` ile `wakeFrom` arası (İstanbul saati).
 * - Akşam: `bedtime − eveningModeMinutes` ile `bedtime` arası.
 * - Sınır: `totalSec`, günlük sınır + bugünkü uzatmalarla karşılaştırılır.
 * - Tanışma günleri (grace) yalnızca kavanozu etkiler; sınır, mola ve gece yine geçerlidir.
 */
import { dayKey, minutesOfDay, parseHHMM } from "@/lib/progress/time";
import type { DayUsage } from "@/lib/progress/types";
import { dailyCapMinutes, type Settings } from "@/lib/settings";

export type Phase =
  "grace" | "play" | "warn5" | "warn1" | "limit" | "evening" | "night";

const CELL_SEC = 120;
const DAY_MIN = 1440;
export const WARN5_SEC = 5 * 60;
export const WARN1_SEC = 60;

/** `m` dakikası [from, to) aralığında mı? Gece yarısını aşan aralıkları da destekler. */
function inWindow(m: number, from: number, to: number): boolean {
  if (from === to) return false;
  return from < to ? m >= from && m < to : m >= from || m < to;
}

export function isNightAt(ms: number, s: Settings): boolean {
  const bed = parseHHMM(s.bedtime);
  const wake = parseHHMM(s.wakeFrom);
  if (!Number.isFinite(bed) || !Number.isFinite(wake)) return false;
  return inWindow(minutesOfDay(ms), bed, wake);
}

export function isEveningAt(ms: number, s: Settings): boolean {
  const bed = parseHHMM(s.bedtime);
  const span = Math.max(
    0,
    Math.min(DAY_MIN - 1, Math.round(s.eveningModeMinutes || 0)),
  );
  if (!Number.isFinite(bed) || span === 0) return false;
  const start = (((bed - span) % DAY_MIN) + DAY_MIN) % DAY_MIN;
  return inWindow(minutesOfDay(ms), start, bed);
}

/** Bugünün toplam sınırı (saniye): hafta içi/sonu/tatil + bugünkü uzatmalar. */
export function capSeconds(s: Settings, d: DayUsage, ms: number): number {
  return Math.max(0, (dailyCapMinutes(s, ms) + d.extensionMinutes) * 60);
}

export function secondsLeftToday(s: Settings, d: DayUsage, ms: number): number {
  return capSeconds(s, d, ms) - d.totalSec;
}

/**
 * "+N dk" için yazılacak dakika: sınır beklerken (≤ 120 sn) aşılan süre de kapatılır,
 * böylece uzatma verildiği andan itibaren en az N dakika sürer.
 */
export function extensionMinutesFor(
  s: Settings,
  d: DayUsage,
  ms: number,
  minutes: number,
): number {
  const overSec = Math.max(0, -secondsLeftToday(s, d, ms));
  return minutes + Math.ceil(overSec / 60);
}

/** Bugün tanışma günlerinden biri mi (kavanoz kapı olmaz)? */
export function isGraceDay(s: Settings, ms: number): boolean {
  return Boolean(s.graceUntil) && dayKey(ms) <= s.graceUntil;
}

export function computePhase(
  now: Date,
  s: Settings,
  d: DayUsage,
  opts: { ignoreNight?: boolean } = {},
): Phase {
  const ms = now.getTime();
  if (!opts.ignoreNight && isNightAt(ms, s)) return "night";
  const left = secondsLeftToday(s, d, ms);
  if (left <= 0) return "limit";
  if (left <= WARN1_SEC) return "warn1";
  if (left <= WARN5_SEC) return "warn5";
  if (isEveningAt(ms, s)) return "evening";
  if (isGraceDay(s, ms)) return "grace";
  return "play";
}

export function honeyCells(
  s: Settings,
  d: DayUsage,
): { left: number; capacity: number } {
  const maxSec = s.arcadeMaxMinutes * 60;
  const budgetSec = Math.min(
    maxSec,
    s.arcadeMinutes * 60 + d.honeyEarned * CELL_SEC,
  );
  return {
    left: Math.ceil(Math.max(0, budgetSec - d.arcadeSec) / CELL_SEC),
    capacity: Math.ceil(maxSec / CELL_SEC),
  };
}

/** Bir "Bal topla" daha kavanoza kullanılabilir bir hücre ekler mi (tavan dolmadıysa)? */
export function canEarnHoney(s: Settings, d: DayUsage): boolean {
  return honeyCells(s, { ...d, honeyEarned: d.honeyEarned + 1 }).left > 0;
}

/**
 * Arcade başlatılabilir mi? Gece ve sınırda hayır. Birlikte oyunda evet (kavanoz
 * boşalmaz). Akşam arcade adaları uyur (−5/−1 dk uyarıları akşamı bastırmaz).
 * Tanışma günlerinde kavanoz kapı olmaz. `ignoreNight`: ebeveyn geceyi açtı;
 * gece saatleri akşam sayılır.
 */
export function canStartArcade(
  now: Date,
  s: Settings,
  d: DayUsage,
  coplay: boolean,
  opts: { ignoreNight?: boolean } = {},
): boolean {
  const ms = now.getTime();
  const phase = computePhase(now, s, d, opts);
  if (phase === "night" || phase === "limit") return false;
  if (coplay) return true;
  if (isEveningAt(ms, s) || (opts.ignoreNight && isNightAt(ms, s))) return false;
  return isGraceDay(s, ms) || honeyCells(s, d).left > 0;
}

export function canStartEpisode(s: Settings, d: DayUsage): boolean {
  return d.episodesDone < s.episodesPerDay;
}

export function breakDue(s: Settings, d: DayUsage): boolean {
  return d.sinceBreakSec >= s.breakEveryMinutes * 60;
}
