"use client";

import { useEffect, useState } from "react";
import { sounds } from "@/lib/sounds";
import { randInt } from "@/lib/utils";

const COLORS = [
  { name: "Kırmızı", hex: "#ef4444" },
  { name: "Mavi", hex: "#3b82f6" },
  { name: "Sarı", hex: "#eab308" },
  { name: "Yeşil", hex: "#22c55e" },
];

export function ColorRace() {
  const [target, setTarget] = useState(COLORS[0]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(15);
  const [done, setDone] = useState(false);

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
      sounds.success();
      setScore((s) => s + 1);
    } else {
      sounds.wrong();
    }
    setTarget(COLORS[randInt(0, COLORS.length - 1)]);
  };

  return (
    <div className="game-panel">
      <p className="round-label">
        Süre: {time}s · Puan: {score}
      </p>
      {done ? (
        <div className="result-panel inner">
          <h2>Süre doldu!</h2>
          <p className="result-score">{score} doğru</p>
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            Tekrar
          </button>
        </div>
      ) : (
        <>
          <h2 className="count-prompt">
            <span className="color-dot" style={{ background: target.hex }} /> {target.name} rengine dokun!
          </h2>
          <div className="color-race-grid">
            {COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                className="color-btn"
                style={{ background: c.hex }}
                onClick={() => pick(c)}
                aria-label={c.name}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
