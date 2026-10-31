/**
 * `mat.toplama` — onluk çerçevede iki renk nokta: "3 artı 2 kaç eder?"
 * L1: toplam 2–5 · L2: toplam 6–10 · L3: toplam 11–20 (her terim ≤ 10).
 */
import type { Exercise, Generator } from "@/activities/engine/types";
import { randInt } from "@/lib/rng";
import type { SkillLevel } from "@/lib/skills";
import { choiceCount, numberChoice, numberChoices } from "../util";

const SKILL = "mat.toplama" as const;

const SUM_RANGE: Record<1 | 2 | 3, [number, number]> = {
  1: [2, 5],
  2: [6, 10],
  3: [11, 20],
};
const MAX_SUM: Record<1 | 2 | 3, number> = { 1: 5, 2: 10, 3: 20 };

export const toplama: Generator = {
  skill: SKILL,
  maxLevel: 3,
  generate(rng, requested) {
    const level = (requested >= 3 ? 3 : requested) as 1 | 2 | 3;
    const [lo, hi] = SUM_RANGE[level];
    const sum = randInt(rng, lo, hi);
    // a ve b 1..10 arasında; onluk çerçeveye sığsın.
    const aMin = Math.max(1, sum - 10);
    const aMax = Math.min(10, sum - 1);
    const a = randInt(rng, aMin, aMax);
    const b = sum - a;
    const exercise: Exercise = {
      id: `${SKILL}:${level}:${a}+${b}`,
      skill: SKILL,
      level: level as SkillLevel,
      kind: "choice",
      prompt: {
        say: `${a} artı ${b} kaç eder?`,
        text: `${a} + ${b} = ?`,
        visual: { type: "tenframe", a, b, op: "+" },
        hintSay: `Önce ${a} nokta, sonra ${b} nokta. Hepsini say.`,
      },
      choices: numberChoices(
        rng,
        sum,
        choiceCount(level),
        1,
        Math.min(20, MAX_SUM[level] + 2),
      ).map(numberChoice),
      answerIds: [String(sum)],
      feedback: {
        retry: "Noktaları tek tek say.",
        reveal: `${a} artı ${b}, ${sum} eder.`,
      },
      ...(level === 1 ? { bigTap: true } : {}),
    };
    return exercise;
  },
};
