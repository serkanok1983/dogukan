import { describe, expect, it, vi } from "vitest";
import type { Exercise, Generator } from "@/activities/engine/types";
import type { SkillId, SkillLevel } from "@/lib/skills";

function gen(skill: SkillId, maxLevel: SkillLevel = 3): Generator {
  let n = 0;
  return {
    skill,
    maxLevel,
    generate(_rng, level): Exercise {
      n += 1;
      return {
        id: `${skill}-${n}`,
        skill,
        level,
        kind: "choice",
        prompt: { say: `${skill} ${n}` },
        choices: [
          { id: "a", text: "a", say: "a" },
          { id: "b", text: "b", say: "b" },
          { id: "c", text: "c", say: "c" },
        ],
        answerIds: ["a"],
        feedback: { retry: "r", reveal: "v" },
      };
    },
  };
}

vi.mock("@/activities/content", () => {
  const GENERATORS: Partial<Record<SkillId, Generator>> = {
    "mat.sayma": gen("mat.sayma"),
    "mat.toplama": gen("mat.toplama"),
    "tr.ses-ayirt": gen("tr.ses-ayirt"),
  };
  return { GENERATORS, getGenerator: (s: SkillId) => GENERATORS[s] };
});

import { buildGate, buildSession, isCorrect, normalizeExercise, pickFade, readoutChoices } from "@/activities/engine/plan";
import { DAY_MS, emptyProgress } from "@/lib/progress/time";
import type { Progress, SkillState } from "@/lib/progress/types";
import { createRng } from "@/lib/rng";

const NOW = 1_800_000_000_000;

function state(over: Partial<SkillState>): SkillState {
  return {
    level: 1,
    streak: 0,
    misses: 0,
    attempts: 5,
    correct: 4,
    firstTryCorrect: 3,
    box: 1,
    lastAt: NOW - DAY_MS,
    nextDueAt: NOW + DAY_MS,
    ...over,
  };
}

function progress(skills: Progress["skills"]): Progress {
  return { ...emptyProgress("dogukan", NOW), skills };
}

describe("buildSession", () => {
  it("6 madde: ısınma, odak, tekrar (review), odak, komşu, odak", () => {
    const p = progress({
      "mat.sayma": state({ level: 3, streak: 0 }),
      "tr.ses-ayirt": state({ nextDueAt: NOW - 1 }),
      "mat.toplama": state({ level: 2 }),
    });
    const items = buildSession(p, "mat.sayma", NOW, createRng(1));
    expect(items).toHaveLength(6);
    expect(items.map((i) => i.ex.skill)).toEqual([
      "mat.sayma",
      "mat.sayma",
      "tr.ses-ayirt",
      "mat.sayma",
      "mat.toplama",
      "mat.sayma",
    ]);
    expect(items[0]?.ex.level).toBe(2); // ısınma bir seviye aşağıda
    expect(items[1]?.ex.level).toBe(3);
    expect(items.map((i) => i.review)).toEqual([false, false, true, false, false, false]);
    expect(items[4]?.ex.level).toBe(1); // komşu bir seviye aşağıda (L2 → L1)
  });

  it("tekrar/komşu üreticisi yoksa odaktan doldurur; seviye maxLevel'e kırpılır", () => {
    const p = progress({ "mat.sayma": state({ level: 5, streak: 1 }), "hb.guvenli": state({ nextDueAt: NOW - 1 }) });
    const items = buildSession(p, "mat.sayma", NOW, createRng(2));
    expect(items).toHaveLength(6);
    // toplama kilitli değil mi? sayma L5 ≥ 2 → açık; komşu toplama olur.
    expect(items.filter((i) => i.ex.skill === "mat.sayma").length).toBeGreaterThanOrEqual(5);
    expect(items.every((i) => i.ex.level <= 3)).toBe(true);
    expect(items.some((i) => i.review)).toBe(false);
  });

  it("üreticisi olmayan odak beceri → boş set", () => {
    expect(buildSession(progress({}), "tr.hece", NOW, createRng(3))).toEqual([]);
  });

  it("aynı sette aynı soru tekrar etmez", () => {
    const items = buildSession(progress({}), "mat.sayma", NOW, createRng(4));
    expect(new Set(items.map((i) => i.ex.prompt.say)).size).toBe(items.length);
  });
});

