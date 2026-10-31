/**
 * Bütünlük testleri (S8, MASTER_PLAN §4.7). Katalog tabloları, ansiklopedi
 * verisi, PWA dosyaları ve CSS bölmesi birbirini tutmalı.
 */
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ACTIVITY_MAP } from "@/activities/registry";
import { GENERATORS } from "@/activities/content";
import type { Generator } from "@/activities/engine/types";
import { getActivityLearningPreviews } from "@/lib/activityLearning";
import { TOPICS } from "@/lib/encyclopedia";
import { GUIDES } from "@/lib/guides";
import { findActivity, MENU } from "@/lib/menu";
import { createRng } from "@/lib/rng";
import type { SkillLevel } from "@/lib/skills";
import { ACTIVITY_INFO } from "@/lib/worlds";

const ROOT = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const menuSlugs = MENU.flatMap((c) => c.items.map((i) => i.slug)).sort();

describe("katalog: MENU ↔ ACTIVITY_MAP ↔ GUIDES ↔ ACTIVITY_INFO ↔ bilgi kataloğu", () => {
  it("en az 73 benzersiz slug, hepsi tüm tablolarda (CONTRACT §0.4)", () => {
    expect(menuSlugs.length).toBeGreaterThanOrEqual(73);
    expect(new Set(menuSlugs).size).toBe(menuSlugs.length);
    expect(Object.keys(ACTIVITY_MAP).sort()).toEqual(menuSlugs);
    expect(Object.keys(GUIDES).sort()).toEqual(menuSlugs);
    expect(Object.keys(ACTIVITY_INFO).sort()).toEqual(menuSlugs);
    expect(Object.keys(getActivityLearningPreviews()).sort()).toEqual(menuSlugs);
  });

  it("her menü öğesinin adı ve emojisi var; slug'lar URL güvenli", () => {
    for (const item of MENU.flatMap((c) => c.items)) {
      expect(item.label.trim(), item.slug).not.toBe("");
      expect(item.emoji.trim(), item.slug).not.toBe("");
      expect(item.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("her ACTIVITY_MAP değeri bir bileşen (<Activity/> olarak çizilir)", () => {
    for (const [slug, Activity] of Object.entries(ACTIVITY_MAP)) {
      expect(typeof Activity, slug).toBe("function");
    }
  });

  it("bilgi kartlarının konuları TOPICS içinde", () => {
    const topics = new Set(TOPICS.map((t) => t.slug));
    for (const [slug, preview] of Object.entries(getActivityLearningPreviews())) {
      expect(topics.has(preview.relatedTopicSlug), slug).toBe(true);
    }
  });

  const talkFile = path.join(ROOT, "src/lib/activityTalk.ts");
  it.skipIf(!fs.existsSync(talkFile))(
    "TALK_QUESTIONS anahtarları = MENU slug'ları (S3)",
    async () => {
      const mod = (await import(/* @vite-ignore */ talkFile)) as {
        TALK_QUESTIONS?: Record<string, string>;
      };
      expect(mod.TALK_QUESTIONS).toBeTypeOf("object");
      expect(Object.keys(mod.TALK_QUESTIONS ?? {}).sort()).toEqual(menuSlugs);
      for (const [slug, q] of Object.entries(mod.TALK_QUESTIONS ?? {}))
        expect(q.trim(), slug).not.toBe("");
    },
  );
});

describe("ansiklopedi TOPICS", () => {
  it("slug'lar benzersiz", () => {
    const slugs = TOPICS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(TOPICS.map((t) => [t.slug, t] as const))(
    "%s: 3 geçerli soru, 2–3 https kaynak, bağlı etkinlikler var",
    (_slug, topic) => {
      expect(topic.quiz).toHaveLength(3);
      for (const q of topic.quiz) {
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(new Set(q.options).size).toBe(q.options.length);
      }
      expect(topic.sources.length).toBeGreaterThanOrEqual(2);
      expect(topic.sources.length).toBeLessThanOrEqual(3);
      for (const s of topic.sources) expect(s.url).toMatch(/^https:\/\//);
      for (const a of topic.relatedActivities)
        expect(findActivity(a.slug), a.slug).not.toBeNull();
      expect(Number.isNaN(Date.parse(topic.reviewedAt))).toBe(false);
    },
  );
});

describe("manifest() basePath", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function load(env: { base?: string; nodeEnv: string }) {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", env.base);
    vi.stubEnv("NODE_ENV", env.nodeEnv);
    vi.resetModules();
    const manifest = (await import("@/app/manifest")).default();
    const nextConfig = (await import("../../next.config")).default;
    return { manifest, basePath: nextConfig.basePath ?? "" };
  }

  it.each([
    { base: "/dogukan", nodeEnv: "production", expected: "/dogukan" },
    { base: "", nodeEnv: "production", expected: "" },
    { base: undefined, nodeEnv: "production", expected: "/dogukan" },
    { base: undefined, nodeEnv: "development", expected: "" },
  ])(
    "NEXT_PUBLIC_BASE_PATH=$base, NODE_ENV=$nodeEnv → '$expected'",
    async ({ base, nodeEnv, expected }) => {
      const { manifest, basePath } = await load({ base, nodeEnv });
      expect(basePath).toBe(expected); // next.config.ts ile aynı hesap
      expect(manifest.start_url).toBe(`${expected}/`);
      expect(manifest.scope).toBe(`${expected}/`);
      expect(manifest.id).toBe(`${expected}/`);
      expect(manifest.display).toBe("standalone");
      expect(manifest.icons?.length).toBeGreaterThanOrEqual(3);
      expect(manifest.icons?.some((i) => i.purpose === "maskable")).toBe(true);
      for (const icon of manifest.icons ?? []) {
        expect(icon.src.startsWith(`${expected}/icons/`)).toBe(true);
        const file = path.join(ROOT, "public", icon.src.slice(expected.length));
        expect(fs.existsSync(file), icon.src).toBe(true);
      }
    },
  );

  it("apple-icon.png var, apple-icon.svg yok (Next yalnızca png/jpg kabul eder)", () => {
    expect(fs.existsSync(path.join(ROOT, "src/app/apple-icon.png"))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, "src/app/apple-icon.svg"))).toBe(false);
  });
});

describe("public/sw.js", () => {
  const source = read("public/sw.js");

  type Handler = (event: unknown) => void;
  function boot(scope = "https://ornek.test/dogukan/") {
    const handlers: Record<string, Handler> = {};
    const cache = {
      match: async () => undefined,
      put: async () => undefined,
      add: async () => undefined,
      addAll: async () => undefined,
      keys: async () => [],
      delete: async () => true,
    };
    const self = {
      registration: { scope },
      location: new URL(scope),
      clients: { claim: async () => undefined },
      skipWaiting: vi.fn(),
      addEventListener: (type: string, cb: Handler) => {
        handlers[type] = cb;
      },
    };
    const caches = {
      open: async () => cache,
      keys: async () => [],
      delete: async () => true,
    };
    const fetchStub = async () => ({
      ok: true,
      type: "basic",
      clone() {
        return this;
      },
    });
    new Function("self", "caches", "fetch", source)(self, caches, fetchStub);
    return { handlers, self };
  }

  function fetchEvent(
    url: string,
    init: { method?: string; mode?: string; headers?: Record<string, string> } = {},
  ) {
    const event = {
      request: {
        url,
        method: init.method ?? "GET",
        mode: init.mode ?? "no-cors",
        headers: new Headers(init.headers),
      },
      respondWith: vi.fn((p: Promise<unknown>) => p.catch(() => undefined)),
      waitUntil: vi.fn((p: Promise<unknown>) => p.catch(() => undefined)),
    };
    return event;
  }

  it("ayrıştırılabilir ve sürüm yer tutucusu taşır", () => {
    expect(() => new Function(source)).not.toThrow();
    expect(source).toContain('"__BUILD_ID__"');
    expect(source).toContain("registration.scope");
  });

  it("install, activate, fetch ve SKIP_WAITING mesajını dinler", () => {
    const { handlers, self } = boot();
    expect(Object.keys(handlers).sort()).toEqual([
      "activate",
      "fetch",
      "install",
      "message",
    ]);
    handlers.message({ data: { type: "SKIP_WAITING" } });
    expect(self.skipWaiting).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      "_next/static parçası",
      "https://ornek.test/dogukan/_next/static/chunks/abc.js",
      {},
      true,
    ],
    [
      "RSC .txt yükü",
      "https://ornek.test/dogukan/aktivite/tetris/__next.aktivite.txt",
      {},
      true,
    ],
    [
      "gezinme",
      "https://ornek.test/dogukan/aktivite/tetris/",
      { mode: "navigate" },
      true,
    ],
    ["ses dosyası", "https://ornek.test/dogukan/sounds/hit.m4a", {}, true],
    [
      "başka köken (Firebase)",
      "https://x.firebaseio.com/leaderboard.json",
      {},
      false,
    ],
    [
      "GET dışı",
      "https://ornek.test/dogukan/_next/static/a.js",
      { method: "POST" },
      false,
    ],
    [
      "Range isteği",
      "https://ornek.test/dogukan/sounds/hit.m4a",
      { headers: { range: "bytes=0-" } },
      false,
    ],
    ["kapsam dışı", "https://ornek.test/baska/a.js", {}, false],
    ["sw.js kendisi", "https://ornek.test/dogukan/sw.js", {}, false],
  ] as const)("%s → yakalanır mı: %s", (_name, url, init, intercepted) => {
    const { handlers } = boot();
    const event = fetchEvent(url, init);
    handlers.fetch(event);
    expect(event.respondWith).toHaveBeenCalledTimes(intercepted ? 1 : 0);
  });

  it("BASE kayıt kapsamından gelir (geliştirmede '/')", () => {
    const { handlers } = boot("http://localhost:3000/");
    const event = fetchEvent("http://localhost:3000/_next/static/chunks/a.js");
    handlers.fetch(event);
    expect(event.respondWith).toHaveBeenCalledTimes(1);
  });
});

describe("CSS bölmesi", () => {
  const SCOPE = [
    "src/app/kesfet/",
    "src/components/encyclopedia/",
    "src/components/kesfet/",
  ];

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), {
      withFileTypes: true,
    })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel, out);
      else if (rel.endsWith(".tsx")) out.push(rel);
    }
    return out;
  }

  function walkCss(dir: string, out: string[] = []): string[] {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), {
      withFileTypes: true,
    })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walkCss(rel, out);
      else if (rel.endsWith(".css")) out.push(rel);
    }
    return out;
  }

  it("encyclopedia.css yalnızca src/app/kesfet/layout.tsx'ten içe aktarılır", () => {
    const importers = walk("src").filter((f) => /encyclopedia\.css/.test(read(f)));
    expect(importers).toEqual(["src/app/kesfet/layout.tsx"]);
    for (const css of fs.readdirSync(path.join(ROOT, "src/styles"))) {
      expect(read(`src/styles/${css}`), css).not.toMatch(
        /@import[^;]*encyclopedia\.css/,
      );
    }
    expect(read("src/app/globals.css")).not.toMatch(/@import[^;]*encyclopedia\.css/);
  });

  it("encyclopedia.css'teki her seçici /kesfet'e özgü bir sınıfa bağlı (dışarıda kullanılan stil kaybolmaz)", () => {
    const outside = walk("src")
      .filter((f) => !SCOPE.some((s) => f.startsWith(s)) && !f.includes("__tests__"))
      .map(read)
      .join("\n");
    const dynamicPrefixes = [...outside.matchAll(/([a-zA-Z][\w-]*-)\$\{/g)].map(
      (m) => m[1],
    );
    const usedOutside = (cls: string) =>
      new RegExp(`(^|[^\\w-])${cls.replace(/[-]/g, "\\-")}(?![\\w-])`).test(
        outside,
      ) || dynamicPrefixes.some((p) => cls.startsWith(p));
    // Başka bir paket aynı sınıfı kendi stil dosyasında tanımlıyorsa (ör. S6 .parent-note)
    // dışarıdaki kullanım kendi stilini taşır; ansiklopedi sürümü /kesfet'te kalır.
    const otherCss = walkCss("src")
      .filter((f) => f !== "src/styles/encyclopedia.css")
      .map(read)
      .join("\n");
    const definedElsewhere = (cls: string) =>
      new RegExp(`\\.${cls.replace(/[-]/g, "\\-")}(?![\\w-])`).test(otherCss);
    const orphanedOutside = (cls: string) =>
      usedOutside(cls) && !definedElsewhere(cls);

    const css = read("src/styles/encyclopedia.css").replace(/\/\*[\s\S]*?\*\//g, "");
    const offenders: string[] = [];
    for (const m of css.matchAll(/([^{};]+)\{/g)) {
      const prelude = m[1].trim();
      if (
        prelude.startsWith("@") ||
        /^(from|to|\d[\d.]*%)(\s*,\s*(from|to|\d[\d.]*%))*$/.test(prelude)
      )
        continue;
      for (const selector of prelude.split(",")) {
        const classes = [
          ...selector
            .replace(/:(not|where|is|has)\([^)]*\)/g, "")
            .matchAll(/\.(-?[_a-zA-Z][\w-]*)/g),
        ].map((c) => c[1]);
        if (classes.length === 0 || classes.every(orphanedOutside))
          offenders.push(selector.trim());
      }
    }
    expect(offenders).toEqual([]);
  });

  it("sonsuz animasyonlar prefers-reduced-motion kapısının içinde", () => {
    for (const file of fs
      .readdirSync(path.join(ROOT, "src/styles"))
      .filter((f) => f.endsWith(".css"))) {
      const css = read(`src/styles/${file}`);
      const lines = css.split("\n");
      lines.forEach((line, i) => {
        if (!/animation\s*:[^;]*\binfinite\b/.test(line)) return;
        // En yakın açık @media bloğu (girintiye göre) hareket kapısı olmalı.
        const before = lines
          .slice(0, i)
          .reverse()
          .find((l) => /^@media/.test(l));
        expect(before, `${file}:${i + 1}`).toMatch(
          /prefers-reduced-motion: no-preference/,
        );
        expect(line.startsWith("    "), `${file}:${i + 1} @media içinde değil`).toBe(
          true,
        );
      });
    }
  });

  it(".activity-topbar üzerinde backdrop-filter yok (tuvalin üstünde)", () => {
    const css = read("src/styles/activity.css");
    const block = css.match(/\.activity-topbar \{[^}]*\}/)?.[0] ?? "";
    expect(block).not.toBe("");
    expect(block).not.toMatch(/backdrop-filter/);
  });
});

const BARE_CONSONANT = /^\s*[bcçdfgğhjklmnprsştvyz]\s*[.?!]?\s*$/i;
const generators = Object.values(GENERATORS).filter((g): g is Generator =>
  Boolean(g),
);

describe("üreticiler: çıplak ünsüz kuralı", () => {
  it.skipIf(generators.length === 0)(
    "prompt.say asla tek başına bir ünsüz değildir (200 tohumlu çekiliş/seviye)",
    () => {
      for (const gen of generators) {
        for (let level = 1; level <= gen.maxLevel; level += 1) {
          for (let seed = 1; seed <= 200; seed += 1) {
            const ex = gen.generate(
              createRng(seed * 7919 + level),
              level as SkillLevel,
            );
            const where = `${gen.skill} L${level} tohum ${seed}`;
            expect(ex.prompt.say.trim(), where).not.toBe("");
            expect(
              BARE_CONSONANT.test(ex.prompt.say),
              `${where}: "${ex.prompt.say}"`,
            ).toBe(false);
          }
        }
      }
    },
  );
});
