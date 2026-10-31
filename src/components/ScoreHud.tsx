"use client";

import { useSettings, type Settings } from "@/lib/settings";

type Props = {
  score: number;
  selfHigh: number;
  rivalHigh?: number;
  rivalName?: string;
  playerName?: string;
};

const selectRivalVisible = (s: Settings) => s.rivalVisible;

/**
 * Okumayan çocuk için yalnızca ikon + sayı (MASTER_PLAN §2.5).
 * Babayla rekabet satırı yalnızca `settings.rivalVisible` açıkken görünür.
 */
export function ScoreHud({
  score,
  selfHigh,
  rivalHigh = 0,
  rivalName = "Rakip",
  playerName = "Sen",
}: Props) {
  const rivalVisible = useSettings(selectRivalVisible);
  const leader =
    selfHigh === rivalHigh
      ? "Berabere"
      : selfHigh > rivalHigh
        ? `${playerName} önde`
        : `${rivalName} önde`;

  return (
    <div className="score-hud gf-score-hud" aria-live="polite">
      <span className="score-hud-now" aria-label={`Puan ${score}`}>
        <span aria-hidden>⭐</span> <strong>{score}</strong>
      </span>
      <span className="score-hud-best" aria-label={`Rekor ${selfHigh}`}>
        <span aria-hidden>🏆</span> {selfHigh}
      </span>
      {rivalVisible && (
        <div className="score-hud-rival">
          <p className="score-hud-rival-title">🏆 Rekorlar</p>
          <p>
            {rivalName}: {rivalHigh} · {playerName}: {selfHigh}
          </p>
          <p>Bu oyunda lider: {leader}</p>
        </div>
      )}
    </div>
  );
}
