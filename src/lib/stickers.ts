/**
 * Çıkartma kataloğu (CONTRACT §10.4, MASTER_PLAN §2.7). Sahibi S5.
 *
 * Kartın üstünde emoji olarak çizilir. Tetikleyiciler sabittir ve rastgelelik
 * içermez; her çıkartma bir kez verilir (`reducers.ts`). Kilitliler albümde
 * silüet olarak görünür.
 *
 * `trigger` dilbilgisi (saf, `stickerTriggered` değerlendirir):
 * - `open`                 ilk açılış (app_open / activity_open)
 * - `stars:N`              toplam yıldız ≥ N
 * - `first3`               herhangi bir etkinlikte 3 yıldız
 * - `3star:<slug>`         o etkinlikte 3 yıldız
 * - `skill:<id>:<L>`       beceri seviyesi ≥ L (ör. ses grubu ustalığı)
 * - `sets:N`               tamamlanan öğrenme seti ≥ N
 * - `capsules:N`           bitirilen kapsül bölümü ≥ N
 * - `streak:N`             seri ≥ N gün
 * - `blocks` / `share`     ilk kayıtlı / ilk babaya gösterilen Blok dünyası
 * - `trio:N`               günün üç görevi N. kez bitti
 */
import type { Progress, ProgressEvent, StickerId } from "@/lib/progress/types";

export type StickerDef = {
  id: StickerId;
  emoji: string;
  name: string;
  say: string;
  page: string;
  trigger: string;
};

export const STICKER_PAGES = [
  "İlk adımlar",
  "Macera",
  "Harfler",
  "Sayılar",
  "Merak",
  "Çalışkan arı",
  "Güneşler",
  "Blok",
  "Günün kutusu",
] as const;

function s(
  id: string,
  emoji: string,
  name: string,
  say: string,
  page: (typeof STICKER_PAGES)[number],
  trigger: string,
): StickerDef {
  return { id, emoji, name, say, page, trigger };
}

export const STICKERS: readonly StickerDef[] = [
  s("hos-geldin", "🐾", "Pati izi", "Pati izi! Hoş geldin.", "İlk adımlar", "open"),
  s(
    "ilk-yildiz",
    "⭐",
    "Parlak yıldız",
    "Parlak yıldız! İlk yıldızın.",
    "İlk adımlar",
    "stars:1",
  ),
  s(
    "on-yildiz",
    "🌟",
    "Işıltılı yıldız",
    "Işıltılı yıldız! On yıldız oldu.",
    "İlk adımlar",
    "stars:10",
  ),
  s(
    "ilk-uc-yildiz",
    "🏅",
    "Madalya",
    "Madalya! Üç yıldız kazandın.",
    "İlk adımlar",
    "first3",
  ),

  s(
    "ayicik",
    "🐻",
    "Ayıcık",
    "Ayıcık! Süper Ayı'da üç yıldız.",
    "Macera",
    "3star:super-ayi",
  ),
  s(
    "civciv",
    "🐤",
    "Civciv",
    "Civciv! Uçarak üç yıldız.",
    "Macera",
    "3star:flappy-bird",
  ),
  s(
    "tilki",
    "🦊",
    "Tilki",
    "Tilki! Koşuda üç yıldız.",
    "Macera",
    "3star:kosu-macera",
  ),
  s(
    "balon",
    "🎈",
    "Balon",
    "Balon! Balonlarda üç yıldız.",
    "Macera",
    "3star:balon-patlat",
  ),
  s(
    "hamster",
    "🐹",
    "Hamster",
    "Hamster! Köstebeklerde üç yıldız.",
    "Macera",
    "3star:kostebek-vur",
  ),
  s(
    "fil",
    "🐘",
    "Fil",
    "Fil! Hafızan çok güçlü.",
    "Macera",
    "3star:hafiza-kartlari",
  ),

  s(
    "kulak",
    "👂",
    "Kulak",
    "Kulak! Sesleri iyi dinledin.",
    "Harfler",
    "skill:tr.ses-ayirt:2",
  ),
  s(
    "ari",
    "🐝",
    "Arı",
    "Arı! İlk harf grubu senin.",
    "Harfler",
    "skill:tr.ses-harf:2",
  ),
  s(
    "kaplumbaga",
    "🐢",
    "Kaplumbağa",
    "Kaplumbağa! İkinci harf grubu senin.",
    "Harfler",
    "skill:tr.ses-harf:3",
  ),
  s(
    "aslan",
    "🦁",
    "Aslan",
    "Aslan! Üçüncü harf grubu senin.",
    "Harfler",
    "skill:tr.ses-harf:4",
  ),
  s(
    "yunus",
    "🐬",
    "Yunus",
    "Yunus! Dördüncü harf grubu senin.",
    "Harfler",
    "skill:tr.ses-harf:5",
  ),
  s(
    "kitap",
    "📚",
    "Kitap",
    "Kitap! Kelimeleri okuyorsun.",
    "Harfler",
    "skill:tr.kelime:2",
  ),

  s(
    "ugur-bocegi",
    "🐞",
    "Uğur böceği",
    "Uğur böceği! Saymayı öğrendin.",
    "Sayılar",
    "skill:mat.sayma:2",
  ),
  s(
    "elma",
    "🍎",
    "Elma",
    "Elma! Toplamayı öğrendin.",
    "Sayılar",
    "skill:mat.toplama:2",
  ),
  s(
    "kurabiye",
    "🍪",
    "Kurabiye",
    "Kurabiye! Çıkarmayı öğrendin.",
    "Sayılar",
    "skill:mat.cikarma:2",
  ),
  s(
    "zebra",
    "🦓",
    "Zebra",
    "Zebra! Desenleri buldun.",
    "Sayılar",
    "skill:mat.oruntu:2",
  ),

  s("fener", "🔦", "Fener", "Fener! İlk bölümü bitirdin.", "Merak", "capsules:1"),
  s(
    "teleskop",
    "🔭",
    "Teleskop",
    "Teleskop! Üç bölüm bitirdin.",
    "Merak",
    "capsules:3",
  ),
  s(
    "trafik-isigi",
    "🚦",
    "Trafik ışığı",
    "Trafik ışığı! Güvenli yolu biliyorsun.",
    "Merak",
    "skill:hb.guvenli:2",
  ),

  s(
    "kalem",
    "✏️",
    "Kalem",
    "Kalem! İlk soru setin bitti.",
    "Çalışkan arı",
    "sets:1",
  ),
  s("canta", "🎒", "Çanta", "Çanta! Beş set bitirdin.", "Çalışkan arı", "sets:5"),
  s("kupa", "🏆", "Kupa", "Kupa! On set bitirdin.", "Çalışkan arı", "sets:10"),
  s(
    "aycicegi",
    "🌻",
    "Ayçiçeği",
    "Ayçiçeği! Yirmi beş set bitirdin.",
    "Çalışkan arı",
    "sets:25",
  ),

  s(
    "kucuk-gunes",
    "🌤️",
    "Küçük güneş",
    "Küçük güneş! Üç gün üst üste.",
    "Güneşler",
    "streak:3",
  ),
  s("gunes", "☀️", "Güneş", "Güneş! Yedi gün üst üste.", "Güneşler", "streak:7"),
  s(
    "gokkusagi",
    "🌈",
    "Gökkuşağı",
    "Gökkuşağı! On dört gün üst üste.",
    "Güneşler",
    "streak:14",
  ),

  s("ev", "🏠", "Ev", "Ev! İlk dünyanı kaydettin.", "Blok", "blocks"),
  s("tablo", "🖼️", "Tablo", "Tablo! Babana gösterdin.", "Blok", "share"),

  s(
    "hediye",
    "🎁",
    "Hediye kutusu",
    "Hediye kutusu! Çantan doldu.",
    "Günün kutusu",
    "trio:1",
  ),
  s(
    "oyuncak-ayi",
    "🧸",
    "Oyuncak ayı",
    "Oyuncak ayı! Beş kez çanta doldu.",
    "Günün kutusu",
    "trio:5",
  ),
];

