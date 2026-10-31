import { describe, expect, it } from "vitest";
import type { Exercise, Generator } from "@/activities/engine/types";
import { GENERATORS, getGenerator } from "@/activities/content";
import { BLANK } from "@/activities/content/mat/oruntu";
import {
  DECODABLE_WORDS,
  GROUP1,
  GROUP12,
  WORDS_BY_SOUND,
} from "@/activities/content/tr/words";
import { trUpper } from "@/activities/content/util";
import { createRng, seedFrom } from "@/lib/rng";
import type { SkillId, SkillLevel } from "@/lib/skills";

const DRAWS = 1000;
const BARE_CONSONANT = /^\s*[bcçdfgğhjklmnprsştvyz]\s*[.?!]?\s*$/i;
const METALANGUAGE =
  /(?<!\p{L})(yüklem|özne|basamak|ünsüz|ünlü|sıfat|zamir)(?!\p{L})/iu;

const EXPECTED_SKILLS: SkillId[] = [
  "tr.ses-ayirt",
  "tr.ses-harf",
  "tr.kelime",
  "tr.harf-yaz",
  "mat.sayma",
  "mat.toplama",
  "mat.cikarma",
  "mat.oruntu",
  "mat.sira",
  "hb.guvenli",
];

/** Seviyeye göre seçenek sayısı (kind "choice" / tapcount düğmeleri / order kartları). */
const CHOICE_COUNT: Partial<Record<SkillId, readonly [number, number, number]>> = {
  "tr.ses-ayirt": [2, 3, 3],
  "tr.ses-harf": [2, 3, 4],
  "tr.kelime": [2, 3, 4],
  "mat.sayma": [2, 3, 4],
  "mat.toplama": [2, 3, 4],
  "mat.cikarma": [2, 3, 4],
  "mat.oruntu": [2, 3, 4],
  "mat.sira": [3, 4, 5],
  "hb.guvenli": [2, 3, 4],
};

const LIMIT: readonly [number, number, number] = [5, 10, 20];

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const onlyLetters = (word: string, allowed: readonly string[]) =>
  [...word.replace(/\s/g, "")].every((ch) => allowed.includes(ch));

function draw(g: Generator, level: SkillLevel, seed: number): Exercise {
  return g.generate(createRng(seedFrom(`${g.skill}|${level}|${seed}`)), level);
}

function checkCommon(ex: Exercise, g: Generator, level: SkillLevel) {
  expect(ex.skill).toBe(g.skill);
  expect(ex.level).toBe(level);
  expect(ex.id.length).toBeGreaterThan(0);

  const spoken = [
    ex.prompt.say,
    ex.prompt.hintSay ?? "x",
    ex.feedback.retry,
    ex.feedback.reveal,
  ];
  for (const s of spoken) {
    expect(s.trim().length).toBeGreaterThan(0);
    expect(s).not.toMatch(BARE_CONSONANT);
    expect(s).not.toMatch(METALANGUAGE);
  }
  if (ex.feedback.correct !== undefined)
    expect(ex.feedback.correct.trim().length).toBeGreaterThan(0);
  expect(words(ex.feedback.retry)).toBeLessThanOrEqual(8);
  expect(words(ex.feedback.reveal)).toBeLessThanOrEqual(8);

  const choices = ex.choices ?? [];
  const ids = choices.map((c) => c.id);
  expect(new Set(ids).size).toBe(ids.length);
  const texts = choices.flatMap((c) => (c.text === undefined ? [] : [c.text]));
  const emojis = choices.flatMap((c) => (c.emoji === undefined ? [] : [c.emoji]));
  expect(new Set(texts).size).toBe(texts.length);
  expect(new Set(emojis).size).toBe(emojis.length);
  for (const c of choices) {
    expect(c.text !== undefined || c.emoji !== undefined).toBe(true);
    expect(c.say.trim().length).toBeGreaterThan(0);
    expect(c.say).not.toMatch(BARE_CONSONANT);
    expect(c.say).not.toMatch(METALANGUAGE);
  }

  const expectedCount = CHOICE_COUNT[g.skill]?.[level - 1];
  switch (ex.kind) {
    case "choice":
      expect(ex.answerIds).toHaveLength(1);
      expect(ids).toContain(ex.answerIds[0]);
      if (expectedCount !== undefined) expect(choices).toHaveLength(expectedCount);
      break;
    case "order":
      expect([...ex.answerIds].sort()).toEqual([...ids].sort());
      expect(ex.answerIds).not.toEqual(ids);
      if (expectedCount !== undefined) expect(choices).toHaveLength(expectedCount);
      break;
    case "tapcount":
      expect(ex.answerIds).toHaveLength(1);
      expect(ex.prompt.visual?.type).toBe("count");
      if (ex.prompt.visual?.type === "count")
        expect(ex.answerIds[0]).toBe(String(ex.prompt.visual.n));
      if (choices.length > 0) {
        expect(ids).toContain(ex.answerIds[0]);
        if (expectedCount !== undefined) expect(choices).toHaveLength(expectedCount);
      }
      break;
    case "trace":
      expect(ex.trace).toBeDefined();
      expect(ex.answerIds).toEqual([ex.trace?.char]);
      expect(choices).toHaveLength(0);
      break;
  }
}

