"use client";

/**
 * Seçmeli soru oyunu (~20 görünür etkinlik). Okumayı yeni öğrenen çocuk için:
 *
 * - Soru açılınca okunur (StartCard dokunuşu sesi açtı); sonra seçenekler sırayla,
 *   vurguyla okunur. Herhangi bir dokunuş okumayı keser; uzun basınca seçenek okunur.
 * - ≥ 56 px 🔊 tekrar düğmesi; seçenekler ≥ 96 px, yazılar ≥ 18 px.
 * - 1. yanlış: yumuşak ton, `praise("wrong_try_again")`, ipucu, soru yavaş tekrar.
 *   2. yanlış: cevap gösterilir ve okunur (`praise("wrong_reveal")`), "Devam ▶".
 * - Her cevaplanan sorudan sonra `notifyNaturalPause("card_end")`; set sonunda
 *   `exercise_set_end` (etkinliğin becerisi varsa) ve `notifyNaturalPause("set_end")`.
 * - Oyun etkin değilken (iyi oluş katmanı, ⏸) konuşma başlamaz, cevap alınmaz;
 *   katman kapanınca o anki soru bir kez yeniden okunur.
 */
import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { PressButton } from "@/activities/engine/PressButton";
import { createTimers } from "@/activities/engine/timers";
import {
  createVoiceQueue,
  type LineInput,
  type VoiceQueue,
} from "@/activities/engine/voice";
import { SayButton } from "@/components/SayButton";
import { useGameActive } from "@/lib/gameSession";
import { praise } from "@/lib/praise";
import { trackEvent } from "@/lib/progress/events";
import { notifyNaturalPause } from "@/lib/sessionClock";
import { sounds } from "@/lib/sounds";
import { cancelSpeech } from "@/lib/speech";
import { getActivityInfo } from "@/lib/worlds";
import { explainSay, hintSay, optionSay, questionSay } from "./quizSpeech";

export type QuizQuestion = {
  prompt: string;
  /** Sorunun konuşma biçimi; yoksa `prompt`tan türetilir (quizSpeech.toSpoken). */
  say?: string;
  emoji?: string;
  answer: string;
  options: string[];
  /** Seçeneklerin konuşma biçimi (yalnız emoji olan seçenekler için gerekli). */
  optionSay?: Readonly<Record<string, string>>;
  hint?: string;
  explanation?: string;
};

type Props = { questions: QuizQuestion[]; slug?: string };

const MAX_QUESTIONS_PER_SESSION = 6;
/** Doğru sonrası ses bitmezse bile ilerlemek için üst sınır. */
const ADVANCE_FALLBACK_MS = 9000;
const ADVANCE_AFTER_VOICE_MS = 400;

type Phase = "ask" | "hint" | "correct" | "reveal";
type Mark = "empty" | "star" | "late" | "miss";

