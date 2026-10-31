/**
 * Oturum saati ve iyi oluş katmanı durumu (CONTRACT §10.2, proposals/parent-wellbeing.md
 * Ek B). Tek örnek; tarayıcıda ilk `setClockContext` ile başlar. Sahibi S6.
 *
 * Saat:
 * - Belge görünürken ve son dokunuş/tuş < 60 sn önceyken 5 sn'de bir `usage` yayar
 *   (yalnızca bağlam `running` iken; mola sırasında tür "break").
 * - Gece yarısı: her tik o anın gün anahtarına yazılır, kovalar kendiliğinden bölünür.
 * - Arka plana geçiş: tik durur, `session_end` ("background").
 * - Saat atlaması yalnızca `clock_jump` olarak kaydedilir; asla kilitlemez (K23).
 *
 * Kaplamalar:
 * - Mola ve sınır "bekleyen" olur; bir sonraki doğal duraklamada (koşu/set/kart sonu)
 *   ya da en geç 120 sn sonra açılır. Haritada veya oyun çalışmıyorken hemen açılır.
 * - Gece kaplaması hemen açılır; her açılışta bir kez `bedtime_block` yazılır.
 * - Tanışma ipucu `graceUntil` gününde bir kez gösterilir.
 */
import { pickBreak } from "@/content/breaks";
import { startDaySync } from "@/lib/activityLog";
import { getPlayerId } from "@/lib/auth";
import { onEvent, trackEvent } from "@/lib/progress/events";
import { getProgress, subscribeProgress } from "@/lib/progress/store";
import { dayKey, emptyDay } from "@/lib/progress/time";
import type {
  BreakId,
  ClockKind,
  DayUsage,
  SessionEndReason,
} from "@/lib/progress/types";
import {
  getSettings,
  subscribeSettings,
  updateSettings,
  type Settings,
} from "@/lib/settings";
import {
  breakDue,
  computePhase,
  honeyCells,
  isGraceDay,
  type Phase,
} from "@/lib/wellbeing";

export type OverlayKind = "mola" | "limit" | "night" | "grace-hint" | "coplay";

export type WellbeingState = {
  phase: Phase;
  honey: { left: number; capacity: number };
  jarEmpty: boolean;
  blocking: boolean;
  overlay: OverlayKind | null;
  coplay: boolean;
  evening: boolean;
};

/** Kaplamaların ihtiyaç duyduğu ek ayrıntılar (kararlı nesne). */
export type OverlayDetails = {
  breakId: BreakId | null;
  firstBreak: boolean;
  nightOverride: boolean;
};

type ClockContext = { slug: string | null; kind: ClockKind; running: boolean };

export const TICK_MS = 5_000;
export const IDLE_MS = 60_000;
export const PAUSE_WAIT_MS = 120_000;
export const COPLAY_MS = 30 * 60_000;
const PAUSE_FRESH_MS = 30_000;
const JUMP_MS = 5 * 60_000;
const TICK_SEC = TICK_MS / 1000;

const EMPTY_DAY: DayUsage = emptyDay();

export const SERVER_WELLBEING: WellbeingState = Object.freeze({
  phase: "play",
  honey: Object.freeze({ left: 8, capacity: 13 }),
  jarEmpty: false,
  blocking: false,
  overlay: null,
  coplay: false,
  evening: false,
}) as WellbeingState;

const EMPTY_DETAILS: OverlayDetails = Object.freeze({
  breakId: null,
  firstBreak: false,
  nightOverride: false,
});

// --- durum -----------------------------------------------------------------

let observing = false;
let started = false;
let base: ClockContext = { slug: null, kind: "map", running: false };
let breakCtx: ClockContext | null = null;
let lastInputAt = 0;
let lastWall = 0;
let lastPerf = 0;
let interval: ReturnType<typeof setInterval> | null = null;
let teardown: (() => void)[] = [];

let coplayUntil = 0;
let coplayPrompt = false;

let mounted: "mola" | "limit" | null = null;
let pending: "mola" | "limit" | null = null;
let pendingSince = 0;
let lastPauseAt = 0;
let pausedSinceRunStart = false;

let night = false;
let bedtimeLogged = false;
let nightOverrideUntil = 0;
let graceHint = false;
let limitLoggedDay = "";
let sessionOpen = false;
let sessionTicked = false;

let breakId: BreakId | null = null;
let firstBreak = false;

let snapshot: WellbeingState | null = null;
let details: OverlayDetails = EMPTY_DETAILS;
const listeners = new Set<() => void>();
let evaluating = false;
let dirty = false;

