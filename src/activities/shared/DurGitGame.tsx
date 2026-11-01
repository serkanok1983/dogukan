"use client";

import { useEffect, useReducer, useRef } from "react";
import { SayButton } from "@/components/SayButton";
import { useGameScore } from "@/hooks/useGameScore";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { praise } from "@/lib/praise";
import { sounds } from "@/lib/sounds";
import { speak } from "@/lib/speech";
import {
  GAME_MS,
  LANES,
  initialDgState,
  isTarget,
  phaseOf,
  reduceDg,
  secondsLeft,
  type Creature,
} from "./durGitLogic";
import "./durgit.css";

const TICK_MS = 100;
const RULE_GO = "Balıklara dokun. Köpekbalığına dokunma!";
const RULE_FAST = "Balıklar hızlandı!";
const RULE_RED = "Şimdi sadece kırmızı balığa dokun!";

function creatureLabel(c: Creature): string {
  if (c.kind === "shark") return "köpekbalığı";
  return c.color === "kirmizi" ? "kırmızı balık" : "mavi balık";
}

export function DurGitGame() {
  const [state, dispatch] = useReducer(reduceDg, undefined, initialDgState);
  const active = useGameActive();
  const { resetMilestones, submitFinal } = useGameScore("dur-git");
  const finishedRun = useRef(0);

  const playing = state.status === "playing";
  const running = playing && active;
  const phase = phaseOf(state.elapsed);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      dispatch({
        type: "tick",
        dt: TICK_MS,
        rand: [Math.random(), Math.random(), Math.random(), Math.random()],
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!playing) return;
    if (phase === 2) speak(RULE_FAST);
    if (phase === 3) speak(RULE_RED);
  }, [phase, playing]);

  useEffect(() => {
    if (state.status !== "over" || finishedRun.current === state.run) return;
    finishedRun.current = state.run;
    sounds.win();
    void submitFinal(state.score);
    speak(`${praise("run_end")} ${state.score} balık yakaladın.`);
  }, [state.status, state.run, state.score, submitFinal]);

  const start = () => {
    resetMilestones();
    dispatch({ type: "start" });
    speak(RULE_GO);
  };

  // Kabuğun StartCard'ındaki tek "Başla" dokunuşu oyunu başlatır (ikinci düğme yok).
  useGameBoot(start);

  const tap = (c: Creature) => {
    if (!running) return;
    if (isTarget(c, phase)) sounds.pop();
    else sounds.softWrong();
    dispatch({ type: "tap", id: c.id });
  };

  if (state.status === "ready") {
    return (
      <div className="game-panel dg-panel">
        <div className="dg-rule" aria-hidden="true">
          <span className="dg-rule-item dg-ok">🐟 ✅</span>
          <span className="dg-rule-item dg-no">🦈 ❌</span>
        </div>
        <p className="dg-text">
          {RULE_GO} <SayButton text={RULE_GO} />
        </p>
      </div>
    );
  }

  if (state.status === "over") {
    const line = `${state.score} balık yakaladın.`;
    return (
      <div className="game-panel result-panel dg-panel">
        <div className="result-emoji" aria-hidden="true">
          🐟
        </div>
        <p className="dg-score-big">{state.score}</p>
        <p className="dg-text">
          {line} <SayButton text={line} />
        </p>
        <button type="button" className="btn-primary dg-big" onClick={start}>
          Bir daha ▶
        </button>
      </div>
    );
  }

  const ruleNow = phase === 3 ? RULE_RED : RULE_GO;
  const left = secondsLeft(state);

  return (
    <div className="game-panel dg-panel">
      <div className="dg-hud">
        <span className="dg-chip" aria-label={`${state.score} puan`}>
          🐟 {state.score}
        </span>
        <span className="dg-chip" aria-label={`${left} saniye`}>
          ⏱️ {left}
        </span>
      </div>
      <div className="dg-timebar" aria-hidden="true">
        <div
          className="dg-timebar-fill"
          style={{ width: `${(1 - state.elapsed / GAME_MS) * 100}%` }}
        />
      </div>
      <p className={`dg-text dg-banner${phase === 3 ? " is-red" : ""}`}>
        {phase === 3 ? "🔴🐟 " : ""}
        {ruleNow} <SayButton text={ruleNow} />
      </p>
      <div
        className={`dg-pond${active ? "" : " is-paused"}`}
        role="group"
        aria-label="Göl"
      >
        {state.creatures.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`dg-creature dg-${c.dir} dg-${c.kind === "shark" ? "shark" : c.color}`}
            style={{
              top: `${4 + (c.lane * 92) / LANES}%`,
              animationDuration: `${c.durationMs}ms`,
            }}
            aria-label={creatureLabel(c)}
            onPointerDown={(e) => {
              e.preventDefault();
              tap(c);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                tap(c);
              }
            }}
            onAnimationEnd={() => dispatch({ type: "escape", id: c.id })}
          >
            <span aria-hidden="true">{c.kind === "shark" ? "🦈" : "🐟"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
