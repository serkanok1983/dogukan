import { useSyncExternalStore } from "react";
import {
  KEYS,
  readJSON,
  readRaw,
  removeKey,
  writeJSON,
  writeRaw,
} from "@/lib/storage";

/**
 * Oyuncular, oturum ve ebeveyn modu (CONTRACT §9). Sahibi S1.
 *
 * Düz metin parolalar kaldırıldı: çocuk fotoğrafına dokunarak girer, ebeveyn
 * aritmetik kapı + PIN'den geçer. PIN bir çocuk kapısıdır, güvenlik değildir
 * (hash istemci paketinde herkese açıktır).
 */
export const PLAYERS = {
  dogukan: { displayName: "Doğukan" },
  serkan: { displayName: "Serkan" },
} as const satisfies Record<string, { displayName: string }>;

export type PlayerId = keyof typeof PLAYERS;

const STORAGE_KEY = KEYS.loggedIn;
const PLAYER_KEY = KEYS.player;

/**
 * Yalnızca bu oyuncu cihazda kalıcı oturum açabilir. Baba (`serkan`) girişi
 * sekmeye özeldir (sessionStorage): yeni sekme/PWA açılışı asla babanın
 * oturumuyla, yani çocuk korumaları (süre, uyku, mola, etkinlik kaydı) kapalı
 * başlamaz.
 */
const PERSISTENT_PLAYER: PlayerId = "dogukan";

/**
 * Eski sürümün "Oturumu açık tut" seçeneği ya da eski `loginAs("serkan")`
 * localStorage'a baba girişi yazmış olabilir: onu kaldırır. Bu sekmedeki
 * sessionStorage oturumuna dokunmaz. İdempotent; her okumada çağrılır.
 */
function dropPersistentFatherLogin(): void {
  const stored = readRaw(PLAYER_KEY, "local");
  if (stored === null || stored === PERSISTENT_PLAYER) return;
  removeKey(STORAGE_KEY, "local");
  removeKey(PLAYER_KEY, "local");
}

export function getPlayerId(): PlayerId | null {
  if (typeof window === "undefined") return null;
  dropPersistentFatherLogin();
  const id = readRaw(PLAYER_KEY, "session") ?? readRaw(PLAYER_KEY, "local");
  if (id && id in PLAYERS) return id as PlayerId;
  return null;
}

export function getPlayerDisplayName(id?: PlayerId | null): string {
  const pid = id ?? getPlayerId();
  return pid ? PLAYERS[pid].displayName : "Oyuncu";
}

export function getRivalId(id: PlayerId): PlayerId {
  return id === "dogukan" ? "serkan" : "dogukan";
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  dropPersistentFatherLogin();
  return (
    readRaw(STORAGE_KEY, "session") === "true" ||
    readRaw(STORAGE_KEY, "local") === "true"
  );
}

const SESSION_EVENT = "dogukan:session";

function announceSession() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/** @deprecated `loginAs` kullanın. `remember` yalnızca Doğukan için geçerlidir. */
export function setLoggedIn(playerId: PlayerId, remember: boolean): void {
  writeRaw(STORAGE_KEY, "true", "session");
  writeRaw(PLAYER_KEY, playerId, "session");
  if (remember && playerId === PERSISTENT_PLAYER) {
    writeRaw(STORAGE_KEY, "true", "local");
    writeRaw(PLAYER_KEY, playerId, "local");
  }
  announceSession();
}

/**
 * Oturum açar (CONTRACT §9). `dogukan` kalıcıdır (local + session); `serkan`
 * yalnızca bu sekmede (session) geçerlidir ve cihazdaki Doğukan girişini
 * silmez. İlerleme deposu `dogukan:session` olayını dinler ve
 * `reloadProgressForPlayer()` çağırır (doğrudan içe aktarmak auth ↔ store
 * döngüsü yaratırdı).
 */
export function loginAs(player: PlayerId): void {
  setLoggedIn(player, true);
}

export type Session = { ready: boolean; player: PlayerId | null };

const SERVER_SESSION: Session = { ready: false, player: null };
let cachedSession: Session = SERVER_SESSION;

function readSession(): Session {
  const player = isLoggedIn() ? getPlayerId() : null;
  if (!cachedSession.ready || cachedSession.player !== player) {
    cachedSession = { ready: true, player };
  }
  return cachedSession;
}

