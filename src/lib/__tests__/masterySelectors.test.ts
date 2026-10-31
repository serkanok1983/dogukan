import { describe, expect, it } from "vitest";
import {
  adjacentSkills,
  dueSkills,
  isUnlocked,
  pickForGate,
  planSession,
  summary,
  weakestSkills,
} from "@/lib/mastery";
import { DAY_MS, emptyProgress } from "@/lib/progress/time";
import type { Progress, SkillState } from "@/lib/progress/types";
import type { SkillId } from "@/lib/skills";

const NOW = 1_800_000_000_000;

function st(over: Partial<SkillState> = {}): SkillState {
  return {
    level: 1,
    streak: 0,
    misses: 0,
    attempts: 4,
    correct: 3,
    firstTryCorrect: 2,
    box: 1,
    lastAt: NOW - DAY_MS,
    nextDueAt: NOW + DAY_MS,
    ...over,
  };
}

function prog(skills: Progress["skills"]): Progress {
  return { ...emptyProgress("dogukan", NOW), skills };
}

describe("dueSkills", () => {
  it("zamanı gelmiş, çalışılmış Faz 1 becerileri; en eskisi önce", () => {
    const p = prog({
      "mat.sayma": st({ nextDueAt: NOW - 10 }),
      "tr.ses-harf": st({ nextDueAt: NOW - 1000 }),
      "mat.toplama": st({ nextDueAt: NOW + 1 }), // henüz değil
      "tr.hece": st({ nextDueAt: NOW - 5000 }), // Faz 1 değil
      "ef.refleks": st({ nextDueAt: NOW - 9000 }), // yalnız arcade
      "mat.oruntu": st({ nextDueAt: NOW - 9000, attempts: 0 }), // hiç çalışılmamış
    });
    expect(dueSkills(p, NOW)).toEqual(["tr.ses-harf", "mat.sayma"]);
  });

  it("boş ilerlemede boş", () => {
    expect(dueSkills(prog({}), NOW)).toEqual([]);
  });
});

describe("weakestSkills", () => {
  it("≥ 3 denemesi olanlar oran sırasıyla önce, sonra açık beceriler en düşük seviyeden", () => {
    const p = prog({
      "mat.sayma": st({ attempts: 10, firstTryCorrect: 8 }),
      "tr.ses-ayirt": st({ attempts: 10, firstTryCorrect: 3 }),
      "mat.oruntu": st({ attempts: 2, firstTryCorrect: 0 }), // < 3 deneme
    });
    const w = weakestSkills(p, 4);
    expect(w.slice(0, 2)).toEqual(["tr.ses-ayirt", "mat.sayma"]);
    expect(w).toHaveLength(4);
    expect(w).not.toContain("ef.refleks");
  });

  it("kilitli beceriler (önkoşul eksik) önerilmez; süzgeç uygulanır", () => {
    const p = prog({});
    const all = weakestSkills(p, 50);
    expect(all).not.toContain("mat.toplama"); // mat.sayma L2 gerekir
    expect(all).not.toContain("mat.cikarma"); // toplama kilitli
    expect(all).toContain("mat.sayma");
    const only: SkillId[] = ["mat.sayma", "tr.ses-ayirt"];
    expect(weakestSkills(p, 5, (id) => only.includes(id)).sort()).toEqual(
      [...only].sort(),
    );
    expect(weakestSkills(p, 0)).toEqual([]);
  });
});

describe("isUnlocked / adjacentSkills", () => {
  it("önkoşul zinciri", () => {
    expect(isUnlocked(prog({}), "mat.toplama")).toBe(false);
    expect(isUnlocked(prog({ "mat.sayma": st({ level: 2 }) }), "mat.toplama")).toBe(
      true,
    );
    expect(isUnlocked(prog({ "mat.sayma": st({ level: 2 }) }), "mat.cikarma")).toBe(
      true,
    );
    expect(adjacentSkills("mat.toplama").sort()).toEqual([
      "mat.cikarma",
      "mat.sayma",
    ]);
  });
});

