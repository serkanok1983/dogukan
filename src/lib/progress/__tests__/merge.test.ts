import { describe, expect, it } from "vitest";
import { COSMETICS, starsAvailable } from "@/lib/cosmetics";
import { createRng, pick, randInt, type Rng } from "@/lib/rng";
import { lifetimeSets } from "@/lib/stickers";
import { mergeProgress, reduceProgress, totalStars } from "../reducers";
import { DAY_MS, dayKey, emptyDay, emptyProgress } from "../time";
import type { Progress, ProgressEvent, ProgressEventInput } from "../types";

const T0 = Date.UTC(2026, 10, 2, 9, 0);
const SLUGS = [
  "super-ayi",
  "flappy-bird",
  "sayma-oyunu",
  "harf-tanima",
  "renk-yaris",
];

function randomEvent(rng: Rng, i: number, prefix: string): ProgressEvent {
  const at = T0 + randInt(rng, 0, 4) * DAY_MS + i * 1000;
  const slug = pick(rng, SLUGS);
  const options: ProgressEventInput[] = [
    { type: "app_open" },
    {
      type: "run_end",
      slug,
      score: randInt(rng, 0, 400),
      durationMs: 1000,
      level: randInt(rng, 1, 6),
    },
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
    {
      type: "exercise_set_end",
      slug,
      skill: "mat.sayma",
      correct: randInt(rng, 0, 6),
      total: 6,
      firstTry: 3,
      mode: "session",
    },
    {
      type: "capsule_end",
      topic: pick(rng, ["isik-ve-golge", "kalbim-ve-nefesim"]),
    },
    {
      type: "usage",
      day: dayKey(at),
      kind: pick(rng, ["arcade", "learning", "map"] as const),
      sec: 5,
      coplay: false,
      slug,
    },
    { type: "topic_flag", slug: "miknatislar", favorite: rng() > 0.5 },
    { type: "topic_flag", slug: "miknatislar", complete: rng() > 0.5 },
    { type: "break_done", breakId: "zipla", skippedByParent: rng() > 0.7 },
    { type: "extension", minutes: pick(rng, [5, 10, 15]) },
    { type: "cosmetic_buy", cosmeticId: pick(rng, COSMETICS).id, price: 0 },
    {
      type: "cosmetic_equip",
      cosmeticId: pick(rng, [null, ...COSMETICS.map((c) => c.id)]),
    },
  ];
  return { ...pick(rng, options), id: `${prefix}${i}`, at } as ProgressEvent;
}

/** Rastgele olaylar; arada gelen kutudaki bildirimlerin bir kısmı onaylanır. */
function extend(
  p: Progress,
  rng: Rng,
  n: number,
  prefix: string,
  from = 0,
): Progress {
  for (let i = from; i < from + n; i++) {
    if (p.inbox.length > 0 && rng() < 0.15) {
      const ids = p.inbox.filter(() => rng() < 0.6).map((x) => x.id);
      p = reduceProgress(p, {
        type: "notices_ack",
        ids,
        id: `${prefix}ack${i}`,
        at: T0 + i * 1000,
      });
    } else {
      p = reduceProgress(p, randomEvent(rng, i, prefix));
    }
  }
  return p;
}

function build(seed: number, prefix: string): Progress {
  const rng = createRng(seed);
  return extend(emptyProgress("dogukan", T0), rng, randInt(rng, 3, 40), prefix);
}

/** Ortak geçmiş + iki sekmede ayrı devam (gerçek çok sekmeli durum). */
function fork(seed: number): [Progress, Progress] {
  const rng = createRng(seed);
  const base = extend(emptyProgress("dogukan", T0), rng, randInt(rng, 5, 30), "c");
  return [
    extend(base, createRng(seed + 7), randInt(rng, 1, 25), "x", 100),
    extend(base, createRng(seed + 9), randInt(rng, 1, 25), "y", 100),
  ];
}

/** Diziler sıralanarak karşılaştırılır (CONTRACT §3.5). */
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

  it("ortak geçmişten ayrılan iki sekme: değişmeli, idempotent, yıldız/en iyi kaybı yok, onaylanan geri gelmez", () => {
    for (let seed = 1; seed <= 80; seed++) {
      const [a, b] = fork(seed);
      const ab = mergeProgress(a, b);
      expect(canonical(ab)).toEqual(canonical(mergeProgress(b, a)));
      expect(canonical(mergeProgress(ab, a))).toEqual(canonical(ab));
      expect(canonical(mergeProgress(ab, ab))).toEqual(canonical(ab));
      for (const side of [a, b]) {
        for (const [slug, s] of Object.entries(side.activities)) {
          expect(ab.activities[slug]?.stars).toBeGreaterThanOrEqual(s.stars);
          expect(ab.activities[slug]?.best).toBeGreaterThanOrEqual(s.best);
        }
        for (const id of Object.keys(side.ackedNotices ?? {})) {
          expect(ab.inbox.some((n) => n.id === id)).toBe(false);
        }
        expect(lifetimeSets(ab)).toBeGreaterThanOrEqual(lifetimeSets(side));
      }
      for (const d of Object.values(ab.days)) {
        expect(d.sinceBreakSec).toBeLessThanOrEqual(d.totalSec);
        expect(d.extensionMinutes).toBe(
          Object.values(d.extensionGrants ?? {}).reduce((n, m) => n + m, 0),
        );
      }
      const spent = ab.rewards.cosmetics.owned.reduce(
        (n, id) => n + (COSMETICS.find((c) => c.id === id)?.price ?? 0),
        0,
      );
      expect(ab.rewards.starsSpent).toBe(spent);
    }
  });
});

