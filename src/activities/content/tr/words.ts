/**
 * Resimli kelime bankası (MASTER_PLAN §3.3). Ses gruplarının 1–2'si için her
 * ses en az 6 resimli kelime içerir. Kelimeler küçük harf ve çocuk dilindedir.
 * Ğ hiçbir zaman ilk ses değildir; J gerekirse yalnızca "jeton", "jöle".
 *
 * Resimler somut ve tek anlamlı seçilir; eski telefonlarda çizilmeyen yeni
 * emojilerden kaçınılır. Çocuğun resme verebileceği başka adlar `aka`'da durur:
 * belirsizlik koruması (`soundsClash`) bu adların ilk sesini de hesaba katar,
 * böylece bir soruda iki doğru cevap çıkmaz.
 */
import { SOUND_GROUPS } from "@/lib/skills";

export type PictureWord = {
  word: string;
  emoji: string;
  /** Çocuğun resme verebileceği başka adlar (ilk sesleri çakışma sayılır). */
  aka?: readonly string[];
};

/** İlk sese göre resimli kelimeler. Anahtar = kelimenin ilk harfi. */
export const WORDS_BY_SOUND: Readonly<Record<string, readonly PictureWord[]>> = {
  // 1. grup: e l a k i n
  e: [
    { word: "elma", emoji: "🍎" },
    { word: "el", emoji: "✋" },
    { word: "ev", emoji: "🏠" },
    { word: "ekmek", emoji: "🍞" },
    { word: "eldiven", emoji: "🧤" },
    { word: "elbise", emoji: "👗" },
    { word: "ejderha", emoji: "🐉" },
  ],
  l: [
    { word: "limon", emoji: "🍋" },
    { word: "lale", emoji: "🌷", aka: ["çiçek"] },
    { word: "lamba", emoji: "💡", aka: ["ampul", "ışık"] },
    { word: "lama", emoji: "🦙", aka: ["alpaka", "deve"] },
    { word: "lolipop", emoji: "🍭", aka: ["şeker"] },
    { word: "laptop", emoji: "💻", aka: ["bilgisayar"] },
  ],
  a: [
    { word: "at", emoji: "🐴" },
    { word: "ayı", emoji: "🐻" },
    { word: "araba", emoji: "🚗" },
    { word: "arı", emoji: "🐝" },
    { word: "armut", emoji: "🍐" },
    { word: "ağaç", emoji: "🌳" },
    { word: "anahtar", emoji: "🔑" },
    { word: "ay", emoji: "🌙", aka: ["hilal"] },
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
    { word: "iğne", emoji: "💉", aka: ["aşı"] },
    { word: "ilaç", emoji: "💊", aka: ["hap"] },
    { word: "itfaiye", emoji: "🚒", aka: ["araba"] },
    { word: "iki", emoji: "2️⃣" },
    { word: "iplik", emoji: "🧵", aka: ["ip", "yün"] },
  ],
  n: [
    { word: "nine", emoji: "👵", aka: ["anneanne", "babaanne", "büyükanne"] },
    { word: "nazar boncuğu", emoji: "🧿" },
    { word: "noel baba", emoji: "🎅" },
    { word: "ninja", emoji: "🥷" },
    { word: "nota", emoji: "🎵", aka: ["müzik"] },
    { word: "nergis", emoji: "🌼", aka: ["çiçek", "papatya"] },
  ],
  // 2. grup: o m u t ü y
  o: [
    { word: "okul", emoji: "🏫" },
    { word: "ok", emoji: "➡️" },
    { word: "otobüs", emoji: "🚌" },
    { word: "olta", emoji: "🎣" },
    { word: "oje", emoji: "💅" },
    { word: "okyanus", emoji: "🌊", aka: ["deniz", "dalga"] },
  ],
  m: [
    { word: "muz", emoji: "🍌" },
    { word: "maymun", emoji: "🐒" },
    { word: "mantar", emoji: "🍄" },
    { word: "mum", emoji: "🕯️" },
    { word: "makas", emoji: "✂️" },
    { word: "mısır", emoji: "🌽" },
    { word: "mektup", emoji: "✉️", aka: ["zarf"] },
  ],
  u: [
    { word: "uçak", emoji: "✈️" },
    { word: "uçurtma", emoji: "🪁" },
    { word: "uğur böceği", emoji: "🐞" },
    { word: "uydu", emoji: "🛰️" },
    { word: "uzaylı", emoji: "👽", aka: ["yaratık"] },
    { word: "ufo", emoji: "🛸" },
    { word: "uyku", emoji: "😴" },
  ],
  ü: [
    { word: "üzüm", emoji: "🍇" },
    { word: "üçgen", emoji: "🔺" },
    { word: "üç", emoji: "3️⃣" },
    { word: "üzgün", emoji: "😞", aka: ["mutsuz"] },
    { word: "üçgen cetvel", emoji: "📐", aka: ["cetvel", "gönye"] },
    { word: "üflemek", emoji: "🌬️", aka: ["rüzgar"] },
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
    { word: "yağmur", emoji: "🌧️", aka: ["bulut"] },
    { word: "yatak", emoji: "🛏️" },
    { word: "yengeç", emoji: "🦀" },
    { word: "yunus", emoji: "🐬", aka: ["balık"] },
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

/** Resmin adıyla ve `aka` adlarıyla başlayabileceği bütün ilk sesler. */
export function firstSounds(w: PictureWord): string[] {
  return [...new Set([w.word, ...(w.aka ?? [])].map(firstSound))];
}

/** İki resim, herhangi bir adıyla aynı sesle başlayabiliyor mu (belirsizlik koruması). */
export function soundsClash(a: PictureWord, b: PictureWord): boolean {
  const sa = firstSounds(a);
  return firstSounds(b).some((s) => sa.includes(s));
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
  { word: "inek", emoji: "🐄", group: 1 },
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
