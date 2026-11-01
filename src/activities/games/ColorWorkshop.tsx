"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { SayButton } from "@/components/SayButton";
import { useGameBoot } from "@/lib/gameSession";
import { praise } from "@/lib/praise";
import { sounds } from "@/lib/sounds";
import { speak } from "@/lib/speech";
import { randInt, shuffle } from "@/lib/utils";
import "./color-workshop.css";

type Level = {
  prompt: string;
  target: string;
  emoji: string;
  parts: { color: string; label: string }[];
  answer: string;
};

const LEVELS: Level[] = [
  { prompt: "Mavi + Sarı = ?", target: "#22c55e", emoji: "🎨", parts: [{ color: "#3b82f6", label: "Mavi" }, { color: "#eab308", label: "Sarı" }], answer: "Yeşil" },
  { prompt: "Kırmızı + Sarı = ?", target: "#f97316", emoji: "🎨", parts: [{ color: "#ef4444", label: "Kırmızı" }, { color: "#eab308", label: "Sarı" }], answer: "Turuncu" },
  { prompt: "Kırmızı + Mavi = ?", target: "#a855f7", emoji: "🎨", parts: [{ color: "#ef4444", label: "Kırmızı" }, { color: "#3b82f6", label: "Mavi" }], answer: "Mor" },
  { prompt: "Kırmızı + Beyaz = ?", target: "#f9a8d4", emoji: "🎨", parts: [{ color: "#ef4444", label: "Kırmızı" }, { color: "#ffffff", label: "Beyaz" }], answer: "Pembe" },
  { prompt: "Mavi + Yeşil = ?", target: "#06b6d4", emoji: "🎨", parts: [{ color: "#3b82f6", label: "Mavi" }, { color: "#22c55e", label: "Yeşil" }], answer: "Turkuaz" },
  { prompt: "Siyah + Beyaz = ?", target: "#9ca3af", emoji: "🎨", parts: [{ color: "#000000", label: "Siyah" }, { color: "#ffffff", label: "Beyaz" }], answer: "Gri" },
  { prompt: "Kırmızı + Yeşil = ?", target: "#854d0e", emoji: "🎨", parts: [{ color: "#ef4444", label: "Kırmızı" }, { color: "#22c55e", label: "Yeşil" }], answer: "Kahverengi" },
  { prompt: "Sarı + Turuncu = ?", target: "#f59e0b", emoji: "🎨", parts: [{ color: "#eab308", label: "Sarı" }, { color: "#f97316", label: "Turuncu" }], answer: "Altın Sarısı" },
];

const OPTIONS = [
  { color: "#22c55e", name: "Yeşil" },
  { color: "#f97316", name: "Turuncu" },
  { color: "#a855f7", name: "Mor" },
  { color: "#f9a8d4", name: "Pembe" },
  { color: "#06b6d4", name: "Turkuaz" },
  { color: "#9ca3af", name: "Gri" },
  { color: "#854d0e", name: "Kahverengi" },
  { color: "#f59e0b", name: "Altın Sarısı" },
  { color: "#3b82f6", name: "Mavi" },
  { color: "#ef4444", name: "Kırmızı" },
  { color: "#eab308", name: "Sarı" },
  { color: "#ffffff", name: "Beyaz" },
  { color: "#000000", name: "Siyah" },
  { color: "#ec4899", name: "Parlak Pembe" },
  { color: "#14b8a6", name: "Deniz Yeşili" },
];

function getFakeOptions(correct: string, count: number): string[] {
  const names = OPTIONS.filter((o) => o.name !== correct).map((o) => o.name);
  const picked: string[] = [];
  while (picked.length < count && names.length > 0) {
    const idx = randInt(0, names.length - 1);
    picked.push(names[idx]);
    names.splice(idx, 1);
  }
  return picked;
}

const lower = (s: string) => s.toLocaleLowerCase("tr");

/** Sesli soru: "Mavi ile sarı karışınca hangi renk olur?" */
function colorPromptSay(level: Level): string {
  const [a, b] = level.parts;
  return `${a.label} ile ${lower(b.label)} karışınca hangi renk olur?`;
}

const isWhite = (color: string | undefined) => color === "#ffffff";

