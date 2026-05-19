"use client";

import { useCallback, useEffect, useState } from "react";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";

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
  const [target, setTarget] = useState(COLORS[0]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [time, setTime] = useState(DURATION);
  const [done, setDone] = useState(false);

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
    nextTarget();
  }, [nextTarget]);

  useEffect(() => {
    if (done) return;
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
  }, [done]);

  const pick = (c: (typeof COLORS)[0]) => {
    if (done) return;
    if (c.name === target.name) {
      const bonus = Math.min(streak, 8) * 2;
      setScore((s) => s + 1 + bonus);
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
      <p className="round-label">
        Süre: {time}s · Puan: {score} {streak >= 3 ? `· 🔥${streak}` : ""}
      </p>
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
