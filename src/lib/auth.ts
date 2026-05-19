export const PLAYERS = {
  dogukan: { password: "ilovemyfather", displayName: "Doğukan" },
  serkan: { password: "ilovemyson", displayName: "Serkan" },
} as const;

export type PlayerId = keyof typeof PLAYERS;

const STORAGE_KEY = "dogukan-logged-in";
const PLAYER_KEY = "dogukan-player";

export function checkCredentials(username: string, password: string): PlayerId | null {
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

export function setLoggedIn(playerId: PlayerId, remember: boolean): void {
  sessionStorage.setItem(STORAGE_KEY, "true");
  sessionStorage.setItem(PLAYER_KEY, playerId);
  if (remember) {
    localStorage.setItem(STORAGE_KEY, "true");
    localStorage.setItem(PLAYER_KEY, playerId);
  }
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
}
