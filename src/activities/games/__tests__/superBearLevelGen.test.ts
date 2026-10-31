import { describe, expect, it } from "vitest";
import { DEFAULT_EASE, buildProceduralLevel } from "../superBearLevelGen";

const wolves = (lv: ReturnType<typeof buildProceduralLevel>) =>
  lv.enemies.filter((e) => e.kind === "wolf").length;
const bees = (lv: ReturnType<typeof buildProceduralLevel>) =>
  lv.enemies.filter((e) => e.kind === "bee").length;
const maxSpeed = (lv: ReturnType<typeof buildProceduralLevel>) =>
  Math.max(...lv.enemies.map((e) => Math.abs(e.vx)));

describe("buildProceduralLevel(level, ease)", () => {
  it("aynı girdiyle deterministiktir", () => {
    for (const [level, ease] of [
      [1, 0.7],
      [12, 0.6],
      [50, 1],
    ] as const) {
      expect(buildProceduralLevel(level, ease)).toEqual(buildProceduralLevel(level, ease));
    }
  });

  it("varsayılan ease 0.7'dir", () => {
    expect(DEFAULT_EASE).toBe(0.7);
    expect(buildProceduralLevel(9)).toEqual(buildProceduralLevel(9, 0.7));
  });

  it("formül: nWolves = max(1, round((2 + L/7 + L/25) * ease)), nBees = round((1 + L/12 + L/40) * ease)", () => {
    for (const L of [1, 7, 20, 60, 100]) {
      for (const ease of [0.6, 0.7, 0.85, 1]) {
        const lv = buildProceduralLevel(L, ease);
        expect(wolves(lv)).toBe(Math.max(1, Math.round((2 + L / 7 + L / 25) * ease)));
        expect(bees(lv)).toBe(Math.round((1 + L / 12 + L / 40) * ease));
      }
    }
  });

  it("düşük ease daha az ve daha yavaş düşman üretir", () => {
    const easy = buildProceduralLevel(30, 0.6);
    const hard = buildProceduralLevel(30, 1);
    expect(wolves(easy)).toBeLessThan(wolves(hard));
    expect(bees(easy)).toBeLessThan(bees(hard));
    expect(easy.enemies.length).toBeLessThan(hard.enemies.length);
    expect(maxSpeed(easy)).toBeLessThan(maxSpeed(hard));
  });

  it("en kolay ayarda bile en az bir kurt vardır", () => {
    expect(wolves(buildProceduralLevel(1, 0.6))).toBeGreaterThanOrEqual(1);
  });

  it("ease platform düzenini değiştirmez ve 0.6–1.0'a sıkıştırılır", () => {
    expect(buildProceduralLevel(15, 0.6).plats).toEqual(buildProceduralLevel(15, 1).plats);
    expect(buildProceduralLevel(15, 0.2)).toEqual(buildProceduralLevel(15, 0.6));
    expect(buildProceduralLevel(15, 3)).toEqual(buildProceduralLevel(15, 1));
  });
});
