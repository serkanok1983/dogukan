/**
 * Gün kovası reducer'ı (CONTRACT §3.5). C0 yazdı, sahibi S6.
 * Saf fonksiyon: aynı girdi → aynı çıktı.
 */
import type { DayUsage, Progress, ProgressEvent, Stars } from "./types";

function play(d: DayUsage, slug: string) {
  return d.plays[slug] ?? { sec: 0, runs: 0, stars: 0 as Stars };
}

export function reduceDay(d: DayUsage, e: ProgressEvent, p: Progress, runStars?: Stars): DayUsage {
  void p;
  switch (e.type) {
    case "app_open":
      return { ...d, opens: d.opens + 1 };
    case "usage": {
      if (e.kind === "break") return { ...d, breakSec: d.breakSec + e.sec };
      const next: DayUsage = { ...d, totalSec: d.totalSec + e.sec, sinceBreakSec: d.sinceBreakSec + e.sec };
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
      return { ...d, plays: { ...d.plays, [e.slug]: { ...cur, runs: cur.runs + 1, stars } } };
    }
    case "exercise_set_end":
      return {
        ...d,
        setsDone: d.setsDone + (e.mode === "session" ? 1 : 0),
        honeyEarned: d.honeyEarned + (e.mode === "session" ? 2 : 1),
      };
    case "capsule_end":
      return { ...d, episodesDone: d.episodesDone + 1, honeyEarned: d.honeyEarned + 1 };
    case "break_done":
      return e.skippedByParent
        ? { ...d, breaksSkippedByParent: d.breaksSkippedByParent + 1, sinceBreakSec: 0 }
        : { ...d, breaksTaken: d.breaksTaken + 1, sinceBreakSec: 0 };
    case "limit_reached":
      return { ...d, limitReached: true };
    case "extension":
      return { ...d, extensions: d.extensions + 1, extensionMinutes: d.extensionMinutes + e.minutes };
    case "bedtime_block":
      return { ...d, bedtimeBlocks: d.bedtimeBlocks + 1 };
    case "session_end":
      return {
        ...d,
        sessionsEndedBy: { ...d.sessionsEndedBy, [e.reason]: d.sessionsEndedBy[e.reason] + 1 },
      };
    case "together_done":
      return { ...d, togetherDone: true };
    case "clock_jump":
      return { ...d, clockJumps: d.clockJumps + 1 };
    default:
      return d;
  }
}