// ---------- Geri alınamayanların geri alınabilmesi (inceleme bulguları) ----------

const today = dayKey(T0);
let n = 0;
function ev(input: ProgressEventInput, at = T0): ProgressEvent {
  n += 1;
  return { ...input, id: `m${n}`, at } as ProgressEvent;
}
const apply = (p: Progress, ...events: ProgressEvent[]) =>
  events.reduce(reduceProgress, p);
const usage = (sec: number, at = T0) =>
  ev({ type: "usage", day: today, kind: "learning", sec, coplay: false }, at);

describe("mergeProgress — geri alma ve eşzamanlı yazımlar", () => {
  it("onaylanan bildirim başka sekmenin eski kopyasından geri gelmez", () => {
    const base = apply(
      emptyProgress("dogukan", T0),
      ev({ type: "run_end", slug: "flappy-bird", score: 15, durationMs: 1 }),
    );
    expect(base.inbox.length).toBeGreaterThan(0);
    const acked = apply(
      base,
      ev({ type: "notices_ack", ids: base.inbox.map((x) => x.id) }, T0 + 1000),
    );
    expect(acked.inbox).toEqual([]);
    expect(mergeProgress(acked, base).inbox).toEqual([]);
    expect(mergeProgress(base, acked).inbox).toEqual([]);
  });

  it("onay listesi sınırlıdır ve en yenileri tutar", () => {
    let p = emptyProgress("dogukan", T0);
    for (let i = 0; i < 320; i++) {
      p = { ...p, inbox: [{ id: `x${i}`, kind: "new_star", at: T0 + i }] };
      p = apply(p, ev({ type: "notices_ack", ids: [`x${i}`] }, T0 + i));
    }
    const ids = Object.keys(p.ackedNotices ?? {});
    expect(ids).toHaveLength(300);
    expect(ids).toContain("x319");
    expect(ids).not.toContain("x0");
  });

  it("mola sıfırlaması (break_done) birleşince geri gelmez", () => {
    const base = apply(emptyProgress("dogukan", T0), usage(1500));
    const rested = apply(
      base,
      ev({ type: "break_done", breakId: "goz", skippedByParent: false }, T0 + 1000),
    );
    const stale = base; // dondurulmuş sekme: molayı görmedi
    for (const m of [mergeProgress(rested, stale), mergeProgress(stale, rested)]) {
      expect(m.days[today]?.sinceBreakSec).toBe(0);
      expect(m.days[today]?.breaksTaken).toBe(1);
    }
    const later = apply(rested, usage(60, T0 + 2000));
    expect(mergeProgress(later, stale).days[today]?.sinceBreakSec).toBe(60);
  });

  it("eski biçimli gün (breakAtTotalSec yok) doğru birleşir", () => {
    const legacy = emptyProgress("dogukan", T0);
    legacy.days[today] = { ...emptyDay(), totalSec: 1000, sinceBreakSec: 300 };
    const fresh = apply(legacy, usage(10, T0 + 1000));
    expect(fresh.days[today]).toMatchObject({
      totalSec: 1010,
      sinceBreakSec: 310,
      breakAtTotalSec: 700,
    });
    const rested = apply(
      legacy,
      ev({ type: "break_done", breakId: "su", skippedByParent: true }, T0 + 1000),
    );
    expect(mergeProgress(legacy, rested).days[today]?.sinceBreakSec).toBe(0);
    expect(mergeProgress(fresh, rested).days[today]?.sinceBreakSec).toBe(10);
  });

  it("favoriden çıkarma ve tamamlandı işaretini kaldırma: son yazan kazanır", () => {
    const fav = apply(
      emptyProgress("dogukan", T0),
      ev({
        type: "topic_flag",
        slug: "miknatislar",
        favorite: true,
        complete: true,
      }),
    );
    const unfav = apply(
      fav,
      ev({ type: "topic_flag", slug: "miknatislar", favorite: false }, T0 + 1000),
    );
    const undone = apply(
      fav,
      ev({ type: "topic_flag", slug: "miknatislar", complete: false }, T0 + 2000),
    );
    for (const m of [mergeProgress(fav, unfav), mergeProgress(unfav, fav)]) {
      expect(m.topics.miknatislar).toMatchObject({
        favorite: false,
        complete: true,
      });
    }
    expect(mergeProgress(unfav, undone).topics.miknatislar).toMatchObject({
      favorite: false,
      complete: false,
    });
    // Eski veri (zaman yok): OR davranışı korunur, yeni yazım eskiyi yener.
    const legacy = emptyProgress("dogukan", T0);
    legacy.topics.miknatislar = {
      capsuleDone: false,
      favorite: true,
      complete: false,
      lastAt: 0,
    };
    expect(
      mergeProgress(legacy, emptyProgress("dogukan", T0)).topics.miknatislar
        ?.favorite,
    ).toBe(true);
    const cleared = apply(
      legacy,
      ev({ type: "topic_flag", slug: "miknatislar", favorite: false }, T0 + 5000),
    );
    expect(mergeProgress(legacy, cleared).topics.miknatislar?.favorite).toBe(false);
  });

  it("iki sekmede aynı anda alınan iki kozmetik: ikisi de sahip olunur, ikisinin fiyatı harcanır", () => {
    const [kep, atki] = [COSMETICS[0]!, COSMETICS[1]!];
    const rich = apply(
      emptyProgress("dogukan", T0),
      ...[
        "flappy-bird",
        "kostebek-vur",
        "tetris",
        "pong",
        "tugla-kir",
        "yilan-oyunu",
      ].map((slug) => ev({ type: "run_end", slug, score: 99_999, durationMs: 1 })),
    );
    expect(totalStars(rich)).toBe(18);
    const a = apply(
      rich,
      ev({ type: "cosmetic_buy", cosmeticId: kep.id, price: kep.price }, T0 + 1000),
    );
    const b = apply(
      rich,
      ev(
        { type: "cosmetic_buy", cosmeticId: atki.id, price: atki.price },
        T0 + 2000,
      ),
    );
    const m = mergeProgress(a, b);
    expect(m.rewards.cosmetics.owned).toEqual([atki.id, kep.id].sort());
    expect(m.rewards.starsSpent).toBe(kep.price + atki.price);
    expect(starsAvailable(m)).toBe(18 - kep.price - atki.price);
  });

  it("kozmetik fiyatı katalogdan alınır (olaydaki fiyat yok sayılır)", () => {
    const kep = COSMETICS[0]!;
    const p = apply(
      emptyProgress("dogukan", T0),
      ev({ type: "run_end", slug: "flappy-bird", score: 99, durationMs: 1 }),
      ev({ type: "cosmetic_buy", cosmeticId: kep.id, price: 1 }),
    );
    expect(p.rewards.cosmetics.owned).toEqual([]);
  });

  it("iki sekmede verilen iki uzatma birleşince ikisi de sayılır (eski sayaç da korunur)", () => {
    const legacy = emptyProgress("dogukan", T0);
    legacy.days[today] = { ...emptyDay(), extensions: 1, extensionMinutes: 10 }; // kimliksiz eski uzatma
    delete legacy.days[today].extensionGrants;
    const a = apply(legacy, ev({ type: "extension", minutes: 10 }, T0 + 1000));
    const b = apply(legacy, ev({ type: "extension", minutes: 15 }, T0 + 2000));
    for (const m of [mergeProgress(a, b), mergeProgress(b, a)]) {
      expect(m.days[today]).toMatchObject({ extensions: 3, extensionMinutes: 35 });
    }
    const ab = mergeProgress(a, b);
    expect(mergeProgress(ab, a).days[today]).toMatchObject({
      extensions: 3,
      extensionMinutes: 35,
    });
  });

  it("ömür boyu set sayacı günler budansa da azalmaz ve max ile birleşir", () => {
    const set = (at: number) =>
      ev(
        {
          type: "exercise_set_end",
          slug: "harf-tanima",
          skill: "tr.ses-harf",
          correct: 6,
          total: 6,
          firstTry: 6,
          mode: "session",
        },
        at,
      );
    let p = emptyProgress("dogukan", T0);
    for (let i = 0; i < 4; i++) p = apply(p, set(T0 + i * DAY_MS));
    expect(p.lifetime?.sets).toBe(4);
    const pruned = { ...p, days: {} };
    expect(lifetimeSets(pruned)).toBe(4);
    expect(mergeProgress(pruned, emptyProgress("dogukan", T0)).lifetime?.sets).toBe(
      4,
    );
    expect(apply(pruned, set(T0 + 10 * DAY_MS)).lifetime?.sets).toBe(5);
  });
});
