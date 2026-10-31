/**
 * Ustalık kuralları (CONTRACT §6.2). `applyExercise` sözleşmedir (C0).
 * Seçiciler (dueSkills, weakestSkills, planSession, pickForGate, summary)
 * S2'nindir; imzaları sözleşmedir. İsteğe bağlı son parametreler (beceri
 * süzgeci) eklemedir: motor yalnızca üreticisi olan becerileri seçtirir.
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
        if (next.level === 3 && next.masteredAt === undefined)
          next.masteredAt = item.at;
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

// ---- Seçiciler (S2; imzalar sözleşmedir) ----

/** Beceri süzgeci; motor `(id) => getGenerator(id) !== undefined` verir. */
export type SkillFilter = (skill: SkillId) => boolean;

const anySkill: SkillFilter = () => true;

const PHASE1_SKILLS = SKILL_IDS.filter((id) => SKILLS[id].phase1);

/**
 * Yalnızca arcade koşularından beslenen beceriler (CONTRACT §3.5 run_end).
 * Tekrar, kapı ya da "zayıf beceri" maddesi olamazlar: hiçbir egzersiz
 * onları sınamaz ve çocuğu öğrenme diye arcade'e göndermek istemeyiz.
 */
const ARCADE_ONLY: ReadonlySet<SkillId> = new Set<SkillId>(["ef.refleks"]);

const EXERCISE_SKILLS = PHASE1_SKILLS.filter((id) => !ARCADE_ONLY.has(id));

const SKILL_ORDER = new Map<SkillId, number>(SKILL_IDS.map((id, i) => [id, i]));

function order(a: SkillId, b: SkillId): number {
  return (SKILL_ORDER.get(a) ?? 0) - (SKILL_ORDER.get(b) ?? 0);
}

function firstTryRatio(s: SkillState): number {
  return s.attempts > 0 ? s.firstTryCorrect / s.attempts : 0;
}

function practiced(p: Progress, id: SkillId): SkillState | undefined {
  const s = p.skills[id];
  return s && s.attempts > 0 ? s : undefined;
}

function levelOf(p: Progress, id: SkillId): SkillLevel {
  return p.skills[id]?.level ?? 1;
}

function easier(level: SkillLevel): SkillLevel {
  return Math.max(1, level - 1) as SkillLevel;
}

/**
 * Önkoşulları karşılanmış mı (MASTER_PLAN §3.1)? Çalışılmış beceri hep açıktır.
 * Önkoşul becerinin kendisi de açık olmalı (graf asiklik; özyineleme biter).
 */
export function isUnlocked(p: Progress, skill: SkillId): boolean {
  if (practiced(p, skill)) return true;
  return SKILLS[skill].prereq.every(
    (r) => levelOf(p, r.skill) >= r.level && isUnlocked(p, r.skill),
  );
}

/** Önkoşul grafında komşular (önkoşulları ve onu önkoşul alanlar), Faz 1, arcade hariç. */
export function adjacentSkills(skill: SkillId): SkillId[] {
  const before = SKILLS[skill].prereq.map((r) => r.skill);
  const after = SKILL_IDS.filter((id) =>
    SKILLS[id].prereq.some((r) => r.skill === skill),
  );
  return [...new Set([...before, ...after])].filter(
    (id) => id !== skill && SKILLS[id].phase1 && !ARCADE_ONLY.has(id),
  );
}

/** Zamanı gelmiş (nextDueAt <= now) ve en az bir kez çalışılmış Faz 1 becerileri; en eskisi önce. */
export function dueSkills(p: Progress, now: number): SkillId[] {
  const due: { id: SkillId; s: SkillState }[] = [];
  for (const id of EXERCISE_SKILLS) {
    const s = practiced(p, id);
    if (s && s.nextDueAt <= now) due.push({ id, s });
  }
  return due
    .sort(
      (a, b) =>
        a.s.nextDueAt - b.s.nextDueAt || a.s.box - b.s.box || order(a.id, b.id),
    )
    .map((d) => d.id);
}

/**
 * En zayıf beceriler: önce ≥ 3 denemesi olanlar (ilk-deneme oranı düşükten
 * yükseğe, sonra seviye, sonra en az yakın zamanda çalışılan); sonra kalan
 * açık beceriler en düşük seviyeden. En fazla `n` öğe döner.
 */
export function weakestSkills(
  p: Progress,
  n: number,
  has: SkillFilter = anySkill,
): SkillId[] {
  const pool = EXERCISE_SKILLS.filter((id) => has(id));
  const tried: { id: SkillId; s: SkillState }[] = [];
  const rest: SkillId[] = [];
  for (const id of pool) {
    const s = p.skills[id];
    if (s && s.attempts >= 3) tried.push({ id, s });
    else if (isUnlocked(p, id)) rest.push(id);
  }
  tried.sort(
    (a, b) =>
      firstTryRatio(a.s) - firstTryRatio(b.s) ||
      a.s.level - b.s.level ||
      a.s.lastAt - b.s.lastAt ||
      order(a.id, b.id),
  );
  rest.sort(
    (a, b) =>
      levelOf(p, a) - levelOf(p, b) ||
      (p.skills[b]?.attempts ?? 0) - (p.skills[a]?.attempts ?? 0) ||
      order(a, b),
  );
  return [...tried.map((t) => t.id), ...rest].slice(0, Math.max(0, n));
}

