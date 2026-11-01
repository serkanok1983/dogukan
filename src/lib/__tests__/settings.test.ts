import { describe, expect, it, vi } from "vitest";

async function fresh() {
  vi.resetModules();
  return import("@/lib/settings");
}

describe("settings", () => {
  it("varsayılanlar plan K14 ile aynı", async () => {
    const { getSettings } = await fresh();
    expect(getSettings()).toMatchObject({
      weekdayMinutes: 30,
      weekendMinutes: 45,
      arcadeMinutes: 16,
      arcadeMaxMinutes: 26,
      breakEveryMinutes: 25,
      bedtime: "20:30",
      wakeFrom: "07:00",
      episodesPerDay: 2,
      rivalVisible: false,
      babaIleEnabled: false,
      companionName: "Bal",
    });
  });

  it("updateSettings yazar, olay atar ve kalıcıdır", async () => {
    const { updateSettings, getSettings } = await fresh();
    const spy = vi.fn();
    window.addEventListener("dogukan:settings", spy);
    updateSettings({ companionName: "Kaptan" });
    expect(getSettings().companionName).toBe("Kaptan");
    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener("dogukan:settings", spy);
    const reloaded = await fresh();
    expect(reloaded.getSettings().companionName).toBe("Kaptan");
  });

  it("ensureFirstLaunch tanışma günlerini bir kez ayarlar", async () => {
    const { ensureFirstLaunch } = await fresh();
    const now = Date.UTC(2026, 10, 2, 9);
    expect(ensureFirstLaunch(now).graceUntil).toBe("2026-11-04");
    expect(ensureFirstLaunch(now + 10 * 86_400_000).graceUntil).toBe("2026-11-04");
  });

  it("günlük sınır hafta sonu ve tatil modunu dikkate alır", async () => {
    const { dailyCapMinutes, DEFAULT_SETTINGS } = await fresh();
    const monday = Date.UTC(2026, 10, 2, 9);
    const saturday = Date.UTC(2026, 9, 31, 9);
    expect(dailyCapMinutes(DEFAULT_SETTINGS, monday)).toBe(30);
    expect(dailyCapMinutes(DEFAULT_SETTINGS, saturday)).toBe(45);
    expect(dailyCapMinutes({ ...DEFAULT_SETTINGS, holidayMode: true }, monday)).toBe(45);
  });
});

describe('settings — temizleme (bozuk değer "sınır yok" demek olmamalı)', () => {
  const KEY = "dogukan-settings-v1";

  it("NaN/yanlış tür → varsayılan, aralık dışı → sınıra çekilir", async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        weekdayMinutes: null,
        weekendMinutes: "45",
        arcadeMinutes: -5,
        arcadeMaxMinutes: 999,
        eveningModeMinutes: 1e9,
        episodesPerDay: 2.6,
        breakSeconds: 10,
        breakEveryMinutes: 7,
        bedtime: "25:99",
        wakeFrom: 7,
        voiceOn: "evet",
        companionName: "",
        graceUntil: "yarın",
      }),
    );
    const { getSettings, DEFAULT_SETTINGS } = await fresh();
    expect(getSettings()).toMatchObject({
      weekdayMinutes: DEFAULT_SETTINGS.weekdayMinutes,
      weekendMinutes: DEFAULT_SETTINGS.weekendMinutes,
      arcadeMinutes: 0,
      arcadeMaxMinutes: 90,
      eveningModeMinutes: 120,
      episodesPerDay: 3,
      breakSeconds: 30,
      breakEveryMinutes: DEFAULT_SETTINGS.breakEveryMinutes,
      bedtime: DEFAULT_SETTINGS.bedtime,
      wakeFrom: DEFAULT_SETTINGS.wakeFrom,
      voiceOn: true,
      companionName: "Bal",
      graceUntil: "",
    });
    localStorage.removeItem(KEY);
  });

  it("updateSettings NaN yazamaz", async () => {
    const { updateSettings, getSettings, DEFAULT_SETTINGS } = await fresh();
    updateSettings({ weekdayMinutes: Number.NaN, weekendMinutes: Infinity });
    expect(getSettings().weekdayMinutes).toBe(DEFAULT_SETTINGS.weekdayMinutes);
    expect(getSettings().weekendMinutes).toBe(DEFAULT_SETTINGS.weekendMinutes);
    localStorage.removeItem(KEY);
  });

  it("kavanoz tavanı tabanın altına inemez", async () => {
    const { updateSettings, getSettings } = await fresh();
    updateSettings({ arcadeMinutes: 16, arcadeMaxMinutes: 26 });
    // Yalnız tavan düşürülürse taban da iner.
    updateSettings({ arcadeMaxMinutes: 10 });
    expect(getSettings()).toMatchObject({ arcadeMinutes: 10, arcadeMaxMinutes: 10 });
    // Taban tavanın üstüne çıkarılırsa tavan da çıkar.
    updateSettings({ arcadeMinutes: 30 });
    expect(getSettings()).toMatchObject({ arcadeMinutes: 30, arcadeMaxMinutes: 30 });
    localStorage.removeItem(KEY);
  });
});
