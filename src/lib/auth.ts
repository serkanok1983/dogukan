import { useSyncExternalStore } from "react";

export const PLAYERS = {
  dogukan: { password: "ilovemyfather", displayName: "Doğukan" },
  serkan: { password: "ilovemyson", displayName: "Serkan" },
} as const;

export type PlayerId = keyof typeof PLAYERS;

const STORAGE_KEY = "dogukan-logged-in";
const PLAYER_KEY = "dogukan-player";

export function checkCredentials(
  username: string,
  password: string,
): PlayerId | null {
  const id = username.trim().toLowerCase() as PlayerId;
  if (id in PLAYERS && PLAYERS[id].password === password) return id;
  return null;
}

export function getPlayerId(): PlayerId | null {
  if (typeof window === "undefined") return null;
  const id = sessionStorage.getItem(PLAYER_KEY) ?? localStorage.getItem(PLAYER_KEY);
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
  return (
    sessionStorage.getItem(STORAGE_KEY) === "true" ||
    localStorage.getItem(STORAGE_KEY) === "true"
  );
}

const SESSION_EVENT = "dogukan:session";

function announceSession() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/** @deprecated `loginAs` kullanın. */
export function setLoggedIn(playerId: PlayerId, remember: boolean): void {
  sessionStorage.setItem(STORAGE_KEY, "true");
  sessionStorage.setItem(PLAYER_KEY, playerId);
  if (remember) {
    localStorage.setItem(STORAGE_KEY, "true");
    localStorage.setItem(PLAYER_KEY, playerId);
  }
  announceSession();
}

/** Kalıcı oturum açar (CONTRACT §9). İlerleme deposu `dogukan:session` ile yeniden yüklenir. */
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

/** SSR ve hidrasyon sırasında `{ ready: false }`; tarayıcıda gerçek oturum. */
export function useSession(): Session {
  return useSyncExternalStore(subscribeSession, readSession, () => SERVER_SESSION);
}

export function logout(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(PLAYER_KEY);
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PLAYER_KEY);
  try {
    sessionStorage.removeItem("dogukan-activity-login");
  } catch {
    /* ignore */
  }
  announceSession();
}
