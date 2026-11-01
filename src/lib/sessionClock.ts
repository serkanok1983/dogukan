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
 *   Duvar saati + monoton referans gizlenip görününce korunur, son duvar saati
 *   yeniden yüklemeler için saklanır (bkz. `checkClock`).
 *
 * Kaplamalar (yalnızca çocuk oturumu varken):
 * - Mola ve sınır "bekleyen" olur; bir sonraki doğal duraklamada (koşu/set/kart sonu)
 *   ya da en geç 120 sn sonra açılır. Haritada veya oyun çalışmıyorken hemen açılır.
 * - Duraklamanın ardından çocuk hâlâ o duraklamadaysa (set sonu ekranı, kapsül
 *   sonu; dokunmadı, ≤ 30 sn) yeni bekleyen de hemen açılır. İlk dokunuş/tuş, yeni
 *   koşu, kapsülün sonraki kartı ve mola bitişi bu pencereyi kapatır.
 * - Gece kaplaması hemen açılır; her açılışta bir kez `bedtime_block` yazılır.
 * - Tanışma ipucu `graceUntil` gününde bir kez gösterilir.
 */
import { pickBreak } from "@/content/breaks";
import { startDaySync } from "@/lib/activityLog";
import { getPlayerId, isLoggedIn } from "@/lib/auth";
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
import { readJSON, removeKey, writeJSON } from "@/lib/storage";
import {
  breakDue,
  canEarnHoney,
  canStartArcade,
  computePhase,
  extensionMinutesFor,
  honeyCells,
  isEveningAt,
  isGraceDay,
  isNightAt,
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
  /** Akşam saatleri (`isEveningAt`, ebeveyn gece izni dahil); −5/−1 dk uyarıları bunu bastırmaz. */
  evening: boolean;
  /** Ek: bugün tanışma günü (kavanoz kapı olmaz; uyarı/sallanma yok). */
  graceDay: boolean;
  /** Ek: `canStartArcade` (gece/sınır hayır, birlikte oyun evet, akşam hayır, kavanoz). */
  arcadeOpen: boolean;
  /** Ek: "Bal topla" kavanoza kullanılabilir bir hücre ekler (tavan dolmadı, akşam/gece/sınır değil). */
  honeyRefill: boolean;
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
/** Son duvar saati (yeniden yüklemeler arası geri atlama tespiti). */
export const CLOCK_REF_KEY = "dogukan-clock-ref";
const SESSION_EVENT = "dogukan:session";

const EMPTY_DAY: DayUsage = emptyDay();

export const SERVER_WELLBEING: WellbeingState = Object.freeze({
  phase: "play",
  honey: Object.freeze({ left: 8, capacity: 13 }),
  jarEmpty: false,
  blocking: false,
  overlay: null,
  coplay: false,
  evening: false,
  graceDay: false,
  arcadeOpen: true,
  honeyRefill: true,
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
/** Çocuk hâlâ son doğal duraklamada mı (o zamandan beri dokunmadı, yeni koşu yok)? */
let atPause = false;

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

/**
 * Kurallar çocuğu tanımlar: yalnızca bir çocuk oturumu varken geçerlidir. "Baba olarak
 * oyna" oturumunda ve çıkıştan sonra (giriş ekranı) kaplama ve sınır yok.
 */
function childActive(): boolean {
  if (!isLoggedIn()) return false;
  const id = getPlayerId();
  return id !== null && id !== "serkan";
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

/**
 * Saat atlaması (K23, yalnızca kayıt). Duvar saati ile monoton saat arasındaki fark.
 * - Görünürken (tikler arası) iki yön de güvenilirdir.
 * - Gizli bir aralıktan sonra yalnız geri atlama kesindir: telefon uyurken monoton
 *   saat durabilir (iOS/Android), ileri fark uykudan ayırt edilemez.
 * - Yeniden yüklemede monoton saat sıfırlanır; saklanan son duvar saatinden geri
 *   dönüş kesindir.
 */
function checkClock(afterHidden: boolean): void {
  const t = Date.now();
  const p = perfNow();
  if (lastWall) {
    const drift = t - lastWall - (p - lastPerf);
    if (drift < -JUMP_MS || (!afterHidden && drift > JUMP_MS))
      trackEvent({ type: "clock_jump", deltaMs: Math.round(drift) });
  } else {
    const stored = readJSON<{ wall?: unknown } | null>(CLOCK_REF_KEY, null);
    const wall = typeof stored?.wall === "number" ? stored.wall : 0;
    if (wall && wall - t > JUMP_MS)
      trackEvent({ type: "clock_jump", deltaMs: Math.round(t - wall) });
  }
  lastWall = t;
  lastPerf = p;
  writeJSON(CLOCK_REF_KEY, { wall: t });
}

function tick(): void {
  const t = Date.now();
  checkClock(false);

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
  interval = setInterval(tick, TICK_MS);
}

function stopInterval(): void {
  if (interval) clearInterval(interval);
  interval = null;
}

// --- değerlendirme -------------------------------------------------------------

function canMountPending(t: number): boolean {
  if (!inRun()) return true;
  if (atPause && t - lastPauseAt <= PAUSE_FRESH_MS) return true;
  return t - pendingSince >= PAUSE_WAIT_MS;
}

function clearChildOverlays(): void {
  night = false;
  pending = null;
  mounted = null;
  breakCtx = null;
  breakId = null;
  firstBreak = false;
  coplayPrompt = false;
  graceHint = false;
}

function evaluateOnce(): void {
  if (!started) return;
  if (!childActive()) {
    clearChildOverlays();
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
    a.evening === b.evening &&
    a.graceDay === b.graceDay &&
    a.arcadeOpen === b.arcadeOpen &&
    a.honeyRefill === b.honeyRefill
  );
}

function buildState(): WellbeingState {
  const t = Date.now();
  const s = getSettings();
  const d = today(t);
  const child = childActive();
  const phase = child ? effectivePhase(t, s, d) : "play";
  const honey = honeyCells(s, d);
  const coplay = isCoplayActive();
  const graceDay = isGraceDay(s, t);
  const nightOverride = nightOverrideUntil > t;
  const evening = child && (isEveningAt(t, s) || (nightOverride && isNightAt(t, s)));
  const overlay: OverlayKind | null =
    !started || !child
      ? null
      : night
        ? "night"
        : coplayPrompt
          ? "coplay"
          : (mounted ?? (graceHint ? "grace-hint" : null));
  const closed = phase === "night" || phase === "limit";
  return {
    phase,
    honey,
    jarEmpty: child && honey.left === 0 && !graceDay && !coplay,
    blocking: overlay !== null,
    overlay,
    coplay,
    evening,
    graceDay: child && graceDay,
    arcadeOpen:
      !child ||
      canStartArcade(new Date(t), s, d, coplay, { ignoreNight: nightOverride }),
    honeyRefill: child && !closed && !evening && canEarnHoney(s, d),
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

/** Duraklamadan sonraki ilk dokunuş/tuş: çocuk artık duraklamada beklemiyor. */
function onTap(): void {
  atPause = false;
}

function onVisibility(): void {
  if (!isVisible()) {
    stopInterval();
    if (lastWall) writeJSON(CLOCK_REF_KEY, { wall: Date.now() });
    if (started) closeSession("background");
    return;
  }
  checkClock(true);
  lastInputAt = Date.now();
  bedtimeLogged = false; // her geri dönüş yeni bir açılıştır
  sessionOpen = started;
  sessionTicked = false;
  startInterval();
  evaluate();
}

/**
 * Doğal duraklama. Bekleyen kaplama hemen açılabilir. `lingers`: çocuk bu
 * duraklamada bekler (set/koşu/bölüm sonu ekranı); kapsül kartı geçişinde hemen
 * sonraki kartın cümlesi başladığı için pencere yalnızca o an açıktır.
 */
function notePause(lingers = true): void {
  lastPauseAt = Date.now();
  atPause = true;
  evaluate();
  if (!lingers) atPause = false;
}

function onSession(): void {
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
  const taps = ["pointerdown", "keydown"] as const;
  for (const type of inputs) window.addEventListener(type, onInput, opts);
  for (const type of taps) window.addEventListener(type, onTap, opts);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener(SESSION_EVENT, onSession);
  window.addEventListener("storage", onSession);
  teardown = [
    () => {
      for (const type of inputs) window.removeEventListener(type, onInput, opts);
      for (const type of taps) window.removeEventListener(type, onTap, opts);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(SESSION_EVENT, onSession);
      window.removeEventListener("storage", onSession);
    },
    subscribeProgress(evaluate),
    subscribeSettings(evaluate),
    onEvent("run_end", () => notePause()),
    onEvent("exercise_set_end", () => notePause()),
    onEvent("capsule_end", () => notePause()),
    onEvent("run_start", () => {
      atPause = false;
    }),
  ];
  if (isVisible()) checkClock(false);
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
  if (
    ctx.running &&
    (!prev.running || prev.slug !== ctx.slug || prev.kind !== ctx.kind)
  )
    atPause = false;
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
  if (!isBrowser()) return;
  notePause(reason !== "card_end");
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

/**
 * Yetişkin kapıyı geçti: 30 dk birlikte oyun. Harita/ada kapısı da bunu doğrudan
 * çağırır (ikinci bir kapı açılmaz); Baba ile adasının izni aynı durumdur.
 */
export function startCoplay(): void {
  if (!isBrowser()) return;
  ensureObserving();
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
  // Zaten bekleyen bir sınır molanın hemen ardından açılabilir; ama mola bitişi
  // "taze duraklama" bırakmaz: oyun/kart sürerken yeni bir kaplama bir sonraki
  // doğal duraklamayı (ya da 120 sn'yi) bekler.
  lastPauseAt = Date.now();
  atPause = true;
  evaluate();
  atPause = false;
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

/**
 * Ebeveyn "+N dk": bugünün sınırını uzatır (`extension`). Uzatma verildiği andan
 * itibaren sayılır: sınır beklerken aşılan süre de `minutes`'e eklenir.
 */
export function grantExtension(minutes = 10): void {
  const t = Date.now();
  trackEvent({
    type: "extension",
    minutes: extensionMinutesFor(getSettings(), today(t), t, minutes),
  });
  evaluate();
}

/** Ebeveyn gece ekranını bu cihazda N dakikalığına kaldırır (yalnızca bellek). */
export function allowNightFor(minutes = 30): void {
  nightOverrideUntil = Date.now() + minutes * 60_000;
  night = false;
  // İzin bitip gece dönünce yeni bir `bedtime_block` yazılır ve oturum yeniden kapanır.
  bedtimeLogged = false;
  sessionOpen = started;
  sessionTicked = false;
  evaluate();
}

/**
 * Şu an arcade başlatılabilir mi (`canStartArcade`; gece izni ve birlikte oyun dahil)?
 * Olay işleyicileri için (ör. Bal topla bittiğinde kavanozda gerçekten hücre var mı).
 */
export function canStartArcadeNow(): boolean {
  if (!isBrowser()) return true;
  return buildState().arcadeOpen;
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
  atPause = false;
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
  removeKey(CLOCK_REF_KEY);
}
