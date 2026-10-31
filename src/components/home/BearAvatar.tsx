// STUB (C0) — owner: S1. Replace body, keep signature (docs/plan/CONTRACT.md §10.7).
"use client";

import type { CosmeticId } from "@/lib/progress/types";

export type BearPose = "idle" | "wave" | "yawn" | "sleep" | "jump" | "stretch";

export function BearAvatar({
  pose = "idle",
  size = 64,
  cosmetic = null,
}: {
  pose?: BearPose;
  size?: number;
  cosmetic?: CosmeticId | null;
}) {
  return (
    <span
      className="home-bear"
      data-pose={pose}
      data-cosmetic={cosmetic ?? undefined}
      style={{ fontSize: size * 0.8, lineHeight: 1 }}
      aria-hidden
    >
      🐻
    </span>
  );
}
