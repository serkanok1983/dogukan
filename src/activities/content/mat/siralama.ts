/**
 * `mat.sira` — sayı kartlarını küçükten büyüğe sırala (OrderStrip).
 * L1: 3 kart, 1–10 · L2: 4 kart, 1–10 · L3: 5 kart, 1–20.
 * `answerIds` doğru sıradır; `choices` karışık gelir (asla zaten sıralı değil).
 */
import type { Exercise, Generator } from "@/activities/engine/types";
import { shuffled } from "@/lib/rng";
import type { SkillLevel } from "@/lib/skills";
import { numberChoice, sample } from "../util";

const SKILL = "mat.sira" as const;

const SETUP: Record<1 | 2 | 3, { cards: number; max: number }> = {
  1: { cards: 3, max: 10 },
  2: { cards: 4, max: 10 },
  3: { cards: 5, max: 20 },
};

export const siralama: Generator = {
  skill: SKILL,
  maxLevel: 3,
  generate(rng, requested) {
    const level = (requested >= 3 ? 3 : requested) as 1 | 2 | 3;
    const { cards, max } = SETUP[level];
    const all = Array.from({ length: max }, (_, i) => i + 1);
    const nums = sample(rng, all, cards);
    const sorted = [...nums].sort((x, y) => x - y);
    let order = shuffled(rng, nums);
    // Kartlar zaten sıralı gelmesin: sıralıysa ilk ikisini değiştir.
    if (order.every((n, i) => n === sorted[i])) order = [order[1] as number, order[0] as number, ...order.slice(2)];
    const exercise: Exercise = {
      id: `${SKILL}:${level}:${sorted.join("-")}`,
      skill: SKILL,
      level: level as SkillLevel,
      kind: "order",
      prompt: {
        say: "Sayıları küçükten büyüğe diz. En küçükle başla.",
        text: "küçük → büyük",
        hintSay: "En küçük sayı hangisi? Önce onu bul.",
      },
      choices: order.map(numberChoice),
      answerIds: sorted.map(String),
      feedback: {
        retry: "Önce en küçük sayıyı bul.",
        reveal: `Doğru sıra: ${sorted.join(", ")}.`,
      },
    };
    return exercise;
  },
};
