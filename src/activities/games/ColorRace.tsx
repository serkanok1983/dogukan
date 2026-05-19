"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";

const GAME_SLUG = "renk-yaris";

const COLORS = [
  { name: "Kırmızı", hex: "#ef4444", emoji: "🔴" },
  { name: "Mavi", hex: "#3b82f6", emoji: "🔵" },
  { name: "Sarı", hex: "#eab308", emoji: "🟡" },
  { name: "Yeşil", hex: "#22c55e", emoji: "🟢" },
  { name: "Turuncu", hex: "#f97316", emoji: "🟠" },
  { name: "Mor", hex: "#a855f7", emoji: "🟣" },
];

const DURATION = 40;

export function ColorRace() {
  const active = useGameActive();
  const running = useGameRunning();
  const [target, setTarget] = useState(COLORS[0]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [time, setTime] = useState(DURATION);
  const [done, setDone] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const nextTarget = useCallback((avoid?: string) => {
    let next = COLORS[randInt(0, COLORS.length - 1)];
    while (avoid && next.name === avoid) {
      next = COLORS[randInt(0, COLORS.length - 1)];
    }
    setTarget(next);
  }, []);

  const reset = useCallback(() => {
    setScore(0);
    setStreak(0);
    setTime(DURATION);
    setDone(false);
    submitted.current = false;
    nextTarget();
    scoreGame.resetMilestones();
  }, [nextTarget, scoreGame]);

  useGameBoot(reset);

  useEffect(() => {
    if (done && !submitted.current) {
      submitted.current = true;
      scoreGame.submitFinal(score);
    }
  }, [done, score, scoreGame]);

  useEffect(() => {
    if (!running || done) return;
    const t = setInterval(() => {
      setTime((tm) => {
        if (tm <= 1) {
          setDone(true);
          sounds.win();
          return 0;
        }
        return tm - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, done]);

  const pick = (c: (typeof COLORS)[0]) => {
    if (!running || done) return;
    if (c.name === target.name) {
      const bonus = Math.min(streak, 8) * 2;
      setScore((s) => {
        const ns = s + 1 + bonus;
        scoreGame.checkMilestone(ns);
        return ns;
      });
      setStreak((st) => {
        const ns = st + 1;
        if (ns % 5 === 0) sounds.combo(ns);
        else sounds.success();
        return ns;
      });
    } else {
      sounds.wrong();
      setStreak(0);
    }
    nextTarget(target.name);
  };

  return (
    <div className="game-panel">
      <ScoreHud
        score={score}
        selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
      />
      <p className="round-label">
        Süre: {time}s {streak >= 3 ? `· 🔥${streak}` : ""}
      </p>
      {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca süre işler</p>}
      {done ? (
        <div className="result-panel inner">
          <h2>🌈 Süre doldu!</h2>
          <p className="result-score">{score} doğru renk</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      ) : (
        <>
          <h2 className="count-prompt">
            <span className="color-dot color-dot-lg" style={{ background: target.hex }} />
            {target.emoji} {target.name} rengine dokun!
          </h2>
          <div className="color-race-grid color-race-grid-6">
            {COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                className="color-btn color-btn-lg"
                style={{ background: c.hex }}
                onClick={() => pick(c)}
                aria-label={c.name}
              >
                <span className="color-btn-emoji">{c.emoji}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
