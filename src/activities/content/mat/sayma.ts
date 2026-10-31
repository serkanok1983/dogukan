/**
 * `mat.sayma` — nesneleri tek tek dokunarak say (TapCount).
 * L1: 1–5, beşli sıra · L2: 6–10, beşli sıra · L3: 11–20, onluk çerçeve.
 * `choices` sayı düğmeleridir (L1 2, L2 3, L3 4); cevap `String(n)`.
 */
import type { Exercise, Generator } from "@/activities/engine/types";
import { pick, randInt } from "@/lib/rng";
import type { SkillLevel } from "@/lib/skills";
import { choiceCount, numberChoice, numberChoices } from "../util";

const SKILL = "mat.sayma" as const;

export const COUNT_THINGS: readonly { emoji: string; name: string }[] = [
  { emoji: "🍎", name: "elma" },
  { emoji: "⭐", name: "yıldız" },
  { emoji: "🐶", name: "köpek" },
  { emoji: "🌸", name: "çiçek" },
  { emoji: "🎈", name: "balon" },
  { emoji: "🦋", name: "kelebek" },
  { emoji: "🍊", name: "portakal" },
  { emoji: "🐟", name: "balık" },
  { emoji: "🚗", name: "araba" },
  { emoji: "🐞", name: "uğur böceği" },
];

const RANGES: Record<1 | 2 | 3, [number, number]> = {
  1: [1, 5],
  2: [6, 10],
  3: [11, 20],
};

export const sayma: Generator = {
  skill: SKILL,
  maxLevel: 3,
  generate(rng, requested) {
    const level = (requested >= 3 ? 3 : requested) as 1 | 2 | 3;
    const [min, max] = RANGES[level];
    const n = randInt(rng, min, max);
    const thing = pick(rng, COUNT_THINGS);
    const exercise: Exercise = {
      id: `${SKILL}:${level}:${n}:${thing.name}`,
      skill: SKILL,
      level: level as SkillLevel,
      kind: "tapcount",
      prompt: {
        say: `Kaç ${thing.name} var? Tek tek dokunarak say.`,
        visual: {
          type: "count",
          emoji: thing.emoji,
          n,
          layout: level === 3 ? "tenframe" : "rows5",
        },
        hintSay:
          level === 3
            ? "Önce dolu onluğu say: on. Sonra devam et."
            : "Her birine bir kez dokun.",
      },
      choices: numberChoices(
        rng,
        n,
        choiceCount(level),
        Math.max(1, min - 2),
        Math.min(20, max + 2),
      ).map(numberChoice),
      answerIds: [String(n)],
      feedback: {
        retry: "Tek tek dokunarak bir daha say.",
        reveal: `Burada ${n} ${thing.name} var.`,
      },
      ...(level === 1 ? { bigTap: true } : {}),
    };
    return exercise;
  },
};
