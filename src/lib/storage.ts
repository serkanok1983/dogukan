import type { PlayerId } from "@/lib/auth";

/**
 * Tüm localStorage/sessionStorage anahtarları burada (CONTRACT §1).
 * Okuma/yazma SSR'da ve gizli gezinmede asla hata fırlatmaz.
 */
export const KEYS = {
  loggedIn: "dogukan-logged-in",
  player: "dogukan-player",
  settings: "dogukan-settings-v1",
  outbox: "dogukan-outbox-v1",
  errors: "dogukan-errors",
  pinLock: "dogukan-pin-lock",
  parentUntil: "dogukan-parent-until",
  installDismissed: "dogukan-install-card-dismissed",
  legacyEncyclopedia: "dogukan-merak-ansiklopedisi-v1",
} as const;

type Area = "local" | "session";

function getArea(area: Area): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return area === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function progressKey(player: PlayerId): string {
  return `dogukan-progress-v1:${player}`;
}

export function blocksKey(player: PlayerId): string {
  return `dogukan-blocks-v1:${player}`;
}

export function readRaw(key: string, area: Area = "local"): string | null {
  try {
    return getArea(area)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T, area: Area = "local"): T {
  const raw = readRaw(key, area);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeRaw(key: string, value: string, area: Area = "local"): void {
  try {
    getArea(area)?.setItem(key, value);
  } catch {
    /* Kota dolu veya gizli gezinme: öğrenmeyi engellememeli. */
  }
}

export function writeJSON(key: string, value: unknown, area: Area = "local"): void {
  writeRaw(key, JSON.stringify(value), area);
}

export function removeKey(key: string, area: Area = "local"): void {
  try {
    getArea(area)?.removeItem(key);
  } catch {
    /* yok say */
  }
}
