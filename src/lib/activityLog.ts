/**
 * Firebase etkinlik kayıtları (CONTRACT §16). Sahibi S6.
 *
 * - `activity/dogukan/{logins,visits}`: Faz 1'de değişmeden yazılır (eski panel için).
 * - `users/{player}/days/{YYYY-MM-DD}`: gün özeti (`plays` ayrıntısı olmadan),
 *   en fazla 60 sn'de bir ve `pagehide`'da.
 *
 * Firebase isteğe bağlıdır: SDK yalnızca `await import("@/lib/firebase")` ile
 * yüklenir, tüm çağrılar sessizce başarısız olabilir ve çocuk yolu hiçbirini beklemez.
 */
import type { Unsubscribe } from "firebase/database";
import { getPlayerId, type PlayerId } from "./auth";
import { isFirebaseConfigured } from "./firebaseConfig";
import { getProgress, subscribeProgress } from "./progress/store";
import { dayKey } from "./progress/time";
import type { DayKey, DayUsage } from "./progress/types";

const MONITORED: PlayerId = "dogukan";
const LOGIN_SESSION_KEY = "dogukan-activity-login";
const DAY_SYNC_MS = 60_000;

export type LoginEvent = { at: number; iso: string };
export type VisitEvent = { at: number; iso: string; slug: string; title: string };

type FirebaseModule = typeof import("./firebase");

let fbPromise: Promise<FirebaseModule | null> | null = null;

/** SDK'yı bir kez, tembel yükler. Yapılandırılmamışsa veya yüklenemezse `null`. */
function loadFirebase(): Promise<FirebaseModule | null> {
  if (typeof window === "undefined" || !isFirebaseConfigured())
    return Promise.resolve(null);
  if (!fbPromise) {
    fbPromise = import("./firebase").catch((e: unknown) => {
      console.warn("Firebase yüklenemedi:", e);
      fbPromise = null;
      return null;
    });
  }
  return fbPromise;
}

