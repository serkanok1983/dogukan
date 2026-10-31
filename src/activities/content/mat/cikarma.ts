/**
 * `mat.cikarma` — onluk çerçevede bazı noktalar üstü çizili: "5 eksi 2 kaç kalır?"
 * L1: 5'e kadar · L2: 10'a kadar · L3: 20'ye kadar (çıkan ≤ 10).
 */
import type { Exercise, Generator } from "@/activities/engine/types";
import { randInt } from "@/lib/rng";
import type { SkillLevel } from "@/lib/skills";
import { choiceCount, numberChoice, numberChoices } from "../util";

const SKILL = "mat.cikarma" as const;

const START_RANGE: Record<1 | 2 | 3, [number, number]> = { 1: [2, 5], 2: [6, 10], 3: [11, 20] };

export const cikarma: Generator = {
  skill: SKILL,
  maxLevel: 3,
  generate(rng, requested) {
    const level = (requested >= 3 ? 3 : requested) as 1 | 2 | 3;
    const [lo, hi] = START_RANGE[level];
    const a = randInt(rng, lo, hi);
    const b = randInt(rng, 1, Math.min(10, a - 1));
    const rest = a - b;
    const exercise: Exercise = {
      id: `${SKILL}:${level}:${a}-${b}`,
      skill: SKILL,
      level: level as SkillLevel,
      kind: "choice",
      prompt: {
        say: `${a} eksi ${b} kaç kalır?`,
        text: `${a} − ${b} = ?`,
        visual: { type: "tenframe", a, b, op: "-" },
        hintSay: `${a} noktadan ${b} tanesi gitti. Kalanları say.`,
      },
      choices: numberChoices(rng, rest, choiceCount(level), 0, hi).map(numberChoice),
      answerIds: [String(rest)],
      feedback: {
        retry: "Çizili olmayanları tek tek say.",
        reveal: `${a} eksi ${b}, ${rest} kalır.`,
      },
      ...(level === 1 ? { bigTap: true } : {}),
    };
    return exercise;
  },
};
