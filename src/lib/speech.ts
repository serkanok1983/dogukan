/**
 * Konuşma katmanı (CONTRACT §8.1, MASTER_PLAN §3.6). C0 yazdı; sahibi S2.
 *
 * - Türkçe ses sıralaması: Yelda → Google Türkçe → Microsoft Emel → herhangi tr-*.
 * - Kayıt öncelikli yol: `public/voice/manifest.json` içindeki id'ler için
 *   `public/voice/<id>.m4a` çalınır, yoksa TTS. Babanın sesi kod değişmeden eklenir.
 * - Fonem kuralı çağıranın sorumluluğudur: tek ünsüz asla söyletilmez.
 * - `onEnd` her `speak` için tam bir kez ve her zaman eşzamansız çağrılır: doğal
 *   bitiş, hata, iptal (`cancelSpeech` ya da yeni bir kesen `speak`), ses kapalı,
 *   TTS yok ya da tarayıcı olay atmayı unuttuğunda bekçi zamanlayıcısı.
 * - Chrome'un ~15 sn sonra susma hatasına karşı uzun metin cümle cümle kısa
 *   parçalara bölünür ve konuşurken düzenli `resume()` çağrılır.
 */
import { assetPath } from "@/lib/asset";
import { getPlayerDisplayName } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export type SpeakOptions = {
  rate?: number;
  pitch?: number;
  interrupt?: boolean;
  clip?: string;
  onEnd?: () => void;
};

const VOICE_PREFERENCE = [/yelda/i, /google.*t[uü]rk/i, /emel/i];
/** Tek bir konuşma parçasının üst sınırı (karakter). */
const MAX_CHUNK = 120;
const KEEP_ALIVE_MS = 5000;

type Pending = { finish: () => void; estimateMs: number };

let voice: SpeechSynthesisVoice | null = null;
let voicesHooked = false;
let manifest: Set<string> | null = null;
let manifestLoading = false;
let currentAudio: HTMLAudioElement | null = null;
/** Çalan ya da sırada bekleyen konuşmalar (TTS ya da kayıt). */
const active = new Set<Pending>();
let keepAlive: ReturnType<typeof setInterval> | null = null;
let speaking = false;
const speakingListeners = new Set<() => void>();

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return window.speechSynthesis;
}

function setSpeaking(value: boolean) {
  if (speaking === value) return;
  speaking = value;
  for (const cb of speakingListeners) cb();
}

function pickVoice(): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  let all: SpeechSynthesisVoice[] = [];
  try {
    all = s.getVoices();
  } catch {
    return null;
  }
  const turkish = all.filter((v) =>
    v.lang.toLocaleLowerCase("tr").replace("_", "-").startsWith("tr"),
  );
  for (const pattern of VOICE_PREFERENCE) {
    const found = turkish.find((v) => pattern.test(v.name));
    if (found) return found;
  }
  return turkish[0] ?? null;
}

function hookVoices() {
  const s = synth();
  if (!s || voicesHooked) return;
  voicesHooked = true;
  voice = pickVoice();
  s.addEventListener?.("voiceschanged", () => {
    voice = pickVoice();
  });
}

function loadManifest() {
  if (manifest || manifestLoading || typeof fetch === "undefined") return;
  manifestLoading = true;
  fetch(assetPath("/voice/manifest.json"))
    .then((r) => (r.ok ? r.json() : []))
    .then((ids: unknown) => {
      manifest = new Set(
        Array.isArray(ids)
          ? ids.filter((x): x is string => typeof x === "string")
          : [],
      );
    })
    .catch(() => {
      manifest = new Set();
    });
}

/** {ad} → oyuncunun adı, {ayı} → ayının adı. */
export function fillTemplate(text: string): string {
  return text
    .replaceAll("{ad}", getPlayerDisplayName())
    .replaceAll("{ayı}", getSettings().companionName || "Bal");
}

function finishLater(onEnd?: () => void) {
  if (onEnd) setTimeout(onEnd, 0);
}

function startKeepAlive() {
  if (keepAlive) return;
  keepAlive = setInterval(() => {
    const s = synth();
    if (active.size === 0 || !s) {
      stopKeepAlive();
      return;
    }
    // Chrome bazen konuşmayı sessizce durdurur; resume() duraklamamışsa etkisizdir.
    try {
      s.resume();
    } catch {
      /* yok say */
    }
  }, KEEP_ALIVE_MS);
}

function stopKeepAlive() {
  if (keepAlive) clearInterval(keepAlive);
  keepAlive = null;
}

/** Bir konuşma için tek seferlik bitiş: `onEnd` tam bir kez, eşzamansız. */
function createPending(
  onEnd: (() => void) | undefined,
  estimateMs: number,
  cleanup?: () => void,
): Pending {
  let done = false;
  const entry: Pending = {
    estimateMs,
    finish: () => {
      if (done) return;
      done = true;
      cleanup?.();
      active.delete(entry);
      if (active.size === 0) {
        stopKeepAlive();
        setSpeaking(false);
      }
      finishLater(onEnd);
    },
  };
  active.add(entry);
  setSpeaking(true);
  return entry;
}

