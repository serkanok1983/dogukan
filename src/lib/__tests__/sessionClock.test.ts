import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loginAs, logout } from "@/lib/auth";
import { trackEvent } from "@/lib/progress/events";
import { _resetProgressForTests, getProgress } from "@/lib/progress/store";
import { emptyDay, emptyProgress } from "@/lib/progress/time";
import type { DayUsage } from "@/lib/progress/types";
import {
  _resetClockForTests,
  finishBreak,
  getOverlayDetails,
  getWellbeingSnapshot,
  grantExtension,
  isCoplayActive,
  notifyNaturalPause,
  requestCoplay,
  setClockContext,
  startCoplay,
} from "@/lib/sessionClock";
import { DEFAULT_SETTINGS, getSettings, updateSettings, type Settings } from "@/lib/settings";

const MON = "2026-11-02";
const TUE = "2026-11-03";
const at = (day: string, hhmmss: string) => new Date(`${day}T${hhmmss}+03:00`).getTime();

let hidden = false;
Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });

function setup(opts: { time: number; settings?: Partial<Settings>; today?: Partial<DayUsage>; installDay?: string }) {
  vi.useFakeTimers();
  vi.setSystemTime(opts.time);
  hidden = false;
  logout();
  _resetProgressForTests();
  loginAs("dogukan");
  const p = emptyProgress("dogukan", at("2026-10-20", "10:00:00"));
  p.installDay = opts.installDay ?? "2026-10-20";
  if (opts.today) p.days[MON] = { ...emptyDay(), ...opts.today };
  _resetProgressForTests(p);
  _resetClockForTests();
  updateSettings({ ...DEFAULT_SETTINGS, graceUntil: "", firstBreakDone: true, ...opts.settings });
}

function day(key = MON): DayUsage {
  return getProgress().days[key] ?? emptyDay();
}

/** `ms` boyunca her 10 sn'de bir dokunuş yaparak ilerler. */
function playFor(ms: number) {
  for (let t = 0; t < ms; t += 10_000) {
    window.dispatchEvent(new Event("pointerdown"));
    vi.advanceTimersByTime(Math.min(10_000, ms - t));
  }
}

function setHidden(v: boolean) {
  hidden = v;
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  hidden = false;
});

afterEach(() => {
  _resetClockForTests();
  vi.useRealTimers();
});

describe("sessionClock — süre ölçümü", () => {
  it("görünür + etkin iken 5 sn'de bir usage yazar (tür ve slug ile)", () => {
    setup({ time: at(MON, "10:00:00") });
    setClockContext({ slug: "super-ayi", kind: "arcade", running: true });
    playFor(30_000);
    expect(day().totalSec).toBe(30);
    expect(day().arcadeSec).toBe(30);
    expect(day().plays["super-ayi"]?.sec).toBe(30);
    expect(getProgress().activities["super-ayi"]?.seconds).toBe(30);
  });

  it("çalışmıyorken (running=false) saymaz", () => {
    setup({ time: at(MON, "10:00:00") });
    setClockContext({ slug: "super-ayi", kind: "arcade", running: false });
    playFor(30_000);
    expect(day().totalSec).toBe(0);
  });

  it("gizlenince durur ve session_end(background) yazar; dönünce sürer", () => {
    setup({ time: at(MON, "10:00:00") });
    setClockContext({ slug: "super-ayi", kind: "arcade", running: true });
    playFor(10_000);
    expect(day().totalSec).toBe(10);
    setHidden(true);
    playFor(60_000);
    expect(day().totalSec).toBe(10);
    expect(day().sessionsEndedBy.background).toBe(1);
    setHidden(false);
    playFor(10_000);
    expect(day().totalSec).toBe(20);
  });

  it("60 sn'den uzun boşta kalınca durur, dokununca sürer", () => {
    setup({ time: at(MON, "10:00:00") });
    setClockContext({ slug: null, kind: "learning", running: true });
    vi.advanceTimersByTime(120_000);
    expect(day().totalSec).toBe(55);
    expect(day().learningSec).toBe(55);
    window.dispatchEvent(new Event("pointerdown"));
    vi.advanceTimersByTime(5_000);
    expect(day().totalSec).toBe(60);
  });

  it("gece yarısı kovaları böler", () => {
    setup({
      time: at(MON, "23:59:45"),
      settings: { bedtime: "07:00", wakeFrom: "07:00", eveningModeMinutes: 0 },
    });
    setClockContext({ slug: "cizgi", kind: "creative", running: true });
    playFor(20_000);
    expect(day(MON).totalSec).toBe(10);
    expect(day(TUE).totalSec).toBe(10);
    expect(day(TUE).creativeSec).toBe(10);
  });

  it("birlikte oyunda arcade süresi coplaySec'e yazılır (kavanoz boşalmaz)", () => {
    setup({ time: at(MON, "10:00:00") });
    setClockContext({ slug: "super-ayi", kind: "arcade", running: true });
    requestCoplay();
    expect(getWellbeingSnapshot().overlay).toBe("coplay");
    startCoplay();
    expect(isCoplayActive()).toBe(true);
    expect(getWellbeingSnapshot().overlay).toBeNull();
    playFor(20_000);
    expect(day().coplaySec).toBe(20);
    expect(day().arcadeSec).toBe(0);
    vi.advanceTimersByTime(31 * 60_000);
    expect(isCoplayActive()).toBe(false);
  });

  it("saat atlaması yalnızca kaydedilir, asla kilitlemez", () => {
    setup({ time: at(MON, "10:00:00") });
    setClockContext({ slug: null, kind: "map", running: true });
    playFor(10_000);
    vi.setSystemTime(at(MON, "13:00:10"));
    window.dispatchEvent(new Event("pointerdown"));
    vi.advanceTimersByTime(5_000);
    expect(day().clockJumps).toBe(1);
    const wb = getWellbeingSnapshot();
    expect(wb.overlay).toBeNull();
    expect(wb.blocking).toBe(false);
    expect(wb.phase).toBe("play");
  });
});

