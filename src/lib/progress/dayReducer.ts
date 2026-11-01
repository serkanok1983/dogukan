/**
 * Gün kovası reducer'ı (CONTRACT §3.5). C0 yazdı, sahibi S6.
 * Saf fonksiyon: aynı girdi → aynı çıktı.
 */
import type { DayUsage, Progress, ProgressEvent, Stars } from "./types";

function play(d: DayUsage, slug: string) {
  return d.plays[slug] ?? { sec: 0, runs: 0, stars: 0 as Stars };
}

/** Son molanın `totalSec` değeri. Eski veride `totalSec − sinceBreakSec`ten türetilir. */
export function breakBase(d: DayUsage): number {
  return d.breakAtTotalSec ?? d.totalSec - d.sinceBreakSec;
}

function grantTotals(d: DayUsage): { count: number; minutes: number } {
  let count = 0;
  let minutes = 0;
  for (const m of Object.values(d.extensionGrants ?? {})) {
    count += 1;
    minutes += m;
  }
  return { count, minutes };
}

/**
 * Birleştirme düzeltmesi (`mergeProgress` gün kovasını alan bazlı `max` ile
 * birleştirdikten sonra): `merged` = max/OR/birleşim sonucu, `a`/`b` = girdiler.
 *
 * - `sinceBreakSec`: mola tabanı (`breakAtTotalSec`) `max` ile birleşir, süre
 *   ondan türetilir; başka sekmedeki mola sıfırlaması geri gelmez.
 * - `extensions`/`extensionMinutes`: uzatmalar kimlikle birleşir; kimliksiz eski
 *   kısım (`sayaç − kimlikli toplam`) `max` ile korunur.
 *
 * Değişmeli ve idempotenttir.
 */
export function fixMergedDay(merged: DayUsage, a: DayUsage, b: DayUsage): DayUsage {
  const base = Math.max(breakBase(a), breakBase(b));
  const ga = grantTotals(a);
  const gb = grantTotals(b);
  const gm = grantTotals(merged);
  const out: DayUsage = {
    ...merged,
    sinceBreakSec: Math.max(0, merged.totalSec - base),
    extensionGrants: merged.extensionGrants ?? {},
    extensions:
      Math.max(a.extensions - ga.count, b.extensions - gb.count) + gm.count,
    extensionMinutes:
      Math.max(a.extensionMinutes - ga.minutes, b.extensionMinutes - gb.minutes) +
      gm.minutes,
  };
  // Taban yalnızca girdilerden biri taşıyorsa yazılır (yoksa `breakBase` türetir).
  if (a.breakAtTotalSec !== undefined || b.breakAtTotalSec !== undefined)
    out.breakAtTotalSec = base;
  else delete out.breakAtTotalSec;
  return out;
}

export function reduceDay(
  d: DayUsage,
  e: ProgressEvent,
  p: Progress,
  runStars?: Stars,
): DayUsage {
  void p;
  switch (e.type) {
    case "app_open":
      return { ...d, opens: d.opens + 1 };
    case "usage": {
      if (e.kind === "break") return { ...d, breakSec: d.breakSec + e.sec };
      const base = breakBase(d);
      const totalSec = d.totalSec + e.sec;
      const next: DayUsage = {
        ...d,
        totalSec,
        breakAtTotalSec: base,
        sinceBreakSec: totalSec - base,
      };
      if (e.kind === "arcade") {
        if (e.coplay) next.coplaySec = d.coplaySec + e.sec;
        else next.arcadeSec = d.arcadeSec + e.sec;
      } else if (e.kind === "learning") next.learningSec = d.learningSec + e.sec;
      else if (e.kind === "capsule") next.capsuleSec = d.capsuleSec + e.sec;
      else if (e.kind === "creative") next.creativeSec = d.creativeSec + e.sec;
      if (e.slug) {
        const cur = play(d, e.slug);
        next.plays = { ...d.plays, [e.slug]: { ...cur, sec: cur.sec + e.sec } };
      }
      return next;
    }
    case "run_end": {
      const cur = play(d, e.slug);
      const stars = Math.max(cur.stars, runStars ?? 0) as Stars;
      return {
        ...d,
        plays: { ...d.plays, [e.slug]: { ...cur, runs: cur.runs + 1, stars } },
      };
    }
    case "exercise_set_end":
      return {
        ...d,
        setsDone: d.setsDone + (e.mode === "session" ? 1 : 0),
        honeyEarned: d.honeyEarned + (e.mode === "session" ? 2 : 1),
      };
    case "capsule_end":
      return {
        ...d,
        episodesDone: d.episodesDone + 1,
        honeyEarned: d.honeyEarned + 1,
      };
    case "break_done":
      return e.skippedByParent
        ? {
            ...d,
            breaksSkippedByParent: d.breaksSkippedByParent + 1,
            sinceBreakSec: 0,
            breakAtTotalSec: d.totalSec,
          }
        : {
            ...d,
            breaksTaken: d.breaksTaken + 1,
            sinceBreakSec: 0,
            breakAtTotalSec: d.totalSec,
          };
    case "limit_reached":
      return { ...d, limitReached: true };
    case "extension":
      return {
        ...d,
        extensions: d.extensions + 1,
        extensionMinutes: d.extensionMinutes + e.minutes,
        extensionGrants: { ...d.extensionGrants, [e.id]: e.minutes },
      };
    case "bedtime_block":
      return { ...d, bedtimeBlocks: d.bedtimeBlocks + 1 };
    case "session_end":
      return {
        ...d,
        sessionsEndedBy: {
          ...d.sessionsEndedBy,
          [e.reason]: d.sessionsEndedBy[e.reason] + 1,
        },
      };
    case "together_done":
      return { ...d, togetherDone: true };
    case "clock_jump":
      return { ...d, clockJumps: d.clockJumps + 1 };
    default:
      return d;
  }
}
