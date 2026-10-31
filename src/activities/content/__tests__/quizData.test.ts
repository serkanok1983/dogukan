import { describe, expect, it } from "vitest";
import * as Q from "@/activities/data/quizData";
import type { QuizQuestion } from "@/activities/shared/QuizGame";

const pools = Object.entries(Q).filter(
  (entry): entry is [string, QuizQuestion[]] => Array.isArray(entry[1]),
);

/** MASTER_PLAN §6: çocuğa gösterilmeyecek lise düzeyi / hatalı içerik. */
const BANNED =
  /yüklem|eksen eğikliği|stoma|sera etkisi|para üstü|jilet|basamağ|basamak|gaz alışverişi|yoğunlaşma|fotosentez|yarımküre|embriyo/i;

describe("quizData havuzları", () => {
  it("havuzlar var; ölü havuzlar silindi", () => {
    expect(pools.length).toBeGreaterThan(20);
    const names = pools.map(([n]) => n);
    for (const dead of ["gezegenler", "hayvanlar", "harfTania", "desenTamamla", "siraBul"]) {
      expect(names).not.toContain(dead);
    }
  });

  for (const [name, pool] of pools) {
    it(`${name}: ≥ 4 madde, cevap seçeneklerde, tekrar eden seçenek yok`, () => {
      expect(pool.length).toBeGreaterThanOrEqual(4);
      for (const q of pool) {
        expect(q.prompt.trim().length).toBeGreaterThan(0);
        expect(q.options).toContain(q.answer);
        expect(new Set(q.options).size).toBe(q.options.length);
        const text = [q.prompt, q.answer, q.hint ?? "", q.explanation ?? "", ...q.options].join(" ");
        expect(text).not.toMatch(BANNED);
        expect(text).not.toMatch(/(^|\s)[<>](\s|$)/);
      }
    });
  }

  it("saat soruları doğru kadranı gösterir (🕐 = 1)", () => {
    const clocks: Record<string, string> = { "🕐": "1", "🕒": "3", "🕕": "6", "🕘": "9", "🕛": "12" };
    for (const q of Q.saatOgren) {
      if (q.emoji && clocks[q.emoji]) expect(q.answer).toBe(clocks[q.emoji]);
    }
  });

  it("şekil sorularında büyük görsel şeklin kendisi (⬛ yok)", () => {
    for (const q of Q.sekilTani) {
      expect(q.emoji).not.toBe("⬛");
      expect(q.prompt).not.toMatch(/[🔺⬜⚫]/u);
    }
  });
});
