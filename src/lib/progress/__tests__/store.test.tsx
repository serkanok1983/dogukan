import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProgress } from "@/hooks/useProgress";
import { loginAs, logout } from "@/lib/auth";
import { onEvent, trackEvent } from "../events";
import {
  _readStoredForTests,
  _resetProgressForTests,
  flushProgress,
  getProgress,
  readProgressSnapshot,
  subscribeProgress,
} from "../store";
import { dayKey } from "../time";
import type { Progress } from "../types";

beforeEach(() => {
  logout();
  _resetProgressForTests();
});

describe("store ve olay veriyolu", () => {
  it("oturum yokken trackEvent hiçbir şey yazmaz", () => {
    const cb = vi.fn();
    const off = onEvent("*", cb);
    trackEvent({ type: "app_open" });
    expect(cb).not.toHaveBeenCalled();
    expect(_readStoredForTests("dogukan")).toBeNull();
    off();
  });

  it("giriş sonrası olay uygulanır, dinleyiciye gider ve kalıcılaşır", () => {
    loginAs("dogukan");
    const cb = vi.fn();
    const off = onEvent("run_end", cb);
    const progressEvents = vi.fn();
    window.addEventListener("dogukan:progress", progressEvents);
    trackEvent({
      type: "run_end",
      slug: "super-ayi",
      score: 60,
      durationMs: 1000,
      level: 4,
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(progressEvents).toHaveBeenCalledTimes(1);
    expect(getProgress().activities["super-ayi"]?.stars).toBe(2);
    flushProgress();
    const stored = JSON.parse(_readStoredForTests("dogukan") ?? "null") as Progress;
    expect(stored.activities["super-ayi"]?.best).toBe(60);
    off();
    window.removeEventListener("dogukan:progress", progressEvents);
  });

  it("oyuncu değişince doğru veri yüklenir", () => {
    loginAs("dogukan");
    trackEvent({ type: "run_end", slug: "tetris", score: 5, durationMs: 1 });
    loginAs("serkan");
    expect(getProgress().player).toBe("serkan");
    expect(getProgress().activities.tetris).toBeUndefined();
    expect(readProgressSnapshot("dogukan").activities.tetris?.best).toBe(5);
  });

  it("eski ansiklopedi ilerlemesi konulara taşınır", () => {
    localStorage.setItem(
      "dogukan-merak-ansiklopedisi-v1",
      JSON.stringify({
        miknatislar: {
          favorite: true,
          complete: true,
          lastVisited: "2026-09-01T10:00:00.000Z",
        },
      }),
    );
    loginAs("dogukan");
    expect(getProgress().topics.miknatislar).toMatchObject({
      favorite: true,
      complete: true,
      capsuleDone: false,
    });
  });

  it("bozuk depolama verisi depoyu çökertmez", () => {
    localStorage.setItem("dogukan-progress-v1:dogukan", "{bozuk");
    loginAs("dogukan");
    expect(getProgress().v).toBe(1);
  });
});

const KEY = "dogukan-progress-v1:dogukan";
const storedNow = () =>
  JSON.parse(_readStoredForTests("dogukan") ?? "null") as Progress;

/** Başka bir sekmenin (storage olayı görülmeden) depoya yazması. */
function otherTabWrites(mut: (p: Progress) => void) {
  const p = storedNow();
  mut(p);
  p.updatedAt += 1;
  localStorage.setItem(KEY, JSON.stringify(p));
}

describe("eski sekme yeni ilerlemeyi ezmez", () => {
  it("kalıcılaştırmadan önce depodaki değer birleştirilir (bfcache/dondurulmuş sekme)", () => {
    loginAs("dogukan");
    trackEvent({ type: "run_end", slug: "tetris", score: 5, durationMs: 1 });
    flushProgress();
    otherTabWrites((p) => {
      p.activities["flappy-bird"] = { ...p.activities.tetris!, best: 15, stars: 3 };
    });
    trackEvent({ type: "run_end", slug: "tetris", score: 9, durationMs: 1 });
    flushProgress();
    const stored = storedNow();
    expect(stored.activities["flappy-bird"]?.stars).toBe(3);
    expect(stored.activities.tetris?.best).toBe(9);
    expect(getProgress().activities["flappy-bird"]?.best).toBe(15);
  });

  it("pagehide ve visibilitychange → hidden da birleştirerek yazar", () => {
    loginAs("dogukan");
    trackEvent({ type: "app_open" });
    flushProgress();
    otherTabWrites((p) => {
      p.rewards.stickers["kupa"] = 123;
    });
    window.dispatchEvent(new Event("pagehide"));
    expect(storedNow().rewards.stickers.kupa).toBe(123);
  });

  it("pageshow ve görünür olunca depo yeniden okunup birleştirilir", () => {
    loginAs("dogukan");
    trackEvent({ type: "app_open" });
    flushProgress();
    const cb = vi.fn();
    const off = subscribeProgress(cb);
    otherTabWrites((p) => {
      p.rewards.stickers["kupa"] = 1;
    });
    window.dispatchEvent(new Event("pageshow"));
    expect(getProgress().rewards.stickers.kupa).toBe(1);
    expect(cb).toHaveBeenCalledTimes(1);
    otherTabWrites((p) => {
      p.rewards.stickers["canta"] = 2;
    });
    document.dispatchEvent(new Event("visibilitychange")); // jsdom: "visible"
    expect(getProgress().rewards.stickers.canta).toBe(2);
    // Değişmeyen depo yeniden birleştirilmez (gereksiz yeniden çizim yok).
    window.dispatchEvent(new Event("pageshow"));
    expect(cb).toHaveBeenCalledTimes(2);
    off();
  });
});

describe("normalize: alan bazında doğrulama", () => {
  it("bozuk alanlar çökertmez; her biri kendi varsayılanına düşer, sağlamlar korunur", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        v: 1,
        createdAt: "dün",
        days: null,
        activities: { tetris: { best: 40, stars: 2, plays: "çok" }, bozuk: null },
        skills: [],
        topics: { miknatislar: { favorite: true }, x: 5 },
        rewards: {
          stickers: { kupa: 5, kotu: "a" },
          cosmetics: null,
          streak: "x",
          starsSpent: "2",
        },
        quests: { day: 5, items: "x" },
        inbox: { id: "x" },
        seenEventIds: [1, "a"],
      }),
    );
    loginAs("dogukan");
    const p = getProgress();
    expect(p.days).toEqual({});
    expect(p.activities.tetris).toMatchObject({
      best: 40,
      stars: 2,
      plays: 0,
      ease: 0.7,
    });
    expect(p.activities.bozuk).toBeUndefined();
    expect(p.skills).toEqual({});
    expect(p.topics.miknatislar).toMatchObject({
      favorite: true,
      complete: false,
      capsuleDone: false,
    });
    expect(p.topics.x).toBeUndefined();
    expect(p.rewards).toMatchObject({
      stickers: { kupa: 5 },
      cosmetics: { owned: [], equipped: null },
      streak: { count: 0, lastDay: null },
      starsSpent: 0,
    });
    expect(p.quests).toEqual({ day: null, items: [] });
    expect(p.inbox).toEqual([]);
    expect(p.seenEventIds).toEqual(["a"]);
    expect(Number.isFinite(p.createdAt)).toBe(true);
    // Bozuk veriden sonra olaylar çalışır.
    trackEvent({ type: "run_end", slug: "tetris", score: 1500, durationMs: 1 });
    expect(getProgress().activities.tetris?.plays).toBe(1);
  });

  it("bozuk gün kovası alanları düzeltilir; eski günden mola tabanı ve ömür boyu set türetilir", () => {
    const day = dayKey();
    localStorage.setItem(
      KEY,
      JSON.stringify({
        v: 1,
        days: {
          [day]: {
            totalSec: 900,
            sinceBreakSec: 200,
            setsDone: 3,
            opens: "x",
            plays: null,
            sessionsEndedBy: 4,
          },
          "bozuk-anahtar": { totalSec: 1 },
        },
      }),
    );
    loginAs("dogukan");
    const p = getProgress();
    expect(Object.keys(p.days)).toEqual([day]);
    expect(p.days[day]).toMatchObject({
      totalSec: 900,
      sinceBreakSec: 200,
      breakAtTotalSec: 700,
      opens: 0,
      plays: {},
    });
    expect(p.days[day]?.sessionsEndedBy.limit).toBe(0);
    expect(p.lifetime?.sets).toBe(3);
    trackEvent({ type: "app_open" });
    expect(getProgress().days[day]?.opens).toBe(1);
  });
});

describe("useProgress", () => {
  it("yalnızca seçilen değer değişince yeniden çizer", () => {
    loginAs("dogukan");
    let renders = 0;
    const selectTetris = (p: Progress) => p.activities.tetris?.best ?? 0;
    function Probe() {
      renders += 1;
      const best = useProgress(selectTetris);
      return <span data-testid="best">{best}</span>;
    }
    const { getByTestId } = render(<Probe />);
    const initial = renders;
    act(() => {
      trackEvent({ type: "run_end", slug: "super-ayi", score: 10, durationMs: 1 });
    });
    expect(renders).toBe(initial);
    act(() => {
      trackEvent({ type: "run_end", slug: "tetris", score: 7, durationMs: 1 });
    });
    expect(getByTestId("best").textContent).toBe("7");
    expect(renders).toBe(initial + 1);
  });
});
