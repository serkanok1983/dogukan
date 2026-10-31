import { describe, expect, it } from "vitest";
import { reduceProgress, setStars, totalStars } from "../reducers";
import { DAY_MS, dayKey, emptyProgress } from "../time";
import type { Progress, ProgressEvent, ProgressEventInput } from "../types";

const T0 = Date.UTC(2026, 10, 2, 9, 0); // Pazartesi 12:00 İstanbul
let seq = 0;

function ev(input: ProgressEventInput, at = T0): ProgressEvent {
  seq += 1;
  return { ...input, id: `e${seq}`, at } as ProgressEvent;
}

function apply(p: Progress, ...events: ProgressEvent[]): Progress {
  return events.reduce(reduceProgress, p);
}

const fresh = () => emptyProgress("dogukan", T0);
const today = dayKey(T0);

describe("reduceProgress", () => {
  it("aynı olay iki kez uygulanmaz", () => {
    const e = ev({ type: "app_open" });
    const once = apply(fresh(), e);
    expect(apply(once, e)).toBe(once);
    expect(once.days[today]?.opens).toBe(1);
    expect(once.seenEventIds).toContain(e.id);
  });

  it("run_end: oynama, en iyi skor, yıldız, bildirim ve gün kovası", () => {
    const p = apply(fresh(), ev({ type: "run_end", slug: "super-ayi", score: 120, durationMs: 30_000, level: 4 }));
    const a = p.activities["super-ayi"];
    expect(a).toMatchObject({ plays: 1, best: 120, bestLevel: 4, stars: 2, ease: 0.7, seconds: 0 });
    expect(p.inbox.filter((n) => n.kind !== "sticker").map((n) => n.kind)).toEqual(["new_star"]);
    expect(p.days[today]?.plays["super-ayi"]).toEqual({ sec: 0, runs: 1, stars: 2 });
  });

  it("run_end: yıldız düşmez, yeni yıldız yalnızca artınca bildirilir", () => {
    const p = apply(
      fresh(),
      ev({ type: "run_end", slug: "super-ayi", score: 300, durationMs: 1, level: 7 }),
      ev({ type: "run_end", slug: "super-ayi", score: 5, durationMs: 1, level: 1 }),
    );
    expect(p.activities["super-ayi"]?.stars).toBe(3);
    expect(p.inbox.filter((n) => n.kind === "new_star")).toHaveLength(1);
  });

  it("ease: 3 yıldızda artar, 3 ardışık 0 yıldızda azalır, sınırlar korunur", () => {
    let p = apply(fresh(), ev({ type: "run_end", slug: "flappy-bird", score: 500, durationMs: 1 }));
    expect(p.activities["flappy-bird"]?.ease).toBe(0.75);
    const zero = () => ev({ type: "run_end", slug: "flappy-bird", score: 0, durationMs: 1 });
    p = apply(p, zero(), zero());
    expect(p.activities["flappy-bird"]).toMatchObject({ ease: 0.75, consecutiveLow: 2 });
    p = apply(p, zero());
    expect(p.activities["flappy-bird"]).toMatchObject({ ease: 0.7, consecutiveLow: 0 });
    for (let i = 0; i < 12; i++) p = apply(p, zero());
    expect(p.activities["flappy-bird"]?.ease).toBe(0.6);
  });

  it("arcade run_end ef.refleks becerisini besler, öğrenme etkinliği beslemez", () => {
    const p = apply(fresh(), ev({ type: "run_end", slug: "super-ayi", score: 10, durationMs: 1 }));
    expect(p.skills["ef.refleks"]?.attempts).toBe(1);
    const q = apply(fresh(), ev({ type: "run_end", slug: "renk-yaris", score: 10, durationMs: 1 }));
    expect(q.skills["ef.refleks"]).toBeUndefined();
  });

  it("level_complete en iyi seviyeyi yükseltir", () => {
    const p = apply(fresh(), ev({ type: "level_complete", slug: "super-ayi", level: 4 }));
    expect(p.activities["super-ayi"]?.bestLevel).toBe(4);
  });

  it("exercise_item beceriyi günceller ve seviye atlamayı bildirir", () => {
    const item = () =>
      ev({
        type: "exercise_item",
        slug: "harf-tanima",
        skill: "tr.ses-harf",
        level: 1,
        firstTry: true,
        correct: true,
        review: false,
        ms: 900,
      });
    const p = apply(fresh(), item(), item(), item());
    expect(p.skills["tr.ses-harf"]?.level).toBe(2);
    expect(p.inbox.filter((n) => n.kind === "level_up")).toHaveLength(1);
  });

  it("exercise_set_end: yıldız, bal, set sayısı ve seri", () => {
    const p = apply(
      fresh(),
      ev({ type: "exercise_set_end", slug: "sayma-oyunu", skill: "mat.sayma", correct: 5, total: 6, firstTry: 4, mode: "session" }),
    );
    expect(p.activities["sayma-oyunu"]).toMatchObject({ plays: 1, best: 5, stars: 2 });
    expect(p.days[today]).toMatchObject({ setsDone: 1, honeyEarned: 2 });
    expect(p.rewards.streak).toMatchObject({ count: 1, lastDay: today });
  });

  it("gate modu: +1 bal, set sayılmaz, seri ilerlemez", () => {
    const p = apply(
      fresh(),
      ev({ type: "exercise_set_end", slug: "super-ayi", skill: "mat.sayma", correct: 3, total: 3, firstTry: 3, mode: "gate" }),
    );
    expect(p.days[today]).toMatchObject({ setsDone: 0, honeyEarned: 1 });
    expect(p.rewards.streak.count).toBe(0);
  });

  it("capsule_end: konu, bölüm, bal ve seri", () => {
    const p = apply(fresh(), ev({ type: "capsule_end", topic: "isik-ve-golge" }));
    expect(p.topics["isik-ve-golge"]).toMatchObject({ capsuleDone: true, capsuleDoneAt: T0 });
    expect(p.days[today]).toMatchObject({ episodesDone: 1, honeyEarned: 1 });
    expect(p.rewards.streak.count).toBe(1);
  });

  it("usage: türe göre saniyeler, eş oyun kavanozu boşaltmaz, mola toplama girmez", () => {
    const u = (kind: "arcade" | "learning" | "capsule" | "creative" | "break" | "map", coplay = false, slug?: string) =>
      ev({ type: "usage", day: today, kind, sec: 5, coplay, slug });
    const p = apply(
      fresh(),
      u("arcade", false, "super-ayi"),
      u("arcade", true, "dovus-arenasi"),
      u("learning"),
      u("capsule"),
      u("creative"),
      u("map"),
      u("break"),
    );
    expect(p.days[today]).toMatchObject({
      totalSec: 30,
      arcadeSec: 5,
      coplaySec: 5,
      learningSec: 5,
      capsuleSec: 5,
      creativeSec: 5,
      breakSec: 5,
      sinceBreakSec: 30,
    });
    expect(p.days[today]?.plays["super-ayi"]?.sec).toBe(5);
    expect(p.activities["super-ayi"]?.seconds).toBe(5);
  });

  it("gün kovası olayları", () => {
    const p = apply(
      fresh(),
      ev({ type: "usage", day: today, kind: "arcade", sec: 100, coplay: false }),
      ev({ type: "break_done", breakId: "zipla", skippedByParent: false }),
      ev({ type: "break_done", breakId: "goz", skippedByParent: true }),
      ev({ type: "limit_reached" }),
      ev({ type: "extension", minutes: 10 }),
      ev({ type: "bedtime_block" }),
      ev({ type: "session_end", reason: "limit" }),
      ev({ type: "together_done" }),
      ev({ type: "clock_jump", deltaMs: -600_000 }),
    );
    expect(p.days[today]).toMatchObject({
      sinceBreakSec: 0,
      breaksTaken: 1,
      breaksSkippedByParent: 1,
      limitReached: true,
      extensions: 1,
      extensionMinutes: 10,
      bedtimeBlocks: 1,
      togetherDone: true,
      clockJumps: 1,
    });
    expect(p.days[today]?.sessionsEndedBy.limit).toBe(1);
  });

  it("usage olayı kendi gün anahtarına yazılır", () => {
    const p = apply(fresh(), ev({ type: "usage", day: "2026-11-01", kind: "learning", sec: 5, coplay: false }));
    expect(p.days["2026-11-01"]?.learningSec).toBe(5);
  });

  it("topic_flag, quests_set ve notices_ack", () => {
    let p = apply(
      fresh(),
      ev({ type: "topic_flag", slug: "miknatislar", favorite: true }),
      ev({ type: "quests_set", day: today, items: [{ id: `${today}:0`, kind: "tr", slug: "harf-tanima", done: false }] }),
      ev({ type: "run_end", slug: "super-ayi", score: 10, durationMs: 1 }),
    );
    expect(p.topics.miknatislar).toMatchObject({ favorite: true, complete: false });
    expect(p.quests.items).toHaveLength(1);
    const ids = p.inbox.map((n) => n.id);
    p = apply(p, ev({ type: "notices_ack", ids }));
    expect(p.inbox).toEqual([]);
  });

  it("kozmetik: yıldız yetmezse alınmaz, sahip olunmayan takılmaz", () => {
    let p = apply(fresh(), ev({ type: "cosmetic_buy", cosmeticId: "sapka", price: 2 }));
    expect(p.rewards.cosmetics.owned).toEqual([]);
    p = apply(p, ev({ type: "run_end", slug: "super-ayi", score: 300, durationMs: 1, level: 7 }));
    expect(totalStars(p)).toBe(3);
    p = apply(p, ev({ type: "cosmetic_equip", cosmeticId: "sapka" }));
    expect(p.rewards.cosmetics.equipped).toBeNull();
    p = apply(p, ev({ type: "cosmetic_buy", cosmeticId: "sapka", price: 2 }), ev({ type: "cosmetic_equip", cosmeticId: "sapka" }));
    expect(p.rewards).toMatchObject({ starsSpent: 2, cosmetics: { owned: ["sapka"], equipped: "sapka" } });
    p = apply(p, ev({ type: "cosmetic_buy", cosmeticId: "atki", price: 2 }));
    expect(p.rewards.cosmetics.owned).toEqual(["sapka"]);
  });

  describe("seri", () => {
    const set = (at: number) =>
      ev({ type: "exercise_set_end", slug: "sayma-oyunu", skill: "mat.sayma", correct: 6, total: 6, firstTry: 6, mode: "session" }, at);

    it("aynı gün bir kez sayılır, ardışık gün artar", () => {
      const p = apply(fresh(), set(T0), set(T0 + 1000), set(T0 + DAY_MS));
      expect(p.rewards.streak.count).toBe(2);
    });

    it("kaçırılan tek gün haftada bir dondurmayla korunur", () => {
      const p = apply(fresh(), set(T0), set(T0 + DAY_MS), set(T0 + 3 * DAY_MS));
      expect(p.rewards.streak.count).toBe(3);
      expect(p.rewards.streak.freezeUsedWeek).not.toBeNull();
    });

    it("dondurma kullanıldıysa kaçırılan gün sayacı 1 düşürür (sıfırlamaz)", () => {
      // Pazartesi, Salı, (Çarşamba yok) Perşembe → dondurma; (Cuma yok) Cumartesi → −1 +1
      const p = apply(
        fresh(),
        set(T0),
        set(T0 + DAY_MS),
        set(T0 + 3 * DAY_MS),
        set(T0 + 5 * DAY_MS),
      );
      expect(p.rewards.streak.count).toBe(3);
    });

    it("3. günde seri bildirimi", () => {
      const p = apply(fresh(), set(T0), set(T0 + DAY_MS), set(T0 + 2 * DAY_MS));
      expect(p.inbox.some((n) => n.kind === "streak" && n.streak === 3)).toBe(true);
    });
  });

  it("setStars eşikleri", () => {
    expect([setStars(6, 6), setStars(5, 6), setStars(4, 6), setStars(3, 6), setStars(0, 0)]).toEqual([3, 2, 1, 0, 0]);
  });
});
