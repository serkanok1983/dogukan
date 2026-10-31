import { beforeEach, describe, expect, it } from "vitest";
import { createRng } from "@/lib/rng";
import {
  _resetPraiseForTests,
  BANNED_WORDS,
  praise,
  praiseClip,
  PRAISE_LINES,
  wordCount,
  type PraiseContext,
} from "@/lib/praise";

const CONTEXTS = Object.keys(PRAISE_LINES) as PraiseContext[];

beforeEach(() => {
  _resetPraiseForTests(createRng(42));
});

describe("praise", () => {
  it("her bağlamda birden çok satır var; hepsi ≤ 7 kelime ve yasaklı kelimesiz", () => {
    for (const ctx of CONTEXTS) {
      const lines = PRAISE_LINES[ctx];
      expect(lines.length, ctx).toBeGreaterThanOrEqual(
        ctx === "new_star" || ctx === "persisted" || ctx === "chose_hard" ? 4 : 5,
      );
      for (const line of lines) {
        expect(wordCount(line), line).toBeLessThanOrEqual(7);
        expect(BANNED_WORDS.test(line), line).toBe(false);
        expect(line, line).not.toMatch(/harikaydın|süpersin/i);
      }
    }
  });

  it.each(CONTEXTS)(
    "%s: 200 çekiliş — son 3 içinde tekrar yok, ≤ 7 kelime, yasaklı yok",
    (ctx) => {
      const draws = Array.from({ length: 200 }, () => praise(ctx));
      draws.forEach((line, i) => {
        expect(draws.slice(Math.max(0, i - 3), i), `${ctx}#${i}`).not.toContain(
          line,
        );
        expect(wordCount(line)).toBeLessThanOrEqual(7);
        expect(BANNED_WORDS.test(line)).toBe(false);
      });
    },
  );

  it('"Harika" oturumda en fazla bir kez', () => {
    const all = CONTEXTS.flatMap((ctx) =>
      Array.from({ length: 200 }, () => praise(ctx)),
    );
    expect(all.filter((l) => /harika/i.test(l)).length).toBeLessThanOrEqual(1);
  });

  it("ad oturumda en fazla bir kez kullanılır ve satır yine ≤ 7 kelime", () => {
    const draws = CONTEXTS.flatMap((ctx) =>
      Array.from({ length: 200 }, () => praise(ctx, { name: "Doğukan" })),
    );
    const named = draws.filter((l) => l.includes("Doğukan"));
    expect(named.length).toBe(1);
    expect(wordCount(named[0] ?? "")).toBeLessThanOrEqual(7);
  });

  it("praiseClip satırı klip kimliğine çevirir", () => {
    expect(praiseClip("Dikkatle baktın!")).toBe("p-correct-first-1");
    expect(praiseClip("Gözlerin dinlendi. Hadi.")).toBe("p-break-done-1");
    expect(praiseClip("Doğukan, dikkatle baktın!")).toBeUndefined();
  });

  it("yasaklı kelime düzeni kelime başlarını yakalar", () => {
    for (const bad of [
      "Çok zekisin",
      "Akıllı çocuk",
      "En iyi sensin",
      "Mükemmel!",
      "Babanı geçtin",
      "Kaybettin",
      "Ders zamanı",
      "Ödev",
      "Yasak",
    ]) {
      expect(BANNED_WORDS.test(bad), bad).toBe(true);
    }
    for (const ok of ["Adres", "Gördersin", "Dikkatle baktın"]) {
      expect(BANNED_WORDS.test(ok), ok).toBe(false);
    }
  });
});
