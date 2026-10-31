/**
 * Harita ve ada ekranı için saf yardımcılar ve kararlı seçiciler.
 * Seçiciler modül düzeyindedir (useProgress/useSettings kararlı seçici ister).
 */
import { trackEvent } from "@/lib/progress/events";
import type { ActivityStats, Progress } from "@/lib/progress/types";
import type { Settings } from "@/lib/settings";
import { activitiesInWorld, getActivityInfo, type WorldId } from "@/lib/worlds";

export const DEFAULT_CONTINUE_SLUG = "super-ayi";

export const selectActivities = (p: Progress) => p.activities;
export const selectStreak = (p: Progress) => p.rewards.streak.count;
export const selectEquipped = (p: Progress) => p.rewards.cosmetics.equipped;
export const selectTopics = (p: Progress) => p.topics;
export const selectChapterNoticeId = (p: Progress): string | null =>
  p.inbox.find((n) => n.kind === "quests_all_done")?.id ?? null;

export const selectBabaEnabled = (s: Settings) => s.babaIleEnabled;
export const selectFirstLaunchDone = (s: Settings) => s.firstLaunchDone;
export const selectCompanionName = (s: Settings) => s.companionName || "Bal";

/** Yıldız toplamı ve doluluk: Σ stars / (3 × görünür slug). */
export function islandProgress(
  activities: Readonly<Record<string, ActivityStats>>,
  world: WorldId,
): { stars: number; fill: number } {
  const slugs = activitiesInWorld(world);
  if (slugs.length === 0) return { stars: 0, fill: 0 };
  const stars = slugs.reduce((n, slug) => n + (activities[slug]?.stars ?? 0), 0);
  return { stars, fill: stars / (3 * slugs.length) };
}

/** Görünür etkinliklerinin hepsi arcade olan ada (akşam modunda uyur). */
export function isArcadeWorld(world: WorldId): boolean {
  const slugs = activitiesInWorld(world);
  return (
    slugs.length > 0 && slugs.every((s) => getActivityInfo(s)?.kind === "arcade")
  );
}

/**
 * Devam kutucuğu: görünür slug'lar arasında en son `lastAt`. Baba ile adası
 * hariç (birlikte oyun kapısını atlamasın). Hiç oynanmamışsa Süper Ayı.
 */
export function mostRecentSlug(
  activities: Readonly<Record<string, ActivityStats>>,
): string {
  let best = DEFAULT_CONTINUE_SLUG;
  let bestAt = 0;
  for (const [slug, stats] of Object.entries(activities)) {
    const info = getActivityInfo(slug);
    if (!info || info.hidden || info.world === "baba") continue;
    if (stats.lastAt > bestAt) {
      best = slug;
      bestAt = stats.lastAt;
    }
  }
  return best;
}

/** Kutucukları sayfalara böler (ada ekranı: sayfa başına en fazla 12). */
export function paginate<T>(items: readonly T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

/**
 * Süper Ayı rekoru (Doğukan). `leaderboard.ts` Firebase'i statik içe aktardığı için
 * harita paketine girmesin diye tembel yüklenir (CONTRACT §0.9).
 */
export async function loadContinueRecord(): Promise<number> {
  try {
    const m = await import("@/lib/leaderboard");
    return m.getHighScore(DEFAULT_CONTINUE_SLUG, "dogukan");
  } catch {
    return 0;
  }
}

let appOpenTracked = false;

/** Sayfa yüklemesi başına bir kez `app_open` (harita ilk açıldığında). */
export function trackAppOpenOnce(): void {
  if (appOpenTracked) return;
  appOpenTracked = true;
  trackEvent({ type: "app_open" });
}

/* Baba ile geçişi: haritadaki aritmetik kapıdan geçildiğinde ada ekranı yeniden sormaz.
   Yalnızca bellekte (yeniden yüklemede kapı tekrar sorulur). */
const BABA_PASS_MS = 15 * 60_000;
let babaPassUntil = 0;

export function grantBabaPass(now: number = Date.now()): void {
  babaPassUntil = now + BABA_PASS_MS;
}

export function hasBabaPass(now: number = Date.now()): boolean {
  return babaPassUntil > now;
}
