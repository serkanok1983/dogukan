import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as Q from "@/activities/data/quizData";
import type { QuizQuestion } from "@/activities/shared/QuizGame";
import {
  BARE_CONSONANT_TOKEN,
  explainSay,
  hintSay,
  optionSay,
  questionSay,
  toSpoken,
} from "@/activities/shared/quizSpeech";
import { getActivityInfo } from "@/lib/worlds";

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

/** registry.tsx: slug → havuz adı (QuizGame kullanan etkinlikler). */
const registry = fs.readFileSync(path.join(process.cwd(), "src/activities/registry.tsx"), "utf8");
const quizSlugs = [...registry.matchAll(/<QuizGame slug="([a-z-]+)" questions=\{Q\.(\w+)\} \/>/g)].map(
  (m) => [m[1] as string, m[2] as string] as const,
);
const visible = quizSlugs.filter(([slug]) => !getActivityInfo(slug)?.hidden);
const EMOJI_ONLY = /^[\p{Extended_Pictographic}\u{FE0F}\u{200D}\s]+$/u;

describe("QuizGame konuşma biçimleri (görünen etkinlikler)", () => {
  it("registry her QuizGame'e slug verir; görünen ~20 etkinlik", () => {
    expect(registry).not.toMatch(/<QuizGame questions=/);
    expect(visible.length).toBeGreaterThanOrEqual(20);
    for (const [slug] of visible) expect(getActivityInfo(slug)?.skill, slug).toBeTruthy();
  });

  it("toSpoken: emoji atılır, + → artı, TL → lira, boşluk → …", () => {
    expect(toSpoken("1 TL + 1 TL kaç TL eder?")).toBe("1 lira artı 1 lira kaç lira eder?");
    expect(toSpoken("🔺🔺 kaç üçgen?")).toBe("kaç üçgen?");
    expect(toSpoken("3 + 2 = ?")).toBe("3 artı 2 kaç eder?");
    expect(toSpoken("Güneş gökyüzünde ___")).toBe("Güneş gökyüzünde…");
    expect(toSpoken("\"B\" sesli harf mi?")).toMatch(BARE_CONSONANT_TOKEN);
  });

  for (const [slug, pool] of visible) {
    it(`${slug}: soru, seçenekler, ipucu ve açıklama konuşulabilir; tek ünsüz yok`, () => {
      const questions = (Q as unknown as Record<string, QuizQuestion[]>)[pool] ?? [];
      expect(questions.length).toBeGreaterThanOrEqual(4);
      for (const q of questions) {
        expect(questionSay(q), q.prompt).toBeTruthy();
        for (const o of q.options) {
          if (EMOJI_ONLY.test(o)) expect(q.optionSay?.[o], `${q.prompt} / ${o}`).toBeTruthy();
          expect(optionSay(q, o), `${q.prompt} / ${o}`).toBeTruthy();
        }
        if (q.hint) expect(hintSay(q), q.hint).toBeTruthy();
        if (q.explanation) expect(explainSay(q), q.explanation).toBeTruthy();
      }
    });
  }

  it("içerik düzeltmeleri: tek doğru cevap, beyaz kare yok, 2 TL madeni para yok, 6:00 = 🕕", () => {
    for (const q of Q.farkBul) {
      expect(q.options.filter((o) => ["🔴", "🟥", "❤️", "😺", "🐈"].includes(o))).toEqual([]);
    }
    for (const q of [...Q.sekilTani, ...Q.sekilSay]) {
      expect(`${q.emoji ?? ""}${q.prompt}`).not.toMatch(/⬜/u);
    }
    for (const q of Q.paraSay) {
      expect(`${q.prompt} ${q.options.join(" ")}`).not.toMatch(/(^|\D)2 TL \+|\+ 2 TL|ürün|ödeme|harca/);
    }
    expect(Q.heceBirlestir.map((q) => q.answer)).not.toContain("ata");
    expect(Q.bitkiBuyume.map((q) => q.prompt).join(" ")).not.toMatch(/neye bakar/);
    const six = Q.saatOgren.find((q) => q.answer === "6");
    expect(six?.emoji).toBe("🕕");
  });
});
