"use client";

type Props = {
  score: number;
  selfHigh: number;
  rivalHigh?: number;
  rivalName?: string;
  playerName?: string;
};

export function ScoreHud({ score, selfHigh, rivalHigh = 0, rivalName = "Rakip", playerName = "Sen" }: Props) {
  const leader =
    selfHigh === rivalHigh ? "Berabere" : selfHigh > rivalHigh ? `${playerName} önde` : `${rivalName} önde`;

  return (
    <div className="score-hud" aria-live="polite">
      <span className="score-hud-now">
        Puan: <strong>{score}</strong>
      </span>
      <span className="score-hud-best">Rekor: {selfHigh}</span>
      <div className="score-hud-rival">
        <p className="score-hud-rival-title">🏆 Rekorlar</p>
        <p>
          {rivalName}: {rivalHigh} · {playerName}: {selfHigh}
        </p>
        <p>Bu oyunda lider: {leader}</p>
      </div>
    </div>
  );
}
