"use client";

/**
 * Egzersiz oturumu (CONTRACT §10.1, MASTER_PLAN §2.8). Sahibi S2.
 *
 * - session: 6 madde (planSession) + set sonu ekranı; gate: pickForGate'ten 3 madde, ekran yok.
 * - İlk soru "Başla ▶" dokunuşunun içinde okunur (iOS kuralı); sonrakiler açılınca okunur.
 * - Yönergeden sonra seçenekler sırayla, vurguyla okunur; herhangi bir dokunuş keser.
 * - Oyun etkin değilken (iyi oluş katmanı, ⏸) konuşma durur ve başlamaz; katman
 *   kapanınca o anki madde bir kez yeniden okunur.
 * - 1. yanlış: yumuşak ton, ipucu cümlesi, soru yavaş tekrar, bir çeldirici söner.
 * - 2. yanlış: cevap gösterilir ve okunur, madde bir kez sona eklenir (toplama sayılmaz).
 * - Her cevaplanan madde `exercise_item`, set sonu bir kez `exercise_set_end` yayar.
 */
import "./engine.css";
import Link from "next/link";
import { useEffect, useEffectEvent, useReducer, useRef, useState } from "react";
import { getGenerator } from "@/activities/content";
import { SayButton } from "@/components/SayButton";
import { useGameActive } from "@/lib/gameSession";
import { praise } from "@/lib/praise";
import { trackEvent } from "@/lib/progress/events";
import { getProgress } from "@/lib/progress/store";
import { createRng, seedFrom, type Rng } from "@/lib/rng";
import { notifyNaturalPause } from "@/lib/sessionClock";
import { useSettings, type Settings } from "@/lib/settings";
import { SKILLS, type SkillId } from "@/lib/skills";
import { sounds } from "@/lib/sounds";
import { cancelSpeech, unlockAudio } from "@/lib/speech";
import { ChoiceCard } from "./ChoiceCard";
import { OrderStrip } from "./OrderStrip";
import {
  anyGenerator,
  answerSay,
  buildGate,
  buildSession,
  forRequeue,
  GATE_SIZE,
  isCorrect,
  pickFade,
  readoutChoices,
  SESSION_SIZE,
  type PlannedItem,
} from "./plan";
import type { ItemPhase, RendererProps } from "./rendererTypes";
import { TapCount } from "./TapCount";
import { createTimers } from "./timers";
import { TraceCanvas } from "./TraceCanvas";
import type { Exercise } from "./types";
import { ExerciseVisual } from "./visuals";
import { createVoiceQueue, type LineInput, type VoiceQueue } from "./voice";

export type ExerciseSessionResult = {
  correct: number;
  total: number;
  firstTry: number;
};

type Mode = "session" | "gate";

type QItem = {
  key: string;
  ex: Exercise;
  review: boolean;
  /** Sona yeniden eklenmiş kopya: toplama ve olaylara sayılmaz. */
  requeue: boolean;
  /** Yıldız rayındaki yuva. */
  slot: number;
};

type Mark = "empty" | "star" | "late" | "miss";

type State = {
  stage: "start" | "play" | "done" | "empty";
  run: number;
  queue: QItem[];
  index: number;
  phase: ItemPhase;
  tries: number;
  faded: string[];
  wrong: string[];
  caption: string;
  rail: Mark[];
  result: ExerciseSessionResult;
};

type Action =
  | { type: "start"; queue: QItem[] }
  | { type: "correct"; key: string; caption: string }
  | {
      type: "wrong";
      key: string;
      chosen: string[];
      fade: string | null;
      caption: string;
      requeue: QItem | null;
    }
  | { type: "advance"; key: string };

const INITIAL: State = {
  stage: "start",
  run: 0,
  queue: [],
  index: 0,
  phase: "ask",
  tries: 0,
  faded: [],
  wrong: [],
  caption: "",
  rail: [],
  result: { correct: 0, total: 0, firstTry: 0 },
};

