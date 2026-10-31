/**
 * Çocuk ekran metinleri (MASTER_PLAN §2.14, CONTRACT §10.2). C0 tohumladı; sahibi S6.
 * Yer tutucular: {ad} oyuncu adı, {ayı} ayının adı, {skor} rekor.
 * Övgü satırları burada değil, `praise.ts`'te.
 * Her satırın bir ses klibi kimliği vardır (`speak(text, { clip })`); liste:
 * `docs/plan/VOICE_SCRIPT.md`.
 */
import type { WorldId } from "@/lib/worlds";

export type VoiceKey =
  | "welcome"
  | "nameAsk"
  | "nameDone"
  | "continueRecord"
  | "start"
  | "exitAsk"
  | "jarEmpty"
  | "graceHint"
  | "warn5"
  | "warn1"
  | "limit"
  | "evening"
  | "eveningTile"
  | "night"
  | "chapterEnd"
  | "error";

export const VOICE: Readonly<Record<VoiceKey, string>> = {
  welcome: "Hoş geldin {ad}!",
  nameAsk: "Ben senin ayınım. Bana bir isim ver.",
  nameDone: "{ayı}! Ne güzel isim.",
  continueRecord: "Rekorun hâlâ burada: {skor}.",
  start: "Hazır? Üç, iki, bir!",
  exitAsk: "Gidiyor muyuz?",
  jarEmpty: "Bal bitti. Üç soruyla bal toplayalım mı?",
  graceHint: "Yarından sonra bal böyle: oynarken azalır, öğrenirken dolar.",
  warn5: "Beş dakika kaldı. Son oyununu seç.",
  warn1: "Bu son tur!",
  limit: "Bugünlük bu kadar! Bugün çok şey yaptın.",
  evening: "Akşam oldu. Sakin oyunlar açık.",
  eveningTile: "Macera Adası uyuyor. Sabah görüşürüz.",
  night: "İyi geceler {ad}. Yarın görüşürüz.",
  chapterEnd: "Çanta doldu! Bugünlük bu kadar mı, devam mı?",
  error: "Oyun biraz yoruldu.",
};

/** `VOICE` satırlarının klip kimlikleri (public/voice/<id>.m4a). */
export const VOICE_CLIPS: Readonly<Record<VoiceKey, string>> = {
  welcome: "v-welcome",
  nameAsk: "v-name-ask",
  nameDone: "v-name-done",
  continueRecord: "v-continue-record",
  start: "v-start",
  exitAsk: "v-exit-ask",
  jarEmpty: "v-jar-empty",
  graceHint: "v-grace-hint",
  warn5: "v-warn5",
  warn1: "v-warn1",
  limit: "v-limit",
  evening: "v-evening",
  eveningTile: "v-evening-tile",
  night: "v-night",
  chapterEnd: "v-chapter-end",
  error: "v-error",
};

export type Line = { readonly say: string; readonly clip: string };

/** İyi oluş katmanının ek satırları (MolaScreen, LimitScreen, CoPlayPrompt…). */
export const WB_LINES = {
  breakStart: { say: "Mola zamanı! Hadi biraz hareket.", clip: "wb-break-start" },
  firstBreak: {
    say: "Babanla birlikte! İlk molayı beraber yapın.",
    clip: "wb-first-break",
  },
  breakReady: { say: "Halka doldu. Devam etmeye hazırsın.", clip: "wb-break-ready" },
  honeyLow: { say: "Bal azalıyor. Son oyunlarını seç.", clip: "wb-honey-low" },
  limitStars: { say: "Bugünkü yıldızların burada.", clip: "wb-limit-stars" },
  coplayCalled: {
    say: "Babanı çağırdım! Biraz bekleyelim.",
    clip: "wb-coplay-called",
  },
  coplayStart: { say: "İkiniz birlikte! Hadi.", clip: "wb-coplay-start" },
  graceOk: { say: "Tamam!", clip: "wb-grace-ok" },
  albumOpen: { say: "Çıkartmalarına bakalım.", clip: "wb-album-open" },
} as const satisfies Record<string, Line>;

/** LimitScreen "Yarın: …" önizlemesi, ada başına (bulunma eki elle yazıldı). */
export const TOMORROW: Readonly<Record<WorldId, Line>> = {
  macera: {
    say: "Yarın Macera Adası'nda yeni bir koşu var.",
    clip: "wb-tomorrow-macera",
  },
  harf: { say: "Yarın Harf Ormanı'nda yeni bir ses var.", clip: "wb-tomorrow-harf" },
  sayi: { say: "Yarın Sayı Dağı'nda yeni bir şey var.", clip: "wb-tomorrow-sayi" },
  sekil: {
    say: "Yarın Şekil Köyü'nde yeni bir şekil var.",
    clip: "wb-tomorrow-sekil",
  },
  merak: {
    say: "Yarın Merak Gölü'nde yeni bir soru var.",
    clip: "wb-tomorrow-merak",
  },
  blok: {
    say: "Yarın Blok Dünyası'nda yeni bir yapı var.",
    clip: "wb-tomorrow-blok",
  },
  baba: { say: "Yarın babanla yeni bir oyun var.", clip: "wb-tomorrow-baba" },
};

/** LimitScreen görev kartı: gerçek dünyada, babayla yapılacak tek bir şey. */
export const MISSIONS: readonly Line[] = [
  { say: "Babanla dene: evde üç yuvarlak şey bulun.", clip: "wb-mission-1" },
  { say: "Babanla dene: gölgenizi ölçün.", clip: "wb-mission-2" },
  { say: "Babanla dene: masadaki çatalları sayın.", clip: "wb-mission-3" },
  {
    say: "Babanla dene: adının ilk sesiyle başlayan bir şey bulun.",
    clip: "wb-mission-4",
  },
  { say: "Babanla dene: evdeki pencereleri sayın.", clip: "wb-mission-5" },
  { say: "Babanla dene: kalbinin sesini dinleyin.", clip: "wb-mission-6" },
  {
    say: "Babanla dene: evde kırmızı ve mavi şeyleri ayırın.",
    clip: "wb-mission-7",
  },
];

/** 0–20 sayı adları (mola sayımı); klip `n-<sayı>`. */
export const NUMBER_WORDS: readonly string[] = [
  "Sıfır",
  "Bir",
  "İki",
  "Üç",
  "Dört",
  "Beş",
  "Altı",
  "Yedi",
  "Sekiz",
  "Dokuz",
  "On",
  "On bir",
  "On iki",
  "On üç",
  "On dört",
  "On beş",
  "On altı",
  "On yedi",
  "On sekiz",
  "On dokuz",
  "Yirmi",
];

export function numberClip(n: number): string {
  return `n-${n}`;
}

/** {skor} gibi ek yer tutucuları doldurur; {ad}/{ayı} `speech.fillTemplate` ile dolar. */
export function voiceLine(
  key: VoiceKey,
  vars: Record<string, string | number> = {},
): string {
  let line: string = VOICE[key];
  for (const [k, v] of Object.entries(vars))
    line = line.replaceAll(`{${k}}`, String(v));
  return line;
}
