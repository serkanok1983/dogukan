"use client";

import "./home.css";
import type { CSSProperties } from "react";
import { COSMETICS } from "@/lib/cosmetics";
import type { CosmeticId } from "@/lib/progress/types";

export type BearPose = "idle" | "wave" | "yawn" | "sleep" | "jump" | "stretch";

/** Poz başına küçük ek simge (Faz 1: emoji tabanlı ayı). */
const POSE_EXTRA: Partial<Record<BearPose, string>> = {
  wave: "👋",
  yawn: "🥱",
  sleep: "💤",
};

/** Yoldaş ayı (CONTRACT §10.7). Pozlar CSS sınıflarıyla; kozmetik başın üstünde emoji. */
export function BearAvatar({
  pose = "idle",
  size = 64,
  cosmetic = null,
}: {
  pose?: BearPose;
  size?: number;
  cosmetic?: CosmeticId | null;
}) {
  const cosmeticEmoji = cosmetic
    ? COSMETICS.find((c) => c.id === cosmetic)?.emoji
    : undefined;
  const extra = POSE_EXTRA[pose];
  return (
    <span
      className={`home-bear home-bear--${pose}`}
      data-pose={pose}
      data-cosmetic={cosmetic ?? undefined}
      style={{ "--bear-size": `${size}px` } as CSSProperties}
      aria-hidden
    >
      <span className="home-bear-face">🐻</span>
      {cosmeticEmoji && <span className="home-bear-cosmetic">{cosmeticEmoji}</span>}
      {extra && <span className="home-bear-extra">{extra}</span>}
    </span>
  );
}
