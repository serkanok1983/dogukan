/**
 * Legacy `/kesfet` progress API, now an adapter over `progress.topics`
 * (CONTRACT §1, §3.5). Owner: S7.
 *
 * - With a player: reads `getProgress().topics`, writes through
 *   `trackEvent({ type: "topic_flag" })`. There is no dedicated "visited"
 *   event, so a `lastVisited`-only patch is recorded as a flagless
 *   `topic_flag`, which only bumps `topics[slug].lastAt`; `lastVisited` is read
 *   back from `lastAt`.
 * - Without a player (anonymous visit to the parent reference page, where
 *   `trackEvent` is a no-op): falls back to the legacy localStorage key so
 *   favourites still work. The store migrates that key into `topics` the
 *   first time a player's progress is created.
 * - Always dispatches `dogukan-encyclopedia-progress` for the hub and tools.
 */
import { getPlayerId } from "@/lib/auth";
import { trackEvent } from "@/lib/progress/events";
import { getProgress } from "@/lib/progress/store";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";

export type EncyclopediaProgressEntry = {
  favorite?: boolean;
  complete?: boolean;
  lastVisited?: string;
};

export type EncyclopediaProgress = Record<string, EncyclopediaProgressEntry>;

const CHANGE_EVENT = "dogukan-encyclopedia-progress";

function readLegacy(): EncyclopediaProgress {
  const parsed = readJSON<unknown>(KEYS.legacyEncyclopedia, null);
  return parsed && typeof parsed === "object"
    ? (parsed as EncyclopediaProgress)
    : {};
}

export function readEncyclopediaProgress(): EncyclopediaProgress {
  if (typeof window === "undefined") return {};
  if (!getPlayerId()) return readLegacy();
  const progress: EncyclopediaProgress = {};
  for (const [slug, topic] of Object.entries(getProgress().topics)) {
    progress[slug] = {
      favorite: topic.favorite,
      complete: topic.complete,
      ...(topic.lastAt ? { lastVisited: new Date(topic.lastAt).toISOString() } : {}),
    };
  }
  return progress;
}

export function updateEncyclopediaProgress(
  slug: string,
  patch: Partial<EncyclopediaProgressEntry>,
): EncyclopediaProgress {
  if (typeof window === "undefined") return {};
  if (getPlayerId()) {
    trackEvent({
      type: "topic_flag",
      slug,
      ...(patch.favorite !== undefined ? { favorite: patch.favorite } : {}),
      ...(patch.complete !== undefined ? { complete: patch.complete } : {}),
    });
  } else {
    const legacy = readLegacy();
    legacy[slug] = { ...legacy[slug], ...patch };
    writeJSON(KEYS.legacyEncyclopedia, legacy);
  }
  const progress = readEncyclopediaProgress();
  try {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: progress }));
  } catch {
    /* An event failure must not block learning. */
  }
  return progress;
}

export function countCompleted(progress: EncyclopediaProgress): number {
  return Object.values(progress).filter((entry) => entry.complete).length;
}
