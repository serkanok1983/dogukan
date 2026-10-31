/**
 * Set kurgusu (MASTER_PLAN §2.8) ve madde yardımcıları. Saf; React yok.
 * Üretici hataları yutulur: bozuk madde atlanır, motor asla fırlatmaz.
 */
import { GENERATORS, getGenerator } from "@/activities/content";
import { pickForGate, planSession } from "@/lib/mastery";
import type { Progress } from "@/lib/progress/types";
import { shuffled, type Rng } from "@/lib/rng";
import type { SkillId, SkillLevel } from "@/lib/skills";
import { getLetterPath } from "./letterPaths";
import { numberWord } from "./numbers";
import type { Choice, Exercise, Generator } from "./types";

export type PlannedItem = { ex: Exercise; review: boolean };

export const SESSION_SIZE = 6;
export const GATE_SIZE = 3;

export function hasGenerator(skill: SkillId): boolean {
  return getGenerator(skill) !== undefined;
}

export function anyGenerator(): Generator | undefined {
  return Object.values(GENERATORS).find((g): g is Generator => g !== undefined);
}

export function clampLevel(level: number, gen: Generator): SkillLevel {
  return Math.max(1, Math.min(gen.maxLevel, Math.round(level))) as SkillLevel;
}

function easier(level: SkillLevel): SkillLevel {
  return Math.max(1, level - 1) as SkillLevel;
}

/** TapCount için seçenek yoksa n-1, n, n+1 üretir. */
function countChoices(n: number): Choice[] {
  const set = n <= 0 ? [0, 1, 2] : [n - 1, n, n + 1];
  return set.map((k) => ({ id: String(k), text: String(k), say: numberWord(k) }));
}

/**
 * Üretici çıktısını doğrular ve motorun beklediği biçime getirir. Geçersizse null.
 * - choice: ≥ 2 seçenek, cevap seçenekler içinde; `bigTap` → en fazla 2 seçenek.
 * - order: answerIds seçenek id'lerinin bir permütasyonu.
 * - tapcount: answerIds[0] sayı; seçenek yoksa üretilir.
 * - trace: karakterin yolu `letterPaths.ts`'de var.
 */
export function normalizeExercise(ex: Exercise): Exercise | null {
  if (!ex || typeof ex.prompt?.say !== "string" || !ex.prompt.say.trim())
    return null;
  const answer = ex.answerIds?.[0];
  if (answer === undefined) return null;
  const choices = ex.choices ?? [];
  switch (ex.kind) {
    case "choice": {
      if (choices.length < 2 || !choices.some((c) => c.id === answer)) return null;
      if (new Set(choices.map((c) => c.id)).size !== choices.length) return null;
      if (ex.bigTap && choices.length > 2) {
        const right = choices.find((c) => c.id === answer) as Choice;
        const wrong = choices.find((c) => c.id !== answer) as Choice;
        const firstIsRight = choices.indexOf(right) < choices.indexOf(wrong);
        return { ...ex, choices: firstIsRight ? [right, wrong] : [wrong, right] };
      }
      return ex;
    }
    case "order": {
      const ids = new Set(choices.map((c) => c.id));
      if (choices.length < 2 || ids.size !== choices.length) return null;
      if (
        ex.answerIds.length !== choices.length ||
        !ex.answerIds.every((id) => ids.has(id))
      )
        return null;
      if (new Set(ex.answerIds).size !== ex.answerIds.length) return null;
      return ex;
    }
    case "tapcount": {
      const n = Number(answer);
      if (!Number.isInteger(n) || n < 0 || n > 30) return null;
      if (choices.length >= 2 && choices.some((c) => c.id === answer)) return ex;
      return { ...ex, choices: countChoices(n) };
    }
    case "trace": {
      const char = ex.trace?.char ?? answer;
      if (!getLetterPath(char)) return null;
      return { ...ex, trace: { char }, answerIds: [char] };
    }
    default:
      return null;
  }
}

export function generateSafe(
  gen: Generator,
  rng: Rng,
  level: SkillLevel,
): Exercise | null {
  try {
    const ex = gen.generate(rng, clampLevel(level, gen));
    return normalizeExercise(ex);
  } catch (err) {
    console.warn("exercise generator", gen.skill, err);
    return null;
  }
}

function signature(ex: Exercise): string {
  return `${ex.skill}|${ex.prompt.say}|${ex.answerIds.join(",")}`;
}

/** Aynı sette aynı soru tekrar gelmesin diye birkaç kez dener. */
function draw(
  gen: Generator,
  rng: Rng,
  level: SkillLevel,
  seen: Set<string>,
): Exercise | null {
  let last: Exercise | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const ex = generateSafe(gen, rng, level);
    if (!ex) continue;
    last = ex;
    if (!seen.has(signature(ex))) break;
  }
  if (last) seen.add(signature(last));
  return last;
}

