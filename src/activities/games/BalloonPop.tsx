"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGameActive } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";

const GAME_SLUG = "balon-patlat";

type Balloon = { id: number; answer: number; x: number; color: string };

export function BalloonPop() {
  const active = useGameActive();
  const running = useGameRunning();
  const [round, setRound] = useState(0);
  const { a, b, correct } = useMemo(
    () => {
      const a = randInt(1, 5);
      const b = randInt(1, 5);
      return { a, b, correct: a + b };
    },
    [round]
  );
  const [score, setScore] = useState(0);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const balloons: Balloon[] = [
    { id: 1, answer: correct, x: 15, color: "#ff6b9d" },
    { id: 2, answer: correct + 1, x: 40, color: "#4ecdc4" },
    { id: 3, answer: correct - 1, x: 65, color: "#ffd93d" },
    { id: 4, answer: correct + 2, x: 85, color: "#a78bfa" },
  ].filter((b) => b.answer > 0);

  const pop = (ans: number) => {
    if (!running) return;
    if (ans === correct) {
      sounds.pop();
      setScore((s) => s + 1);
      if (round + 1 >= 6) return;
      setTimeout(() => setRound((r) => r + 1), 400);
    } else {
      sounds.wrong();
    }
  };

  const done = round >= 6;

  useEffect(() => {
    if (done && !submitted.current) {
      submitted.current = true;
      scoreGame.submitFinal(score);
    }
  }, [done, score, scoreGame]);

  const restart = () => {
    setRound(0);
    setScore(0);
    submitted.current = false;
    scoreGame.resetMilestones();
  };

  if (done) {
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">🎈</div>
        <h2>Harika!</h2>
        <p className="result-score">{score} doğru balon</p>
        <button type="button" className="btn-primary" onClick={restart}>
          Tekrar oyna
        </button>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <ScoreHud
        score={score}
        selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
        playerName={scoreGame.playerName}
      />
      <p className="round-label">
        Tur {round + 1}/6 · {a} + {b} = ?
      </p>
      {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca balonlar gelir</p>}
      <h2 className="count-prompt">Doğru cevabın balonunu patlat!</h2>
      <div className="balloon-sky">
        {balloons.map((b) => (
          <button
            key={b.id}
            type="button"
            className="balloon"
            style={{ left: `${b.x}%`, background: b.color }}
            onClick={() => pop(b.answer)}
          >
            <span className="balloon-num">{b.answer}</span>
            <span className="balloon-string" />
          </button>
        ))}
      </div>
    </div>
  );
}
