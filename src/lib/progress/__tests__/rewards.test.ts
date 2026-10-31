import { describe, expect, it } from "vitest";
import { COSMETICS, starsAvailable } from "@/lib/cosmetics";
import { createRng, pick, randInt, type Rng } from "@/lib/rng";
import { STICKERS } from "@/lib/stickers";
import { mergeProgress, reduceProgress } from "../reducers";
import { DAY_MS, dayKey, emptyProgress } from "../time";
import type {
  Progress,
  ProgressEvent,
  ProgressEventInput,
  QuestState,
} from "../types";

const T0 = Date.UTC(2026, 10, 2, 9, 0); // Pazartesi 12:00 İstanbul
const today = dayKey(T0);
let seq = 0;

function ev(input: ProgressEventInput, at = T0): ProgressEvent {
  seq += 1;
  return { ...input, id: `r${seq}`, at } as ProgressEvent;
}

function apply(p: Progress, ...events: ProgressEvent[]): Progress {
  return events.reduce(reduceProgress, p);
}

const fresh = () => emptyProgress("dogukan", T0);
const stickerNotices = (p: Progress, id: string) =>
  p.inbox.filter((n) => n.kind === "sticker" && n.stickerId === id);

const item = (skill: "tr.ses-harf" | "mat.sayma", at = T0) =>
  ev(
    {
      type: "exercise_item",
      slug: "harf-tanima",
      skill,
      level: 1,
      firstTry: true,
      correct: true,
      review: false,
      ms: 900,
    },
    at,
  );
const set = (slug: string, skill: "tr.ses-harf" | "mat.sayma", at = T0) =>
  ev(
    {
      type: "exercise_set_end",
      slug,
      skill,
      correct: 6,
      total: 6,
      firstTry: 6,
      mode: "session",
    },
    at,
  );

describe("çıkartma kataloğu", () => {
  it("~30 benzersiz çıkartma, hepsi emoji + ad + söz + sayfa + tetikleyici", () => {
    expect(STICKERS.length).toBeGreaterThanOrEqual(28);
    expect(STICKERS.length).toBeLessThanOrEqual(40);
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length);
    for (const s of STICKERS) {
      expect(s.emoji && s.name && s.say && s.page && s.trigger, s.id).toBeTruthy();
    }
  });
});

describe("çıkartma ödülleri", () => {
  it("ilk açılış çıkartması bir kez verilir", () => {
    const p = apply(fresh(), ev({ type: "app_open" }), ev({ type: "app_open" }));
    expect(p.rewards.stickers["hos-geldin"]).toBe(T0);
    expect(stickerNotices(p, "hos-geldin")).toHaveLength(1);
  });

  it("amiral oyunda 3 yıldız: ilk yıldız, ilk 3 yıldız ve oyun çıkartması; tekrar verilmez", () => {
    let p = apply(
      fresh(),
      ev({ type: "run_end", slug: "super-ayi", score: 0, durationMs: 1, level: 7 }),
    );
    expect(Object.keys(p.rewards.stickers).sort()).toEqual([
      "ayicik",
      "ilk-uc-yildiz",
      "ilk-yildiz",
    ]);
    p = apply(
      p,
      ev({ type: "run_end", slug: "super-ayi", score: 0, durationMs: 1, level: 8 }),
    );
    expect(p.inbox.filter((n) => n.kind === "sticker")).toHaveLength(3);
  });

  it("ses grubu ustalığı (tr.ses-harf seviye atlaması) çıkartma verir", () => {
    const p = apply(
      fresh(),
      item("tr.ses-harf"),
      item("tr.ses-harf"),
      item("tr.ses-harf"),
    );
    expect(p.skills["tr.ses-harf"]?.level).toBe(2);
    expect(p.rewards.stickers.ari).toBeDefined();
    expect(p.rewards.stickers.kaplumbaga).toBeUndefined();
  });

  it("ilk set, seri 3 ve Blok kaydı / paylaşımı", () => {
    const p = apply(
      fresh(),
      set("sayma-oyunu", "mat.sayma", T0),
      set("sayma-oyunu", "mat.sayma", T0 + DAY_MS),
      set("sayma-oyunu", "mat.sayma", T0 + 2 * DAY_MS),
      ev({ type: "blocks_saved", index: 0, shared: false }),
    );
    expect(p.rewards.stickers.kalem).toBe(T0);
    expect(p.rewards.stickers["kucuk-gunes"]).toBe(T0 + 2 * DAY_MS);
    expect(p.rewards.stickers.ev).toBeDefined();
    expect(p.rewards.stickers.tablo).toBeUndefined();
    const q = apply(p, ev({ type: "blocks_saved", index: 0, shared: true }));
    expect(q.rewards.stickers.tablo).toBeDefined();
  });

  it("birleştirme: iki cihaz aynı çıkartmayı alırsa en erken zaman kalır", () => {
    const a = apply(fresh(), ev({ type: "app_open" }, T0 + 5000));
    const b = apply(fresh(), ev({ type: "app_open" }, T0 + 1000));
    const m = mergeProgress(a, b);
    expect(m.rewards.stickers["hos-geldin"]).toBe(T0 + 1000);
    expect(mergeProgress(b, a).rewards.stickers).toEqual(m.rewards.stickers);
  });
});

