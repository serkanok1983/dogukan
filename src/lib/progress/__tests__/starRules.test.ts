import { describe, expect, it } from "vitest";
import { ACTIVITY_INFO } from "@/lib/worlds";
import { DEFAULT_THRESHOLDS, STAR_TABLE, starsForRun } from "../starRules";

describe("starsForRun", () => {
  it("Süper Ayı ulaşılan seviyeyle ölçülür (2/4/7), seviye yoksa puan yedeği", () => {
    expect([1, 2, 3, 4, 6, 7, 9].map((level) => starsForRun("super-ayi", { score: 0, level }))).toEqual([
      0, 1, 1, 2, 2, 3, 3,
    ]);
    expect(starsForRun("super-ayi", { score: 4500 })).toBe(3);
    expect(starsForRun("super-ayi", { score: 499 })).toBe(0);
  });

  it("tablo eşikleri: flappy boru, köstebek, tetris", () => {
    expect([2, 3, 8, 15].map((score) => starsForRun("flappy-bird", { score }))).toEqual([0, 1, 2, 3]);
    expect([79, 80, 180, 300].map((score) => starsForRun("kostebek-vur", { score }))).toEqual([0, 1, 2, 3]);
    // Tetris: 3 / 10 / 20 satır ≈ 300 / 1000 / 3000 puan; seviye yok sayılır.
    expect([299, 300, 1000, 3000].map((score) => starsForRun("tetris", { score, level: 9 }))).toEqual([
      0, 1, 2, 3,
    ]);
  });

  it("hafıza kartları: çift sayısı ya da bitirilen zorluk (1–3)", () => {
    expect(starsForRun("hafiza-kartlari", { score: 10 })).toBe(2);
    expect(starsForRun("hafiza-kartlari", { score: 0, level: 3 })).toBe(3);
  });

  it("tabloda olmayan slug varsayılan eşiklerle ölçülür", () => {
    expect(DEFAULT_THRESHOLDS).toEqual([1, 50, 200]);
    expect([0, 1, 50, 200].map((score) => starsForRun("labirent", { score }))).toEqual([0, 1, 2, 3]);
  });

  it("geçersiz sayılar 0 yıldız verir", () => {
    expect(starsForRun("flappy-bird", { score: Number.NaN })).toBe(0);
    expect(starsForRun("super-ayi", { score: 0, level: Number.NaN })).toBe(0);
  });

  it("tablodaki her slug gerçek ve eşikler artan", () => {
    for (const [slug, rule] of Object.entries(STAR_TABLE)) {
      expect(ACTIVITY_INFO[slug], slug).toBeDefined();
      expect(rule.t[0] < rule.t[1] && rule.t[1] < rule.t[2], slug).toBe(true);
    }
  });
});