const BY_ID = new Map(STICKERS.map((d) => [d.id, d]));

export function getSticker(id: StickerId): StickerDef | undefined {
  return BY_ID.get(id);
}

function totalStarsOf(p: Progress): number {
  let n = 0;
  for (const a of Object.values(p.activities)) n += a.stars;
  return n;
}

/**
 * Ömür boyu tamamlanan öğrenme seti. `days` 60 günde budandığı için tek
 * başına yetmez; `lifetime.sets` (tekdüze sayaç) ile gün toplamının büyüğü.
 */
export function lifetimeSets(p: Pick<Progress, "days" | "lifetime">): number {
  let n = 0;
  for (const d of Object.values(p.days)) n += d.setsDone;
  return Math.max(n, p.lifetime?.sets ?? 0);
}

function capsulesDone(p: Progress): number {
  let n = 0;
  for (const t of Object.values(p.topics)) if (t.capsuleDone) n += 1;
  return n;
}

/** Saf: `p` olay uygulandıktan sonraki durumdur. */
export function stickerTriggered(
  trigger: string,
  p: Progress,
  e: ProgressEvent,
): boolean {
  const [kind, a, b] = trigger.split(":");
  const n = Number(a);
  switch (kind) {
    case "open":
      return e.type === "app_open" || e.type === "activity_open";
    case "stars":
      return totalStarsOf(p) >= n;
    case "first3":
      return Object.values(p.activities).some((x) => x.stars === 3);
    case "3star":
      return a !== undefined && p.activities[a]?.stars === 3;
    case "skill": {
      const state = a ? p.skills[a as keyof Progress["skills"]] : undefined;
      return state !== undefined && state.level >= Number(b);
    }
    case "sets":
      return lifetimeSets(p) >= n;
    case "capsules":
      return capsulesDone(p) >= n;
    case "streak":
      return p.rewards.streak.count >= n;
    case "blocks":
      return e.type === "blocks_saved";
    case "share":
      return e.type === "blocks_saved" && e.shared;
    case "trio":
      return (p.rewards.questDays?.length ?? 0) >= n;
    default:
      return false;
  }
}