type Quiz = {
  run: number;
  start: number;
  idx: number;
  phase: Phase;
  /** İlk denemede seçilen yanlış seçenek. */
  wrong: string | null;
  caption: string;
  marks: Mark[];
  done: boolean;
};

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function rotate<T>(items: T[], amount: number): T[] {
  if (items.length === 0) return items;
  const offset = amount % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function makeOptions(question: QuizQuestion): string[] {
  const wrong = question.options.filter((o) => o !== question.answer);
  const seed = stableHash(`${question.prompt}|${question.answer}`);
  const selectedWrong = rotate(wrong, seed).slice(0, 3);
  return rotate([question.answer, ...selectedWrong], seed >>> 3);
}

function getSession(questions: QuizQuestion[], start: number): QuizQuestion[] {
  return questions.slice(start, start + MAX_QUESTIONS_PER_SESSION);
}

function getNextSessionStart(
  total: number,
  start: number,
  sessionLength: number,
): number {
  return start + sessionLength >= total ? 0 : start + sessionLength;
}

function newSet(questions: QuizQuestion[], run: number, start: number): Quiz {
  return {
    run,
    start,
    idx: 0,
    phase: "ask",
    wrong: null,
    caption: "",
    marks: getSession(questions, start).map((): Mark => "empty"),
    done: false,
  };
}

export function QuizGame({ questions, slug }: Props) {
  const [quiz, setQuiz] = useState<Quiz>(() => newSet(questions, 1, 0));
  const [reading, setReading] = useState<{ token: string; option: string } | null>(
    null,
  );
  const [voice] = useState(createVoiceQueue);
  const [timers] = useState(createTimers);
  const active = useGameActive();
  const spokenKey = useRef<string | null>(null);
  const answeredToken = useRef<string | null>(null);
  const advancedKey = useRef<string | null>(null);
  const finishedRun = useRef(0);
  const readoutOn = useRef(false);

  const sessionQuestions = getSession(questions, quiz.start);
  const sessionLength = sessionQuestions.length;
  const q = quiz.done ? undefined : sessionQuestions[quiz.idx];
  const opts = q ? makeOptions(q) : [];
  const itemKey = `${quiz.run}:${quiz.idx}`;
  const skill = slug ? (getActivityInfo(slug)?.skill ?? null) : null;
  const correct = quiz.marks.filter((m) => m === "star" || m === "late").length;
  const firstTry = quiz.marks.filter((m) => m === "star").length;

  useEffect(
    () => () => {
      voice.stop();
      timers.clear();
      cancelSpeech();
    },
    [voice, timers],
  );

  const sayLines = (lines: LineInput[], onDone?: () => void) => {
    readoutOn.current = false;
    voice.say(lines, onDone);
  };

  /** `lead`, soru (ipucunda yavaş) ve ardından seçenekler sırayla, vurguyla. */
  const speakAsk = (
    lead: LineInput[],
    question: QuizQuestion,
    token: string,
    hint: boolean,
    skip: string | null,
  ) => {
    const prompt = questionSay(question);
    const choices: LineInput[] = makeOptions(question)
      .filter((o) => o !== skip)
      .map((o) => {
        const text = optionSay(question, o);
        return text
          ? { text, onStart: () => setReading({ token, option: o }) }
          : null;
      });
    readoutOn.current = choices.some(Boolean);
    voice.say(
      [
        ...lead,
        prompt && (hint ? { text: prompt, rate: 0.75 } : prompt),
        ...choices,
      ],
      () => {
        readoutOn.current = false;
        setReading(null);
      },
    );
  };

  const stopVoice = () => {
    readoutOn.current = false;
    voice.stop();
    setReading(null);
  };

  /** Okuma sürerken herhangi bir dokunuş okumayı keser. */
  const skipReadout = () => {
    if (!readoutOn.current) return;
    stopVoice();
    cancelSpeech();
  };

  // Katman açılınca zinciri durdur (katmanın kendi sesi bizimkini keser);
  // kapanınca o anki soru bir kez yeniden okunur.
  useEffect(() => {
    if (active) return;
    readoutOn.current = false;
    voice.stop();
    spokenKey.current = null;
  }, [active, voice]);

  const speakCurrent = useEffectEvent((question: QuizQuestion) => {
    const token = `${quiz.run}:${quiz.idx}#${quiz.phase}`;
    if (quiz.phase === "ask") speakAsk([], question, token, false, null);
    else if (quiz.phase === "hint")
      speakAsk([quiz.caption, hintSay(question)], question, token, true, quiz.wrong);
    else if (quiz.phase === "reveal")
      sayLines([
        quiz.caption,
        optionSay(question, question.answer),
        explainSay(question),
      ]);
  });

  // Soru açılınca (yalnızca etkinken) oku: StartCard dokunuşu sesi açtı.
  useEffect(() => {
    if (!q || !active || spokenKey.current === itemKey) return;
    spokenKey.current = itemKey;
    speakCurrent(q);
  }, [q, active, itemKey]);

  // Set sonu: tek bir exercise_set_end (beceri varsa) ve doğal mola.
  useEffect(() => {
    if (!quiz.done || finishedRun.current === quiz.run) return;
    finishedRun.current = quiz.run;
    if (skill) {
      trackEvent({
        type: "exercise_set_end",
        slug: slug ?? "",
        skill,
        correct,
        total: sessionLength,
        firstTry,
        mode: "session",
      });
    }
    notifyNaturalPause("set_end");
  }, [quiz.done, quiz.run, skill, slug, correct, firstTry, sessionLength]);

  const advance = (run: number, idx: number) => {
    const key = `${run}:${idx}`;
    if (advancedKey.current === key) return;
    advancedKey.current = key;
    const last = idx + 1 >= sessionLength;
    setQuiz((s) =>
      s.run !== run || s.idx !== idx
        ? s
        : last
          ? { ...s, done: true }
          : { ...s, idx: idx + 1, phase: "ask", wrong: null, caption: "" },
    );
    if (last) sounds.win();
    else notifyNaturalPause("card_end");
  };

  const again = () => {
    stopVoice();
    timers.clear();
    const start = getNextSessionStart(questions.length, quiz.start, sessionLength);
    setQuiz(newSet(questions, quiz.run + 1, start));
  };

  if (quiz.done) {
    return (
      <QuizEnd
        key={quiz.run}
        marks={quiz.marks}
        high={sessionLength > 0 && correct >= sessionLength}
        voice={voice}
        active={active}
        onAgain={again}
      />
    );
  }

  if (!q) return null;

  const { run, idx, phase } = quiz;
  const answering = phase === "ask" || phase === "hint";

  const pick = (choice: string) => {
    if (!active || !answering) return;
    const token = `${run}:${idx}#${phase}`;
    if (answeredToken.current === token) return;
    answeredToken.current = token;

    if (choice === q.answer) {
      const first = phase === "ask";
      sounds.success();
      const caption = praise(first ? "correct_first" : "correct_retry");
      setQuiz((s) => {
        const marks = [...s.marks];
        marks[idx] = first ? "star" : "late";
        return { ...s, phase: "correct", caption, marks };
      });
      timers.later(() => sounds.star(), 450);
      sayLines([caption, explainSay(q)], () =>
        timers.later(() => advance(run, idx), ADVANCE_AFTER_VOICE_MS),
      );
      timers.later(() => advance(run, idx), ADVANCE_FALLBACK_MS);
      return;
    }

    sounds.softWrong();
    if (phase === "ask") {
      const caption = praise("wrong_try_again");
      setQuiz((s) => ({ ...s, phase: "hint", wrong: choice, caption }));
      speakAsk([caption, hintSay(q)], q, `${run}:${idx}#hint`, true, choice);
      return;
    }

    const caption = praise("wrong_reveal");
    setQuiz((s) => {
      const marks = [...s.marks];
      marks[idx] = "miss";
      return { ...s, phase: "reveal", caption, marks };
    });
    sayLines([caption, optionSay(q, q.answer), explainSay(q)]);
  };

  const sayOption = (o: string) => {
    const text = optionSay(q, o);
    if (text) sayLines([text]);
  };

  const promptSay = questionSay(q);
  const readingOption =
    active && answering && reading?.token === `${run}:${idx}#${phase}`
      ? reading.option
      : null;
  const questionId = `quiz-question-${run}-${idx}`;
  const showAnswer = phase === "correct" || phase === "reveal";

  return (
    <div className="game-panel quiz-panel" onPointerDownCapture={skipReadout}>
      <QuizRail marks={quiz.marks} current={idx} />
      <div
        className={`question-card ${phase === "correct" ? "correct" : phase === "hint" || phase === "reveal" ? "wrong" : ""}`}
      >
        {q.emoji && (
          <span className="q-emoji" aria-hidden="true">
            {q.emoji}
          </span>
        )}
        <div className="quiz-prompt">
          {promptSay ? (
            <SayButton
              text={promptSay}
              rate={phase === "hint" ? 0.75 : undefined}
              size={72}
              label="Soruyu tekrar dinle"
              className="quiz-say"
              onPress={stopVoice}
            />
          ) : null}
          <h2 id={questionId}>{q.prompt}</h2>
        </div>
        <div
          className="quiz-feedback"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {quiz.caption ? (
            <p className={phase === "correct" ? "hint-text success" : "hint-text"}>
              {quiz.caption}
            </p>
          ) : null}
          {phase === "hint" && q.hint ? (
            <p className="hint-text">💡 {q.hint}</p>
          ) : null}
          {showAnswer && q.explanation ? (
            <p className="hint-text">{q.explanation}</p>
          ) : null}
        </div>
      </div>
      <div className="options-grid" role="group" aria-labelledby={questionId}>
        {opts.map((o) => {
          const cls = [
            "option-btn",
            showAnswer && o === q.answer ? "correct" : "",
            o === quiz.wrong ? "wrong" : "",
            readingOption === o ? "is-reading" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <PressButton
              key={o}
              className={cls}
              disabled={o === quiz.wrong && phase === "hint"}
              inert={!answering}
              label={optionSay(q, o) ?? o}
              onPress={() => pick(o)}
              onLongPress={() => sayOption(o)}
            >
              {o}
            </PressButton>
          );
        })}
      </div>
      {phase === "reveal" && (
        <button
          type="button"
          className="btn-primary next-btn"
          onClick={() => advance(run, idx)}
        >
          Devam ▶
        </button>
      )}
    </div>
  );
}

const MARK_ICON: Record<Mark, string> = {
  empty: "",
  star: "⭐",
  late: "⭐",
  miss: "•",
};

function QuizRail({
  marks,
  current,
  big,
}: {
  marks: Mark[];
  current?: number;
  big?: boolean;
}) {
  const stars = marks.filter((m) => m === "star" || m === "late").length;
  return (
    <ol
      className={big ? "quiz-rail is-big" : "quiz-rail"}
      aria-label={`${stars} yıldız`}
    >
      {marks.map((m, i) => (
        <li
          key={i}
          className={`quiz-rail-slot is-${m}${i === current ? " is-current" : ""}`}
          aria-hidden="true"
        >
          {MARK_ICON[m]}
        </li>
      ))}
    </ol>
  );
}

function QuizEnd({
  marks,
  high,
  voice,
  active,
  onAgain,
}: {
  marks: Mark[];
  high: boolean;
  voice: VoiceQueue;
  active: boolean;
  onAgain: () => void;
}) {
  const [line] = useState(() => praise(high ? "set_done_high" : "set_done_low"));
  const ask = "Bir tane daha mı? Yoksa haritaya mı dönelim?";
  const said = useRef(false);

  // Yalnızca etkinken okunur; set sonu molası kapanınca bir kez yeniden okunur.
  useEffect(() => {
    if (!active) {
      said.current = false;
      return;
    }
    if (said.current) return;
    said.current = true;
    voice.say([line, ask]);
  }, [active, line, voice]);

  return (
    <div className="game-panel result-panel" role="group" aria-label="Set bitti">
      <QuizRail marks={marks} big />
      <div className="result-emoji" aria-hidden="true">
        {high ? "🏆" : "⭐"}
      </div>
      <div className="quiz-end-head">
        <SayButton text={`${line} ${ask}`} size={56} label="Dinle" />
        <p className="result-msg">{line}</p>
      </div>
      <div className="quiz-end-actions">
        <button type="button" className="btn-primary" onClick={onAgain}>
          Bir tane daha ⭐
        </button>
        <Link href="/" className="btn-primary quiz-end-map">
          Haritaya dön 🗺️
        </Link>
      </div>
    </div>
  );
}
