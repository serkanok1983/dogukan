/**
 * `mat.oruntu` — desen şeridinde boşluğa ne gelir?
 * L1: AB, 2 seçenek · L2: AABB veya ABC, 3 seçenek · L3: AAB/ABB/ABC veya büyüyen desen, 4 seçenek.
 * Boşluk `items[blankIndex]` içinde "❓" olarak durur.
 */
import type { Choice, Exercise, Generator } from "@/activities/engine/types";
import { pick, randInt, shuffled, type Rng } from "@/lib/rng";
import type { SkillLevel } from "@/lib/skills";
import { choiceCount, sample } from "../util";

const SKILL = "mat.oruntu" as const;
export const BLANK = "❓";

type Thing = { emoji: string; name: string };

const PALETTES: readonly (readonly Thing[])[] = [
  [
    { emoji: "🔴", name: "kırmızı" },
    { emoji: "🔵", name: "mavi" },
    { emoji: "🟢", name: "yeşil" },
    { emoji: "🟡", name: "sarı" },
    { emoji: "🟣", name: "mor" },
  ],
  [
    { emoji: "🐱", name: "kedi" },
    { emoji: "🐶", name: "köpek" },
    { emoji: "🐰", name: "tavşan" },
    { emoji: "🐸", name: "kurbağa" },
    { emoji: "🐻", name: "ayı" },
  ],
  [
    { emoji: "🍎", name: "elma" },
    { emoji: "🍌", name: "muz" },
    { emoji: "🍇", name: "üzüm" },
    { emoji: "🍊", name: "portakal" },
    { emoji: "🍓", name: "çilek" },
  ],
  [
    { emoji: "⭐", name: "yıldız" },
    { emoji: "🌙", name: "ay" },
    { emoji: "☀️", name: "güneş" },
    { emoji: "☁️", name: "bulut" },
    { emoji: "❤️", name: "kalp" },
  ],
];

/** Birim kalıpları: harfler birimdeki öğenin sırasıdır (0 = A, 1 = B, 2 = C). */
const UNITS: Record<string, number[]> = {
  AB: [0, 1],
  AABB: [0, 0, 1, 1],
  ABC: [0, 1, 2],
  AAB: [0, 0, 1],
  ABB: [0, 1, 1],
};

function repeating(rng: Rng, level: SkillLevel, unitName: string): Exercise {
  const unit = UNITS[unitName] ?? [0, 1];
  const distinct = Math.max(...unit) + 1;
  const n = choiceCount(level);
  const palette = pick(rng, PALETTES);
  const things = sample(rng, palette, Math.max(distinct, n));
  const length = Math.min(8, unit.length * 2 + 2);
  const blankIndex = level === 1 ? randInt(rng, length - 2, length - 1) : randInt(rng, unit.length, length - 1);
  const seq = Array.from({ length }, (_, i) => things[unit[i % unit.length] ?? 0] as Thing);
  const answer = seq[blankIndex] as Thing;
  const options = things.slice(0, n);
  const choices: Choice[] = shuffled(rng, options).map((t) => ({ id: t.emoji, emoji: t.emoji, say: t.name }));
  const heard = seq.slice(0, blankIndex).map((t) => t.name).join(", ");
  return {
    id: `${SKILL}:${level}:${unitName}:${seq.map((t) => t.emoji).join("")}:${blankIndex}`,
    skill: SKILL,
    level,
    kind: "choice",
    prompt: {
      say: level === 1 ? "Sırada hangisi var? Deseni tamamla." : "Desene bak. Boşluğa hangisi gelir?",
      visual: { type: "pattern", items: seq.map((t, i) => (i === blankIndex ? BLANK : t.emoji)), blankIndex },
      hintSay: `${heard}… sonra?`,
    },
    choices,
    answerIds: [answer.emoji],
    feedback: {
      retry: "Desene baştan bak, yüksek sesle söyle.",
      reveal: `Buraya ${answer.name} gelir.`,
    },
    ...(level === 1 ? { bigTap: true } : {}),
  };
}

/** Büyüyen desen: 1, 2, 3, ? tane (ya da 2, 3, 4, ?). */
function growing(rng: Rng, level: SkillLevel): Exercise {
  const thing = pick(rng, pick(rng, PALETTES));
  const start = randInt(rng, 1, 2);
  const counts = [start, start + 1, start + 2, start + 3];
  const answer = start + 3;
  const blankIndex = counts.length - 1;
  const optionCounts = shuffled(rng, [answer, answer - 1, answer + 1, answer - 2].slice(0, choiceCount(level)));
  const strip = (k: number) => thing.emoji.repeat(k);
  return {
    id: `${SKILL}:${level}:grow:${thing.emoji}:${start}`,
    skill: SKILL,
    level,
    kind: "choice",
    prompt: {
      say: "Desen büyüyor. Sırada kaç tane var?",
      visual: { type: "pattern", items: counts.map((k, i) => (i === blankIndex ? BLANK : strip(k))), blankIndex },
      hintSay: `${counts.slice(0, 3).join(", ")}… sonra?`,
    },
    choices: optionCounts.map((k) => ({ id: `n${k}`, text: strip(k), say: `${k} ${thing.name}` })),
    answerIds: [`n${answer}`],
    feedback: {
      retry: "Her kutuda kaç tane var, say.",
      reveal: `Her seferinde bir tane artıyor. ${answer} tane.`,
    },
  };
}

export const oruntu: Generator = {
  skill: SKILL,
  maxLevel: 3,
  generate(rng, requested) {
    const level: SkillLevel = requested >= 3 ? 3 : requested;
    if (level === 1) return repeating(rng, 1, "AB");
    if (level === 2) return repeating(rng, 2, rng() < 0.5 ? "AABB" : "ABC");
    if (rng() < 0.4) return growing(rng, 3);
    return repeating(rng, 3, pick(rng, ["AAB", "ABB", "ABC"]));
  },
};
