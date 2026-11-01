"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameBoot, useRegisterRestart } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { SayButton } from "@/components/SayButton";
import { haptic } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { speak } from "@/lib/speech";
import { randInt, shuffle } from "@/lib/utils";

const GAME_SLUG = "balon-patlat";
const ROUNDS = 6;

type Balloon = { id: number; answer: number; color: string };
type Problem = { a: number; b: number; correct: number; order: number[] };

function makeProblem(): Problem {
  const a = randInt(1, 5);
  const b = randInt(1, 5);
  // Doğru balon her turda başka yerde olsun ("hep soldakine bas" öğrenilmesin).
  return { a, b, correct: a + b, order: shuffle([0, 1, 2, 3]) };
}

function problemSay(p: Problem): string {
  return `${p.a} artı ${p.b} kaç eder?`;
}

export function BalloonPop() {
  const running = useGameRunning();
  const [round, setRound] = useState(0);
  const [problem, setProblem] = useState<Problem>(makeProblem);
  const [popped, setPopped] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { a, b, correct } = problem;

  const options: Balloon[] = [
    { id: 1, answer: correct, color: "#ff6b9d" },
    { id: 2, answer: correct + 1, color: "#4ecdc4" },
    { id: 3, answer: correct - 1, color: "#ffd93d" },
    { id: 4, answer: correct + 2, color: "#a78bfa" },
  ];
  const balloons = problem.order
    .map((i) => options[i])
    .filter((bl) => bl.answer > 0);

  const done = round >= ROUNDS;

  useEffect(() => {
    if (running && !done) speak(problemSay(problem));
  }, [running, done, problem]);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  const pop = (ans: number, id: number) => {
    if (!running || popped !== null || done) return;
    if (ans === correct) {
      sounds.pop();
      haptic("tick");
      setPopped(id);
      setScore((s) => s + 1);
      advanceTimer.current = setTimeout(() => {
        advanceTimer.current = null;
        setPopped(null);
        setProblem(makeProblem());
        setRound((r) => r + 1);
      }, 400);
    } else {
      sounds.softWrong();
      haptic("fail");
    }
  };

  useEffect(() => {
    if (done && !submitted.current) {
      submitted.current = true;
      void scoreGame.submitFinal(score);
    }
  }, [done, score, scoreGame]);

  const restart = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    setRound(0);
    setScore(0);
    setPopped(null);
    setProblem(makeProblem());
    submitted.current = false;
    scoreGame.resetMilestones();
  }, [scoreGame]);

  useGameBoot(restart);
  useRegisterRestart(restart);

  if (done) {
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">🎈</div>
        <h2>
          Hepsi patladı! <SayButton text={`Hepsi patladı! ${score} balon.`} size={56} />
        </h2>
        <p className="result-score">{score} doğru balon</p>
        <button type="button" className="btn-primary" onClick={restart}>
          Tekrar oyna
        </button>
      </div>
    );
  }

  return (
    <div className="game-panel gf-balloons">
      <ScoreHud
        score={score}
        selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
        playerName={scoreGame.playerName}
      />
      <p className="round-label" aria-label={`Tur ${round + 1} / ${ROUNDS}`}>
        {"🎈".repeat(round + 1)}
        <span className="gf-balloons-left">{"○".repeat(ROUNDS - round - 1)}</span>
      </p>
      <div className="gf-balloons-ask">
        <h2 className="count-prompt">
          {a} + {b} = ?
        </h2>
        <SayButton text={problemSay(problem)} size={56} />
      </div>
      <div className="balloon-sky">
        {balloons.map((bl) => (
          <button
            key={`${round}-${bl.id}`}
            type="button"
            className={`balloon${popped === bl.id ? " gf-popped" : ""}`}
            style={{ background: bl.color }}
            onClick={() => pop(bl.answer, bl.id)}
            aria-label={String(bl.answer)}
          >
            <span className="balloon-num">{bl.answer}</span>
            <span className="balloon-string" />
          </button>
        ))}
      </div>
    </div>
  );
}
