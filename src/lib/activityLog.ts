import { child, get, limitToLast, onValue, push, query, ref, type Unsubscribe } from "firebase/database";
import { getPlayerId, type PlayerId } from "./auth";
import { getFirebaseDb, isFirebaseConfigured } from "./firebase";

const MONITORED: PlayerId = "dogukan";
const LOGIN_SESSION_KEY = "dogukan-activity-login";

export type LoginEvent = { at: number; iso: string };
export type VisitEvent = { at: number; iso: string; slug: string; title: string };

function iso(at: number) {
  return new Date(at).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function activityRoot() {
  const db = getFirebaseDb();
  if (!db) return null;
  return ref(db, `activity/${MONITORED}`);
}

export function logDogukanLogin(): void {
  if (typeof window === "undefined") return;
  if (getPlayerId() !== MONITORED) return;
  if (!isFirebaseConfigured()) return;
  if (sessionStorage.getItem(LOGIN_SESSION_KEY) === "1") return;

  const root = activityRoot();
  if (!root) return;

  const at = Date.now();
  sessionStorage.setItem(LOGIN_SESSION_KEY, "1");
  void push(child(root, "logins"), { at, iso: iso(at) }).catch((e) =>
    console.warn("Giriş kaydı yazılamadı:", e),
  );
}

export function logDogukanVisit(slug: string, title: string): void {
  if (typeof window === "undefined") return;
  if (getPlayerId() !== MONITORED) return;
  if (!isFirebaseConfigured()) return;

  const root = activityRoot();
  if (!root) return;

  const at = Date.now();
  void push(child(root, "visits"), { at, iso: iso(at), slug, title }).catch((e) =>
    console.warn("Ziyaret kaydı yazılamadı:", e),
  );
}

export function clearLoginSessionFlag(): void {
  sessionStorage.removeItem(LOGIN_SESSION_KEY);
}

export type ActivitySummary = {
  logins: LoginEvent[];
  visits: VisitEvent[];
};

export async function fetchDogukanActivity(): Promise<ActivitySummary> {
  const root = activityRoot();
  if (!root) return { logins: [], visits: [] };

  try {
    const [loginSnap, visitSnap] = await Promise.all([
      get(child(root, "logins")),
      get(queryVisits(root)),
    ]);
    const logins = loginSnap.val()
      ? (Object.values(loginSnap.val()) as LoginEvent[]).sort((a, b) => b.at - a.at)
      : [];
    const visits = visitSnap.val()
      ? (Object.values(visitSnap.val()) as VisitEvent[]).sort((a, b) => b.at - a.at)
      : [];
    return { logins, visits };
  } catch (e) {
    console.warn("Aktivite okunamadı:", e);
    return { logins: [], visits: [] };
  }
}

function queryVisits(root: NonNullable<ReturnType<typeof activityRoot>>) {
  return query(child(root, "visits"), limitToLast(80));
}

export function subscribeDogukanActivity(onUpdate: (data: ActivitySummary) => void): Unsubscribe | null {
  const root = activityRoot();
  if (!root) return null;

  let logins: LoginEvent[] = [];
  let visits: VisitEvent[] = [];

  const emit = () => onUpdate({ logins, visits });

  const unsubLogins = onValue(child(root, "logins"), (snap) => {
    logins = snap.val()
      ? (Object.values(snap.val()) as LoginEvent[]).sort((a, b) => b.at - a.at)
      : [];
    emit();
  });

  const unsubVisits = onValue(queryVisits(root), (snap) => {
    visits = snap.val()
      ? (Object.values(snap.val()) as VisitEvent[]).sort((a, b) => b.at - a.at)
      : [];
    emit();
  });

  return () => {
    unsubLogins();
    unsubVisits();
  };
}