function answering(s: State, key: string): QItem | null {
  const item = s.queue[s.index];
  if (s.stage !== "play" || !item || item.key !== key) return null;
  return s.phase === "ask" || s.phase === "hint" ? item : null;
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "start":
      return {
        ...INITIAL,
        stage: a.queue.length > 0 ? "play" : "empty",
        run: s.run + 1,
        queue: a.queue,
        rail: a.queue.map((): Mark => "empty"),
        result: { correct: 0, total: a.queue.length, firstTry: 0 },
      };
    case "correct": {
      const item = answering(s, a.key);
      if (!item) return s;
      const rail = [...s.rail];
      rail[item.slot] = item.requeue ? "late" : "star";
      const result = item.requeue
        ? s.result
        : {
            ...s.result,
            correct: s.result.correct + 1,
            firstTry: s.result.firstTry + (s.tries === 0 ? 1 : 0),
          };
      return { ...s, phase: "correct", caption: a.caption, rail, result };
    }
    case "wrong": {
      const item = answering(s, a.key);
      if (!item) return s;
      const wrong = [...s.wrong, ...a.chosen.filter((id) => !s.wrong.includes(id))];
      if (s.tries === 0) {
        return {
          ...s,
          phase: "hint",
          tries: 1,
          wrong,
          faded:
            a.fade && !s.faded.includes(a.fade) ? [...s.faded, a.fade] : s.faded,
          caption: a.caption,
        };
      }
      const rail = [...s.rail];
      if (!item.requeue) rail[item.slot] = "miss";
      return {
        ...s,
        phase: "reveal",
        tries: s.tries + 1,
        wrong,
        caption: a.caption,
        rail,
        queue: a.requeue ? [...s.queue, a.requeue] : s.queue,
      };
    }
    case "advance": {
      const item = s.queue[s.index];
      if (s.stage !== "play" || !item || item.key !== a.key) return s;
      const index = s.index + 1;
      const next: State = {
        ...s,
        index,
        phase: "ask",
        tries: 0,
        faded: [],
        wrong: [],
        caption: "",
      };
      return index >= s.queue.length ? { ...next, stage: "done" } : next;
    }
    default:
      return s;
  }
}

const selectVoiceOn = (s: Settings) => s.voiceOn;

/** Doğru sonrası ses bitmezse bile ilerlemek için üst sınır. */
const ADVANCE_FALLBACK_MS = 9000;
const ADVANCE_AFTER_VOICE_MS = 350;

