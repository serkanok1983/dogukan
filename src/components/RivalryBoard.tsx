"use client";

import { useEffect, useMemo, useState } from "react";
import { getPlayerDisplayName, getPlayerId, type PlayerId } from "@/lib/auth";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getAllLeaderboards, subscribeAllLeaderboards, type ScoreBoard } from "@/lib/leaderboard";
import { MENU } from "@/lib/menu";

const GAME_SLUGS = MENU.find((c) => c.id === "oyun")?.items.map((i) => i.slug) ?? [];

function labelFor(slug: string) {
  return MENU.find((c) => c.id === "oyun")?.items.find((i) => i.slug === slug)?.label ?? slug;
}

export function RivalryBoard() {
  const player = getPlayerId();
  const [boards, setBoards] = useState<Record<PlayerId, ScoreBoard>>(() => getAllLeaderboards());

  useEffect(() => {
    setBoards(getAllLeaderboards());
    const unsub = subscribeAllLeaderboards(setBoards);
    return () => {
      unsub?.();
    };
  }, []);

  const rows = useMemo(() => {
    return GAME_SLUGS.map((slug) => {
      const d = boards.dogukan[slug] ?? 0;
      const s = boards.serkan[slug] ?? 0;
      if (d === 0 && s === 0) return null;
      const leader: PlayerId = d >= s ? "dogukan" : "serkan";
      return { slug, d, s, leader };
    }).filter(Boolean) as {
      slug: string;
      d: number;
      s: number;
      leader: PlayerId;
    }[];
  }, [boards]);

  if (!player || rows.length === 0) return null;

  return (
    <section className="rivalry-board" aria-label="Rekabet tablosu">
      <h2>🏆 Rekabet</h2>
      <p className="rivalry-hint">
        Merhaba {getPlayerDisplayName(player)}! {getPlayerDisplayName("dogukan")} ve{" "}
        {getPlayerDisplayName("serkan")} en yüksek puanları burada yarışıyor
        {isFirebaseConfigured() ? " (tüm cihazlarda senkron)." : "."}
      </p>
      <ul className="rivalry-list">
        {rows.slice(0, 10).map((r) => (
          <li key={r.slug} className={r.leader === player ? "rivalry-leading" : ""}>
            <span className="rivalry-game">{labelFor(r.slug)}</span>
            <span className="rivalry-scores">
              <span title={getPlayerDisplayName("dogukan")}>🦸 {r.d}</span>
              <span className="rivalry-vs">vs</span>
              <span title={getPlayerDisplayName("serkan")}>👨 {r.s}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
