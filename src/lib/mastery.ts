/**
 * Ustalık kuralları (CONTRACT §6.2). `applyExercise` sözleşmedir (C0).
 * Seçiciler (dueSkills, weakestSkills, planSession, pickForGate, summary)
 * S2'nindir; burada imzası sabit, sade ilk sürümleri vardır.
 */
import type { Progress, SkillState } from "@/lib/progress/types";
import { DAY_MS } from "@/lib/progress/time";
import { SKILL_IDS, SKILLS, type SkillId, type SkillLevel } from "@/lib/skills";

export const LEITNER_DAYS = [0, 1, 3, 7, 14] as const;

export function emptySkill(at: number): SkillState {
  return {
    level: 1,
    streak: 0,
    misses: 0,
    attempts: 0,
    correct: 0,
    firstTryCorrect: 0,
    box: 0,
    lastAt: at,
    nextDueAt: at + DAY_MS,
  };
}

export type ExerciseOutcome = {
  level: SkillLevel;
  firstTry: boolean;
  correct: boolean;
  review: boolean;
  at: number;
};

export function applyExercise(
  s: SkillState | undefined,
  item: ExerciseOutcome,
): { next: SkillState; leveledUp: boolean; leveledDown: boolean } {
  const prev = s ?? emptySkill(item.at);
  const next: SkillState = {
    ...prev,
    attempts: prev.attempts + 1,
    correct: prev.correct + (item.correct ? 1 : 0),
    firstTryCorrect: prev.firstTryCorrect + (item.firstTry && item.correct ? 1 : 0),
    lastAt: item.at,
  };
  let leveledUp = false;
  let leveledDown = false;

  if (item.level === prev.level) {
    if (item.firstTry && item.correct) {
      next.streak = prev.streak + 1;
      next.misses = 0;
      if (next.streak >= 3 && next.level < 5) {
        if (next.level === 3 && next.masteredAt === undefined) next.masteredAt = item.at;
        next.level = (next.level + 1) as SkillLevel;
        next.streak = 0;
        next.nextDueAt = item.at + DAY_MS;
        leveledUp = true;
      }
    } else if (item.correct) {
      next.streak = 0;
      next.misses = 0;
    } else {
      next.streak = 0;
      next.misses = prev.misses + 1;
      if (next.misses >= 2 && next.level > 1) {
        next.level = (next.level - 1) as SkillLevel;
        next.misses = 0;
        leveledDown = true;
      }
    }
  }

  if (item.review) {
    next.box = item.correct ? (Math.min(4, prev.box + 1) as SkillState["box"]) : 0;
    next.nextDueAt = item.at + LEITNER_DAYS[next.box] * DAY_MS;
  }

  return { next, leveledUp, leveledDown };
}

// ---- Seçiciler (S2 geliştirecek; imzalar sözleşmedir) ----

const PHASE1_SKILLS = SKILL_IDS.filter((id) => SKILLS[id].phase1);

function firstTryRatio(s: SkillState): number {
  return s.attempts > 0 ? s.firstTryCorrect / s.attempts : 0;
}

export function dueSkills(p: Progress, now: number): SkillId[] {
  return PHASE1_SKILLS.filter((id) => {
    const s = p.skills[id];
    return s !== undefined && s.attempts > 0 && s.nextDueAt <= now;
  }).sort((a, b) => (p.skills[a]?.nextDueAt ?? 0) - (p.skills[b]?.nextDueAt ?? 0));
}

export function weakestSkills(p: Progress, n: number): SkillId[] {
  const practiced = PHASE1_SKILLS.filter((id) => (p.skills[id]?.attempts ?? 0) >= 3);
  const pool = practiced.length > 0 ? practiced : PHASE1_SKILLS;
  return [...pool]
    .sort((a, b) => {
      const sa = p.skills[a];
      const sb = p.skills[b];
      const ra = sa ? firstTryRatio(sa) : 0;
      const rb = sb ? firstTryRatio(sb) : 0;
      if (ra !== rb) return ra - rb;
      return (sa?.level ?? 1) - (sb?.level ?? 1);
    })
    .slice(0, n);
}

export function planSession(
  p: Progress,
  skill: SkillId,
  now: number,
): { focusLevel: SkillLevel; warmUp: boolean; reviewSkill: SkillId | null; adjacentSkill: SkillId | null } {
  const s = p.skills[skill];
  const focusLevel = s?.level ?? 1;
  const reviewSkill = dueSkills(p, now).find((id) => id !== skill) ?? null;
  const strand = SKILLS[skill].strand;
  const adjacentSkill =
    PHASE1_SKILLS.find((id) => id !== skill && id !== reviewSkill && SKILLS[id].strand === strand) ?? null;
  return { focusLevel, warmUp: (s?.streak ?? 0) === 0 && focusLevel > 1, reviewSkill, adjacentSkill };
}

export function pickForGate(p: Progress, now: number): { skill: SkillId; level: SkillLevel }[] {
  void now;
  const weak = weakestSkills(p, 1)[0] ?? "mat.sayma";
  const confident =
    PHASE1_SKILLS.find((id) => id !== weak && (p.skills[id]?.level ?? 1) >= 2) ?? weak;
  const weakLevel = p.skills[weak]?.level ?? 1;
  return [
    { skill: weak, level: weakLevel },
    { skill: weak, level: weakLevel },
    { skill: confident, level: Math.max(1, (p.skills[confident]?.level ?? 1) - 1) as SkillLevel },
  ];
}

export type SkillSummary = {
  learning: { skill: SkillId; level: SkillLevel; ratio: number }[];
  masteredThisWeek: SkillId[];
  struggling: SkillId[];
};

export function summary(p: Progress, now: number): SkillSummary {
  const weekAgo = now - 7 * DAY_MS;
  const entries = SKILL_IDS.flatMap((id) => {
    const s = p.skills[id];
    return s && s.attempts > 0 ? [[id, s] as const] : [];
  });
  return {
    learning: entries.map(([skill, s]) => ({ skill, level: s.level, ratio: firstTryRatio(s) })),
    masteredThisWeek: entries.filter(([, s]) => (s.masteredAt ?? 0) >= weekAgo).map(([id]) => id),
    struggling: entries.filter(([, s]) => s.attempts >= 6 && firstTryRatio(s) < 0.5).map(([id]) => id),
  };
}
