import { describe, expect, it } from "vitest";
import { getLetterPath, LETTER_PATHS, TRACE_CHARS } from "@/activities/engine/letterPaths";
import { checkStroke, resample } from "@/activities/engine/traceMath";

const LOWER = ["e", "l", "a", "k", "i", "n", "o", "m", "u", "t", "ü", "y"];
const UPPER = ["E", "L", "A", "K", "İ", "N", "O", "M", "U", "T", "Ü", "Y"];
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

describe("letterPaths", () => {
  it("1–2. ses grubu küçük/büyük harfleri ve 0–9 rakamları var", () => {
    for (const c of [...LOWER, ...UPPER, ...DIGITS]) {
      expect(TRACE_CHARS, c).toContain(c);
      expect(getLetterPath(c)?.length, c).toBeGreaterThan(0);
    }
  });

  it("tüm noktalar 0–100 kutusunda", () => {
    for (const [c, strokes] of Object.entries(LETTER_PATHS)) {
      for (const s of strokes) {
        expect(s.length, c).toBeGreaterThan(0);
        for (const [x, y] of s) {
          expect(x >= 0 && x <= 100 && y >= 0 && y <= 100, `${c} ${x},${y}`).toBe(true);
        }
      }
    }
  });
});

describe("checkStroke", () => {
  const line = [
    [50, 12],
    [50, 82],
  ] as const;

  it("yolu izleyen çizim geçer", () => {
    const drawn = resample(line, 3).map(([x, y]) => [x + 4, y] as const);
    expect(checkStroke(line, drawn)).toBe(true);
  });

  it("ters yönde çizim geçmez", () => {
    expect(checkStroke(line, resample([...line].reverse(), 3))).toBe(false);
  });

  it("uzaktan geçen çizim geçmez", () => {
    const far = resample(line, 3).map(([x, y]) => [x + 30, y] as const);
    expect(checkStroke(line, far)).toBe(false);
  });

  it("kısa karalama geçmez", () => {
    expect(
      checkStroke(line, [
        [50, 12],
        [50, 25],
      ]),
    ).toBe(false);
  });

  it("nokta vuruşu: yakına dokunmak yeter", () => {
    expect(checkStroke([[50, 27]], [[53, 30]])).toBe(true);
    expect(checkStroke([[50, 27]], [[80, 80]])).toBe(false);
  });

  it("kapalı yol (o) yönü sormadan geçer", () => {
    const o = getLetterPath("o")?.[0];
    expect(o).toBeDefined();
    if (!o) return;
    expect(checkStroke(o, resample(o, 3))).toBe(true);
  });
});
