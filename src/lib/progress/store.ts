/**
 * Yerel öncelikli ilerleme deposu (CONTRACT §3.4). DONDURULMUŞ API.
 *
 * - Oyuncu başına tek anahtar: `dogukan-progress-v1:{player}`.
 * - Bellek içi kopya; 300 ms gecikmeyle ve sayfa gizlenince kalıcılaştırılır.
 * - Diğer sekmelerden gelen yazımlar `mergeProgress` ile birleştirilir.
 * - Oturum değişince (`dogukan:session`) doğru oyuncunun verisi yüklenir.
 */
import { getPlayerId, type PlayerId } from "@/lib/auth";
import { KEYS, progressKey, readJSON, readRaw, writeJSON } from "@/lib/storage";
import { mergeProgress, reduceProgress } from "./reducers";
import { addDays, dayKey, emptyProgress } from "./time";
import type { Progress, ProgressEvent, TopicState } from "./types";

const PERSIST_DELAY_MS = 300;
const KEEP_DAYS = 60;

const SERVER_SNAPSHOT: Progress = emptyProgress("dogukan", 0);

let state: Progress | null = null;
let loadedFor: PlayerId | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let browserHooksInstalled = false;
const listeners = new Set<() => void>();

function emit() {
  for (const cb of listeners) {
    try {
      cb();
    } catch (err) {
      console.warn("progress listener", err);
    }
  }
}

function pruneDays(p: Progress, now: number): Progress {
  const cutoff = addDays(dayKey(now), -KEEP_DAYS);
  const keys = Object.keys(p.days);
  if (keys.every((k) => k >= cutoff)) return p;
  const days = Object.fromEntries(Object.entries(p.days).filter(([k]) => k >= cutoff));
  return { ...p, days };
}

type LegacyEntry = { favorite?: boolean; complete?: boolean; lastVisited?: string };

function migrateLegacyTopics(p: Progress): Progress {
  const legacy = readJSON<Record<string, LegacyEntry> | null>(KEYS.legacyEncyclopedia, null);
  if (!legacy || typeof legacy !== "object") return p;
  const topics: Record<string, TopicState> = { ...p.topics };
  for (const [slug, entry] of Object.entries(legacy)) {
    if (!entry || typeof entry !== "object" || topics[slug]) continue;
    const lastAt = entry.lastVisited ? Date.parse(entry.lastVisited) || 0 : 0;
    topics[slug] = {
      capsuleDone: false,
      favorite: Boolean(entry.favorite),
      complete: Boolean(entry.complete),
      lastAt,
    };
  }
  return { ...p, topics };
}

/** Eksik alanları varsayılanlarla tamamlar; bozuk veri depoyu çökertmez. */
function normalize(raw: unknown, player: PlayerId, now: number): Progress | null {
  if (!raw || typeof raw !== "object" || (raw as { v?: unknown }).v !== 1) return null;
  const base = emptyProgress(player, now);
  const r = raw as Partial<Progress>;
  return {
    ...base,
    ...r,
    player,
    rewards: {
      ...base.rewards,
      ...r.rewards,
      cosmetics: { ...base.rewards.cosmetics, ...r.rewards?.cosmetics },
      streak: { ...base.rewards.streak, ...r.rewards?.streak },
    },
    quests: { ...base.quests, ...r.quests },
    inbox: Array.isArray(r.inbox) ? r.inbox : [],
    seenEventIds: Array.isArray(r.seenEventIds) ? r.seenEventIds : [],
  };
}

function loadFromStorage(player: PlayerId, now: number = Date.now()): Progress {
  const stored = normalize(readJSON<unknown>(progressKey(player), null), player, now);
  if (stored) return pruneDays(stored, now);
  return migrateLegacyTopics(emptyProgress(player, now));
}

function persistNow() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (state && loadedFor) writeJSON(progressKey(loadedFor), state);
}

function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(persistNow, PERSIST_DELAY_MS);
}

function installBrowserHooks() {
  if (browserHooksInstalled || typeof window === "undefined") return;
  browserHooksInstalled = true;
  window.addEventListener("pagehide", persistNow);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") persistNow();
  });
  window.addEventListener("storage", (e) => {
    if (!loadedFor || e.key !== progressKey(loadedFor) || !e.newValue || !state) return;
    try {
      const incoming = normalize(JSON.parse(e.newValue), loadedFor, Date.now());
      if (!incoming) return;
      state = mergeProgress(state, incoming);
      emit();
    } catch {
      /* bozuk veri: yok say */
    }
  });
  window.addEventListener("dogukan:session", () => reloadProgressForPlayer());
}

function ensureLoaded(): void {
  if (typeof window === "undefined") return;
  installBrowserHooks();
  const player = getPlayerId();
  if (player === loadedFor && (state || !player)) return;
  persistNow();
  loadedFor = player;
  state = player ? loadFromStorage(player) : null;
}

export function getProgress(): Progress {
  ensureLoaded();
  return state ?? SERVER_SNAPSHOT;
}

export function getServerProgress(): Progress {
  return SERVER_SNAPSHOT;
}

export function subscribeProgress(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function reloadProgressForPlayer(): void {
  persistNow();
  loadedFor = null;
  state = null;
  ensureLoaded();
  emit();
}

export function readProgressSnapshot(player: PlayerId): Progress {
  ensureLoaded();
  if (player === loadedFor && state) return state;
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  return loadFromStorage(player);
}

export function flushProgress(): void {
  persistNow();
}

/** @internal Yalnızca events.ts çağırır. Uygulanırsa yeni durumu döndürür. */
export function _applyEvent(e: ProgressEvent): Progress | null {
  ensureLoaded();
  if (!state) return null;
  const next = reduceProgress(state, e);
  if (next === state) return null;
  state = next;
  schedulePersist();
  emit();
  return next;
}

/** @internal Testler için. */
export function _resetProgressForTests(p?: Progress): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = null;
  state = p ?? null;
  loadedFor = p ? p.player : null;
  listeners.clear();
}

/** @internal Testler için: depolamadaki ham değeri okur. */
export function _readStoredForTests(player: PlayerId): string | null {
  return readRaw(progressKey(player));
}
