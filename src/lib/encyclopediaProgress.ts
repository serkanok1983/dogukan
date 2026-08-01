export type EncyclopediaProgressEntry = {
  favorite?: boolean;
  complete?: boolean;
  lastVisited?: string;
};

export type EncyclopediaProgress = Record<string, EncyclopediaProgressEntry>;

const STORAGE_KEY = "dogukan-merak-ansiklopedisi-v1";

export function readEncyclopediaProgress(): EncyclopediaProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as EncyclopediaProgress) : {};
  } catch {
    return {};
  }
}

export function updateEncyclopediaProgress(
  slug: string,
  patch: Partial<EncyclopediaProgressEntry>,
): EncyclopediaProgress {
  const progress = readEncyclopediaProgress();
  progress[slug] = { ...progress[slug], ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent("dogukan-encyclopedia-progress", { detail: progress }));
  } catch {
    /* Private browsing or a full storage quota must not block learning. */
  }
  return progress;
}

export function countCompleted(progress: EncyclopediaProgress): number {
  return Object.values(progress).filter((entry) => entry.complete).length;
}