describe("sessionClock — kaplamalar koşuyu kesmez", () => {
  const nearBreak = { sinceBreakSec: 25 * 60 - 5, totalSec: 10 * 60 };

  it("mola koşu sırasında bekler, doğal duraklamada açılır", () => {
    setup({ time: at(MON, "10:00:00"), today: nearBreak });
    setClockContext({ slug: "super-ayi", kind: "arcade", running: true });
    playFor(60_000);
    expect(getWellbeingSnapshot().overlay).toBeNull();
    trackEvent({ type: "run_end", slug: "super-ayi", score: 10, durationMs: 60_000 });
    const wb = getWellbeingSnapshot();
    expect(wb.overlay).toBe("mola");
    expect(wb.blocking).toBe(true);
  });

  it("duraklama gelmezse en geç 120 sn sonra açılır", () => {
    setup({ time: at(MON, "10:00:00"), today: nearBreak });
    setClockContext({ slug: "super-ayi", kind: "arcade", running: true });
    playFor(5_000);
    playFor(110_000);
    expect(getWellbeingSnapshot().overlay).toBeNull();
    playFor(15_000);
    expect(getWellbeingSnapshot().overlay).toBe("mola");
  });

  it("haritada hemen açılır; notifyNaturalPause da duraklamadır", () => {
    setup({ time: at(MON, "10:00:00"), today: nearBreak });
    setClockContext({ slug: null, kind: "learning", running: true });
    playFor(5_000);
    expect(getWellbeingSnapshot().overlay).toBeNull();
    notifyNaturalPause("set_end");
    expect(getWellbeingSnapshot().overlay).toBe("mola");
  });

  it("ilk mola zipla ve babayla; bitince break_done + firstBreakDone", () => {
    setup({ time: at(MON, "10:00:00"), today: nearBreak, settings: { firstBreakDone: false } });
    setClockContext({ slug: null, kind: "map", running: true });
    playFor(5_000);
    expect(getWellbeingSnapshot().overlay).toBe("mola");
    expect(getOverlayDetails()).toMatchObject({ breakId: "zipla", firstBreak: true });
    vi.advanceTimersByTime(40_000);
    expect(day().breakSec).toBeGreaterThanOrEqual(35);
    finishBreak(false);
    expect(getWellbeingSnapshot().overlay).toBeNull();
    expect(day().breaksTaken).toBe(1);
    expect(day().sinceBreakSec).toBe(0);
    expect(getSettings().firstBreakDone).toBe(true);
  });

  it("ebeveyn atlatması ayrı sayılır", () => {
    setup({ time: at(MON, "10:00:00"), today: nearBreak });
    setClockContext({ slug: null, kind: "map", running: true });
    playFor(5_000);
    finishBreak(true);
    expect(day().breaksSkippedByParent).toBe(1);
    expect(day().breaksTaken).toBe(0);
  });

  it("günlük sınır koşuyu bekler, sonra LimitScreen; uzatma kapatır", () => {
    setup({ time: at(MON, "10:00:00"), today: { totalSec: 30 * 60 - 5 } });
    setClockContext({ slug: "super-ayi", kind: "arcade", running: true });
    playFor(30_000);
    expect(day().limitReached).toBe(true);
    expect(getWellbeingSnapshot().phase).toBe("limit");
    expect(getWellbeingSnapshot().overlay).toBeNull();
    trackEvent({ type: "run_end", slug: "super-ayi", score: 10, durationMs: 30_000 });
    expect(getWellbeingSnapshot().overlay).toBe("limit");
    const frozen = day().totalSec;
    playFor(30_000);
    expect(day().totalSec).toBe(frozen);
    grantExtension(10);
    expect(day().extensionMinutes).toBe(10);
    expect(getWellbeingSnapshot().overlay).toBeNull();
  });

  it("gece kaplaması hemen açılır, bedtime_block açılış başına bir kez", () => {
    setup({ time: at(MON, "21:00:00") });
    setClockContext({ slug: "super-ayi", kind: "arcade", running: true });
    expect(getWellbeingSnapshot().overlay).toBe("night");
    playFor(30_000);
    expect(day().bedtimeBlocks).toBe(1);
    expect(day().totalSec).toBe(0);
    setHidden(true);
    setHidden(false);
    expect(day().bedtimeBlocks).toBe(2);
  });

  it("tanışma ipucu graceUntil gününde haritada bir kez", () => {
    setup({ time: at(MON, "10:00:00"), settings: { graceUntil: MON } });
    setClockContext({ slug: "super-ayi", kind: "arcade", running: true });
    expect(getWellbeingSnapshot().overlay).toBeNull();
    setClockContext({ slug: null, kind: "map", running: true });
    expect(getWellbeingSnapshot().overlay).toBe("grace-hint");
  });

  it("baba olarak oynarken kaplama yok", () => {
    setup({ time: at(MON, "21:00:00") });
    loginAs("serkan");
    setClockContext({ slug: null, kind: "map", running: true });
    expect(getWellbeingSnapshot().overlay).toBeNull();
  });

  it("anlık görüntü değişmedikçe aynı nesne", () => {
    setup({ time: at(MON, "10:00:00") });
    setClockContext({ slug: null, kind: "map", running: false });
    const a = getWellbeingSnapshot();
    vi.advanceTimersByTime(15_000);
    expect(getWellbeingSnapshot()).toBe(a);
  });
});
