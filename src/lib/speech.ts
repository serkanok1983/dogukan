/**
 * Konuşma katmanı (CONTRACT §8.1, MASTER_PLAN §3.6). C0 yazdı; sahibi S2.
 *
 * - Türkçe ses sıralaması: Yelda → Google Türkçe → Microsoft Emel → herhangi tr-*.
 * - Kayıt öncelikli yol: `public/voice/manifest.json` içindeki id'ler için
 *   `public/voice/<id>.m4a` çalınır, yoksa TTS. Babanın sesi kod değişmeden eklenir.
 * - Fonem kuralı çağıranın sorumluluğudur: tek ünsüz asla söyletilmez.
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

let voice: SpeechSynthesisVoice | null = null;
let voicesHooked = false;
let manifest: Set<string> | null = null;
let manifestLoading = false;
let currentAudio: HTMLAudioElement | null = null;
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
  const turkish = s.getVoices().filter((v) => v.lang.toLocaleLowerCase("tr").startsWith("tr"));
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
      manifest = new Set(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : []);
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

export function cancelSpeech(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  synth()?.cancel();
  setSpeaking(false);
}

function playClip(id: string, onEnd?: () => void): boolean {
  if (!manifest?.has(id) || typeof Audio === "undefined") return false;
  const audio = new Audio(assetPath(`/voice/${id}.m4a`));
  currentAudio = audio;
  const done = () => {
    if (currentAudio === audio) currentAudio = null;
    setSpeaking(false);
    onEnd?.();
  };
  audio.addEventListener("ended", done, { once: true });
  audio.addEventListener("error", done, { once: true });
  setSpeaking(true);
  void audio.play().catch(done);
  return true;
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
  const utterance = new SpeechSynthesisUtterance(line);
  utterance.lang = "tr-TR";
  utterance.rate = opts.rate ?? 0.9;
  utterance.pitch = opts.pitch ?? 1.05;
  if (voice) utterance.voice = voice;
  let ended = false;
  const done = () => {
    if (ended) return;
    ended = true;
    setSpeaking(false);
    opts.onEnd?.();
  };
  utterance.onend = done;
  utterance.onerror = done;
  setSpeaking(true);
  s.speak(utterance);
}

/** Bir dokunuşun içinde çağrılmalı (iOS kuralı). */
export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  hookVoices();
  loadManifest();
  const s = synth();
  if (s && !s.speaking) {
    try {
      const primer = new SpeechSynthesisUtterance(" ");
      primer.volume = 0;
      s.speak(primer);
    } catch {
      /* yok say */
    }
  }
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
