import { describe, expect, it } from "vitest";
import { isSkillId, lettersUpToGroup, SKILL_IDS, SKILLS, skillsByStrand, SOUND_GROUPS } from "@/lib/skills";

describe("skills", () => {
  it("37 benzersiz beceri, hepsi tanımlı", () => {
    expect(SKILL_IDS).toHaveLength(37);
    expect(new Set(SKILL_IDS).size).toBe(37);
    for (const id of SKILL_IDS) {
      const s = SKILLS[id];
      expect(s.id).toBe(id);
      expect(s.levels).toHaveLength(5);
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.mebArea.length).toBeGreaterThan(0);
      expect(s.mebCode).toBeUndefined(); // MASTER_PLAN K21: doğrulanmadan doldurulmaz
    }
  });

  it("önkoşullar var olan becerilere işaret eder ve graf asikliktir", () => {
    for (const id of SKILL_IDS) {
      for (const pre of SKILLS[id].prereq) {
        expect(isSkillId(pre.skill)).toBe(true);
        expect(pre.skill).not.toBe(id);
      }
    }
    const state = new Map<string, "visiting" | "done">();
    const visit = (id: (typeof SKILL_IDS)[number]): void => {
      if (state.get(id) === "done") return;
      if (state.get(id) === "visiting") throw new Error(`Döngü: ${id}`);
      state.set(id, "visiting");
      for (const pre of SKILLS[id].prereq) visit(pre.skill);
      state.set(id, "done");
    };
    expect(() => SKILL_IDS.forEach(visit)).not.toThrow();
  });

  it("ses grupları MEB sırasıyla, 29 harf", () => {
    expect(SOUND_GROUPS[0]).toEqual(["e", "l", "a", "k", "i", "n"]);
    expect(SOUND_GROUPS.flat()).toHaveLength(29);
    expect(lettersUpToGroup(2)).toHaveLength(12);
  });

  it("kollar", () => {
    expect(skillsByStrand("tr")).toHaveLength(8);
    expect(skillsByStrand("mat")).toHaveLength(16);
    expect(skillsByStrand("ef")).toHaveLength(6);
  });
});
