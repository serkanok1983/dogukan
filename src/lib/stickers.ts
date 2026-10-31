// STUB (C0) — owner: S5. Replace body, keep signature (docs/plan/CONTRACT.md §10.4).
import type { StickerId } from "@/lib/progress/types";

export type StickerDef = {
  id: StickerId;
  emoji: string;
  name: string;
  say: string;
  page: string;
  trigger: string;
};

export const STICKERS: readonly StickerDef[] = [];
