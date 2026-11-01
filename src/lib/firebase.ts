/**
 * Firebase SDK kapısı (S8). Bu modül SDK'yı statik olarak içe aktarır; bu
 * yüzden çocuk yolundaki kod onu **tembel** yükler:
 *
 *   import { isFirebaseConfigured } from "@/lib/firebaseConfig"; // SDK'sız
 *   if (!isFirebaseConfigured()) return;
 *   const fb = await import("@/lib/firebase");
 *   const db = await fb.getAuthedDb();          // anonim oturum + veritabanı
 *   if (db) await fb.push(fb.ref(db, "yol"), değer);
 *
 * Her çağrı sessizce başarısız olabilir; oyun hiçbir zaman Firebase'i beklemez.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, push, ref, type Database } from "firebase/database";
import { firebaseConfig, isFirebaseConfigured } from "./firebaseConfig";

export { isFirebaseConfigured };
// Tembel yükleyenler `fb.ref(...)` gibi kullanabilsin diye veritabanı yardımcıları buradan da verilir.
export {
  child,
  get,
  limitToLast,
  onValue,
  push,
  query,
  ref,
  remove,
  set,
  update,
  type DatabaseReference,
  type Unsubscribe,
} from "firebase/database";

let app: FirebaseApp | null = null;
let db: Database | null = null;
let authPromise: Promise<boolean> | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined" || !isFirebaseConfigured()) return null;
  if (!app) app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

async function signInOnce(firebaseApp: FirebaseApp): Promise<boolean> {
  try {
    const { getAuth, signInAnonymously } = await import("firebase/auth");
    const auth = getAuth(firebaseApp);
    if (!auth.currentUser) await signInAnonymously(auth);
    return true;
  } catch (e) {
    console.warn("Firebase anonim oturum açılamadı:", e);
    return false;
  }
}

/**
 * Anonim oturum açar (başarı önbelleğe alınır; başarısızlık — ör. çevrimdışı —
 * bir sonraki çağrıda yeniden denenir). Kurallar her yolda `auth != null`
 * ister (database.rules.json); oturum yoksa `false`. Asla hata fırlatmaz.
 */
export function ensureAnonymousAuth(): Promise<boolean> {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return Promise.resolve(false);
  if (!authPromise) {
    authPromise = signInOnce(firebaseApp).then((ok) => {
      if (!ok) authPromise = null;
      return ok;
    });
  }
  return authPromise;
}

/**
 * Eşzamanlı erişim (eski çağıranlar için). Oturum henüz açılmamış olabilir:
 * okuma/abonelik/yazma için `getAuthedDb()` kullanın.
 */
export function getFirebaseDb(): Database | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (!db) {
    db = getDatabase(firebaseApp);
    void ensureAnonymousAuth();
  }
  return db;
}

/**
 * Her okuma, abonelik ve yazım için tek yol: önce anonim oturum, sonra
 * veritabanı. Oturum açılamadıysa `null` (kurallar zaten reddederdi).
 */
export async function getAuthedDb(): Promise<Database | null> {
  const database = getFirebaseDb();
  if (!database) return null;
  return (await ensureAnonymousAuth()) ? database : null;
}

/** `path` altına yeni bir kayıt ekler. Başarısızlıkta `false` döner, fırlatmaz. */
export async function pushValue(path: string, value: unknown): Promise<boolean> {
  try {
    const database = await getAuthedDb();
    if (!database) return false;
    await push(ref(database, path), value);
    return true;
  } catch (e) {
    console.warn(`Firebase yazılamadı (${path}):`, e);
    return false;
  }
}

/** @deprecated Oturum beklenmez; `getAuthedDb()` + `ref(db, "leaderboard/…")` kullanın. */
export function leaderboardRef(gameSlug: string) {
  const database = getFirebaseDb();
  if (!database) return null;
  return ref(database, `leaderboard/${gameSlug}`);
}

/** @deprecated Oturum beklenmez; `getAuthedDb()` + `ref(db, "leaderboard")` kullanın. */
export function leaderboardRootRef() {
  const database = getFirebaseDb();
  if (!database) return null;
  return ref(database, "leaderboard");
}
