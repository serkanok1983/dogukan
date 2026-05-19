"use client";

type Props = {
  score: number;
  selfHigh: number;
  rivalHigh: number;
  rivalName: string;
};

export function ScoreHud({ score, selfHigh, rivalHigh, rivalName }: Props) {
  return (
    <div className="score-hud" aria-live="polite">
      <span className="score-hud-now">Puan: <strong>{score}</strong></span>
      <span className="score-hud-best">Rekor: {selfHigh}</span>
      {rivalName && (
        <span className="score-hud-rival">
          {rivalName}: {rivalHigh}
        </span>
      )}
    </div>
  );
}
