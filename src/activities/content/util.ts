/**
 * Üreticiler için küçük, saf yardımcılar. Rastgelelik yalnızca dışarıdan
 * verilen `Rng` ile gelir; böylece aynı tohum aynı maddeyi üretir.
 */
import type { Choice } from "@/activities/engine/types";
import { shuffled, type Rng } from "@/lib/rng";
import type { SkillLevel } from "@/lib/skills";

/** L1 → 2, L2 → 3, L3+ → 4 seçenek (MASTER_PLAN §3.5). */
export function choiceCount(level: SkillLevel): number {
  return level <= 1 ? 2 : level === 2 ? 3 : 4;
}

/** Türkçe büyük harf: i → İ, ı → I (ortamdaki ICU'ya bağlı kalmadan). */
export function trUpper(s: string): string {
  let out = "";
  for (const ch of s) {
    out += ch === "i" ? "İ" : ch === "ı" ? "I" : ch.toUpperCase();
  }
  return out;
}

/** Diziden `n` farklı öğe seçer (dizi en az `n` öğe içermeli). */
export function sample<T>(rng: Rng, arr: readonly T[], n: number): T[] {
  if (arr.length < n) throw new Error(`sample: ${n} öğe istendi, ${arr.length} var`);
  return shuffled(rng, arr).slice(0, n);
}

/** `answer` ile birlikte yakın sayılardan oluşan, karışık `count` seçenek. */
export function numberChoices(
  rng: Rng,
  answer: number,
  count: number,
  min: number,
  max: number,
): number[] {
  const near: number[] = [];
  for (let d = 1; d <= max - min && near.length < 6; d++) {
    if (answer - d >= min) near.push(answer - d);
    if (answer + d <= max) near.push(answer + d);
  }
  if (near.length < count - 1) throw new Error("numberChoices: aralık çok dar");
  const pool = shuffled(rng, near.slice(0, Math.max(4, count - 1)));
  return shuffled(rng, [answer, ...pool.slice(0, count - 1)]);
}

export function numberChoice(n: number): Choice {
  return { id: String(n), text: String(n), say: String(n) };
}