function iso(at: number) {
  return new Date(at).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function pushActivity(
  kind: "logins" | "visits",
  value: object,
): Promise<void> {
  try {
    const fb = await loadFirebase();
    const db = fb ? await fb.getAuthedDb() : null;
    if (!fb || !db) return;
    await fb.push(fb.ref(db, `activity/${MONITORED}/${kind}`), value);
  } catch (e) {
    console.warn(
      kind === "logins" ? "Giriş kaydı yazılamadı:" : "Ziyaret kaydı yazılamadı:",
      e,
    );
  }
}

export function logDogukanLogin(): void {
  if (typeof window === "undefined") return;
  if (getPlayerId() !== MONITORED) return;
  if (!isFirebaseConfigured()) return;
  try {
    if (sessionStorage.getItem(LOGIN_SESSION_KEY) === "1") return;
    sessionStorage.setItem(LOGIN_SESSION_KEY, "1");
  } catch {
    /* gizli gezinme: yine de bir kez yazmayı dene */
  }
  const at = Date.now();
  void pushActivity("logins", { at, iso: iso(at) });
}

export function logDogukanVisit(slug: string, title: string): void {
  if (typeof window === "undefined") return;
  if (getPlayerId() !== MONITORED) return;
  if (!isFirebaseConfigured()) return;
  const at = Date.now();
  void pushActivity("visits", { at, iso: iso(at), slug, title });
}

export function clearLoginSessionFlag(): void {
  try {
    sessionStorage.removeItem(LOGIN_SESSION_KEY);
  } catch {
    /* yok say */
  }
}

export type ActivitySummary = {
  logins: LoginEvent[];
  visits: VisitEvent[];
};

function sortedValues<T extends { at: number }>(val: unknown): T[] {
  if (!val || typeof val !== "object") return [];
  return (Object.values(val) as T[]).sort((a, b) => b.at - a.at);
}

export async function fetchDogukanActivity(): Promise<ActivitySummary> {
  try {
    const fb = await loadFirebase();
    const db = fb ? await fb.getAuthedDb() : null;
    if (!fb || !db) return { logins: [], visits: [] };
    const root = fb.ref(db, `activity/${MONITORED}`);
    const [loginSnap, visitSnap] = await Promise.all([
      fb.get(fb.child(root, "logins")),
      fb.get(fb.query(fb.child(root, "visits"), fb.limitToLast(80))),
    ]);
    return {
      logins: sortedValues<LoginEvent>(loginSnap.val()),
      visits: sortedValues<VisitEvent>(visitSnap.val()),
    };
  } catch (e) {
    console.warn("Aktivite okunamadı:", e);
    return { logins: [], visits: [] };
  }
}

/** Firebase yapılandırılmamışsa `null`; aksi halde SDK tembel yüklenir ve abonelik arka planda kurulur. */
export function subscribeDogukanActivity(
  onUpdate: (data: ActivitySummary) => void,
): Unsubscribe | null {
  if (typeof window === "undefined" || !isFirebaseConfigured()) return null;
  let cancelled = false;
  const unsubs: Unsubscribe[] = [];
  let logins: LoginEvent[] = [];
  let visits: VisitEvent[] = [];
  const emit = () => onUpdate({ logins, visits });

  void (async () => {
    try {
      const fb = await loadFirebase();
      const db = fb ? await fb.getAuthedDb() : null;
      if (!fb || !db || cancelled) return;
      const root = fb.ref(db, `activity/${MONITORED}`);
      unsubs.push(
        fb.onValue(fb.child(root, "logins"), (snap) => {
          logins = sortedValues<LoginEvent>(snap.val());
          emit();
        }),
        fb.onValue(
          fb.query(fb.child(root, "visits"), fb.limitToLast(80)),
          (snap) => {
            visits = sortedValues<VisitEvent>(snap.val());
            emit();
          },
        ),
      );
    } catch (e) {
      console.warn("Aktivite aboneliği kurulamadı:", e);
    }
  })();

  return () => {
    cancelled = true;
    for (const u of unsubs) u();
  };
}

// ---------------------------------------------------------------------------
// Gün özeti eşitlemesi: users/{player}/days/{YYYY-MM-DD}
// ---------------------------------------------------------------------------

export type DaySummary = Omit<DayUsage, "plays"> & {
  slugs: number;
  syncedAt: number;
};

export function daySummary(d: DayUsage, at: number): DaySummary {
  const { plays, ...rest } = d;
  return { ...rest, slugs: Object.keys(plays).length, syncedAt: at };
}

let daySyncStarted = false;
let dirtyDays = new Set<DayKey>();
let lastDaySyncAt = 0;
let daySyncTimer: ReturnType<typeof setTimeout> | null = null;

async function writeDays(player: PlayerId, days: DayKey[]): Promise<void> {
  try {
    const fb = await loadFirebase();
    const db = fb ? await fb.getAuthedDb() : null;
    if (!fb || !db) return;
    const p = getProgress();
    const at = Date.now();
    await Promise.all(
      days.flatMap((day) => {
        const d = p.player === player ? p.days[day] : undefined;
        return d
          ? [fb.set(fb.ref(db, `users/${player}/days/${day}`), daySummary(d, at))]
          : [];
      }),
    );
  } catch (e) {
    console.warn("Gün özeti yazılamadı:", e);
  }
}

function flushDays(): void {
  if (daySyncTimer) {
    clearTimeout(daySyncTimer);
    daySyncTimer = null;
  }
  const player = getPlayerId();
  if (!player || dirtyDays.size === 0) return;
  const days = [...dirtyDays];
  dirtyDays = new Set();
  lastDaySyncAt = Date.now();
  void writeDays(player, days);
}

function scheduleDaySync(): void {
  dirtyDays.add(dayKey());
  if (daySyncTimer) return;
  const wait = Math.max(0, lastDaySyncAt + DAY_SYNC_MS - Date.now());
  daySyncTimer = setTimeout(flushDays, wait);
}

/**
 * Gün özetini Firebase'e yansıtmaya başlar (idempotent). `sessionClock` ilk
 * başlatıldığında çağırır. Firebase yapılandırılmamışsa hiçbir şey yapmaz.
 */
export function startDaySync(): void {
  if (daySyncStarted || typeof window === "undefined" || !isFirebaseConfigured())
    return;
  daySyncStarted = true;
  void loadFirebase();
  subscribeProgress(scheduleDaySync);
  window.addEventListener("pagehide", flushDays);
}
