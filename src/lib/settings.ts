/**
 * Ebeveyn ayarları (CONTRACT §7). Cihaz genelinde, çocuğu tanımlar.
 * C0 yazdı; sahibi S6 (ayar ekranı ve iyi oluş kuralları).
 */
import { useMemo, useSyncExternalStore } from "react";
import { addDays, dayKey, isWeekend } from "@/lib/progress/time";
import type { DayKey } from "@/lib/progress/types";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";

export type Settings = {
  weekdayMinutes: number;
  weekendMinutes: number;
  arcadeMinutes: number;
  arcadeMaxMinutes: number;
  breakEveryMinutes: 15 | 20 | 25 | 30;
  breakSeconds: number;
  bedtime: string;
  wakeFrom: string;
  eveningModeMinutes: number;
  episodesPerDay: number;
  voiceOn: boolean;
  soundOn: boolean;
  hapticsOn: boolean;
  babaIleEnabled: boolean;
  rivalVisible: boolean;
  companionName: string;
  graceUntil: DayKey | "";
  holidayMode: boolean;
  firstLaunchDone: boolean;
  firstBreakDone: boolean;
  updatedAt: number;
};

export const DEFAULT_SETTINGS: Settings = Object.freeze({
  weekdayMinutes: 30,
  weekendMinutes: 45,
  arcadeMinutes: 16,
  arcadeMaxMinutes: 26,
  breakEveryMinutes: 25,
  breakSeconds: 40,
  bedtime: "20:30",
  wakeFrom: "07:00",
  eveningModeMinutes: 30,
  episodesPerDay: 2,
  voiceOn: true,
  soundOn: true,
  hapticsOn: true,
  babaIleEnabled: false,
  rivalVisible: false,
  companionName: "Bal",
  graceUntil: "",
  holidayMode: false,
  firstLaunchDone: false,
  firstBreakDone: false,
  updatedAt: 0,
}) as Settings;

export const COMPANION_NAMES = ["Bal", "Pati", "Fıstık", "Kaptan"] as const;

const EVENT = "dogukan:settings";
let cached: Settings | null = null;

function load(): Settings {
  const raw = readJSON<Partial<Settings> | null>(KEYS.settings, null);
  return raw && typeof raw === "object" ? { ...DEFAULT_SETTINGS, ...raw } : DEFAULT_SETTINGS;
}

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  if (!cached) cached = load();
  return cached;
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const next: Settings = { ...getSettings(), ...patch, updatedAt: Date.now() };
  cached = next;
  writeJSON(KEYS.settings, next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  }
  return next;
}

export function subscribeSettings(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEYS.settings) return;
    cached = null;
    cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Seçici kararlı (modül düzeyi veya useCallback) olmalı; sonuç ilkel ya da ayarlardan bir referans olmalı. */
export function useSettings<T>(selector: (s: Settings) => T): T {
  const [getSnapshot, getServerSnapshot] = useMemo(
    () => [() => selector(getSettings()), () => selector(DEFAULT_SETTINGS)] as const,
    [selector],
  );
  return useSyncExternalStore(subscribeSettings, getSnapshot, getServerSnapshot);
}

/** İlk açılışta tanışma günlerini ayarlar (kurulum günü + 2). Tekrar çağrılabilir. */
export function ensureFirstLaunch(now: number = Date.now()): Settings {
  const s = getSettings();
  if (s.graceUntil) return s;
  return updateSettings({ graceUntil: addDays(dayKey(now), 2) });
}

export function dailyCapMinutes(s: Settings, now: number = Date.now()): number {
  return s.holidayMode || isWeekend(now) ? s.weekendMinutes : s.weekdayMinutes;
}
