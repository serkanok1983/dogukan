import { describe, expect, it } from "vitest";
import {
  addDays,
  dayKey,
  daysBetween,
  emptyProgress,
  isWeekend,
  minutesOfDay,
  parseHHMM,
  weekKey,
} from "../time";

// 2026-10-31 Cumartesi, 21:30 İstanbul (UTC+3) = 18:30 UTC
const SAT_EVENING = Date.UTC(2026, 9, 31, 18, 30);

describe("time", () => {
  it("dayKey İstanbul saatini kullanır", () => {
    expect(dayKey(SAT_EVENING)).toBe("2026-10-31");
    // 22:30 UTC = 01:30 İstanbul, ertesi gün
    expect(dayKey(Date.UTC(2026, 9, 31, 22, 30))).toBe("2026-11-01");
  });

  it("addDays ve daysBetween ay sınırını aşar", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-10-30", "2026-11-02")).toBe(3);
    expect(daysBetween("2026-11-02", "2026-10-30")).toBe(-3);
  });

  it("weekKey ISO haftasını verir", () => {
    expect(weekKey(Date.UTC(2026, 0, 1, 12))).toBe("2026-W01");
    expect(weekKey(SAT_EVENING)).toBe("2026-W44");
    expect(weekKey(Date.UTC(2027, 0, 1, 12))).toBe("2026-W53");
  });

  it("hafta sonu ve günün dakikası", () => {
    expect(isWeekend(SAT_EVENING)).toBe(true);
    expect(isWeekend(Date.UTC(2026, 10, 2, 9))).toBe(false); // Pazartesi
    expect(minutesOfDay(SAT_EVENING)).toBe(21 * 60 + 30);
  });

  it("parseHHMM", () => {
    expect(parseHHMM("20:30")).toBe(1230);
    expect(parseHHMM("7:05")).toBe(425);
    expect(parseHHMM("yarın")).toBeNaN();
  });

  it("emptyProgress kurulum gününü yazar", () => {
    const p = emptyProgress("dogukan", SAT_EVENING);
    expect(p.installDay).toBe("2026-10-31");
    expect(p.v).toBe(1);
    expect(p.rewards.streak.count).toBe(0);
  });
});
