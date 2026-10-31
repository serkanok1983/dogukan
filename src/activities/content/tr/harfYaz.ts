/**
 * `tr.harf-yaz` — harfi parmakla çiz (TraceCanvas). Sıra ses gruplarını izler,
 * alfabeyi değil. L1: 1. grup küçük · L2: 1–2. grup küçük · L3: 1–2. grup büyük.
 * Harf her zaman bir kelimeyle anılır ("elma… elma kelimesinin ilk harfini çiz").
 */
import type { Exercise, Generator } from "@/activities/engine/types";
import { pick } from "@/lib/rng";
import type { SkillLevel } from "@/lib/skills";
import { trUpper } from "../util";
import { GROUP1, GROUP12, WORDS_BY_SOUND } from "./words";

const SKILL = "tr.harf-yaz" as const;

export const harfYaz: Generator = {
  skill: SKILL,
  maxLevel: 3,
  generate(rng, requested) {
    const level: SkillLevel = requested >= 3 ? 3 : requested;
    const letter = pick(rng, level === 1 ? GROUP1 : GROUP12);
    const upper = level === 3;
    const char = upper ? trUpper(letter) : letter;
    const word = pick(
      rng,
      WORDS_BY_SOUND[letter] ?? [{ word: letter, emoji: "" }],
    ).word;
    const exercise: Exercise = {
      id: `${SKILL}:${level}:${char}`,
      skill: SKILL,
      level,
      kind: "trace",
      prompt: {
        say: upper
          ? `${word}… ${word} kelimesinin ilk harfini büyük çiz.`
          : `${word}… ${word} kelimesinin ilk harfini çiz.`,
        visual: { type: "letter", char, case: upper ? "upper" : "lower" },
        hintSay: "İlk noktadan başla. Yavaşça çiz.",
      },
      answerIds: [char],
      trace: { char },
      feedback: {
        retry: "Noktadan başla, yavaşça çiz.",
        reveal: "Beni izle, birlikte çizelim.",
      },
    };
    return exercise;
  },
};