describe("görev tamamlama", () => {
  const items: QuestState[] = [
    {
      id: `${today}:0`,
      kind: "tr",
      slug: "harf-tanima",
      skill: "tr.ses-harf",
      done: false,
    },
    {
      id: `${today}:1`,
      kind: "mat",
      slug: "sayma-oyunu",
      skill: "mat.sayma",
      done: false,
    },
    { id: `${today}:2`, kind: "extra", topic: "isik-ve-golge", done: false },
  ];

  it("eşleşen olaylar görevi bitirir; üçü bitince quests_all_done + çıkartma", () => {
    let p = apply(fresh(), ev({ type: "quests_set", day: today, items }));
    p = apply(p, set("harf-tanima", "tr.ses-harf"));
    expect(p.quests.items.map((q) => q.done)).toEqual([true, false, false]);
    expect(p.inbox.filter((n) => n.kind === "quest_done")).toHaveLength(1);
    p = apply(p, set("toplama-oyunu", "mat.sayma")); // aynı beceri, başka slug → sayılır
    p = apply(p, ev({ type: "capsule_end", topic: "isik-ve-golge" }));
    expect(p.quests.items.every((q) => q.done)).toBe(true);
    expect(p.inbox.filter((n) => n.kind === "quests_all_done")).toHaveLength(1);
    expect(p.rewards.questDays).toEqual([today]);
    expect(p.rewards.stickers.hediye).toBeDefined();
  });

  it("gate seti ve dünün görevleri bitmez; aynı gün ikinci quests_set yok sayılır", () => {
    let p = apply(fresh(), ev({ type: "quests_set", day: today, items }));
    p = apply(
      p,
      ev({
        type: "exercise_set_end",
        slug: "harf-tanima",
        skill: "tr.ses-harf",
        correct: 3,
        total: 3,
        firstTry: 3,
        mode: "gate",
      }),
    );
    expect(p.quests.items[0]?.done).toBe(false);
    p = apply(p, ev({ type: "quests_set", day: today, items: [] }));
    expect(p.quests.items).toHaveLength(3);
    p = apply(p, set("harf-tanima", "tr.ses-harf", T0 + DAY_MS));
    expect(p.quests.items[0]?.done).toBe(false);
  });
});

describe("Bal topla (gate)", () => {
  it("yıldız ya da etkinlik yazmaz; yalnız +1 bal", () => {
    const p = apply(
      fresh(),
      ev({
        type: "exercise_set_end",
        slug: "bal-topla",
        skill: "mat.sayma",
        correct: 3,
        total: 3,
        firstTry: 3,
        mode: "gate",
      }),
    );
    expect(p.activities["bal-topla"]).toBeUndefined();
    expect(starsAvailable(p)).toBe(0);
    expect(p.days[today]?.honeyEarned).toBe(1);
  });
});

