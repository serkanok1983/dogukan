/**
 * QuizGame'in konuşma biçimleri. Saf; React yok.
 *
 * - Yazılı soru metninden konuşma metni türetilir (emoji atılır, "+" → "artı",
 *   "TL" → "lira", "___" → "…"). Sorunun kendi `say`'i / `optionSay`'i varsa o kullanılır.
 * - Fonem kuralı (CONTRACT §8.1): TTS'e tek bir ünsüz asla söyletilmez (harf adını
 *   okur: "ke"). `safeSay` böyle bir satırı susturur; testler görünen havuzlarda hiç
 *   susturma olmadığını doğrular.
 */
import type { QuizQuestion } from "./QuizGame";

/** Cümlenin herhangi bir yerinde tek başına duran bir ünsüz. */
export const BARE_CONSONANT_TOKEN =
  /(^|[\s,.!?…;:"'“”()-])[bcçdfgğhjklmnprsştvyz](?=[\s,.!?…;:"'“”()-]|$)/iu;

const EMOJI =
  /[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}]/gu;

/** Yazılı metni konuşma metnine çevirir. */
export function toSpoken(text: string): string {
  return text
    .replace(EMOJI, " ")
    .replace(/(\d+)\s*TL\b/g, "$1 lira")
    .replace(/\bTL\b/g, "lira")
    .replace(/=\s*\?/g, " kaç eder?")
    .replace(/\s\+\s/g, " artı ")
    .replace(/\s[−-]\s/g, " eksi ")
    .replace(/_{2,}/g, "…")
    .replace(/[“”"]/g, "")
    .replace(/\s*[—→]\s*/g, ", ")
    .replace(/\s+([,.!?…])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Konuşulabilir değilse (boş ya da tek ünsüz içeriyor) null. */
export function safeSay(text: string | undefined | null): string | null {
  const t = text?.trim();
  if (!t || BARE_CONSONANT_TOKEN.test(t)) return null;
  return t;
}

export function questionSay(q: QuizQuestion): string | null {
  return safeSay(q.say ?? toSpoken(q.prompt));
}

export function optionSay(q: QuizQuestion, option: string): string | null {
  return safeSay(q.optionSay?.[option] ?? toSpoken(option));
}

export function hintSay(q: QuizQuestion): string | null {
  return q.hint ? safeSay(toSpoken(q.hint)) : null;
}

export function explainSay(q: QuizQuestion): string | null {
  return q.explanation ? safeSay(toSpoken(q.explanation)) : null;
}