export function ExerciseSession({
  slug,
  skill,
  mode = "session",
  onDone,
  onExit,
}: {
  slug: string;
  skill: SkillId;
  mode?: Mode;
  onDone?: (r: ExerciseSessionResult) => void;
  onExit?: () => void;
}) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [voice] = useState(createVoiceQueue);
  const [timers] = useState(createTimers);
  const voiceOn = useSettings(selectVoiceOn);
  const rngRef = useRef<Rng | null>(null);
  const shownAt = useRef(0);
  const spokenKey = useRef<string | null>(null);
  const finishedRun = useRef(0);
  /** Her deneme yalnızca bir kez cevaplanır (hızlı çift dokunuş koruması). */
  const answeredToken = useRef<string | null>(null);
  const shownKey = useRef<string | null>(null);
  /** Yönerge + seçenek okuması sürüyor (bir dokunuş keser). */
  const readoutOn = useRef(false);
  const [reading, setReading] = useState<{ token: string; id: string } | null>(null);
  const active = useGameActive();

  const available =
    mode === "gate"
      ? anyGenerator() !== undefined
      : getGenerator(skill) !== undefined;
  const current = state.stage === "play" ? state.queue[state.index] : undefined;
  const { stage, run, result } = state;

  // Ayrılırken konuşmayı ve zamanlayıcıları kes.
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

  /** `lead` satırları, yönerge (ipucunda yavaş) ve ardından seçenekler sırayla, vurguyla. */
  const speakAsk = (
    lead: LineInput[],
    item: QItem,
    hint: boolean,
    skip: readonly string[],
  ) => {
    const { ex } = item;
    const token = `${item.key}#${hint ? 1 : 0}`;
    const choices = readoutChoices(ex, skip).map((c) => ({
      text: c.say,
      onStart: () => setReading({ token, id: c.id }),
    }));
    readoutOn.current = choices.length > 0;
    voice.say(
      [
        ...lead,
        hint
          ? { text: ex.prompt.hintSay ?? ex.prompt.say, rate: 0.75 }
          : ex.prompt.say,
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

  // Katman açılınca (⏸, mola) zinciri durdur: kalan satırlar okunmaz. Katmanın
  // kendi sesi bizimkini zaten keser; cancelSpeech onu da susturacağı için çağrılmaz.
  // Kapanınca madde bir kez yeniden okunur.
  useEffect(() => {
    if (active) return;
    readoutOn.current = false;
    voice.stop();
    spokenKey.current = null;
  }, [active, voice]);

  const speakCurrent = useEffectEvent((item: QItem) => {
    if (shownKey.current !== item.key) {
      shownKey.current = item.key;
      shownAt.current = Date.now();
    }
    if (state.phase === "ask") speakAsk([], item, false, []);
    else if (state.phase === "hint")
      speakAsk([state.caption], item, true, state.faded);
    else if (state.phase === "reveal") sayLines([state.caption, answerSay(item.ex)]);
  });

  // Yeni madde açılınca yönergeyi oku (ilki "Başla" dokunuşunda okundu); yalnızca etkinken.
  useEffect(() => {
    if (!current || !active || spokenKey.current === current.key) return;
    spokenKey.current = current.key;
    speakCurrent(current);
  }, [current, active]);

  // Set sonu: tek bir exercise_set_end, doğal mola, onDone.
  useEffect(() => {
    if (stage !== "done" || finishedRun.current === run) return;
    finishedRun.current = run;
    trackEvent({
      type: "exercise_set_end",
      slug,
      skill,
      correct: result.correct,
      total: result.total,
      firstTry: result.firstTry,
      mode,
    });
    if (mode === "session") notifyNaturalPause("set_end");
    onDone?.(result);
  }, [stage, run, result, slug, skill, mode, onDone]);

  const begin = () => {
    unlockAudio();
    timers.clear();
    const now = Date.now();
    const rng = createRng(seedFrom(`${slug}:${skill}:${now}`));
    rngRef.current = rng;
    let planned: PlannedItem[] = [];
    try {
      const p = getProgress();
      planned =
        mode === "gate"
          ? buildGate(p, skill, now, rng)
          : buildSession(p, skill, now, rng);
    } catch (err) {
      console.warn("ExerciseSession plan", err);
    }
    const nextRun = state.run + 1;
    const queue: QItem[] = planned.map((item, i) => ({
      key: `${nextRun}:${i}:${item.ex.id}`,
      ex: item.ex,
      review: item.review,
      requeue: false,
      slot: i,
    }));
    const first = queue[0];
    if (first) {
      spokenKey.current = first.key;
      shownKey.current = first.key;
      shownAt.current = now;
      speakAsk([], first, false, []);
    }
    dispatch({ type: "start", queue });
  };

  const sayNow = (text: string, rate?: number) => sayLines([{ text, rate }]);

  const answer = (ids: string[]) => {
    const item = current;
    if (!item || (state.phase !== "ask" && state.phase !== "hint")) return;
    const token = `${item.key}#${state.tries}`;
    if (answeredToken.current === token) return;
    answeredToken.current = token;
    const { ex } = item;
    const ms = Math.max(0, Date.now() - shownAt.current);
    const emit = (firstTry: boolean, correct: boolean) => {
      if (item.requeue) return;
      trackEvent({
        type: "exercise_item",
        slug,
        skill: ex.skill,
        level: ex.level,
        firstTry,
        correct,
        review: item.review,
        ms,
      });
    };

    if (isCorrect(ex, ids)) {
      const firstTry = state.tries === 0;
      sounds.success();
      emit(firstTry, true);
      const caption =
        ex.feedback.correct || praise(firstTry ? "correct_first" : "correct_retry");
      dispatch({ type: "correct", key: item.key, caption });
      timers.later(() => sounds.star(), 450);
      const key = item.key;
      let advanced = false;
      const go = () => {
        if (advanced) return;
        advanced = true;
        dispatch({ type: "advance", key });
      };
      sayLines([caption], () => timers.later(go, ADVANCE_AFTER_VOICE_MS));
      timers.later(go, ADVANCE_FALLBACK_MS);
      return;
    }

    sounds.softWrong();
    if (state.tries === 0) {
      const caption = ex.feedback.retry || praise("wrong_try_again");
      const fade = pickFade(ex, ids, state.faded);
      dispatch({
        type: "wrong",
        key: item.key,
        chosen: ids,
        fade,
        caption,
        requeue: null,
      });
      speakAsk([caption], item, true, fade ? [...state.faded, fade] : state.faded);
      return;
    }

    emit(false, false);
    const caption = ex.feedback.reveal || praise("wrong_reveal");
    const rng = rngRef.current;
    const requeue: QItem | null = item.requeue
      ? null
      : {
          ...item,
          key: `${item.key}:r`,
          ex: rng ? forRequeue(ex, rng) : ex,
          review: false,
          requeue: true,
        };
    dispatch({
      type: "wrong",
      key: item.key,
      chosen: ids,
      fade: null,
      caption,
      requeue,
    });
    sayLines([caption, answerSay(ex)]);
  };

  const readingId =
    active &&
    current &&
    reading?.token === `${current.key}#${state.tries}` &&
    (state.phase === "ask" || state.phase === "hint")
      ? reading.id
      : null;

  const size = mode === "gate" ? GATE_SIZE : SESSION_SIZE;
  const rail: Mark[] =
    stage === "start"
      ? Array.from({ length: size }, (): Mark => "empty")
      : state.rail;

  if (!available || stage === "empty") {
    return <Unavailable onExit={mode === "gate" ? onExit : undefined} />;
  }

  return (
    <div
      className={`ex-session ex-session--${mode}`}
      data-slug={slug}
      data-skill={skill}
      onPointerDownCapture={skipReadout}
    >
      <header className="ex-top">
        <StarRail marks={rail} />
        {mode === "gate" && onExit ? (
          <button
            type="button"
            className="ex-exit"
            aria-label="Haritaya dön"
            onClick={() => {
              stopVoice();
              cancelSpeech();
              onExit();
            }}
          >
            <span aria-hidden>🗺️</span>
          </button>
        ) : null}
      </header>

      {stage === "start" ? (
        <StartCard label={SKILLS[skill]?.label ?? ""} onStart={begin} />
      ) : null}

      {current ? (
        <ItemView
          key={current.key}
          item={current}
          state={state}
          voiceOn={voiceOn}
          reading={readingId}
          onStopVoice={stopVoice}
          onAnswer={answer}
          say={sayNow}
          onNext={() => dispatch({ type: "advance", key: current.key })}
        />
      ) : null}

      {stage === "done" && mode === "session" ? (
        <EndSheet
          result={result}
          rail={state.rail}
          voice={voice}
          active={active}
          onAgain={begin}
        />
      ) : null}
      {stage === "done" && mode === "gate" ? (
        <div className="ex-gate-done" aria-hidden>
          🍯
        </div>
      ) : null}
    </div>
  );
}

function ItemView({
  item,
  state,
  voiceOn,
  reading,
  onStopVoice,
  onAnswer,
  say,
  onNext,
}: {
  item: QItem;
  state: State;
  voiceOn: boolean;
  reading: string | null;
  onStopVoice: () => void;
  onAnswer: (ids: string[]) => void;
  say: (text: string, rate?: number) => void;
  onNext: () => void;
}) {
  const { ex } = item;
  const { phase } = state;
  const hint = phase === "hint";
  const promptSay = hint ? (ex.prompt.hintSay ?? ex.prompt.say) : ex.prompt.say;
  const promptText = ex.prompt.text ?? (voiceOn ? undefined : ex.prompt.say);
  const props: RendererProps = {
    ex,
    phase,
    faded: state.faded,
    wrong: state.wrong,
    disabled: phase === "correct" || phase === "reveal",
    onAnswer,
    say,
    reading,
  };

  let renderer: React.ReactNode = null;
  switch (ex.kind) {
    case "choice":
      renderer = <ChoiceCard {...props} />;
      break;
    case "tapcount":
      renderer = <TapCount {...props} />;
      break;
    case "order":
      renderer = (
        <OrderStrip key={state.tries} {...props} lockedPrefix={hint ? 1 : 0} />
      );
      break;
    case "trace":
      renderer = <TraceCanvas {...props} />;
      break;
  }

  return (
    <section className="ex-q" aria-label="Soru">
      <div className="ex-prompt">
        <SayButton
          text={promptSay}
          rate={hint ? 0.75 : undefined}
          size={72}
          label="Soruyu tekrar dinle"
          className="ex-say"
          onPress={onStopVoice}
          disabled={phase === "correct"}
        />
        {promptText ? (
          <p className={voiceOn ? "ex-prompt-text" : "ex-prompt-text is-big"}>
            {promptText}
          </p>
        ) : null}
      </div>
      {ex.prompt.visual && ex.kind !== "tapcount" ? (
        <ExerciseVisual visual={ex.prompt.visual} hint={hint} />
      ) : null}
      <div className="ex-answer">{renderer}</div>
      <p
        className={voiceOn ? "ex-caption" : "ex-caption is-big"}
        role="status"
        aria-live="polite"
      >
        {state.caption}
      </p>
      {phase === "reveal" ? (
        <button type="button" className="ex-next" onClick={onNext}>
          Devam ▶
        </button>
      ) : null}
      {phase === "correct" ? (
        <span className="ex-flystar" aria-hidden>
          ⭐
        </span>
      ) : null}
    </section>
  );
}

const MARK_ICON: Record<Mark, string> = {
  empty: "",
  star: "⭐",
  late: "⭐",
  miss: "•",
};

function StarRail({ marks, big }: { marks: Mark[]; big?: boolean }) {
  const stars = marks.filter((m) => m === "star" || m === "late").length;
  return (
    <ol
      className={big ? "ex-rail is-big" : "ex-rail"}
      aria-label={`${stars} yıldız`}
    >
      {marks.map((m, i) => (
        <li key={i} className={`ex-rail-slot is-${m}`} aria-hidden>
          {MARK_ICON[m]}
        </li>
      ))}
    </ol>
  );
}

function StartCard({ label, onStart }: { label: string; onStart: () => void }) {
  const line = label ? `${label}. Başla düğmesine dokun.` : "Başla düğmesine dokun.";
  return (
    <div className="ex-start">
      <div className="ex-start-head">
        <SayButton text={line} size={56} label="Dinle" />
        {label ? <p className="ex-start-title">{label}</p> : null}
      </div>
      <button type="button" className="ex-start-btn" onClick={onStart}>
        Başla ▶
      </button>
    </div>
  );
}

function EndSheet({
  result,
  rail,
  voice,
  active,
  onAgain,
}: {
  result: ExerciseSessionResult;
  rail: Mark[];
  voice: VoiceQueue;
  active: boolean;
  onAgain: () => void;
}) {
  // "high" = hepsi doğru (ikinci denemede bulunanlar dahil).
  const high = result.total > 0 && result.correct >= result.total;
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
    <div className="ex-end" role="group" aria-label="Set bitti">
      <StarRail marks={rail} big />
      <div className="ex-end-head">
        <SayButton text={`${line} ${ask}`} size={56} label="Dinle" />
        <p className="ex-end-line">{line}</p>
      </div>
      <div className="ex-end-actions">
        <button type="button" className="ex-end-btn" onClick={onAgain}>
          Bir tane daha ⭐
        </button>
        <Link href="/" className="ex-end-btn ex-end-btn--map">
          Haritaya dön 🗺️
        </Link>
      </div>
    </div>
  );
}

function Unavailable({ onExit }: { onExit?: () => void }) {
  const line = "Bu oyun hazırlanıyor. Yakında burada!";
  return (
    <div className="ex-session">
      <div className="ex-wip">
        <span className="ex-wip-emoji" aria-hidden>
          🚧
        </span>
        <div className="ex-end-head">
          <SayButton text={line} size={56} label="Dinle" />
          <p className="ex-end-line">{line}</p>
        </div>
        {onExit ? (
          <button
            type="button"
            className="ex-end-btn ex-end-btn--map"
            onClick={onExit}
          >
            Haritaya dön 🗺️
          </button>
        ) : (
          <Link href="/" className="ex-end-btn ex-end-btn--map">
            Haritaya dön 🗺️
          </Link>
        )}
      </div>
    </div>
  );
}