describe("buildGate", () => {
  it("tam 3 madde, yalnızca üreticisi olan becerilerden", () => {
    const p = progress({
      "mat.sayma": state({ attempts: 10, firstTryCorrect: 2, level: 2 }),
      "tr.ses-ayirt": state({ attempts: 10, firstTryCorrect: 9, level: 3 }),
      "hb.guvenli": state({ attempts: 10, firstTryCorrect: 0 }), // en zayıf ama üreticisi yok
    });
    const items = buildGate(p, "mat.toplama", NOW, createRng(5));
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.ex.skill)).toEqual(["mat.sayma", "mat.sayma", "tr.ses-ayirt"]);
    expect(items.map((i) => i.ex.level)).toEqual([2, 2, 2]);
  });
});

describe("normalizeExercise / isCorrect / pickFade", () => {
  const base = gen("mat.sayma").generate(createRng(1), 1);

  it("bigTap 4 seçeneği 2'ye indirir, cevap korunur", () => {
    const ex = normalizeExercise({
      ...base,
      bigTap: true,
      choices: [...(base.choices ?? []), { id: "d", say: "d" }],
    });
    expect(ex?.choices?.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("cevap seçeneklerde yoksa ya da say boşsa geçersiz", () => {
    expect(normalizeExercise({ ...base, answerIds: ["z"] })).toBeNull();
    expect(normalizeExercise({ ...base, prompt: { say: " " } })).toBeNull();
  });

  it("order: sıra tam eşleşmeli", () => {
    const ex = normalizeExercise({ ...base, kind: "order", answerIds: ["c", "a", "b"] });
    expect(ex).not.toBeNull();
    if (!ex) return;
    expect(isCorrect(ex, ["c", "a", "b"])).toBe(true);
    expect(isCorrect(ex, ["a", "c", "b"])).toBe(false);
  });

  it("trace: desteklenmeyen karakter geçersiz", () => {
    expect(normalizeExercise({ ...base, kind: "trace", answerIds: ["e"], trace: { char: "e" } })).not.toBeNull();
    expect(normalizeExercise({ ...base, kind: "trace", answerIds: ["ğ"], trace: { char: "ğ" } })).toBeNull();
  });

  it("ipucu bir çeldirici söndürür, ama son çeldiriciyi asla", () => {
    expect(pickFade(base, ["b"], [])).toBe("c");
    expect(pickFade(base, ["b"], ["c"])).toBeNull();
    const two = { ...base, choices: base.choices?.slice(0, 2) };
    expect(pickFade(two, ["b"], [])).toBeNull();
  });

  it("seçenekler sırayla okunur; söndürülen ve yazılı harf/kelime seçenekleri okunmaz", () => {
    expect(readoutChoices(base).map((c) => c.id)).toEqual(["a", "b", "c"]);
    expect(readoutChoices(base, ["c"]).map((c) => c.id)).toEqual(["a", "b"]);
    expect(readoutChoices({ ...base, skill: "tr.ses-harf" })).toEqual([]);
    expect(readoutChoices({ ...base, skill: "tr.kelime" })).toEqual([]);
    const pictures = {
      ...base,
      skill: "tr.kelime" as const,
      choices: [
        { id: "a", emoji: "🍎", say: "elma" },
        { id: "b", emoji: "🐱", say: "kedi" },
      ],
    };
    expect(readoutChoices(pictures)).toHaveLength(2);
    expect(readoutChoices({ ...base, kind: "order" })).toEqual([]);
  });
});
