export const AUTH_USER = "dogukan";
export const AUTH_PASS = "ilovemyfather";
export const STORAGE_KEY = "dogukan-logged-in";

export function checkCredentials(username: string, password: string): boolean {
  return username.trim().toLowerCase() === AUTH_USER && password === AUTH_PASS;
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return (
    sessionStorage.getItem(STORAGE_KEY) === "true" ||
    localStorage.getItem(STORAGE_KEY) === "true"
  );
}

export function setLoggedIn(remember: boolean): void {
  sessionStorage.setItem(STORAGE_KEY, "true");
  if (remember) localStorage.setItem(STORAGE_KEY, "true");
}

export function logout(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
}
