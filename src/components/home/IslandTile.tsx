"use client";

import type { CSSProperties } from "react";
import { shellLine, SHELL } from "@/content/shell";
import { VOICE } from "@/content/voice";
import type { World } from "@/lib/worlds";
import { SpokenTile } from "./SpokenTile";
import { sayOnly } from "./spokenNav";

export function islandHref(id: World["id"]): string {
  return `/ada/${id}/`;
}

/** Akşam modunda uyuyan adanın sesi. */
export function sleepingLine(world: World): string {
  return world.id === "macera"
    ? VOICE.eveningTile
    : shellLine(SHELL.islandSleeping, { ada: world.name });
}

/** Harita adası: emoji, ad ve yıldız doluluk halkası (≥ 96 px). */
export function IslandTile({
  world,
  fill,
  stars,
  sleeping = false,
  onActivate,
}: {
  world: World;
  /** 0–1: toplanan yıldız / (3 × görünür etkinlik). */
  fill: number;
  stars: number;
  sleeping?: boolean;
  onActivate?: () => void;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, fill)) * 100);
  return (
    <SpokenTile
      href={islandHref(world.id)}
      visual={
        <span
          className="home-island-ring"
          style={{ "--fill": `${pct}%` } as CSSProperties}
          aria-hidden
        >
          <span className="home-island-emoji">{world.emoji}</span>
        </span>
      }
      label={world.name}
      say={world.say}
      accent={world.accent}
      className={sleeping ? "home-island is-sleeping" : "home-island"}
      badge={sleeping ? "💤" : undefined}
      onActivate={sleeping ? () => sayOnly(sleepingLine(world)) : onActivate}
    >
      <span className="home-island-stars" aria-label={`${stars} yıldız`}>
        <span aria-hidden>⭐</span> {stars}
      </span>
    </SpokenTile>
  );
}