describe("kozmetik", () => {
  it("5 ürün, yıldız fiyatları artan", () => {
    expect(COSMETICS).toHaveLength(5);
    const prices = COSMETICS.map((c) => c.price);
    expect([...prices].sort((x, y) => x - y)).toEqual(prices);
  });

  it("yıldızla alınır, takılır, çıkarılır; harcanan yıldız haritadaki yıldızı düşürmez", () => {
    const kep = COSMETICS[0]!;
    let p = apply(
      fresh(),
      ev({ type: "cosmetic_buy", cosmeticId: kep.id, price: kep.price }),
    );
    expect(p.rewards.cosmetics.owned).toEqual([]);
    p = apply(
      p,
      ev({ type: "run_end", slug: "flappy-bird", score: 15, durationMs: 1 }),
      ev({ type: "run_end", slug: "super-ayi", score: 0, durationMs: 1, level: 7 }),
    );
    expect(starsAvailable(p)).toBe(6);
    p = apply(
      p,
      ev({ type: "cosmetic_buy", cosmeticId: kep.id, price: kep.price }),
      ev({ type: "cosmetic_equip", cosmeticId: kep.id }),
    );
    expect(p.rewards.cosmetics).toEqual({ owned: [kep.id], equipped: kep.id });
    expect(starsAvailable(p)).toBe(0);
    expect(p.activities["flappy-bird"]?.stars).toBe(3);
    p = apply(p, ev({ type: "cosmetic_equip", cosmeticId: null }));
    expect(p.rewards.cosmetics.equipped).toBeNull();
  });
});

// ---------- Birleştirme yasaları, yeni alanlarla ----------

const SLUGS = ["super-ayi", "flappy-bird", "sayma-oyunu", "harf-tanima"];

function randomEvent(rng: Rng, i: number, prefix: string): ProgressEvent {
  const at = T0 + randInt(rng, 0, 3) * DAY_MS + i * 1000;
  const day = dayKey(at);
  const slug = pick(rng, SLUGS);
  const options: ProgressEventInput[] = [
    { type: "app_open" },
    {
      type: "run_end",
      slug,
      score: randInt(rng, 0, 20),
      durationMs: 1000,
      level: randInt(rng, 1, 8),
    },
    {
      type: "exercise_set_end",
      slug,
      skill: "mat.sayma",
      correct: randInt(rng, 3, 6),
      total: 6,
      firstTry: 3,
      mode: "session",
    },
    { type: "capsule_end", topic: "isik-ve-golge" },
    { type: "blocks_saved", index: 0, shared: rng() > 0.5 },
    {
      type: "quests_set",
      day,
      items: [
        {
          id: `${day}:0`,
          kind: "tr",
          slug: "harf-tanima",
          skill: "tr.ses-harf",
          done: false,
        },
        {
          id: `${day}:1`,
          kind: "mat",
          slug: "sayma-oyunu",
          skill: "mat.sayma",
          done: false,
        },
        { id: `${day}:2`, kind: "extra", topic: "isik-ve-golge", done: false },
      ],
    },
    { type: "cosmetic_buy", cosmeticId: pick(rng, ["kep", "atki"]), price: 2 },
    { type: "cosmetic_equip", cosmeticId: pick(rng, ["kep", "atki", null]) },
  ];
  return { ...pick(rng, options), id: `${prefix}${i}`, at } as ProgressEvent;
}

function build(seed: number, prefix: string): Progress {
  const rng = createRng(seed);
  let p = emptyProgress("dogukan", T0);
  const n = randInt(rng, 5, 40);
  for (let i = 0; i < n; i++) {
    p = reduceProgress(p, randomEvent(rng, i, prefix));
    if (rng() > 0.85 && p.inbox.length > 0) {
      p = reduceProgress(p, {
        type: "notices_ack",
        ids: [p.inbox[0]!.id],
        id: `${prefix}ack${i}`,
        at: T0 + i * 1000,
      });
    }
  }
  return p;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map(canonical)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
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

describe("mergeProgress (çıkartma, görev, kozmetik alanlarıyla)", () => {
  it("değişmeli ve idempotent (60 rastgele çift)", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const a = build(seed, "a");
      const b = build(seed + 5000, "b");
      expect(canonical(mergeProgress(a, b))).toEqual(canonical(mergeProgress(b, a)));
      expect(canonical(mergeProgress(a, a))).toEqual(canonical(a));
      const ab = mergeProgress(a, b);
      expect(canonical(mergeProgress(ab, b))).toEqual(canonical(ab));
    }
  });

  it("çıkartma ve görev günü kaybolmaz", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const a = build(seed, "a");
      const b = build(seed + 7000, "b");
      const m = mergeProgress(a, b);
      for (const id of Object.keys(a.rewards.stickers))
        expect(m.rewards.stickers[id]).toBeDefined();
      for (const d of a.rewards.questDays ?? [])
        expect(m.rewards.questDays).toContain(d);
    }
  });
});
