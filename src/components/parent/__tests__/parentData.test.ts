import { describe, expect, it } from "vitest";
import { emptyDay, emptyProgress } from "@/lib/progress/time";
import { SKILLS } from "@/lib/skills";
import { mebLine, pickTip, playsByDay, weekBars, weekVerdict } from "../parentData";

const TODAY = "2026-11-02";

function progress() {
  const p = emptyProgress("dogukan", 0);
  p.days[TODAY] = {
    ...emptyDay(),
    totalSec: 1200,
    learningSec: 420,
    capsuleSec: 60,
    arcadeSec: 720,
    breaksTaken: 1,
    opens: 1,
    bedtimeBlocks: 2,
    plays: { "super-ayi": { sec: 700, runs: 4, stars: 2 }, "harf-yazma": { sec: 400, runs: 1, stars: 1 } },
  };
  p.days["2026-10-30"] = { ...emptyDay(), totalSec: 600, learningSec: 0, arcadeSec: 600, opens: 1 };
  return p;
}

describe("parentData", () => {
  it("7 sütun, eskiden yeniye; öğrenme = öğrenme + kapsül", () => {
    const bars = weekBars(progress(), TODAY);
    expect(bars).toHaveLength(7);
    expect(bars[6]?.day).toBe(TODAY);
    expect(bars[6]?.learningSec).toBe(480);
    expect(bars.filter((b) => b.opened)).toHaveLength(2);
  });

  it("haftalık yargı: öğrenme payı ve hedef", () => {
    const v = weekVerdict(progress(), TODAY);
    expect(v.pct).toBe(27);
    expect(v.text).toBe("Öğrenme payı %27 — hedef %35");
    expect(v.ok).toBe(false);
    expect(weekVerdict(emptyProgress("dogukan", 0), TODAY).pct).toBeNull();
  });

  it("ne oynadı: güne göre, süreye göre sıralı, gece denemesi yalnızca sayı", () => {
    const days = playsByDay(progress(), TODAY);
    expect(days.map((d) => d.day)).toEqual([TODAY, "2026-10-30"]);
    expect(days[0]?.items.map((i) => i.slug)).toEqual(["super-ayi", "harf-yazma"]);
    expect(days[0]?.bedtimeBlocks).toBe(2);
    expect(Object.keys(days[0] ?? {})).not.toContain("at");
  });

  it("kazanım satırı kod uydurmaz; ipucu becerinin kendi ipucudur", () => {
    expect(mebLine("tr.ses-ayirt")).toBe(SKILLS["tr.ses-ayirt"].mebArea);
    const tip = pickTip({ learning: [], masteredThisWeek: [], struggling: ["tr.ses-ayirt"] });
    expect(tip?.tip).toBe(SKILLS["tr.ses-ayirt"].tip);
  });
});