function pickAdjacent(
  p: Progress,
  skill: SkillId,
  exclude: SkillId | null,
  has: SkillFilter,
): SkillId | null {
  const graph = adjacentSkills(skill);
  const strand = SKILLS[skill].strand;
  const sameStrand = EXERCISE_SKILLS.filter(
    (id) => SKILLS[id].strand === strand && !graph.includes(id),
  );
  for (const group of [graph, sameStrand]) {
    const ok = group.filter(
      (id) => id !== skill && id !== exclude && has(id) && isUnlocked(p, id),
    );
    if (ok.length === 0) continue;
    // Çalışılmış olanlar önce (karışık tekrar), aralarında en uzun süredir dokunulmayan.
    ok.sort((a, b) => {
      const sa = practiced(p, a);
      const sb = practiced(p, b);
      if (sa && !sb) return -1;
      if (!sa && sb) return 1;
      return (sa?.lastAt ?? 0) - (sb?.lastAt ?? 0) || order(a, b);
    });
    return ok[0] ?? null;
  }
  return null;
}

/**
 * 6 maddelik set planı (MASTER_PLAN §2.8): odak seviyesi, ısınma (seri 0 ve
 * seviye > 1), zamanı gelmiş tekrar becerisi (başka beceri yoksa odak becerinin
 * kendisi, o da değilse null) ve komşu "sürpriz" becerisi.
 */
export function planSession(
  p: Progress,
  skill: SkillId,
  now: number,
  has: SkillFilter = anySkill,
): {
  focusLevel: SkillLevel;
  warmUp: boolean;
  reviewSkill: SkillId | null;
  adjacentSkill: SkillId | null;
} {
  const s = p.skills[skill];
  const focusLevel = s?.level ?? 1;
  const due = dueSkills(p, now).filter((id) => has(id));
  const reviewSkill =
    due.find((id) => id !== skill) ?? (due.includes(skill) ? skill : null);
  const adjacentSkill = pickAdjacent(p, skill, reviewSkill, has);
  return {
    focusLevel,
    warmUp: (s?.streak ?? 0) === 0 && focusLevel > 1,
    reviewSkill,
    adjacentSkill,
  };
}

/**
 * Bal kapısı: tam 3 madde. En zayıf beceriden 2 madde (kendi seviyesinde) +
 * ustalaşılmış/rahat bir beceriden 1 güven maddesi (bir seviye aşağıda;
 * zamanı gelmiş olan önce). Güven becerisi yoksa zayıf beceri bir seviye aşağıda.
 */
export function pickForGate(
  p: Progress,
  now: number,
  has: SkillFilter = anySkill,
): { skill: SkillId; level: SkillLevel }[] {
  const weak = weakestSkills(p, 1, has)[0] ?? "mat.sayma";
  const weakLevel = levelOf(p, weak);
  const confident = EXERCISE_SKILLS.flatMap((id) => {
    const s = practiced(p, id);
    if (!s || id === weak || !has(id)) return [];
    const comfy =
      s.masteredAt !== undefined ||
      s.level >= 2 ||
      (s.attempts >= 3 && firstTryRatio(s) >= 0.7);
    return comfy ? [{ id, s }] : [];
  }).sort((a, b) => {
    const dueA = a.s.nextDueAt <= now ? 0 : 1;
    const dueB = b.s.nextDueAt <= now ? 0 : 1;
    return (
      dueA - dueB || firstTryRatio(b.s) - firstTryRatio(a.s) || order(a.id, b.id)
    );
  })[0];
  return [
    { skill: weak, level: weakLevel },
    { skill: weak, level: weakLevel },
    confident
      ? { skill: confident.id, level: easier(confident.s.level) }
      : { skill: weak, level: easier(weakLevel) },
  ];
}

export type SkillSummary = {
  learning: { skill: SkillId; level: SkillLevel; ratio: number }[];
  masteredThisWeek: SkillId[];
  struggling: SkillId[];
};

/**
 * Ebeveyn paneli özeti. `learning`: çalışılmış beceriler, en son çalışılan önce.
 * `struggling`: SkillState seviye düşüş geçmişi tutmadığı için "7 günde 2+
 * düşüş" türetilemez; oran kuralı kullanılır (≥ 6 deneme ve oran < 0.5), en
 * düşük oran önce.
 */
export function summary(p: Progress, now: number): SkillSummary {
  const weekAgo = now - 7 * DAY_MS;
  const entries = SKILL_IDS.flatMap((id) => {
    const s = practiced(p, id);
    return s ? [{ id, s }] : [];
  });
  return {
    learning: [...entries]
      .sort((a, b) => b.s.lastAt - a.s.lastAt || order(a.id, b.id))
      .map(({ id, s }) => ({ skill: id, level: s.level, ratio: firstTryRatio(s) })),
    masteredThisWeek: entries
      .filter(
        ({ s }) =>
          s.masteredAt !== undefined &&
          s.masteredAt >= weekAgo &&
          s.masteredAt <= now,
      )
      .map(({ id }) => id),
    struggling: entries
      .filter(({ s }) => s.attempts >= 6 && firstTryRatio(s) < 0.5)
      .sort((a, b) => firstTryRatio(a.s) - firstTryRatio(b.s) || order(a.id, b.id))
      .map(({ id }) => id),
  };
}
