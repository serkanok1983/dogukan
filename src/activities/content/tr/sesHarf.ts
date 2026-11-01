/**
 * `tr.ses-harf` — resim + sesli kelime → ilk sesin harfine dokun.
 * L1: 1. grup, 2 harf · L2: 1–2. grup, 3 harf · L3: 1–2. grup, 4 harf, yarısı büyük harf.
 * Fonem kuralı: tek ünsüz asla söyletilmez (harf adı da); her zaman kelime:
 * "kedi… kedi hangi harfle başlıyor?", seçenek "kapı gibi başlayan harf".
 * Belirsizlik koruması: resmin başka adının (aka) ilk harfi çeldirici olmaz.
 */
import type { Choice, Exercise, Generator } from "@/activities/engine/types";
import { pick, shuffled } from "@/lib/rng";
import type { SkillLevel } from "@/lib/skills";
import { choiceCount, sample, trUpper } from "../util";
import {
  GROUP1,
  GROUP12,
  WORDS_BY_SOUND,
  firstSound,
  firstSounds,
  wordsForSounds,
} from "./words";

const SKILL = "tr.ses-harf" as const;

/** Harf seçeneğinin sesi: aynı sesle başlayan bir anahtar kelime (harf adı söylenmez). */
function letterChoice(letter: string, upper: boolean, avoidWord: string): Choice {
  const anchors = (WORDS_BY_SOUND[letter] ?? []).filter((w) => w.word !== avoidWord);
  const anchor = anchors[0]?.word ?? avoidWord;
  const shown = upper ? trUpper(letter) : letter;
  return { id: letter, text: shown, say: `${anchor} gibi başlayan harf` };
}

export const sesHarf: Generator = {
  skill: SKILL,
  maxLevel: 3,
  generate(rng, requested) {
    const level: SkillLevel = requested >= 3 ? 3 : requested;
    const letters = level === 1 ? GROUP1 : GROUP12;
    const target = pick(rng, wordsForSounds(letters));
    const letter = firstSound(target.word);
    const upper = level === 3 && rng() < 0.5;
    const named = firstSounds(target);
    const others = sample(
      rng,
      letters.filter((l) => l !== letter && l !== "ğ" && !named.includes(l)),
      choiceCount(level) - 1,
    );
    const exercise: Exercise = {
      id: `${SKILL}:${level}:${target.word}:${upper ? "U" : "l"}`,
      skill: SKILL,
      level,
      kind: "choice",
      prompt: {
        say: `${target.word}… ${target.word} hangi harfle başlıyor?`,
        visual: { type: "picture", emoji: target.emoji, alt: target.word },
        hintSay: `${target.word}… ${target.word}. İlk sesi dinle.`,
      },
      choices: shuffled(rng, [letter, ...others]).map((l) => letterChoice(l, upper, target.word)),
      answerIds: [letter],
      feedback: {
        retry: `${target.word}… Kelimeyi bir daha dinle.`,
        reveal: `${target.word} kelimesinin ilk harfi bu.`,
      },
      ...(level === 1 ? { bigTap: true } : {}),
    };
    return exercise;
  },
};
