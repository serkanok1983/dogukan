import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  initialDgState,
  isTarget,
  phaseOf,
  reduceDg,
  type DgState,
} from "@/activities/shared/durGitLogic";
import { MENU } from "@/lib/menu";
import { createRng } from "@/lib/rng";
import { ACTIVITY_INFO } from "@/lib/worlds";
import { DEFAULT_THRESHOLDS, STAR_TABLE, starsForRun } from "../starRules";

const MENU_SLUGS = new Set(MENU.flatMap((c) => c.items.map((i) => i.slug)));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return name === "__tests__" ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

/** `useGameScore("slug")` ya da `useGameScore(GAME_SLUG)` + `GAME_SLUG = "slug"` çağıran slug'lar. */
function scoredSlugs(): string[] {
  const out = new Set<string>();
  for (const file of sourceFiles(join(process.cwd(), "src", "activities"))) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(
      /useGameScore\(\s*(?:"([a-z0-9-]+)"|([A-Z_]+))\s*\)/g,
    )) {
      const slug =
        m[1] ?? new RegExp(`${m[2]}\\s*=\\s*"([a-z0-9-]+)"`).exec(src)?.[1];
      expect(slug, `${file}: useGameScore slug'ı çözülemedi`).toBeDefined();
      if (slug) out.add(slug);
    }
  }
  return [...out].sort();
}

/** Kusursuz oyuncu: her hedefe `reactMs` sonra dokunur, hedef olmayana hiç dokunmaz. */
function perfectDurGit(seed: number, reactMs: number): number {
  const rng = createRng(seed);
  let s: DgState = reduceDg(initialDgState(), { type: "start" });
  const born = new Map<number, number>();
  while (s.status === "playing") {
    s = reduceDg(s, { type: "tick", dt: 100, rand: [rng(), rng(), rng(), rng()] });
    for (const c of s.creatures) if (!born.has(c.id)) born.set(c.id, s.elapsed);
    for (const c of [...s.creatures]) {
      const age = s.elapsed - (born.get(c.id) ?? 0);
      if (isTarget(c, phaseOf(s.elapsed)) && age >= reactMs)
        s = reduceDg(s, { type: "tap", id: c.id });
      else if (age >= c.durationMs) s = reduceDg(s, { type: "escape", id: c.id });
    }
  }
  return s.score;
}

describe("starsForRun", () => {
  it("Süper Ayı ulaşılan seviyeyle ölçülür (2/4/7), seviye yoksa puan yedeği", () => {
    expect(
      [1, 2, 3, 4, 6, 7, 9].map((level) =>
        starsForRun("super-ayi", { score: 0, level }),
      ),
    ).toEqual([0, 1, 1, 2, 2, 3, 3]);
    expect(starsForRun("super-ayi", { score: 4500 })).toBe(3);
    expect(starsForRun("super-ayi", { score: 499 })).toBe(0);
  });

  it("tablo eşikleri: flappy boru, köstebek, tetris", () => {
    expect(
      [2, 3, 8, 15].map((score) => starsForRun("flappy-bird", { score })),
    ).toEqual([0, 1, 2, 3]);
    expect(
      [79, 80, 180, 300].map((score) => starsForRun("kostebek-vur", { score })),
    ).toEqual([0, 1, 2, 3]);
    // Tetris: 3 / 10 / 20 satır ≈ 300 / 1000 / 3000 puan; seviye yok sayılır.
    expect(
      [299, 300, 1000, 3000].map((score) =>
        starsForRun("tetris", { score, level: 9 }),
      ),
    ).toEqual([0, 1, 2, 3]);
  });

  it("hafıza kartları: çift sayısı ya da bitirilen zorluk (1–3)", () => {
    expect(starsForRun("hafiza-kartlari", { score: 10 })).toBe(2);
    expect(starsForRun("hafiza-kartlari", { score: 0, level: 3 })).toBe(3);
  });

  it("tabloda olmayan slug varsayılan eşiklerle ölçülür", () => {
    expect(DEFAULT_THRESHOLDS).toEqual([1, 50, 200]);
    expect(
      [0, 1, 50, 200].map((score) => starsForRun("labirent", { score })),
    ).toEqual([0, 1, 2, 3]);
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

  it("STAR_TABLE anahtarları MENU slug'larıdır; submitFinal çağıran her slug tabloda", () => {
    for (const slug of Object.keys(STAR_TABLE))
      expect(MENU_SLUGS.has(slug), slug).toBe(true);
    const scored = scoredSlugs();
    expect(scored.length).toBeGreaterThanOrEqual(25);
    for (const slug of scored) {
      expect(MENU_SLUGS.has(slug), `${slug} MENU'de yok`).toBe(true);
      // Tabloda olmayan slug varsayılan [1, 50, 200] ile ölçülür; Dur-Git bu yüzden 1 ⭐'da takılıyordu.
      expect(STAR_TABLE[slug], `${slug} STAR_TABLE'da yok`).toBeDefined();
    }
  });

  it("Dur-Git: kusursuz oyunda 3 ⭐ çoğu koşuda ulaşılabilir, yarı dikkatli oyun 1–2 ⭐", () => {
    const runs = Array.from({ length: 120 }, (_, i) => perfectDurGit(i + 1, 400));
    const three = runs.filter(
      (score) => starsForRun("dur-git", { score }) === 3,
    ).length;
    expect(three / runs.length).toBeGreaterThan(0.6);
    expect(Math.max(...runs)).toBeLessThan(40); // eski varsayılan 2 ⭐ = 50 hiç ulaşılamaz
    const median = [...runs].sort((x, y) => x - y)[runs.length >> 1] ?? 0;
    expect(starsForRun("dur-git", { score: Math.floor(median / 2) })).toBe(1);
    expect(starsForRun("dur-git", { score: Math.floor(median * 0.7) })).toBe(2);
  });
});
