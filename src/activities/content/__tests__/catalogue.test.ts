import { describe, expect, it } from "vitest";
import { getActivityLearning } from "@/lib/activityLearning";
import { TALK_QUESTIONS } from "@/lib/activityTalk";
import { GUIDES } from "@/lib/guides";
import { MENU } from "@/lib/menu";

const menuSlugs = MENU.flatMap((c) => c.items.map((i) => i.slug)).sort();

describe("TALK_QUESTIONS (istemci kopyası)", () => {
  it("anahtarlar MENU slug'larıyla aynı (73)", () => {
    expect(Object.keys(TALK_QUESTIONS).sort()).toEqual(menuSlugs);
    expect(menuSlugs).toHaveLength(73);
  });

  it("değerler bilgi kataloğundaki talkQuestion ile birebir aynı", () => {
    for (const slug of menuSlugs) {
      expect(TALK_QUESTIONS[slug], slug).toBe(getActivityLearning(slug).talkQuestion);
    }
  });
});

describe("GUIDES.short", () => {
  it("her slug için ≤ 10 kelimelik tek sesli cümle; klavye talimatı yok", () => {
    for (const slug of menuSlugs) {
      const short = GUIDES[slug]?.short ?? "";
      expect(short.trim().length, slug).toBeGreaterThan(0);
      expect(short.trim().split(/\s+/).length, slug).toBeLessThanOrEqual(10);
      expect(short, slug).not.toMatch(/tuş|klavye|boşluk|shift|[←→↑↓]/i);
    }
  });
});
