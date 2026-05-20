"use client";

type Props = {
  score: number;
  selfHigh: number;
};

export function ScoreHud({ score, selfHigh }: Props) {
  return (
    <div className="score-hud" aria-live="polite">
      <span className="score-hud-now">
        Puan: <strong>{score}</strong>
      </span>
      <span className="score-hud-best">Rekor: {selfHigh}</span>
    </div>
  );
}
