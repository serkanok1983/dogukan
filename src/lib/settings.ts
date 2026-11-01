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
  /** S6 (ek, isteğe bağlı): tanışma ipucunun gösterildiği gün (bir kez gösterilir). */
  graceHintDay?: DayKey;
  /** S6 (ek, isteğe bağlı): /bilgi ilk kurulum listesi, madde id → tamam. */
  parentChecklist?: Record<string, boolean>;
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

export const BREAK_EVERY_OPTIONS = [15, 20, 25, 30] as const;
export const BREAK_SECONDS_MIN = 30;
export const BREAK_SECONDS_MAX = 45;

const EVENT = "dogukan:settings";
let cached: Settings | null = null;

type NumericKey =
  | "weekdayMinutes"
  | "weekendMinutes"
  | "arcadeMinutes"
  | "arcadeMaxMinutes"
  | "breakSeconds"
  | "eveningModeMinutes"
  | "episodesPerDay";

/** Sayısal ayarların güvenli aralıkları (ebeveyn panelindeki adımlayıcılarla aynı). */
export const SETTING_RANGES: Readonly<
  Record<NumericKey, readonly [number, number]>
> = {
  weekdayMinutes: [10, 120],
  weekendMinutes: [10, 180],
  arcadeMinutes: [0, 60],
  arcadeMaxMinutes: [2, 90],
  breakSeconds: [BREAK_SECONDS_MIN, BREAK_SECONDS_MAX],
  eveningModeMinutes: [0, 120],
  episodesPerDay: [0, 5],
};

const BOOL_KEYS = [
  "voiceOn",
  "soundOn",
  "hapticsOn",
  "babaIleEnabled",
  "rivalVisible",
  "holidayMode",
  "firstLaunchDone",
  "firstBreakDone",
] as const;

const HHMM = /^([01]?\d|2[0-3]):[0-5]\d$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function clampNumber(value: unknown, key: NumericKey): number {
  const [min, max] = SETTING_RANGES[key];
  if (typeof value !== "number" || !Number.isFinite(value))
    return DEFAULT_SETTINGS[key];
  return Math.min(max, Math.max(min, Math.round(value)));
}

/**
 * Bozuk veya aralık dışı değerleri güvenli değerlere çeker (NaN "sınır yok" demek
 * olmamalı). Mola halkası 30–45 sn (K13); kavanoz tavanı tabanın altına inemez:
 * yalnız tavan değiştiyse taban aşağı çekilir, aksi hâlde tavan yukarı itilir.
 */
function sanitize(s: Settings, patch?: Partial<Settings>): Settings {
  const next = { ...s } as Settings;
  for (const key of Object.keys(SETTING_RANGES) as NumericKey[]) {
    next[key] = clampNumber(s[key], key);
  }
  if (next.arcadeMaxMinutes < next.arcadeMinutes) {
    const maxOnly =
      patch !== undefined &&
      "arcadeMaxMinutes" in patch &&
      !("arcadeMinutes" in patch);
    if (maxOnly) next.arcadeMinutes = next.arcadeMaxMinutes;
    else
      next.arcadeMaxMinutes = Math.min(
        SETTING_RANGES.arcadeMaxMinutes[1],
        next.arcadeMinutes,
      );
    next.arcadeMinutes = Math.min(next.arcadeMinutes, next.arcadeMaxMinutes);
  }
  if (!(BREAK_EVERY_OPTIONS as readonly number[]).includes(s.breakEveryMinutes))
    next.breakEveryMinutes = DEFAULT_SETTINGS.breakEveryMinutes;
  if (typeof s.bedtime !== "string" || !HHMM.test(s.bedtime.trim()))
    next.bedtime = DEFAULT_SETTINGS.bedtime;
  if (typeof s.wakeFrom !== "string" || !HHMM.test(s.wakeFrom.trim()))
    next.wakeFrom = DEFAULT_SETTINGS.wakeFrom;
  for (const key of BOOL_KEYS) {
    if (typeof s[key] !== "boolean") next[key] = DEFAULT_SETTINGS[key];
  }
  if (typeof s.companionName !== "string" || !s.companionName.trim())
    next.companionName = DEFAULT_SETTINGS.companionName;
  if (
    s.graceUntil !== "" &&
    (typeof s.graceUntil !== "string" || !DAY.test(s.graceUntil))
  )
    next.graceUntil = "";
  if (typeof s.updatedAt !== "number" || !Number.isFinite(s.updatedAt))
    next.updatedAt = 0;

  const keys = Object.keys(next) as (keyof Settings)[];
  return keys.every((k) => Object.is(next[k], s[k])) ? s : next;
}

function load(): Settings {
  const raw = readJSON<Partial<Settings> | null>(KEYS.settings, null);
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? sanitize({ ...DEFAULT_SETTINGS, ...raw })
    : DEFAULT_SETTINGS;
}

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  if (!cached) cached = load();
  return cached;
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const next: Settings = sanitize(
    {
      ...getSettings(),
      ...patch,
      updatedAt: Date.now(),
    },
    patch,
  );
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