function checkSpecific(ex: Exercise, level: SkillLevel) {
  const limit = LIMIT[level - 1] as number;
  const v = ex.prompt.visual;
  const answer = ex.answerIds[0] as string;
  switch (ex.skill) {
    case "mat.toplama": {
      expect(v?.type).toBe("tenframe");
      if (v?.type !== "tenframe") return;
      const sum = v.a + (v.b ?? 0);
      expect(v.op).toBe("+");
      expect(Number(answer)).toBe(sum);
      expect(sum).toBeLessThanOrEqual(limit);
      expect(v.a).toBeGreaterThanOrEqual(1);
      expect(v.b ?? 0).toBeGreaterThanOrEqual(1);
      for (const c of ex.choices ?? []) expect(Number(c.id)).toBeLessThanOrEqual(20);
      break;
    }
    case "mat.cikarma": {
      expect(v?.type).toBe("tenframe");
      if (v?.type !== "tenframe") return;
      expect(v.op).toBe("-");
      expect(v.a).toBeLessThanOrEqual(limit);
      expect(Number(answer)).toBe(v.a - (v.b ?? 0));
      expect(Number(answer)).toBeGreaterThanOrEqual(0);
      for (const c of ex.choices ?? [])
        expect(Number(c.id)).toBeGreaterThanOrEqual(0);
      break;
    }
    case "mat.sayma": {
      if (v?.type !== "count") throw new Error("sayma görseli count olmalı");
      expect(v.n).toBeGreaterThanOrEqual(1);
      expect(v.n).toBeLessThanOrEqual(limit);
      expect(v.layout).toBe(level === 3 ? "tenframe" : "rows5");
      if (level === 3) expect(v.n).toBeGreaterThanOrEqual(11);
      for (const c of ex.choices ?? []) expect(Number(c.id)).toBeLessThanOrEqual(20);
      break;
    }
    case "mat.sira": {
      const max = level === 3 ? 20 : 10;
      const nums = ex.answerIds.map(Number);
      expect(nums).toEqual([...nums].sort((a, b) => a - b));
      for (const n of nums) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(max);
      }
      break;
    }
    case "mat.oruntu": {
      if (v?.type !== "pattern") throw new Error("örüntü görseli pattern olmalı");
      expect(v.items[v.blankIndex]).toBe(BLANK);
      expect(v.items.filter((i) => i === BLANK)).toHaveLength(1);
      break;
    }
    case "tr.ses-harf": {
      expect(answer).not.toBe("ğ");
      const allowed = level === 1 ? GROUP1 : GROUP12;
      for (const c of ex.choices ?? []) {
        expect(allowed).toContain(c.id);
        expect(c.text === c.id || c.text === trUpper(c.id)).toBe(true);
      }
      if (v?.type !== "picture") throw new Error("ses-harf görseli resim olmalı");
      expect(v.alt.charAt(0)).toBe(answer);
      break;
    }
    case "tr.ses-ayirt": {
      if (v?.type !== "picture") throw new Error("ses-ayirt görseli resim olmalı");
      const target = v.alt;
      const end = ex.prompt.say.includes("bitiyor");
      if (end) expect(level).toBe(3);
      const key = (w: string) => (end ? w.charAt(w.length - 1) : w.charAt(0));
      expect(answer).not.toBe(target);
      expect(key(answer)).toBe(key(target));
      for (const c of ex.choices ?? []) {
        if (c.id !== answer) expect(key(c.id)).not.toBe(key(target));
      }
      if (level === 1) expect(GROUP1).toContain(target.charAt(0));
      break;
    }
    case "tr.kelime": {
      const allowed = level === 1 ? GROUP1 : GROUP12;
      for (const c of ex.choices ?? [])
        expect(onlyLetters(c.id, allowed)).toBe(true);
      // Hedef kelime yönergede söylenmez.
      expect(
        ex.prompt.say.toLocaleLowerCase("tr").split(/[\s.,?!…]+/),
      ).not.toContain(answer);
      break;
    }
    case "tr.harf-yaz": {
      const ch = ex.trace?.char ?? "";
      if (level === 3) {
        expect(GROUP12.map(trUpper)).toContain(ch);
      } else {
        expect((level === 1 ? GROUP1 : GROUP12) as readonly string[]).toContain(ch);
      }
      break;
    }
    default:
      break;
  }
}

