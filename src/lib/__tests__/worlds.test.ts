import { describe, expect, it } from "vitest";
import { ACTIVITY_MAP } from "@/activities/registry";
import { getActivityLearningPreviews } from "@/lib/activityLearning";
import { GUIDES } from "@/lib/guides";
import { MENU } from "@/lib/menu";
import { isSkillId } from "@/lib/skills";
import { ACTIVITY_INFO, activitiesInWorld, getWorld, WORLDS } from "@/lib/worlds";

const menuSlugs = MENU.flatMap((c) => c.items.map((i) => i.slug)).sort();

describe("worlds ve katalog eşliği", () => {
  it("73 etkinlik: MENU = ACTIVITY_INFO = ACTIVITY_MAP = GUIDES = bilgi kataloğu", () => {
    expect(menuSlugs).toHaveLength(73);
    expect(new Set(menuSlugs).size).toBe(73);
    expect(Object.keys(ACTIVITY_INFO).sort()).toEqual(menuSlugs);
    expect(Object.keys(ACTIVITY_MAP).sort()).toEqual(menuSlugs);
    expect(Object.keys(GUIDES).sort()).toEqual(menuSlugs);
    expect(Object.keys(getActivityLearningPreviews()).sort()).toEqual(menuSlugs);
  });

  it("her beceri geçerli, her ada tanımlı", () => {
    for (const info of Object.values(ACTIVITY_INFO)) {
      if (info.skill !== null) expect(isSkillId(info.skill)).toBe(true);
      expect(getWorld(info.world).id).toBe(info.world);
    }
  });

  it("adalar: 7 ada, yalnızca Baba ile kapılı", () => {
    expect(WORLDS.map((w) => w.id)).toEqual(["macera", "harf", "sayi", "sekil", "merak", "blok", "baba"]);
    expect(WORLDS.filter((w) => w.gated).map((w) => w.id)).toEqual(["baba"]);
  });

  it("gizlenenler haritada yok ama tabloda var (MASTER_PLAN K19)", () => {
    expect(activitiesInWorld("sayi")).not.toContain("hizli-matematik");
    expect(activitiesInWorld("sayi", { includeHidden: true })).toContain("hizli-matematik");
    expect(activitiesInWorld("macera")).toContain("super-ayi");
    expect(activitiesInWorld("baba")).toContain("dovus-arenasi");
  });

  it("6 amiral oyun ve yeni slug'lar", () => {
    const flagships = Object.entries(ACTIVITY_INFO).filter(([, i]) => i.flagship).map(([s]) => s).sort();
    expect(flagships).toEqual(
      ["balon-patlat", "flappy-bird", "hafiza-kartlari", "kosu-macera", "kostebek-vur", "super-ayi"].sort(),
    );
    const fresh = Object.entries(ACTIVITY_INFO).filter(([, i]) => i.isNew).map(([s]) => s).sort();
    expect(fresh).toEqual(["blok-dunyasi", "dur-git", "guvenli-yol", "ses-avi"]);
  });
});
