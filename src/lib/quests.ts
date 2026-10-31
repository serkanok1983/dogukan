// STUB (C0) — owner: S5. Replace body, keep signature (docs/plan/CONTRACT.md §10.4).

export type QuestView = { id: string; emoji: string; say: string; href: string; done: boolean };

const NONE: { items: QuestView[]; allDone: boolean } = { items: [], allDone: false };

export function ensureTodayQuests(now?: number): void {
  void now;
}

export function useQuests(): { items: QuestView[]; allDone: boolean } {
  return NONE;
}
