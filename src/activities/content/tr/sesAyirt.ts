/**
 * `tr.ses-ayirt` — "Hangisi aynı sesle başlıyor?" Hedef kelime sesli okunur,
 * resmi gösterilir; çocuk aynı ilk sesle başlayan resmi seçer. Harf yoktur.
 * L1: 1. grup, 2 resim · L2: 1–2. grup, 3 resim · L3: 3 resim, yarısı son ses.
 */
import type { Choice, Exercise, Generator } from "@/activities/engine/types";
import { pick, shuffled, type Rng } from "@/lib/rng";
import type { SkillLevel } from "@/lib/skills";
import { sample } from "../util";
import {
  GROUP1,
  GROUP12,
  firstSound,
  lastSound,
  wordsForSounds,
  type PictureWord,
} from "./words";

const SKILL = "tr.ses-ayirt" as const;

function toChoice(w: PictureWord): Choice {
  return { id: w.word, emoji: w.emoji, say: w.word };
}

function build(
  level: SkillLevel,
  mode: "start" | "end",
  target: PictureWord,
  answer: PictureWord,
  distractors: PictureWord[],
  rng: Rng,
): Exercise {
  const question =
    mode === "start"
      ? "Hangisi aynı sesle başlıyor?"
      : "Hangisi aynı sesle bitiyor?";
  return {
    id: `${SKILL}:${level}:${mode}:${target.word}:${answer.word}`,
    skill: SKILL,
    level,
    kind: "choice",
    prompt: {
      say: `${target.word}… ${target.word}. ${question}`,
      visual: { type: "picture", emoji: target.emoji, alt: target.word },
      hintSay: `${target.word}… ${target.word}. ${mode === "start" ? "İlk sesi dinle." : "Son sesi dinle."}`,
    },
    choices: shuffled(rng, [answer, ...distractors]).map(toChoice),
    answerIds: [answer.word],
    feedback: {
      retry:
        mode === "start"
          ? `${target.word}… İlk sesi dinle.`
          : `${target.word}… Son sesi dinle.`,
      reveal: `${target.word} ve ${answer.word} aynı sesle ${mode === "start" ? "başlıyor" : "bitiyor"}.`,
    },
    ...(level === 1 ? { bigTap: true } : {}),
  };
}

function startSound(
  rng: Rng,
  level: SkillLevel,
  sounds: readonly string[],
): Exercise {
  const n = level === 1 ? 2 : 3;
  const sound = pick(rng, sounds);
  const same = wordsForSounds([sound]);
  const [target, answer] = sample(rng, same, 2) as [PictureWord, PictureWord];
  // Çeldiriciler farklı seslerle başlar ve kendi aralarında da farklıdır.
  const otherSounds = sample(
    rng,
    sounds.filter((s) => s !== sound),
    n - 1,
  );
  const distractors = otherSounds.map((s) => pick(rng, wordsForSounds([s])));
  return build(level, "start", target, answer, distractors, rng);
}

/** Son ses: aynı son harfi paylaşan en az iki tek kelimelik resim gerekir. */
function endSound(rng: Rng, level: SkillLevel): Exercise {
  const pool = wordsForSounds(GROUP12).filter((w) => !w.word.includes(" "));
  const byEnd = new Map<string, PictureWord[]>();
  for (const w of pool) {
    const k = lastSound(w.word);
    byEnd.set(k, [...(byEnd.get(k) ?? []), w]);
  }
  const ends = [...byEnd.keys()].filter((k) => (byEnd.get(k)?.length ?? 0) >= 2);
  const end = pick(rng, ends);
  const [target, answer] = sample(rng, byEnd.get(end) ?? [], 2) as [
    PictureWord,
    PictureWord,
  ];
  const otherEnds = sample(
    rng,
    ends.filter((k) => k !== end),
    2,
  );
  // Çeldiriciler başka sesle biter ve hedefle aynı sesle başlamaz (karışıklık olmasın).
  const distractors = otherEnds.map((k) => {
    const options = (byEnd.get(k) ?? []).filter(
      (w) => firstSound(w.word) !== firstSound(target.word),
    );
    return pick(rng, options.length > 0 ? options : (byEnd.get(k) ?? []));
  });
  return build(level, "end", target, answer, distractors, rng);
}

export const sesAyirt: Generator = {
  skill: SKILL,
  maxLevel: 3,
  generate(rng, level) {
    if (level <= 1) return startSound(rng, 1, GROUP1);
    if (level === 2) return startSound(rng, 2, GROUP12);
    return rng() < 0.5 ? endSound(rng, 3) : startSound(rng, 3, GROUP12);
  },
};
