/**
 * Resimli kelime bankası (MASTER_PLAN §3.3). Ses gruplarının 1–2'si için her
 * ses en az 6 resimli kelime içerir. Kelimeler küçük harf ve çocuk dilindedir.
 * Ğ hiçbir zaman ilk ses değildir; J gerekirse yalnızca "jeton", "jöle".
 */
import { SOUND_GROUPS } from "@/lib/skills";

export type PictureWord = { word: string; emoji: string };

/** İlk sese göre resimli kelimeler. Anahtar = kelimenin ilk harfi. */
export const WORDS_BY_SOUND: Readonly<Record<string, readonly PictureWord[]>> = {
  // 1. grup: e l a k i n
  e: [
    { word: "elma", emoji: "🍎" },
    { word: "el", emoji: "✋" },
    { word: "ev", emoji: "🏠" },
    { word: "eşek", emoji: "🫏" },
    { word: "ekmek", emoji: "🍞" },
    { word: "eldiven", emoji: "🧤" },
    { word: "elbise", emoji: "👗" },
  ],
  l: [
    { word: "limon", emoji: "🍋" },
    { word: "lale", emoji: "🌷" },
    { word: "lamba", emoji: "💡" },
    { word: "leopar", emoji: "🐆" },
    { word: "lahana", emoji: "🥬" },
    { word: "lama", emoji: "🦙" },
    { word: "lolipop", emoji: "🍭" },
  ],
  a: [
    { word: "at", emoji: "🐴" },
    { word: "ayı", emoji: "🐻" },
    { word: "araba", emoji: "🚗" },
    { word: "arı", emoji: "🐝" },
    { word: "armut", emoji: "🍐" },
    { word: "ağaç", emoji: "🌳" },
    { word: "anahtar", emoji: "🔑" },
    { word: "ay", emoji: "🌙" },
  ],
  k: [
    { word: "kedi", emoji: "🐱" },
    { word: "kapı", emoji: "🚪" },
    { word: "kuş", emoji: "🐦" },
    { word: "kalem", emoji: "✏️" },
    { word: "kitap", emoji: "📖" },
    { word: "köpek", emoji: "🐶" },
    { word: "kurbağa", emoji: "🐸" },
    { word: "kiraz", emoji: "🍒" },
  ],
  i: [
    { word: "inek", emoji: "🐄" },
    { word: "ip", emoji: "🪢" },
    { word: "iğne", emoji: "🪡" },
    { word: "ilaç", emoji: "💊" },
    { word: "istakoz", emoji: "🦞" },
    { word: "itfaiye", emoji: "🚒" },
  ],
  n: [
    { word: "nine", emoji: "👵" },
    { word: "nota", emoji: "🎵" },
    { word: "nane", emoji: "🌿" },
    { word: "nazar boncuğu", emoji: "🧿" },
    { word: "nilüfer", emoji: "🪷" },
    { word: "nehir", emoji: "🏞️" },
  ],
  // 2. grup: o m u t ü y
  o: [
    { word: "okul", emoji: "🏫" },
    { word: "ok", emoji: "🏹" },
    { word: "oyuncak", emoji: "🧸" },
    { word: "otobüs", emoji: "🚌" },
    { word: "orman", emoji: "🌲" },
    { word: "olta", emoji: "🎣" },
    { word: "otel", emoji: "🏨" },
  ],
  m: [
    { word: "muz", emoji: "🍌" },
    { word: "maymun", emoji: "🐒" },
    { word: "mantar", emoji: "🍄" },
    { word: "mum", emoji: "🕯️" },
    { word: "makas", emoji: "✂️" },
    { word: "mısır", emoji: "🌽" },
    { word: "mektup", emoji: "✉️" },
  ],
  u: [
    { word: "uçak", emoji: "✈️" },
    { word: "uçurtma", emoji: "🪁" },
    { word: "uğur böceği", emoji: "🐞" },
    { word: "uydu", emoji: "🛰️" },
    { word: "uzaylı", emoji: "👽" },
    { word: "ufo", emoji: "🛸" },
    { word: "uyku", emoji: "😴" },
  ],
  ü: [
    { word: "üzüm", emoji: "🍇" },
    { word: "üçgen", emoji: "🔺" },
    { word: "üç", emoji: "3️⃣" },
    { word: "üzgün", emoji: "😢" },
    { word: "üşümek", emoji: "🥶" },
    { word: "ünlem", emoji: "❗" },
  ],
  t: [
    { word: "top", emoji: "⚽" },
    { word: "tavşan", emoji: "🐰" },
    { word: "tren", emoji: "🚂" },
    { word: "tavuk", emoji: "🐔" },
    { word: "telefon", emoji: "📱" },
    { word: "timsah", emoji: "🐊" },
    { word: "terlik", emoji: "🩴" },
  ],
  y: [
    { word: "yıldız", emoji: "⭐" },
    { word: "yumurta", emoji: "🥚" },
    { word: "yılan", emoji: "🐍" },
    { word: "yaprak", emoji: "🍃" },
    { word: "yağmur", emoji: "🌧️" },
    { word: "yatak", emoji: "🛏️" },
    { word: "yengeç", emoji: "🦀" },
    { word: "yunus", emoji: "🐬" },
  ],
};