// --- yardımcılar ---------------------------------------------------------------

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function perfNow(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function isVisible(): boolean {
  return typeof document === "undefined" || document.visibilityState !== "hidden";
}

function today(t: number): DayUsage {
  return getProgress().days[dayKey(t)] ?? EMPTY_DAY;
}

function effectivePhase(t: number, s: Settings, d: DayUsage): Phase {
  const phase = computePhase(new Date(t), s, d);
  if (phase !== "night" || nightOverrideUntil <= t) return phase;
  const awake = computePhase(new Date(t), s, d, { ignoreNight: true });
  return awake === "play" || awake === "grace" ? "evening" : awake;
}

function inRun(): boolean {
  return base.running && base.kind !== "map";
}

/** Kurallar çocuğu tanımlar; "Baba olarak oyna" oturumunda kaplama ve sınır yok. */
function childActive(): boolean {
  return getPlayerId() !== "serkan";
}

/** Oturum sonu yalnızca gerçekten süre geçtiyse yazılır (ör. gece açılışı oturum değildir). */
function closeSession(reason: SessionEndReason): void {
  if (!sessionOpen) return;
  sessionOpen = false;
  if (!sessionTicked) return;
  sessionTicked = false;
  endSession(reason);
}

function endSession(
  reason: SessionEndReason,
  slug: string | null = base.slug,
): void {
  trackEvent(
    slug ? { type: "session_end", reason, slug } : { type: "session_end", reason },
  );
}

// --- tik -------------------------------------------------------------------

function tick(): void {
  const t = Date.now();
  const p = perfNow();
  if (lastWall) {
    const drift = t - lastWall - (p - lastPerf);
    if (Math.abs(drift) > JUMP_MS)
      trackEvent({ type: "clock_jump", deltaMs: Math.round(drift) });
  }
  lastWall = t;
  lastPerf = p;

  // Mola açıkken çocuk ekrana dokunmadan hareket eder: süre "break" sayılır, boşta sayılmaz.
  const ctx: ClockContext =
    mounted === "mola"
      ? (breakCtx ?? { slug: null, kind: "break", running: true })
      : base;
  const active = t - lastInputAt < IDLE_MS || ctx.kind === "break";
  if (
    started &&
    isVisible() &&
    active &&
    ctx.running &&
    !night &&
    mounted !== "limit"
  ) {
    const coplay = isCoplayActive();
    sessionTicked = true;
    trackEvent(
      ctx.slug
        ? {
            type: "usage",
            day: dayKey(t),
            kind: ctx.kind,
            sec: TICK_SEC,
            coplay,
            slug: ctx.slug,
          }
        : { type: "usage", day: dayKey(t), kind: ctx.kind, sec: TICK_SEC, coplay },
    );
  }
  evaluate();
}

function startInterval(): void {
  if (interval || !isVisible()) return;
  lastWall = 0;
  interval = setInterval(tick, TICK_MS);
}

function stopInterval(): void {
  if (interval) clearInterval(interval);
  interval = null;
}

// --- değerlendirme -------------------------------------------------------------

function canMountPending(t: number): boolean {
  if (!inRun()) return true;
  if (lastPauseAt >= pendingSince) return true;
  if (pausedSinceRunStart && t - lastPauseAt <= PAUSE_FRESH_MS) return true;
  return t - pendingSince >= PAUSE_WAIT_MS;
}

function evaluateOnce(): void {
  if (!started) return;
  if (!childActive()) {
    night = false;
    pending = null;
    if (mounted === "limit") mounted = null;
    graceHint = false;
    return;
  }
  const t = Date.now();
  const s = getSettings();
  const d = today(t);
  const phase = effectivePhase(t, s, d);
  const day = dayKey(t);

  if (phase === "night") {
    if (!night) {
      night = true;
      coplayPrompt = false;
      graceHint = false;
    }
    if (!bedtimeLogged) {
      bedtimeLogged = true;
      trackEvent({ type: "bedtime_block" });
      closeSession("bedtime");
    }
    return;
  }
  night = false;

  if (phase === "limit") {
    if (limitLoggedDay !== day && !d.limitReached) {
      limitLoggedDay = day;
      trackEvent({ type: "limit_reached" });
    }
    if (mounted !== "limit" && pending !== "limit") {
      if (!pending) pendingSince = t; // bekleyen mola varsa 120 sn'lik süre sıfırlanmaz
      pending = "limit";
    }
  } else {
    if (mounted === "limit") mounted = null;
    if (pending === "limit") pending = null;
    const due = breakDue(s, d);
    if (due && mounted !== "mola" && pending !== "mola") {
      pending = "mola";
      pendingSince = t;
    } else if (!due && pending === "mola") {
      pending = null;
    }
  }

  if (pending && mounted === null && canMountPending(t)) {
    if (pending === "mola") {
      firstBreak = !s.firstBreakDone;
      breakId = pickBreak({
        day,
        takenToday: d.breaksTaken + d.breaksSkippedByParent,
        firstEver: firstBreak,
        adultPresent: isCoplayActive(),
        ziplaFirst: getProgress().installDay === day,
      });
      mounted = "mola";
    } else {
      mounted = "limit";
      closeSession("limit");
    }
    pending = null;
    graceHint = false;
  }

  if (
    !graceHint &&
    mounted === null &&
    !inRun() &&
    s.graceUntil &&
    day === s.graceUntil &&
    s.graceHintDay !== s.graceUntil
  ) {
    graceHint = true;
  }
}

function sameState(a: WellbeingState, b: WellbeingState): boolean {
  return (
    a.phase === b.phase &&
    a.honey.left === b.honey.left &&
    a.honey.capacity === b.honey.capacity &&
    a.jarEmpty === b.jarEmpty &&
    a.blocking === b.blocking &&
    a.overlay === b.overlay &&
    a.coplay === b.coplay &&
    a.evening === b.evening
  );
}

function buildState(): WellbeingState {
  const t = Date.now();
  const s = getSettings();
  const d = today(t);
  const child = childActive();
  const phase = child ? effectivePhase(t, s, d) : "play";
  const honey = honeyCells(s, d);
  const overlay: OverlayKind | null = !started
    ? null
    : night
      ? "night"
      : coplayPrompt
        ? "coplay"
        : (mounted ?? (graceHint ? "grace-hint" : null));
  return {
    phase,
    honey,
    jarEmpty: child && honey.left === 0 && !isGraceDay(s, t),
    blocking: overlay !== null,
    overlay,
    coplay: isCoplayActive(),
    evening: phase === "evening",
  };
}

function publish(): void {
  const next = buildState();
  const nextDetails: OverlayDetails = {
    breakId: mounted === "mola" ? breakId : null,
    firstBreak: mounted === "mola" && firstBreak,
    nightOverride: nightOverrideUntil > Date.now(),
  };
  let changed = false;
  if (!snapshot || !sameState(snapshot, next)) {
    snapshot = next;
    changed = true;
  }
  if (
    details.breakId !== nextDetails.breakId ||
    details.firstBreak !== nextDetails.firstBreak ||
    details.nightOverride !== nextDetails.nightOverride
  ) {
    details = nextDetails;
    changed = true;
  }
  if (!changed) return;
  for (const cb of [...listeners]) {
    try {
      cb();
    } catch (err) {
      console.warn("wellbeing listener", err);
    }
  }
}

function evaluate(): void {
  if (evaluating) {
    dirty = true;
    return;
  }
  evaluating = true;
  try {
    let guard = 0;
    do {
      dirty = false;
      evaluateOnce();
    } while (dirty && ++guard < 5);
  } finally {
    evaluating = false;
  }
  publish();
}

// --- gözlem ----------------------------------------------------------------

function onInput(): void {
  lastInputAt = Date.now();
}

function onVisibility(): void {
  if (!isVisible()) {
    stopInterval();
    if (started) closeSession("background");
    return;
  }
  lastInputAt = Date.now();
  bedtimeLogged = false; // her geri dönüş yeni bir açılıştır
  sessionOpen = started;
  sessionTicked = false;
  startInterval();
  evaluate();
}

function notePause(): void {
  lastPauseAt = Date.now();
  pausedSinceRunStart = true;
  evaluate();
}

function ensureObserving(): void {
  if (observing || !isBrowser()) return;
  observing = true;
  lastInputAt = Date.now();
  const opts: AddEventListenerOptions = { capture: true, passive: true };
  const inputs = [
    "pointerdown",
    "pointermove",
    "keydown",
    "touchstart",
    "wheel",
  ] as const;
  for (const type of inputs) window.addEventListener(type, onInput, opts);
  document.addEventListener("visibilitychange", onVisibility);
  teardown = [
    () => {
      for (const type of inputs) window.removeEventListener(type, onInput, opts);
      document.removeEventListener("visibilitychange", onVisibility);
    },
    subscribeProgress(evaluate),
    subscribeSettings(evaluate),
    onEvent("run_end", notePause),
    onEvent("exercise_set_end", notePause),
    onEvent("capsule_end", notePause),
    onEvent("run_start", () => {
      pausedSinceRunStart = false;
    }),
  ];
  startInterval();
  startDaySync();
  evaluate();
}

// --- sözleşme API'si (CONTRACT §10.2) ----------------------------------------------

export function setClockContext(ctx: {
  slug: string | null;
  kind: ClockKind;
  running: boolean;
}): void {
  if (!isBrowser()) return;
  ensureObserving();
  if (ctx.kind === "break") {
    breakCtx = { ...ctx };
    return;
  }
  const prev = base;
  if (prev.slug && ctx.kind === "map" && started) endSession("map", prev.slug);
  if (ctx.running && (!prev.running || prev.slug !== ctx.slug))
    pausedSinceRunStart = false;
  base = { slug: ctx.slug, kind: ctx.kind, running: ctx.running };
  if (!started) {
    started = true;
    sessionOpen = true;
    lastInputAt = Date.now();
  }
  evaluate();
}

export function notifyNaturalPause(
  reason: "run_end" | "set_end" | "card_end" | "episode_end",
): void {
  void reason;
  if (!isBrowser()) return;
  notePause();
}

/** CoPlayPrompt kaplamasını açar (🔔 düğmeleri). Gece kaplaması açıkken yok sayılır. */
export function requestCoplay(): void {
  if (!isBrowser() || night) return;
  ensureObserving();
  if (!started) started = true;
  coplayPrompt = true;
  publish();
}

export function isCoplayActive(): boolean {
  return coplayUntil > Date.now();
}

// --- S6 ek API'si (kaplamalar ve panel) ----------------------------------------------

/** Ebeveyn paneli: saat çalışıyorsa durdurur, henüz başlamadıysa başlatmaz. */
export function parkClock(): void {
  if (!started) return;
  base = { slug: null, kind: "map", running: false };
  evaluate();
}

/** Yetişkin kapıyı geçti: 30 dk birlikte oyun. */
export function startCoplay(): void {
  coplayUntil = Date.now() + COPLAY_MS;
  coplayPrompt = false;
  trackEvent({ type: "coplay_start" });
  evaluate();
}

export function closeCoplayPrompt(): void {
  coplayPrompt = false;
  publish();
}

/** Mola bitti (halka doldu → "Devam") ya da ebeveyn atlattı. */
export function finishBreak(skippedByParent: boolean): void {
  if (mounted !== "mola") return;
  const id = breakId ?? "zipla";
  mounted = null;
  breakCtx = null;
  breakId = null;
  firstBreak = false;
  trackEvent({ type: "break_done", breakId: id, skippedByParent });
  if (!getSettings().firstBreakDone) updateSettings({ firstBreakDone: true });
  lastPauseAt = Date.now();
  pausedSinceRunStart = true;
  evaluate();
}

/** MolaScreen kapanırken çağırır; mola bağlamını bırakır. */
export function clearBreakContext(): void {
  breakCtx = null;
}

export function dismissGraceHint(): void {
  graceHint = false;
  const s = getSettings();
  if (s.graceUntil && s.graceHintDay !== s.graceUntil)
    updateSettings({ graceHintDay: s.graceUntil });
  publish();
}

/** Ebeveyn "+N dk": bugünün sınırını uzatır (`extension`). */
export function grantExtension(minutes = 10): void {
  trackEvent({ type: "extension", minutes });
  evaluate();
}

/** Ebeveyn gece ekranını bu cihazda N dakikalığına kaldırır (yalnızca bellek). */
export function allowNightFor(minutes = 30): void {
  nightOverrideUntil = Date.now() + minutes * 60_000;
  night = false;
  evaluate();
}

export function subscribeWellbeing(cb: () => void): () => void {
  ensureObserving();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getWellbeingSnapshot(): WellbeingState {
  if (!isBrowser()) return SERVER_WELLBEING;
  if (!snapshot) snapshot = buildState();
  return snapshot;
}

export function getServerWellbeingSnapshot(): WellbeingState {
  return SERVER_WELLBEING;
}

export function getOverlayDetails(): OverlayDetails {
  return details;
}

export function getServerOverlayDetails(): OverlayDetails {
  return EMPTY_DETAILS;
}

/** @internal Testler için: tekil durumu ve dinleyicileri sıfırlar. */
export function _resetClockForTests(): void {
  stopInterval();
  for (const off of teardown) off();
  teardown = [];
  observing = false;
  started = false;
  base = { slug: null, kind: "map", running: false };
  breakCtx = null;
  lastInputAt = 0;
  lastWall = 0;
  lastPerf = 0;
  coplayUntil = 0;
  coplayPrompt = false;
  mounted = null;
  pending = null;
  pendingSince = 0;
  lastPauseAt = 0;
  pausedSinceRunStart = false;
  night = false;
  bedtimeLogged = false;
  nightOverrideUntil = 0;
  graceHint = false;
  limitLoggedDay = "";
  sessionOpen = false;
  sessionTicked = false;
  breakId = null;
  firstBreak = false;
  snapshot = null;
  details = EMPTY_DETAILS;
  listeners.clear();
}