/**
 * 6 maddelik set: [ısınma/odak, odak, tekrar, odak, komşu, odak].
 * Tekrar/komşu becerinin üreticisi yoksa ya da üretemezse odak beceriden doldurulur.
 * Odak becerinin üreticisi yoksa boş dizi döner.
 */
export function buildSession(
  p: Progress,
  skill: SkillId,
  now: number,
  rng: Rng,
): PlannedItem[] {
  const gen = getGenerator(skill);
  if (!gen) return [];
  const plan = planSession(p, skill, now, hasGenerator);
  const focus = clampLevel(plan.focusLevel, gen);
  const warm = plan.warmUp ? clampLevel(plan.focusLevel - 1, gen) : focus;
  const seen = new Set<string>();

  const focusItem = (level: SkillLevel, review = false): PlannedItem | null => {
    const ex = draw(gen, rng, level, seen);
    return ex ? { ex, review } : null;
  };
  const otherItem = (other: SkillId | null, review: boolean): PlannedItem | null => {
    if (other === skill) return focusItem(focus, review);
    const g = other ? getGenerator(other) : undefined;
    if (other && g) {
      const ex = draw(g, rng, easier(p.skills[other]?.level ?? 1), seen);
      if (ex) return { ex, review };
    }
    return focusItem(focus);
  };

  const items = [
    focusItem(warm),
    focusItem(focus),
    otherItem(plan.reviewSkill, plan.reviewSkill !== null),
    focusItem(focus),
    otherItem(plan.adjacentSkill, false),
    focusItem(focus),
  ];
  return items.filter((i): i is PlannedItem => i !== null);
}

/** Bal kapısı: `pickForGate` ile tam 3 madde (üreticisi olmayan beceri atlanır). */
export function buildGate(
  p: Progress,
  skill: SkillId,
  now: number,
  rng: Rng,
): PlannedItem[] {
  const fallback = getGenerator(skill) ?? anyGenerator();
  if (!fallback) return [];
  const seen = new Set<string>();
  const out: PlannedItem[] = [];
  for (const pick of pickForGate(p, now, hasGenerator)) {
    const gen = getGenerator(pick.skill) ?? fallback;
    const level =
      gen.skill === pick.skill ? pick.level : (p.skills[gen.skill]?.level ?? 1);
    const ex = draw(gen, rng, level, seen) ?? draw(fallback, rng, 1, seen);
    if (!ex) continue;
    const s = p.skills[ex.skill];
    const due = s !== undefined && s.attempts > 0 && s.nextDueAt <= now;
    out.push({ ex, review: out.length === GATE_SIZE - 1 && due });
  }
  return out.slice(0, GATE_SIZE);
}

export function isCorrect(ex: Exercise, ids: readonly string[]): boolean {
  if (ex.kind === "order") {
    return (
      ids.length === ex.answerIds.length &&
      ex.answerIds.every((id, i) => ids[i] === id)
    );
  }
  return ids[0] !== undefined && ids[0] === ex.answerIds[0];
}

/** Cevap gösterildikten sonra okunacak satır (MASTER_PLAN §3.6-2). */
export function answerSay(ex: Exercise): string | null {
  const byId = (id: string) => ex.choices?.find((c) => c.id === id)?.say;
  switch (ex.kind) {
    case "choice":
      return byId(ex.answerIds[0] ?? "") ?? null;
    case "tapcount": {
      const id = ex.answerIds[0] ?? "";
      return byId(id) ?? numberWord(Number(id));
    }
    case "order":
      return (
        ex.answerIds
          .map((id) => byId(id) ?? "")
          .filter(Boolean)
          .join(", ") || null
      );
    default:
      return null;
  }
}

/**
 * İpucunda söndürülecek bir çeldirici: seçilmemiş olanlardan biri. En az bir
 * çeldirici görünür kalmalı (2 seçenekte söndürmek cevabı verirdi).
 */
export function pickFade(
  ex: Exercise,
  chosen: readonly string[],
  faded: readonly string[],
): string | null {
  if (ex.kind !== "choice" && ex.kind !== "tapcount") return null;
  const answer = ex.answerIds[0];
  const distractors = (ex.choices ?? []).filter(
    (c) => c.id !== answer && !faded.includes(c.id),
  );
  if (distractors.length < 2) return null;
  return distractors.find((c) => !chosen.includes(c.id))?.id ?? null;
}

/** Sona yeniden eklenen madde: seçenek sırası karıştırılır (yer ezberi olmasın). */
export function forRequeue(ex: Exercise, rng: Rng): Exercise {
  if ((ex.kind === "choice" || ex.kind === "order") && ex.choices) {
    return { ...ex, choices: shuffled(rng, ex.choices) };
  }
  return ex;
}
