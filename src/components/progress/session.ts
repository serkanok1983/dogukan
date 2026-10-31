/**
 * Oturum belleği (sayfa yüklemesi = oturum). Sahibi S5.
 * - "Bal topla" seçeneği oturumda en fazla 2 kez sunulur (MASTER_PLAN K4).
 * - "Başka bir adaya bakalım mı?" aynı oyunda art arda 3 koşudan sonra
 *   oturumda bir kez (parent-wellbeing F2.2).
 * Kalıcı değildir; bilerek localStorage'a yazılmaz.
 */
import { onEvent } from "@/lib/progress/events";
import type { ProgressEventType } from "@/lib/progress/types";

export const HONEY_OFFERS_PER_SESSION = 2;
export const RUNS_BEFORE_SUGGESTION = 3;

let honeyOffers = 0;
let suggested = false;
let lastSlug: string | null = null;
let consecutive = 0;
let installed = false;

function install(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  onEvent<ProgressEventType>("*", (e) => {
    if (e.type === "run_end") {
      if (e.slug === lastSlug) consecutive += 1;
      else {
        lastSlug = e.slug;
        consecutive = 1;
      }
    } else if ((e.type === "exercise_set_end" && e.mode === "session") || e.type === "capsule_end") {
      lastSlug = null;
      consecutive = 0;
    }
  });
}

install();

/** Bu slug için art arda biten koşu sayısı (başka bir etkinlik araya girince sıfırlanır). */
export function consecutiveRuns(slug: string): number {
  return lastSlug === slug ? consecutive : 0;
}

export function canOfferHoney(): boolean {
  return honeyOffers < HONEY_OFFERS_PER_SESSION;
}

export function markHoneyOffered(): void {
  honeyOffers += 1;
}

export function canSuggestIsland(slug: string): boolean {
  return !suggested && consecutiveRuns(slug) >= RUNS_BEFORE_SUGGESTION;
}

export function markIslandSuggested(): void {
  suggested = true;
}

/** @internal Testler için. */
export function _resetProgressSessionForTests(): void {
  honeyOffers = 0;
  suggested = false;
  lastSlug = null;
  consecutive = 0;
  install();
}
