// STUB (C0) — owner: S9. Replace body, keep signature (docs/plan/CONTRACT.md §10.6).
import type { PlayerId } from "@/lib/auth";

export type BlockSave = {
  index: number;
  name: string;
  cells: string;
  thumb: string;
  savedAt: number;
  sharedAt?: number;
};

export function listSaves(player: PlayerId): BlockSave[] {
  void player;
  return [];
}

export function listSharedBuilds(player: PlayerId): BlockSave[] {
  void player;
  return [];
}