export function ColorWorkshop() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "ok" | "bad">("idle");
  const [picked, setPicked] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);
  const [doneLine, setDoneLine] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const level = LEVELS[round % LEVELS.length];

  const options = useMemo(() => {
    const correct = level.answer;
    const fakes = getFakeOptions(correct, 3);
    return shuffle([correct, ...fakes]);
  }, [level]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // StartCard'daki "Başla" dokunuşundan sonra ilk soru sesli sorulur.
  useGameBoot(() => speak(colorPromptSay(LEVELS[0])));

  const later = (fn: () => void, ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      fn();
    }, ms);
  };

  const pick = (name: string) => {
    if (feedback !== "idle") return;
    setPicked(name);
    if (name === level.answer) {
      sounds.success();
      if (!missed) setScore((s) => s + 1);
      setFeedback("ok");
      speak(`${name}! ${praise(missed ? "correct_retry" : "correct_first")}`);
      later(() => {
        if (round + 1 >= LEVELS.length) {
          const line = praise("set_done_high");
          setDoneLine(line);
          sounds.win();
          speak(line, { interrupt: false });
        } else {
          setRound((r) => r + 1);
          setFeedback("idle");
          setPicked(null);
          setMissed(false);
          speak(colorPromptSay(LEVELS[round + 1]), { interrupt: false });
        }
      }, 900);
    } else {
      sounds.softWrong();
      setMissed(true);
      setFeedback("bad");
      speak(`${name}. ${praise("wrong_try_again")}`);
      later(() => {
        setFeedback("idle");
        setPicked(null);
      }, 700);
    }
  };

  const restart = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setRound(0);
    setScore(0);
    setFeedback("idle");
    setPicked(null);
    setMissed(false);
    setDoneLine(null);
    speak(colorPromptSay(LEVELS[0]));
  };

  if (doneLine) {
    const scoreSay = `${LEVELS.length} renkten ${score} tanesini ilk denemede buldun.`;
    return (
      <div className="game-panel result-panel color-workshop">
        <div className="result-emoji" aria-hidden="true">
          🖌️
        </div>
        <h2 className="color-mix-title">
          {doneLine} <SayButton text={`${doneLine} ${scoreSay}`} />
        </h2>
        <p className="result-score" aria-label={scoreSay}>
          ⭐ {score} / {LEVELS.length}
        </p>
        <button type="button" className="btn-primary" onClick={restart}>
          Tekrar Oyna
        </button>
      </div>
    );
  }

  const promptSay = colorPromptSay(level);

  return (
    <div className="game-panel color-workshop">
      <p
        className="color-mix-round"
        aria-label={`Tur ${round + 1} / ${LEVELS.length}`}
      >
        🎨 {round + 1}/{LEVELS.length} · ⭐ {score}
      </p>
      <div className="color-mix-demo">
        {level.parts.map((p, i) => (
          <Fragment key={p.color}>
            {i > 0 && (
              <span className="color-mix-plus" aria-hidden="true">
                +
              </span>
            )}
            <div className="color-mix-part">
              <button
                type="button"
                className={`color-mix-swatch${isWhite(p.color) ? " is-white" : ""}`}
                style={{ background: p.color }}
                aria-label={p.label}
                onClick={() => speak(p.label)}
              />
              <span className="color-mix-label">{p.label}</span>
            </div>
          </Fragment>
        ))}
        <span className="color-mix-eq" aria-hidden="true">
          =
        </span>
        <div className="color-mix-part">
          <span
            className={`color-mix-swatch color-mix-result${feedback === "ok" ? " is-found" : ""}`}
            style={feedback === "ok" ? { background: level.target } : undefined}
            aria-hidden="true"
          >
            {feedback === "ok" ? "" : "?"}
          </span>
          <span className="color-mix-label">
            {feedback === "ok" ? level.answer : "?"}
          </span>
        </div>
      </div>
      <p className="color-mix-prompt">
        {level.prompt} <SayButton text={promptSay} />
      </p>
      <div className="color-workshop-options">
        {options.map((name) => {
          const opt = OPTIONS.find((o) => o.name === name);
          const isCorrect = feedback === "ok" && name === level.answer;
          const isWrong = feedback === "bad" && name === picked;
          return (
            <button
              key={name}
              type="button"
              className={`option-btn color-mix-option${isCorrect ? " correct" : ""}${isWrong ? " wrong" : ""}`}
              style={{
                opacity: feedback === "ok" && name !== level.answer ? 0.5 : 1,
              }}
              onClick={() => pick(name)}
              disabled={feedback !== "idle"}
              aria-label={name}
            >
              <span
                className={`color-mix-dot${isWhite(opt?.color) ? " is-white" : ""}`}
                style={{ background: opt?.color ?? "#ccc" }}
                aria-hidden="true"
              />
              <span className="color-mix-name">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