export function cancelSpeech(): void {
  const prev = [...active];
  active.clear();
  stopKeepAlive();
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch {
      /* yok say */
    }
    currentAudio = null;
  }
  try {
    synth()?.cancel();
  } catch {
    /* yok say */
  }
  setSpeaking(false);
  for (const entry of prev) entry.finish();
}

function playClip(id: string, onEnd?: () => void): boolean {
  if (!manifest?.has(id) || typeof Audio === "undefined") return false;
  const audio = new Audio(assetPath(`/voice/${id}.m4a`));
  currentAudio = audio;
  const entry = createPending(onEnd, 30_000, () => {
    if (currentAudio === audio) currentAudio = null;
  });
  audio.addEventListener("ended", entry.finish, { once: true });
  audio.addEventListener("error", entry.finish, { once: true });
  void audio.play().catch(entry.finish);
  return true;
}

/** Metni cümle sınırlarından ≤ MAX_CHUNK karakterlik parçalara böler. */
export function splitForSpeech(text: string, max = MAX_CHUNK): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  const push = (piece: string) => {
    const t = piece.trim();
    if (t) out.push(t);
  };
  for (const sentence of sentences) {
    if ((cur + sentence).length <= max) {
      cur += sentence;
      continue;
    }
    push(cur);
    cur = "";
    if (sentence.length <= max) {
      cur = sentence;
      continue;
    }
    // Çok uzun tek cümle: virgül ya da boşluktan böl.
    let rest = sentence;
    while (rest.length > max) {
      const slice = rest.slice(0, max);
      const cut = Math.max(slice.lastIndexOf(","), slice.lastIndexOf(" "));
      const at = cut > max / 3 ? cut + 1 : max;
      push(rest.slice(0, at));
      rest = rest.slice(at);
    }
    cur = rest;
  }
  push(cur);
  return out;
}

/** Tarayıcı olay atmazsa `onEnd` yine gelsin diye cömert bir süre tahmini. */
function watchdogMs(chars: number, rate: number): number {
  return Math.min(45_000, 3000 + (chars * 110) / Math.max(0.3, rate));
}

export function speak(text: string, opts: SpeakOptions = {}): void {
  if (typeof window === "undefined") return;
  if (!getSettings().voiceOn) {
    finishLater(opts.onEnd);
    return;
  }
  loadManifest();
  if (opts.interrupt !== false) cancelSpeech();
  if (opts.clip && playClip(opts.clip, opts.onEnd)) return;

  const s = synth();
  const line = fillTemplate(text).trim();
  if (!s || !line) {
    finishLater(opts.onEnd);
    return;
  }
  hookVoices();
  if (!voice) voice = pickVoice();

  const rate = opts.rate ?? 0.9;
  const chunks = splitForSpeech(line);
  const own = watchdogMs(line.length, rate);
  // Sıraya giriyorsa öndekilerin süresini de bekle.
  let ahead = 0;
  for (const other of active) ahead += other.estimateMs;
  let watchdog: ReturnType<typeof setTimeout> | null = null;
  const entry = createPending(opts.onEnd, own, () => {
    if (watchdog) clearTimeout(watchdog);
  });
  watchdog = setTimeout(entry.finish, own + ahead);

  try {
    chunks.forEach((chunk, i) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = "tr-TR";
      utterance.rate = rate;
      utterance.pitch = opts.pitch ?? 1.05;
      if (voice) utterance.voice = voice;
      if (i === chunks.length - 1) utterance.onend = entry.finish;
      utterance.onerror = entry.finish;
      s.speak(utterance);
    });
    startKeepAlive();
    // Bazı tarayıcılar arka plandan dönünce "duraklatılmış" kalır.
    if (s.paused) s.resume();
  } catch {
    entry.finish();
  }
}

/** Sessiz bir konuşmayla TTS'i hazırlar ve ses listesini tazeler. */
export function primeSpeech(): void {
  const s = synth();
  if (!s) return;
  hookVoices();
  voice = pickVoice() ?? voice;
  if (active.size > 0) return;
  try {
    if (s.paused) s.resume();
    if (!s.speaking) {
      const primer = new SpeechSynthesisUtterance(" ");
      primer.volume = 0;
      s.speak(primer);
    }
  } catch {
    /* yok say */
  }
}

/** Bir dokunuşun içinde çağrılmalı (iOS kuralı). */
export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  loadManifest();
  primeSpeech();
  window.dispatchEvent(new Event("dogukan:audio-unlock"));
}

export function isSpeechSupported(): boolean {
  return synth() !== null;
}

export function hasTurkishVoice(): boolean {
  hookVoices();
  voice = voice ?? pickVoice();
  return voice !== null;
}

export function getVoiceName(): string | null {
  return hasTurkishVoice() ? (voice?.name ?? null) : null;
}

export function isSpeaking(): boolean {
  return speaking;
}

export function subscribeSpeaking(cb: () => void): () => void {
  speakingListeners.add(cb);
  return () => {
    speakingListeners.delete(cb);
  };
}