describe("GENERATORS", () => {
  it("Faz 1 üreticilerinin hepsi kayıtlı ve maxLevel 3", () => {
    expect(Object.keys(GENERATORS).sort()).toEqual([...EXPECTED_SKILLS].sort());
    for (const skill of EXPECTED_SKILLS) {
      const g = getGenerator(skill);
      expect(g?.skill).toBe(skill);
      expect(g?.maxLevel).toBe(3);
    }
  });

  for (const skill of EXPECTED_SKILLS) {
    const g = GENERATORS[skill] as Generator;
    for (const level of [1, 2, 3] as SkillLevel[]) {
      it(`${skill} L${level}: ${DRAWS} tohumlu çekiliş`, () => {
        for (let seed = 0; seed < DRAWS; seed++) {
          const ex = draw(g, level, seed);
          checkCommon(ex, g, level);
          checkSpecific(ex, level);
        }
      });
    }

    it(`${skill}: aynı tohum aynı madde`, () => {
      for (const level of [1, 2, 3] as SkillLevel[]) {
        expect(draw(g, level, 7)).toEqual(draw(g, level, 7));
      }
    });
  }
});

describe("kelime bankası", () => {
  it("1–2. grubun her sesi için ≥ 6 resimli kelime, ilk harf doğru", () => {
    for (const sound of GROUP12) {
      const list = WORDS_BY_SOUND[sound] ?? [];
      expect(list.length, sound).toBeGreaterThanOrEqual(6);
      for (const w of list) {
        expect(w.word.charAt(0)).toBe(sound);
        expect(w.word).toBe(w.word.toLocaleLowerCase("tr"));
        expect(w.emoji.length).toBeGreaterThan(0);
      }
    }
  });

  it("Ğ ilk ses değil; resimler ve kelimeler benzersiz", () => {
    const all = Object.values(WORDS_BY_SOUND).flat();
    expect(all.some((w) => w.word.startsWith("ğ"))).toBe(false);
    expect(WORDS_BY_SOUND["ğ"]).toBeUndefined();
    expect(new Set(all.map((w) => w.emoji)).size).toBe(all.length);
    expect(new Set(all.map((w) => w.word)).size).toBe(all.length);
  });

  it("okunabilir kelimeler yalnızca öğrenilen harflerden", () => {
    for (const w of DECODABLE_WORDS) {
      expect(onlyLetters(w.word, w.group === 1 ? GROUP1 : GROUP12), w.word).toBe(
        true,
      );
    }
    expect(
      DECODABLE_WORDS.filter((w) => w.group === 1).length,
    ).toBeGreaterThanOrEqual(4);
    expect(new Set(DECODABLE_WORDS.map((w) => w.word)).size).toBe(
      DECODABLE_WORDS.length,
    );
    expect(new Set(DECODABLE_WORDS.map((w) => w.emoji)).size).toBe(
      DECODABLE_WORDS.length,
    );
  });
});
