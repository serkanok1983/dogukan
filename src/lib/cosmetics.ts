// STUB (C0) — owner: S5. Replace body, keep signature (docs/plan/CONTRACT.md §10.4).
import type { CosmeticId } from "@/lib/progress/types";

export type CosmeticDef = { id: CosmeticId; emoji: string; name: string; say: string; price: number };

export const COSMETICS: readonly CosmeticDef[] = [];
