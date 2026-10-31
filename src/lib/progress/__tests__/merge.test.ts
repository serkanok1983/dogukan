import { describe, expect, it } from "vitest";
import { createRng, pick, randInt, type Rng } from "@/lib/rng";
import { mergeProgress, reduceProgress } from "../reducers";
import { DAY_MS, dayKey, emptyProgress } from "../time";
import type { Progress, ProgressEvent, ProgressEventInput } from "../types";

const T0 = Date.UTC(2026, 10, 2, 9, 0);
const SLUGS = ["super-ayi", "flappy-bird", "sayma-oyunu", "harf-tanima", "renk-yaris"];

function randomEvent(rng: Rng, i: number, prefix: string): ProgressEvent {
  const at = T0 + randInt(rng, 0, 4) * DAY_MS + i * 1000;
  const slug = pick(rng, SLUGS);
  const options: ProgressEventInput[] = [
    { type: "app_open" },
    { type: "run_end", slug, score: randInt(rng, 0, 400), durationMs: 1000, level: randInt(rng, 1, 6) },
    { type: "level_complete", slug, level: randInt(rng, 1, 8) },
    {
      type: "exercise_item",
      slug,
      skill: pick(rng, ["tr.ses-harf", "mat.sayma"] as const),
      level: 1,
      firstTry: rng() > 0.4,
      correct: rng() > 0.2,
      review: rng() > 0.7,
      ms: 800,
    },
    { type: "exercise_set_end", slug, skill: "mat.sayma", correct: randInt(rng, 0, 6), total: 6, firstTry: 3, mode: "session" },
    { type: "capsule_end", topic: pick(rng, ["isik-ve-golge", "kalbim-ve-nefesim"]) },
    { type: "usage", day: dayKey(at), kind: pick(rng, ["arcade", "learning", "map"] as const), sec: 5, coplay: false, slug },
    { type: "topic_flag", slug: "miknatislar", favorite: rng() > 0.5 },
    { type: "break_done", breakId: "zipla", skippedByParent: false },
  ];
  return { ...pick(rng, options), id: `${prefix}${i}`, at } as ProgressEvent;
}

function build(seed: number, prefix: string): Progress {
  const rng = createRng(seed);
  let p = emptyProgress("dogukan", T0);
  const n = randInt(rng, 3, 40);
  for (let i = 0; i < n; i++) p = reduceProgress(p, randomEvent(rng, i, prefix));
  return p;
}

/** Diziler sıralanarak karşılaştırılır (CONTRACT §3.5). */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonical).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonical(v)]),
    );
  }
  return value;
}

describe("mergeProgress", () => {
  it("değişmelidir: merge(a, b) ≡ merge(b, a) (60 rastgele çift)", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const a = build(seed, "a");
      const b = build(seed + 1000, "b");
      expect(canonical(mergeProgress(a, b))).toEqual(canonical(mergeProgress(b, a)));
    }
  });

  it("idempotenttir: merge(a, a) ≡ a ve merge(merge(a, b), b) ≡ merge(a, b)", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const a = build(seed, "a");
      const b = build(seed + 2000, "b");
      expect(canonical(mergeProgress(a, a))).toEqual(canonical(a));
      const ab = mergeProgress(a, b);
      expect(canonical(mergeProgress(ab, b))).toEqual(canonical(ab));
    }
  });

  it("hiçbir cihaz yıldız ya da en iyi skor kaybetmez", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const a = build(seed, "a");
      const b = build(seed + 3000, "b");
      const m = mergeProgress(a, b);
      for (const [slug, s] of Object.entries(a.activities)) {
        expect(m.activities[slug]?.stars).toBeGreaterThanOrEqual(s.stars);
        expect(m.activities[slug]?.best).toBeGreaterThanOrEqual(s.best);
      }
    }
  });
});
