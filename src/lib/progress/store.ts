/**
 * Yerel öncelikli ilerleme deposu (CONTRACT §3.4). DONDURULMUŞ API.
 *
 * - Oyuncu başına tek anahtar: `dogukan-progress-v1:{player}`.
 * - Bellek içi kopya; 300 ms gecikmeyle ve sayfa gizlenince kalıcılaştırılır.
 * - Diğer sekmelerden gelen yazımlar `mergeProgress` ile birleştirilir.
 * - Yazmadan önce depodaki değer okunup birleştirilir; `pageshow` ve
 *   `visibilitychange → visible` da depoyu yeniden okur. Böylece bfcache'ten
 *   dönen ya da dondurulmuş eski bir sekme yeni ilerlemeyi ezemez.
 * - Oturum değişince (`dogukan:session`) doğru oyuncunun verisi yüklenir.
 */
import { getPlayerId, type PlayerId } from "@/lib/auth";
import { KEYS, progressKey, readJSON, readRaw, writeRaw } from "@/lib/storage";
import { lifetimeSets } from "@/lib/stickers";
import { mergeProgress, reduceProgress } from "./reducers";
import { addDays, dayKey, emptyDay, emptyProgress } from "./time";
import type {
  ActivityStats,
  DayPlay,
  DayUsage,
  Progress,
  ProgressEvent,
  SkillState,
  TopicState,
} from "./types";

const PERSIST_DELAY_MS = 300;
const KEEP_DAYS = 60;

const SERVER_SNAPSHOT: Progress = emptyProgress("dogukan", 0);

let state: Progress | null = null;
let loadedFor: PlayerId | null = null;
/** Depoda olduğunu bildiğimiz son ham değer (okuduğumuz ya da yazdığımız); değişmediyse birleştirme atlanır. */
let lastRaw: string | null = null;
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
  const days = Object.fromEntries(
    Object.entries(p.days).filter(([k]) => k >= cutoff),
  );
  return { ...p, days };
}

type LegacyEntry = { favorite?: boolean; complete?: boolean; lastVisited?: string };

