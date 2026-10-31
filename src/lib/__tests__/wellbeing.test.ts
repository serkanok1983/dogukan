import { describe, expect, it } from "vitest";
import { emptyDay } from "@/lib/progress/time";
import type { DayUsage } from "@/lib/progress/types";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings";
import {
  breakDue,
  canStartArcade,
  canStartEpisode,
  computePhase,
  honeyCells,
} from "@/lib/wellbeing";

// İstanbul = UTC+3. 2026-11-02 pazartesi, 2026-10-31 cumartesi.
const at = (day: string, hhmm: string) => new Date(`${day}T${hhmm}:00+03:00`);
const MON = "2026-11-02";
const SAT = "2026-10-31";

const S: Settings = { ...DEFAULT_SETTINGS, graceUntil: "" };
const day = (patch: Partial<DayUsage> = {}): DayUsage => ({
  ...emptyDay(),
  ...patch,
});
const min = (m: number) => m * 60;

describe("computePhase — faz matrisi", () => {
  it.each([
    ["hafta içi, taze → play", at(MON, "09:00"), S, day(), "play"],
    ["25/30 → warn5", at(MON, "16:00"), S, day({ totalSec: min(25) }), "warn5"],
    ["29/30 → warn1", at(MON, "16:00"), S, day({ totalSec: min(29) }), "warn1"],
    ["30/30 → limit", at(MON, "16:00"), S, day({ totalSec: min(30) }), "limit"],
    ["20:05 → evening", at(MON, "20:05"), S, day(), "evening"],
    ["20:31 → night", at(MON, "20:31"), S, day(), "night"],
    ["06:30 → night", at(MON, "06:30"), S, day(), "night"],
    ["07:00 → play (uyanma saati)", at(MON, "07:00"), S, day(), "play"],
    ["19:59 → play (akşam öncesi)", at(MON, "19:59"), S, day(), "play"],
    [
      "tanışma günü + boş kavanoz → grace",
      at(MON, "10:00"),
      { ...S, graceUntil: MON },
      day({ arcadeSec: min(16), totalSec: min(18) }),
      "grace",
    ],
    [
      "tanışma bitti → play",
      at(MON, "10:00"),
      { ...S, graceUntil: "2026-11-01" },
      day(),
      "play",
    ],
  ] as const)("%s", (_name, now, s, d, expected) => {
    expect(computePhase(now, s, d)).toBe(expected);
  });

  it("öncelik: night > limit > warn > evening > grace", () => {
    expect(computePhase(at(MON, "21:00"), S, day({ totalSec: min(40) }))).toBe(
      "night",
    );
    expect(computePhase(at(MON, "20:10"), S, day({ totalSec: min(30) }))).toBe(
      "limit",
    );
    expect(computePhase(at(MON, "20:10"), S, day({ totalSec: min(26) }))).toBe(
      "warn5",
    );
    expect(computePhase(at(MON, "20:10"), { ...S, graceUntil: MON }, day())).toBe(
      "evening",
    );
    expect(
      computePhase(
        at(MON, "16:00"),
        { ...S, graceUntil: MON },
        day({ totalSec: min(30) }),
      ),
    ).toBe("limit");
  });

  it("hafta sonu ve tatil 45 dk, uzatma sınırı büyütür", () => {
    expect(computePhase(at(SAT, "11:00"), S, day({ totalSec: min(30) }))).toBe(
      "play",
    );
    expect(computePhase(at(SAT, "11:00"), S, day({ totalSec: min(45) }))).toBe(
      "limit",
    );
    expect(
      computePhase(
        at(MON, "11:00"),
        { ...S, holidayMode: true },
        day({ totalSec: min(30) }),
      ),
    ).toBe("play");
    expect(
      computePhase(
        at(MON, "11:00"),
        S,
        day({ totalSec: min(30), extensionMinutes: 10, extensions: 1 }),
      ),
    ).toBe("play");
  });

  it("gece yarısını aşmayan ya da aşan yatma saatleri", () => {
    const late = { ...S, bedtime: "23:30", wakeFrom: "06:00" };
    expect(computePhase(at(MON, "23:45"), late, day())).toBe("night");
    expect(computePhase(at(MON, "05:59"), late, day())).toBe("night");
    expect(computePhase(at(MON, "23:10"), late, day())).toBe("evening");
    expect(computePhase(at(MON, "06:00"), late, day())).toBe("play");
  });
});

describe("honeyCells", () => {
  it("16 dk taban → 8 hücre, kapasite 13", () => {
    expect(honeyCells(S, day())).toEqual({ left: 8, capacity: 13 });
  });

  it("3 set (+6) → 13 hücrede tavan", () => {
    expect(honeyCells(S, day({ honeyEarned: 6 })).left).toBe(13);
  });

  it("aktif arcade süresi boşaltır, birlikte oyun boşaltmaz", () => {
    expect(honeyCells(S, day({ arcadeSec: 130 })).left).toBe(7);
    expect(honeyCells(S, day({ coplaySec: 900 })).left).toBe(8);
    expect(honeyCells(S, day({ arcadeSec: min(16) })).left).toBe(0);
  });
});

describe("canStartArcade / canStartEpisode / breakDue", () => {
  const empty = day({ arcadeSec: min(16) });

  it("boş kavanoz kapı olur; birlikte oyunda ve tanışma gününde olmaz", () => {
    expect(canStartArcade(at(MON, "10:00"), S, empty, false)).toBe(false);
    expect(canStartArcade(at(MON, "10:00"), S, empty, true)).toBe(true);
    expect(
      canStartArcade(at(MON, "10:00"), { ...S, graceUntil: MON }, empty, false),
    ).toBe(true);
    expect(canStartArcade(at(MON, "10:00"), S, day(), false)).toBe(true);
  });

  it("gece ve günlük sınırda birlikte oyun da açılmaz; akşam arcade uyur", () => {
    expect(canStartArcade(at(MON, "21:00"), S, day(), true)).toBe(false);
    expect(
      canStartArcade(at(MON, "10:00"), S, day({ totalSec: min(30) }), true),
    ).toBe(false);
    expect(canStartArcade(at(MON, "20:10"), S, day(), false)).toBe(false);
    expect(canStartArcade(at(MON, "20:10"), S, day(), true)).toBe(true);
  });

  it("bölüm sınırı ve mola zamanı", () => {
    expect(canStartEpisode(S, day({ episodesDone: 1 }))).toBe(true);
    expect(canStartEpisode(S, day({ episodesDone: 2 }))).toBe(false);
    expect(breakDue(S, day({ sinceBreakSec: min(25) - 5 }))).toBe(false);
    expect(breakDue(S, day({ sinceBreakSec: min(25) }))).toBe(true);
    expect(
      breakDue({ ...S, breakEveryMinutes: 20 }, day({ sinceBreakSec: 1200 })),
    ).toBe(true);
  });
});
