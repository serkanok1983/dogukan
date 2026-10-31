import { describe, expect, it } from "vitest";
import { applyExercise, emptySkill, LEITNER_DAYS } from "@/lib/mastery";
import { DAY_MS } from "@/lib/progress/time";
import type { SkillState } from "@/lib/progress/types";

const T = 1_000_000;
const ok = { firstTry: true, correct: true, review: false, at: T };

function run(s: SkillState | undefined, items: Partial<Parameters<typeof applyExercise>[1]>[]) {
  let cur = s;
  let last = { leveledUp: false, leveledDown: false };
  for (const it of items) {
    const r = applyExercise(cur, { level: cur?.level ?? 1, ...ok, ...it });
    cur = r.next;
    last = r;
  }
  return { s: cur as SkillState, ...last };
}

describe("applyExercise", () => {
  it("sayaçları her durumda artırır", () => {
    const { s } = run(undefined, [{ firstTry: false, correct: true }, { correct: false, firstTry: false }]);
    expect(s.attempts).toBe(2);
    expect(s.correct).toBe(1);
    expect(s.firstTryCorrect).toBe(0);
  });

  it("art arda 3 ilk-deneme doğrusu seviye atlatır", () => {
    const r = run(undefined, [{}, {}, {}]);
    expect(r.s.level).toBe(2);
    expect(r.s.streak).toBe(0);
    expect(r.leveledUp).toBe(true);
    expect(r.s.nextDueAt).toBe(T + DAY_MS);
  });

  it("tekrar denemede doğru seriyi sıfırlar ama yanlış sayılmaz", () => {
    const r = run(undefined, [{}, {}, { firstTry: false, correct: true }, {}]);
    expect(r.s.level).toBe(1);
    expect(r.s.streak).toBe(1);
    expect(r.s.misses).toBe(0);
  });

  it("art arda 2 yanlış seviye düşürür, 1'in altına inmez", () => {
    const up = run(undefined, [{}, {}, {}]).s;
    const down = run(up, [{ correct: false, firstTry: false }, { correct: false, firstTry: false }]);
    expect(down.s.level).toBe(1);
    expect(down.leveledDown).toBe(true);
    const floor = run(down.s, [{ correct: false, firstTry: false }, { correct: false, firstTry: false }]);
    expect(floor.s.level).toBe(1);
    expect(floor.leveledDown).toBe(false);
  });

  it("farklı seviyedeki madde seviyeyi oynatmaz", () => {
    const base = emptySkill(T);
    const r = applyExercise(base, { level: 2, ...ok });
    expect(r.next.level).toBe(1);
    expect(r.next.streak).toBe(0);
    expect(r.next.attempts).toBe(1);
  });

  it("L3'ten çıkış masteredAt yazar, L5'te durur", () => {
    let s: SkillState = { ...emptySkill(T), level: 3 };
    s = run(s, [{}, {}, {}]).s;
    expect(s.level).toBe(4);
    expect(s.masteredAt).toBe(T);
    s = run({ ...s, level: 5 }, [{}, {}, {}]).s;
    expect(s.level).toBe(5);
  });

  it("Leitner: doğru tekrar kutuyu artırır, yanlış sıfırlar", () => {
    let s = run(undefined, [{ review: true }]).s;
    expect(s.box).toBe(1);
    expect(s.nextDueAt).toBe(T + LEITNER_DAYS[1] * DAY_MS);
    s = run(s, [{ review: true }, { review: true }, { review: true }, { review: true }]).s;
    expect(s.box).toBe(4);
    s = run(s, [{ review: true, correct: false, firstTry: false }]).s;
    expect(s.box).toBe(0);
    expect(s.nextDueAt).toBe(T);
  });
});