function migrateLegacyTopics(p: Progress): Progress {
  const legacy = readJSON<Record<string, LegacyEntry> | null>(
    KEYS.legacyEncyclopedia,
    null,
  );
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

// ---------------- Doğrulama: her alan kendi tipine göre, alan bazında yedek ----------------

type Obj = Record<string, unknown>;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isObj(x: unknown): x is Obj {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function num(x: unknown, fallback: number): number {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}

function strOrNull(x: unknown): string | null {
  return typeof x === "string" ? x : null;
}

function strings(x: unknown): string[] {
  return Array.isArray(x) ? x.filter((v): v is string => typeof v === "string") : [];
}

function numRecord(x: unknown): Record<string, number> {
  if (!isObj(x)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(x))
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  return out;
}

/** Kayıt değerlerinden nesne olmayanları atar, kalanları `fix` ile düzeltir. */
function objRecord<T>(x: unknown, fix: (v: Obj) => T): Record<string, T> {
  if (!isObj(x)) return {};
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(x)) if (isObj(v)) out[k] = fix(v);
  return out;
}

/** Şablondaki her alanı tipine göre denetler; uyuşmayanı şablon değeriyle değiştirir. */
function byTemplate<T extends object>(v: Obj, template: T): T {
  const out: Obj = { ...v };
  for (const [k, def] of Object.entries(template)) {
    const cur = v[k];
    const ok =
      typeof def === "number"
        ? typeof cur === "number" && Number.isFinite(cur)
        : def === null
          ? cur === null || typeof cur === "string"
          : isObj(def)
            ? isObj(cur)
            : typeof cur === typeof def;
    if (!ok) out[k] = def;
  }
  return out as T;
}

function normalizeDay(v: Obj): DayUsage {
  const base = emptyDay();
  const d = byTemplate(v, base);
  const day: DayUsage = {
    ...d,
    sessionsEndedBy: byTemplate(
      isObj(v.sessionsEndedBy) ? v.sessionsEndedBy : {},
      base.sessionsEndedBy,
    ),
    plays: objRecord(v.plays, (p) =>
      byTemplate<DayPlay>(p, { sec: 0, runs: 0, stars: 0 }),
    ),
    extensionGrants: numRecord(v.extensionGrants),
  };
  // Eski veri: mola tabanı `totalSec − sinceBreakSec`ten (dayReducer.breakBase).
  if (typeof v.breakAtTotalSec !== "number" || !Number.isFinite(v.breakAtTotalSec)) {
    day.breakAtTotalSec = day.totalSec - day.sinceBreakSec;
  }
  return day;
}

function normalizeTopic(v: Obj): TopicState {
  const t: TopicState = {
    capsuleDone: v.capsuleDone === true,
    favorite: v.favorite === true,
    complete: v.complete === true,
    lastAt: num(v.lastAt, 0),
  };
  if (typeof v.capsuleDoneAt === "number") t.capsuleDoneAt = v.capsuleDoneAt;
  if (typeof v.favoriteAt === "number") t.favoriteAt = v.favoriteAt;
  if (typeof v.completeAt === "number") t.completeAt = v.completeAt;
  return t;
}

const STATS_TEMPLATE: ActivityStats = {
  plays: 0,
  best: 0,
  bestLevel: 0,
  stars: 0,
  ease: 0.7,
  consecutiveLow: 0,
  seconds: 0,
  lastAt: 0,
};

const SKILL_TEMPLATE: SkillState = {
  level: 1,
  streak: 0,
  misses: 0,
  attempts: 0,
  correct: 0,
  firstTryCorrect: 0,
  box: 0,
  lastAt: 0,
  nextDueAt: 0,
};

/** Eksik ya da bozuk alanları varsayılanlarla tamamlar; bozuk veri depoyu çökertmez. */
function normalize(raw: unknown, player: PlayerId, now: number): Progress | null {
  if (!isObj(raw) || raw.v !== 1) return null;
  const createdAt = num(raw.createdAt, now);
  const days: Progress["days"] = {};
  if (isObj(raw.days)) {
    for (const [k, v] of Object.entries(raw.days))
      if (DAY_RE.test(k) && isObj(v)) days[k] = normalizeDay(v);
  }
  const rw = isObj(raw.rewards) ? raw.rewards : {};
  const cos = isObj(rw.cosmetics) ? rw.cosmetics : {};
  const st = isObj(rw.streak) ? rw.streak : {};
  const q = isObj(raw.quests) ? raw.quests : {};
  return {
    v: 1,
    player,
    createdAt,
    installDay:
      typeof raw.installDay === "string" && DAY_RE.test(raw.installDay)
        ? raw.installDay
        : dayKey(createdAt),
    updatedAt: num(raw.updatedAt, createdAt),
    activities: objRecord(raw.activities, (a) => byTemplate(a, STATS_TEMPLATE)),
    skills: objRecord(raw.skills, (s) => byTemplate(s, SKILL_TEMPLATE)),
    topics: objRecord(raw.topics, normalizeTopic),
    days,
    rewards: {
      stickers: numRecord(rw.stickers),
      cosmetics: { owned: strings(cos.owned), equipped: strOrNull(cos.equipped) },
      starsSpent: num(rw.starsSpent, 0),
      streak: {
        count: num(st.count, 0),
        lastDay: strOrNull(st.lastDay),
        freezeUsedWeek: strOrNull(st.freezeUsedWeek),
      },
      questDays: strings(rw.questDays),
    },
    quests: {
      day: strOrNull(q.day),
      items: Array.isArray(q.items)
        ? (q.items.filter(
            (it) => isObj(it) && typeof it.id === "string",
          ) as Progress["quests"]["items"])
        : [],
    },
    inbox: Array.isArray(raw.inbox)
      ? (raw.inbox.filter(
          (n) =>
            isObj(n) &&
            typeof n.id === "string" &&
            typeof n.at === "number" &&
            typeof n.kind === "string",
        ) as Progress["inbox"])
      : [],
    seenEventIds: strings(raw.seenEventIds),
    ackedNotices: numRecord(raw.ackedNotices),
    // Eski veride yok: gün toplamından başlar (stickers.lifetimeSets).
    lifetime: {
      sets: lifetimeSets({
        days,
        lifetime: { sets: num(isObj(raw.lifetime) ? raw.lifetime.sets : 0, 0) },
      }),
    },
  };
}

function parseStored(
  raw: string | null,
  player: PlayerId,
  now: number,
): Progress | null {
  if (raw === null) return null;
  try {
    const p = normalize(JSON.parse(raw), player, now);
    return p ? pruneDays(p, now) : null;
  } catch {
    return null;
  }
}

function loadFromStorage(player: PlayerId, now: number = Date.now()): Progress {
  const stored = parseStored(readRaw(progressKey(player)), player, now);
  if (stored) return stored;
  return migrateLegacyTopics(emptyProgress(player, now));
}

/**
 * Depodaki değeri (başka sekme yazmış olabilir) bellekteki duruma birleştirir.
 * Değiştiyse `true`. Ham değer son bildiğimizle aynıysa hiçbir şey yapmaz.
 */
function mergeFromStorage(): boolean {
  if (!state || !loadedFor) return false;
  const raw = readRaw(progressKey(loadedFor));
  if (raw === null || raw === lastRaw) return false;
  lastRaw = raw;
  const stored = parseStored(raw, loadedFor, Date.now());
  if (!stored) return false;
  state = mergeProgress(stored, state);
  return true;
}

function persistNow() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (!state || !loadedFor) return;
  const changed = mergeFromStorage();
  const raw = JSON.stringify(state);
  writeRaw(progressKey(loadedFor), raw);
  lastRaw = raw;
  if (changed) emit();
}

/** `pageshow` / görünür olunca: başka sekmenin yazdıklarını al. */
function syncFromStorage() {
  if (mergeFromStorage()) emit();
}

function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(persistNow, PERSIST_DELAY_MS);
}

function installBrowserHooks() {
  if (browserHooksInstalled || typeof window === "undefined") return;
  browserHooksInstalled = true;
  window.addEventListener("pagehide", persistNow);
  window.addEventListener("pageshow", syncFromStorage);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") persistNow();
    else if (document.visibilityState === "visible") syncFromStorage();
  });
  window.addEventListener("storage", (e) => {
    if (!loadedFor || e.key !== progressKey(loadedFor) || !e.newValue || !state)
      return;
    const incoming = parseStored(e.newValue, loadedFor, Date.now());
    if (!incoming) return; // bozuk veri: yok say
    lastRaw = e.newValue;
    state = mergeProgress(state, incoming);
    emit();
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
  lastRaw = player ? readRaw(progressKey(player)) : null;
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
  // Verilen durum gerçektir: depoda kalan eski test verisi birleştirilmez, üzerine yazılır.
  lastRaw = p ? readRaw(progressKey(p.player)) : null;
  listeners.clear();
}

/** @internal Testler için: depolamadaki ham değeri okur. */
export function _readStoredForTests(player: PlayerId): string | null {
  return readRaw(progressKey(player));
}
