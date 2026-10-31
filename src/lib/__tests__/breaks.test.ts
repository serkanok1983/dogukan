import { describe, expect, it } from "vitest";
import { BREAKS, breakOrderForDay, getBreak, pickBreak } from "@/content/breaks";
import type { BreakId } from "@/lib/progress/types";

const IDS: BreakId[] = ["goz", "zipla", "gerin", "flamingo", "nefes", "su", "bul", "saril"];

function sentences(text: string): string[] {
  return text
    .split(/[.!?…]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

describe("Hareket Kartları", () => {
  it("8 kart, benzersiz ve BreakId kümesiyle aynı", () => {
    expect(BREAKS).toHaveLength(8);
    expect(new Set(BREAKS.map((b) => b.id))).toEqual(new Set(IDS));
  });

  it("her kartta ses, klip, ayı karesi, emoji ve başlık var; cümleler ≤ 14 kelime", () => {
    for (const b of BREAKS) {
      expect(b.say.length, b.id).toBeGreaterThan(0);
      expect(b.clip, b.id).toMatch(/^br-/);
      expect(b.bearFrame, b.id).toBeTruthy();
      expect(b.emoji && b.title, b.id).toBeTruthy();
      expect(b.count).toBeGreaterThanOrEqual(0);
      expect(b.count).toBeLessThanOrEqual(20);
      for (const s of sentences(b.say)) expect(s.split(/\s+/).length, `${b.id}: ${s}`).toBeLessThanOrEqual(14);
    }
  });

  it("ilk mola her zaman zipla", () => {
    expect(pickBreak({ day: "2026-11-02", takenToday: 0, firstEver: true, adultPresent: false })).toBe("zipla");
    expect(pickBreak({ day: "2026-11-02", takenToday: 3, firstEver: true, adultPresent: true })).toBe("zipla");
  });

  it("gün içinde tekrar yok; saril yalnızca yetişkin varken", () => {
    for (const day of ["2026-11-02", "2026-11-03", "2026-12-25"]) {
      const picks = Array.from({ length: 7 }, (_, i) => pickBreak({ day, takenToday: i, firstEver: false, adultPresent: false }));
      expect(new Set(picks).size, day).toBe(7);
      expect(picks).not.toContain("saril");
      const withAdult = Array.from({ length: 8 }, (_, i) => pickBreak({ day, takenToday: i, firstEver: false, adultPresent: true }));
      expect(new Set(withAdult).size).toBe(8);
    }
  });

  it("kurulum günü: ilk molanın zipla'sı o gün tekrar gelmez", () => {
    const day = "2026-11-02";
    const first = pickBreak({ day, takenToday: 0, firstEver: true, adultPresent: false, ziplaFirst: true });
    const rest = Array.from({ length: 6 }, (_, i) =>
      pickBreak({ day, takenToday: i + 1, firstEver: false, adultPresent: false, ziplaFirst: true }),
    );
    expect(first).toBe("zipla");
    expect(rest).not.toContain("zipla");
    expect(new Set(rest).size).toBe(6);
  });

  it("günün sırası kararlı", () => {
    expect(breakOrderForDay("2026-11-02")).toEqual(breakOrderForDay("2026-11-02"));
    expect(getBreak("su").id).toBe("su");
  });
});