function subscribeSession(cb: () => void): () => void {
  window.addEventListener(SESSION_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(SESSION_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function getServerSession(): Session {
  return SERVER_SESSION;
}

/** SSR ve hidrasyon sırasında `{ ready: false }`; tarayıcıda gerçek oturum. */
export function useSession(): Session {
  return useSyncExternalStore(subscribeSession, readSession, getServerSession);
}

export function logout(): void {
  removeKey(STORAGE_KEY, "session");
  removeKey(PLAYER_KEY, "session");
  removeKey(STORAGE_KEY, "local");
  removeKey(PLAYER_KEY, "local");
  removeKey("dogukan-activity-login", "session");
  announceSession();
}

/* ------------------------------------------------------------------ */
/* Ebeveyn PIN'i                                                       */
/* ------------------------------------------------------------------ */

const PIN_MAX_FAILS = 3;
const PIN_LOCK_MS = 30_000;

type PinLock = { fails: number; until: number };

/** Next, `process.env.NEXT_PUBLIC_*` erişimlerini derlemede sabitle değiştirir; bu yüzden tam adlarla okunur. */
function pinHash(): string {
  return (process.env.NEXT_PUBLIC_PARENT_PIN_HASH ?? "").trim().toLowerCase();
}

function pinSalt(): string {
  return process.env.NEXT_PUBLIC_PIN_SALT ?? "";
}

function readPinLock(): PinLock {
  const raw = readJSON<Partial<PinLock> | null>(KEYS.pinLock, null);
  return {
    fails: typeof raw?.fails === "number" ? raw.fails : 0,
    until: typeof raw?.until === "number" ? raw.until : 0,
  };
}

export function isParentPinConfigured(): boolean {
  return /^[0-9a-f]{64}$/.test(pinHash());
}

export function getPinLockRemainingMs(): number {
  return Math.max(0, readPinLock().until - Date.now());
}

async function sha256Hex(text: string): Promise<string | null> {
  const subtle = typeof crypto !== "undefined" ? crypto.subtle : undefined;
  if (!subtle) return null;
  try {
    const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
  } catch {
    return null;
  }
}

/** Uzunluktan bağımsız süreyle karşılaştırır. */
function fixedLengthEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * SHA-256(pin + ":" + NEXT_PUBLIC_PIN_SALT) değerini NEXT_PUBLIC_PARENT_PIN_HASH
 * ile karşılaştırır. 3 hatalı denemede 30 sn kilit (`dogukan-pin-lock`).
 * Kilitliyken veya PIN ayarlanmamışsa `false` döner.
 */
export async function verifyParentPin(pin: string): Promise<boolean> {
  if (!isParentPinConfigured() || getPinLockRemainingMs() > 0) return false;
  const actual = await sha256Hex(`${pin}:${pinSalt()}`);
  if (actual !== null && fixedLengthEqual(actual, pinHash())) {
    removeKey(KEYS.pinLock);
    return true;
  }
  const fails = readPinLock().fails + 1;
  writeJSON(
    KEYS.pinLock,
    fails >= PIN_MAX_FAILS
      ? { fails: 0, until: Date.now() + PIN_LOCK_MS }
      : { fails, until: 0 },
  );
  return false;
}

/* ------------------------------------------------------------------ */
/* Ebeveyn modu (oyuncu değişimi değildir)                             */
/* ------------------------------------------------------------------ */

const PARENT_EVENT = "dogukan:parent-mode";
const DEFAULT_PARENT_MINUTES = 15;

function parentUntil(): number {
  const n = Number(readRaw(KEYS.parentUntil, "session"));
  return Number.isFinite(n) ? n : 0;
}

function announceParentMode() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PARENT_EVENT));
}

export function enterParentMode(minutes: number = DEFAULT_PARENT_MINUTES): void {
  writeRaw(KEYS.parentUntil, String(Date.now() + minutes * 60_000), "session");
  announceParentMode();
}

export function exitParentMode(): void {
  removeKey(KEYS.parentUntil, "session");
  announceParentMode();
}

export function isParentMode(): boolean {
  if (typeof window === "undefined") return false;
  return parentUntil() > Date.now();
}

function subscribeParentMode(cb: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    const left = parentUntil() - Date.now();
    // Süre dolduğunda da yeniden çizilsin.
    if (left > 0) timer = setTimeout(onChange, Math.min(left + 50, 2 ** 31 - 1));
  };
  const onChange = () => {
    schedule();
    cb();
  };
  schedule();
  window.addEventListener(PARENT_EVENT, onChange);
  return () => {
    if (timer) clearTimeout(timer);
    window.removeEventListener(PARENT_EVENT, onChange);
  };
}

function getServerParentMode(): boolean {
  return false;
}

export function useParentMode(): boolean {
  return useSyncExternalStore(
    subscribeParentMode,
    isParentMode,
    getServerParentMode,
  );
}
