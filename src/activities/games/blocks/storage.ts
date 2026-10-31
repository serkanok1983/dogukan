/**
 * Blok Dünyası kayıtları (CONTRACT §1, §10.6). Anahtar `dogukan-blocks-v1:{player}`,
 * değer `BlockSave[]` (en fazla 5 yuva, index 0..4).
 */
import type { PlayerId } from "@/lib/auth";
import { blocksKey, readJSON, writeJSON } from "@/lib/storage";

export type BlockSave = {
  index: number;
  name: string;
  /** base64 Uint8Array 12×18 (engine.encodeGrid) */
  cells: string;
  /** PNG data URL ≤ 20 KB ("" olabilir) */
  thumb: string;
  savedAt: number;
  sharedAt?: number;
};

export const SLOT_COUNT = 5;
export const THUMB_MAX_BYTES = 20 * 1024;

export function defaultWorldName(index: number): string {
  return `Dünyam ${index + 1}`;
}

function isValidIndex(i: unknown): i is number {
  return typeof i === "number" && Number.isInteger(i) && i >= 0 && i < SLOT_COUNT;
}

function sanitize(raw: unknown): BlockSave | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<BlockSave>;
  if (!isValidIndex(r.index) || typeof r.cells !== "string") return null;
  const save: BlockSave = {
    index: r.index,
    name:
      typeof r.name === "string" && r.name.trim()
        ? r.name
        : defaultWorldName(r.index),
    cells: r.cells,
    thumb:
      typeof r.thumb === "string" &&
      r.thumb.startsWith("data:image/") &&
      r.thumb.length <= THUMB_MAX_BYTES
        ? r.thumb
        : "",
    savedAt:
      typeof r.savedAt === "number" && Number.isFinite(r.savedAt) ? r.savedAt : 0,
  };
  if (typeof r.sharedAt === "number" && Number.isFinite(r.sharedAt))
    save.sharedAt = r.sharedAt;
  return save;
}

/** Yuva sırasına göre (0..4), her yuvada en fazla bir kayıt. */
function normalize(list: unknown): BlockSave[] {
  if (!Array.isArray(list)) return [];
  const bySlot = new Map<number, BlockSave>();
  for (const item of list) {
    const s = sanitize(item);
    if (!s) continue;
    const prev = bySlot.get(s.index);
    if (!prev || s.savedAt >= prev.savedAt) bySlot.set(s.index, s);
  }
  return [...bySlot.values()].sort((a, b) => a.index - b.index).slice(0, SLOT_COUNT);
}

export function listSaves(player: PlayerId): BlockSave[] {
  return normalize(readJSON<unknown>(blocksKey(player), []));
}

/** `/bilgi` galerisi (S6): "Babaya göster" ile paylaşılanlar, en yeni önce. */
export function listSharedBuilds(player: PlayerId): BlockSave[] {
  return listSaves(player)
    .filter((s) => typeof s.sharedAt === "number")
    .sort((a, b) => (b.sharedAt ?? 0) - (a.sharedAt ?? 0));
}

export function getSave(player: PlayerId, index: number): BlockSave | null {
  return listSaves(player).find((s) => s.index === index) ?? null;
}

/** İlk boş yuva; hepsi doluysa `null`. */
export function firstFreeSlot(player: PlayerId): number | null {
  const used = new Set(listSaves(player).map((s) => s.index));
  for (let i = 0; i < SLOT_COUNT; i++) if (!used.has(i)) return i;
  return null;
}

/** Yuvaya yazar (varsa üzerine). Geçersiz index'te hiçbir şey yazmaz. Güncel listeyi döndürür. */
export function saveWorld(player: PlayerId, save: BlockSave): BlockSave[] {
  const clean = sanitize(save);
  const current = listSaves(player);
  if (!clean) return current;
  const next = normalize([...current.filter((s) => s.index !== clean.index), clean]);
  writeJSON(blocksKey(player), next);
  return next;
}

export function deleteWorld(player: PlayerId, index: number): BlockSave[] {
  const next = listSaves(player).filter((s) => s.index !== index);
  writeJSON(blocksKey(player), next);
  return next;
}