/** 1. ve 2. ses grubunun harfleri (SOUND_GROUPS'tan; okulun sırası değişirse burası da değişir). */
export const GROUP1: readonly string[] = SOUND_GROUPS[0] ?? [];
export const GROUP12: readonly string[] = [...GROUP1, ...(SOUND_GROUPS[1] ?? [])];

export function wordsForSounds(sounds: readonly string[]): PictureWord[] {
  return sounds.flatMap((s) => WORDS_BY_SOUND[s] ?? []);
}

/** Kelimenin ilk harfi (ilk ses). */
export function firstSound(word: string): string {
  return word.charAt(0);
}

/** Kelimenin son harfi (son ses); çok kelimeliler için son kelimenin sonu. */
export function lastSound(word: string): string {
  return word.charAt(word.length - 1);
}

/**
 * Yalnızca 1–2. grup harfleriyle yazılan, çocuğun çözebileceği resimli
 * kelimeler (`tr.kelime`). `group: 1` olanlar yalnızca 1. grup harflerini içerir.
 */
export const DECODABLE_WORDS: readonly (PictureWord & { group: 1 | 2 })[] = [
  { word: "el", emoji: "✋", group: 1 },
  { word: "kek", emoji: "🧁", group: 1 },
  { word: "kale", emoji: "🏰", group: 1 },
  { word: "lale", emoji: "🌷", group: 1 },
  { word: "nane", emoji: "🌿", group: 1 },
  { word: "nine", emoji: "👵", group: 1 },
  { word: "anne", emoji: "👩", group: 1 },
  { word: "kalkan", emoji: "🛡️", group: 1 },
  { word: "elma", emoji: "🍎", group: 2 },
  { word: "at", emoji: "🐴", group: 2 },
  { word: "ay", emoji: "🌙", group: 2 },
  { word: "ok", emoji: "🏹", group: 2 },
  { word: "limon", emoji: "🍋", group: 2 },
  { word: "mum", emoji: "🕯️", group: 2 },
  { word: "kutu", emoji: "📦", group: 2 },
  { word: "kalem", emoji: "✏️", group: 2 },
  { word: "ekmek", emoji: "🍞", group: 2 },
  { word: "maymun", emoji: "🐒", group: 2 },
  { word: "okul", emoji: "🏫", group: 2 },
  { word: "tilki", emoji: "🦊", group: 2 },
  { word: "inek", emoji: "🐄", group: 2 },
  { word: "yelken", emoji: "⛵", group: 2 },
  { word: "kemik", emoji: "🦴", group: 2 },
  { word: "tekne", emoji: "🚤", group: 2 },
  { word: "kaya", emoji: "🪨", group: 2 },
  { word: "tüy", emoji: "🪶", group: 2 },
  { word: "kamyon", emoji: "🚚", group: 2 },
  { word: "yumak", emoji: "🧶", group: 2 },
  { word: "kilit", emoji: "🔒", group: 2 },
  { word: "anten", emoji: "📡", group: 2 },
];
