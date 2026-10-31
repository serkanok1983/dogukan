import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loginAs, logout } from "@/lib/auth";
import { EPISODES } from "@/lib/capsules";
import {
  buildQuests,
  ensureTodayQuests,
  slugForSkill,
  useQuests,
} from "@/lib/quests";
import { SKILLS } from "@/lib/skills";
import { ACTIVITY_INFO } from "@/lib/worlds";
import { onEvent } from "../events";
import { reduceProgress } from "../reducers";
import { _resetProgressForTests, getProgress } from "../store";
import { DAY_MS, dayKey, emptyProgress } from "../time";
import type { Progress, ProgressEvent } from "../types";

const T0 = Date.UTC(2026, 10, 2, 9, 0);
const day = dayKey(T0);

describe("buildQuests", () => {
  it("aynı gün + aynı ilerleme → aynı 3 görev; kimlikler gün:slot", () => {
    const p = emptyProgress("dogukan", T0);
    const a = buildQuests(p, T0);
    expect(buildQuests(p, T0 + 3_600_000)).toEqual(a);
    expect(a.map((q) => q.id)).toEqual([`${day}:0`, `${day}:1`, `${day}:2`]);
    expect(a.map((q) => q.kind)).toEqual(["tr", "mat", "extra"]);
  });

  it("TR/MAT görevleri görünür egzersiz slug'ı açar", () => {
    const [tr, mat] = buildQuests(emptyProgress("dogukan", T0), T0);
    for (const q of [tr!, mat!]) {
      const info = ACTIVITY_INFO[q.slug!];
      expect(info?.exercise).toBe(true);
      expect(info?.hidden).toBeUndefined();
      expect(info?.skill).toBe(q.skill);
    }
    expect(SKILLS[tr!.skill!].strand).toBe("tr");
    expect(SKILLS[mat!.skill!].strand).toBe("mat");
  });

  it("ek slot: bugün bitmemiş kapsül ya da HB/EF etkinliği", () => {
    const extra = buildQuests(emptyProgress("dogukan", T0), T0)[2]!;
    if (EPISODES.length > 0)
      expect(EPISODES.some((e) => e.topic === extra.topic)).toBe(true);
    else
      expect(["hb", "ef"]).toContain(
        SKILLS[ACTIVITY_INFO[extra.slug!]!.skill!].strand,
      );
  });

  it("zamanı gelmiş tekrar aynı alandaki slotun yerine geçer", () => {
    let p: Progress = emptyProgress("dogukan", T0);
    const item = (i: number): ProgressEvent => ({
      type: "exercise_item",
      slug: "sayma-oyunu",
      skill: "mat.sayma",
      level: 1,
      firstTry: true,
      correct: true,
      review: false,
      ms: 500,
      id: `q${i}`,
      at: T0,
    });
    for (let i = 0; i < 3; i++) p = reduceProgress(p, item(i));
    const later = T0 + 2 * DAY_MS;
    const quests = buildQuests(p, later);
    const review = quests.find((q) => q.kind === "review");
    expect(review?.skill).toBe("mat.sayma");
    expect(review?.id).toBe(`${dayKey(later)}:1`);
    expect(review?.slug).toBe(slugForSkill("mat.sayma"));
  });
});

describe("ensureTodayQuests / useQuests", () => {
  beforeEach(() => {
    logout();
    _resetProgressForTests();
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(T0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("oturum yoksa hiçbir şey yapmaz; varsa günde bir kez quests_set yayar", () => {
    const spy = vi.fn();
    const off = onEvent("quests_set", spy);
    ensureTodayQuests(T0);
    expect(spy).not.toHaveBeenCalled();
    loginAs("dogukan");
    ensureTodayQuests(T0);
    ensureTodayQuests(T0 + 1000);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getProgress().quests.day).toBe(day);
    ensureTodayQuests(T0 + DAY_MS);
    expect(spy).toHaveBeenCalledTimes(2);
    off();
  });

  it("useQuests bugünün görevlerini emoji + söz + href ile döndürür", () => {
    loginAs("dogukan");
    ensureTodayQuests(T0);
    const { result, rerender } = renderHook(() => useQuests());
    expect(result.current.items).toHaveLength(3);
    expect(result.current.allDone).toBe(false);
    const first = result.current;
    rerender();
    expect(result.current).toBe(first); // kararlı seçici: gereksiz yeni nesne yok
    const tr = result.current.items[0]!;
    expect(tr.href).toMatch(/^\/aktivite\/[a-z-]+\/$/);
    expect(tr.emoji).not.toBe("");
    expect(tr.say).not.toBe("");
  });
});