describe("planSession", () => {
  it("yeni çocuk: L1, ısınma yok, tekrar yok, aynı koldan açık komşu", () => {
    const plan = planSession(prog({}), "mat.sayma", NOW);
    expect(plan).toEqual({
      focusLevel: 1,
      warmUp: false,
      reviewSkill: null,
      adjacentSkill: "mat.sira",
    });
  });

  it("seri 0 ve L > 1 → ısınma; seri > 0 → ısınma yok", () => {
    expect(
      planSession(
        prog({ "mat.sayma": st({ level: 2, streak: 0 }) }),
        "mat.sayma",
        NOW,
      ).warmUp,
    ).toBe(true);
    expect(
      planSession(
        prog({ "mat.sayma": st({ level: 2, streak: 1 }) }),
        "mat.sayma",
        NOW,
      ).warmUp,
    ).toBe(false);
  });

  it("tekrar: başka zamanı gelmiş beceri önce; yalnızca odak gelmişse odak", () => {
    const p = prog({
      "mat.sayma": st({ level: 2, nextDueAt: NOW - 50 }),
      "tr.ses-harf": st({ nextDueAt: NOW - 10 }),
    });
    expect(planSession(p, "mat.sayma", NOW).reviewSkill).toBe("tr.ses-harf");
    const onlyFocus = prog({ "mat.sayma": st({ nextDueAt: NOW - 50 }) });
    expect(planSession(onlyFocus, "mat.sayma", NOW).reviewSkill).toBe("mat.sayma");
  });

  it("komşu: önce önkoşul grafından açık beceri, tekrar becerisinden farklı", () => {
    const unlocked = prog({ "mat.sayma": st({ level: 2 }) });
    expect(planSession(unlocked, "mat.sayma", NOW).adjacentSkill).toBe(
      "mat.toplama",
    );

    const p = prog({
      "mat.sayma": st({ level: 2 }),
      "mat.toplama": st({ nextDueAt: NOW - 1 }),
    });
    const plan = planSession(p, "mat.sayma", NOW);
    expect(plan.reviewSkill).toBe("mat.toplama");
    expect(plan.adjacentSkill).toBe("mat.sira"); // graf tükendi → aynı kol
  });

  it("süzgeç: üreticisi olmayan beceriler seçilmez", () => {
    const p = prog({ "tr.ses-harf": st({ nextDueAt: NOW - 10 }) });
    const plan = planSession(p, "mat.sayma", NOW, (id) => id === "mat.sayma");
    expect(plan.reviewSkill).toBeNull();
    expect(plan.adjacentSkill).toBeNull();
  });
});

describe("pickForGate", () => {
  it("tam 3 madde: zayıf ×2 kendi seviyesinde + güven maddesi bir seviye aşağıda", () => {
    const p = prog({
      "mat.sayma": st({ attempts: 10, firstTryCorrect: 2, level: 2 }),
      "tr.ses-ayirt": st({
        attempts: 10,
        firstTryCorrect: 9,
        level: 3,
        masteredAt: NOW - DAY_MS,
      }),
    });
    expect(pickForGate(p, NOW)).toEqual([
      { skill: "mat.sayma", level: 2 },
      { skill: "mat.sayma", level: 2 },
      { skill: "tr.ses-ayirt", level: 2 },
    ]);
  });

  it("güven becerisi yoksa zayıf beceri bir seviye aşağıda; boş ilerlemede de 3 madde", () => {
    const p = prog({
      "mat.sayma": st({ attempts: 10, firstTryCorrect: 2, level: 2 }),
    });
    expect(pickForGate(p, NOW)[2]).toEqual({ skill: "mat.sayma", level: 1 });
    const empty = pickForGate(prog({}), NOW);
    expect(empty).toHaveLength(3);
    expect(empty.every((i) => i.level === 1)).toBe(true);
  });

  it("süzgeç tüm maddeleri kapsar", () => {
    const p = prog({
      "hb.guvenli": st({ attempts: 10, firstTryCorrect: 0 }),
      "tr.ses-ayirt": st({ attempts: 10, firstTryCorrect: 9, level: 3 }),
    });
    const allowed: SkillId[] = ["mat.sayma", "tr.ses-ayirt"];
    const items = pickForGate(p, NOW, (id) => allowed.includes(id));
    expect(items).toHaveLength(3);
    expect(items.every((i) => allowed.includes(i.skill))).toBe(true);
  });
});

describe("summary", () => {
  it("öğreniyor (en son önce), bu hafta ustalaştı, zorlanıyor", () => {
    const p = prog({
      "mat.sayma": st({ lastAt: NOW - 100, attempts: 8, firstTryCorrect: 2 }),
      "tr.ses-ayirt": st({
        lastAt: NOW - 10,
        masteredAt: NOW - 2 * DAY_MS,
        attempts: 6,
        firstTryCorrect: 6,
      }),
      "tr.ses-harf": st({ masteredAt: NOW - 8 * DAY_MS }),
      "mat.oruntu": st({ attempts: 5, firstTryCorrect: 0 }), // < 6 deneme
      "mat.toplama": st({ attempts: 0 }),
    });
    const s = summary(p, NOW);
    expect(s.learning.map((l) => l.skill)).toEqual([
      "tr.ses-ayirt",
      "mat.sayma",
      "tr.ses-harf",
      "mat.oruntu",
    ]);
    expect(s.learning[1]).toEqual({ skill: "mat.sayma", level: 1, ratio: 0.25 });
    expect(s.masteredThisWeek).toEqual(["tr.ses-ayirt"]);
    expect(s.struggling).toEqual(["mat.sayma"]);
  });
});
