/**
 * `tr.kelime` — resim ↔ küçük harfli kelime. Kelimeler yalnızca çocuğun
 * öğrendiği harflerden oluşur (L1: 1. grup, L2–L3: 1–2. grup). Hedef kelime
 * yönergede söylenmez; çocuk okuyarak bulur.
 * L1: resim → 2 kelime · L2: resim → 3 kelime · L3: 4 seçenek, yarısı yazı → resim.
 */
import type { Exercise, Generator } from "@/activities/engine/types";
import { pick, shuffled } from "@/lib/rng";
import type { SkillLevel } from "@/lib/skills";
import { choiceCount, sample } from "../util";
import { DECODABLE_WORDS } from "./words";

const SKILL = "tr.kelime" as const;

export const kelime: Generator = {
  skill: SKILL,
  maxLevel: 3,
  generate(rng, requested) {
    const level: SkillLevel = requested >= 3 ? 3 : requested;
    const pool = level === 1 ? DECODABLE_WORDS.filter((w) => w.group === 1) : DECODABLE_WORDS;
    const target = pick(rng, pool);
    const distractors = sample(
      rng,
      pool.filter((w) => w.word !== target.word),
      choiceCount(level) - 1,
    );
    const all = shuffled(rng, [target, ...distractors]);
    const reverse = level === 3 && rng() < 0.5;

    if (reverse) {
      const exercise: Exercise = {
        id: `${SKILL}:${level}:yazi:${target.word}`,
        skill: SKILL,
        level,
        kind: "choice",
        prompt: {
          say: "Yazıyı oku. Hangi resim?",
          text: target.word,
          hintSay: "Harfleri tek tek oku. Sonra birleştir.",
        },
        choices: all.map((w) => ({ id: w.word, emoji: w.emoji, say: w.word })),
        answerIds: [target.word],
        feedback: {
          retry: "Harfleri tek tek oku.",
          reveal: `Burada ${target.word} yazıyor.`,
        },
      };
      return exercise;
    }

    const exercise: Exercise = {
      id: `${SKILL}:${level}:resim:${target.word}`,
      skill: SKILL,
      level,
      kind: "choice",
      prompt: {
        say: "Bu resmin yazısını bul.",
        visual: { type: "picture", emoji: target.emoji, alt: "resim" },
        hintSay: "Resme bak. Harfleri tek tek oku.",
      },
      choices: all.map((w) => ({ id: w.word, text: w.word, say: w.word })),
      answerIds: [target.word],
      feedback: {
        retry: "Harfleri tek tek oku.",
        reveal: `Bu ${target.word}. Yazısı böyle.`,
      },
      ...(level === 1 ? { bigTap: true } : {}),
    };
    return exercise;
  },
};
