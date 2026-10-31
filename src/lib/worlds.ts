/**
 * Adalar ve etkinlik bilgisi (CONTRACT §5). Açık slug→ada tablosu; MENU
 * Faz 1'de yeniden gruplanmaz (MASTER_PLAN K6). C0 yazdı, sahibi S3.
 */
import type { SkillId } from "@/lib/skills";

export type WorldId = "macera" | "harf" | "sayi" | "sekil" | "merak" | "blok" | "baba";
export type ActivityKind = "arcade" | "learning" | "creative";

export type World = {
  id: WorldId;
  name: string;
  say: string;
  emoji: string;
  accent: string;
  order: number;
  gated?: "coplay";
};

export type ActivityInfo = {
  world: WorldId;
  kind: ActivityKind;
  skill: SkillId | null;
  hidden?: true;
  exercise?: true;
  flagship?: true;
  isNew?: true;
};

export const WORLDS: readonly World[] = [
  { id: "macera", name: "Macera Adası", say: "Macera Adası", emoji: "🏝️", accent: "#ff6b9d", order: 1 },
  { id: "harf", name: "Harf Ormanı", say: "Harf Ormanı", emoji: "📖", accent: "#4ecdc4", order: 2 },
  { id: "sayi", name: "Sayı Dağı", say: "Sayı Dağı", emoji: "🔢", accent: "#ffd93d", order: 3 },
  { id: "sekil", name: "Şekil Köyü", say: "Şekil Köyü", emoji: "🔷", accent: "#a78bfa", order: 4 },
  { id: "merak", name: "Merak Gölü", say: "Merak Gölü", emoji: "🔬", accent: "#6bcb77", order: 5 },
  { id: "blok", name: "Blok Dünyası", say: "Blok Dünyası", emoji: "🧱", accent: "#f59e0b", order: 6 },
  { id: "baba", name: "Baba ile", say: "Babanla birlikte", emoji: "👨‍👦", accent: "#f97316", order: 7, gated: "coplay" },
];

const K = "arcade" as const;
const L = "learning" as const;
const C = "creative" as const;

function a(world: WorldId, kind: ActivityKind, skill: SkillId | null, flags: Omit<ActivityInfo, "world" | "kind" | "skill"> = {}): ActivityInfo {
  return { world, kind, skill, ...flags };
}

export const ACTIVITY_INFO: Readonly<Record<string, ActivityInfo>> = {
  // macera
  "super-ayi": a("macera", K, "ef.refleks", { flagship: true }),
  "flappy-bird": a("macera", K, "ef.refleks", { flagship: true }),
  "kosu-macera": a("macera", K, "ef.refleks", { flagship: true }),
  "baloncuk-patlat": a("macera", K, "ef.dikkat"),
  "balon-patlat": a("macera", K, "mat.toplama", { flagship: true }),
  "kostebek-vur": a("macera", K, "ef.dikkat", { flagship: true }),
  "hafiza-kartlari": a("macera", K, "ef.hafiza", { flagship: true }),
  "ziplama-adasi": a("macera", K, "ef.refleks"),
  "yagmur-damlasi": a("macera", K, "ef.refleks"),
  "top-yakala": a("macera", K, "ef.refleks"),
  "serit-yarisi": a("macera", K, "ef.refleks"),
  tetris: a("macera", K, "ef.planlama"),
  labirent: a("macera", K, "ef.planlama"),
  "kaydir-puzzle": a("macera", K, "ef.planlama"),
  "yilan-oyunu": a("macera", K, "ef.planlama"),
  "royal-match": a("macera", K, "ef.planlama"),
  "tugla-kir": a("macera", K, "ef.refleks"),
  pong: a("macera", K, "ef.refleks"),
  // harf
  "harf-tanima": a("harf", L, "tr.ses-harf", { exercise: true }),
  "ses-avi": a("harf", L, "tr.ses-ayirt", { exercise: true, isNew: true }),
  "harf-yazma": a("harf", L, "tr.harf-yaz", { exercise: true }),
  "kelime-okuma": a("harf", L, "tr.kelime", { exercise: true }),
  "hece-birlestir": a("harf", L, "tr.hece"),
  "sesli-harf": a("harf", L, "tr.ses-ayirt"),
  "benzer-kelime": a("harf", L, "tr.sozcuk"),
  "bosluk-doldur": a("harf", L, "tr.dinle"),
  "cumle-kur": a("harf", L, "tr.cumle", { hidden: true }),
  "alfabe-sirasi": a("harf", L, null, { hidden: true }),
  "kelime-avcisi": a("harf", L, "tr.kelime", { hidden: true }),
  // sayi
  "sayma-oyunu": a("sayi", L, "mat.sayma", { exercise: true }),
  "toplama-oyunu": a("sayi", L, "mat.toplama", { exercise: true }),
  "cikarma-oyunu": a("sayi", L, "mat.cikarma", { exercise: true }),
  "sayi-sirasi": a("sayi", L, "mat.sira", { exercise: true }),
  karsilastir: a("sayi", L, "mat.sira"),
  "onluk-birlik": a("sayi", L, "mat.sayma"),
  "saat-ogren": a("sayi", L, "mat.zaman"),
  "para-say": a("sayi", L, "mat.para"),
  "cift-tek": a("sayi", L, null, { hidden: true }),
  "hizli-matematik": a("sayi", L, "mat.toplama", { hidden: true }),
  "hedef-vur": a("sayi", L, "mat.toplama", { hidden: true }),
  // sekil
  "desen-tamamla": a("sekil", L, "mat.oruntu", { exercise: true }),
  "sira-bul": a("sekil", L, "mat.oruntu", { exercise: true }),
  "sekil-tani": a("sekil", L, "mat.sekil"),
  "sekil-say": a("sekil", L, "mat.sekil"),
  "sekil-ciz": a("sekil", L, "tr.harf-yaz"),
  simetri: a("sekil", L, "mat.simetri"),
  tangram: a("sekil", L, "mat.sekil", { hidden: true }),
  "renk-atolyesi": a("sekil", C, "fen.gozlem"),
  "renk-yaris": a("sekil", L, "tr.sozcuk"),
  "hazine-haritasi": a("sekil", L, "mat.uzamsal"),
  "boyut-sirala": a("sekil", L, "mat.olcme"),
  "mantik-eslestir": a("sekil", L, "tr.sozcuk"),
  grupla: a("sekil", L, "fen.siniflama"),
  "fark-bul": a("sekil", L, "ef.dikkat"),
  "dur-git": a("sekil", L, "ef.ketleme", { isNew: true, hidden: true }),
  // merak
  "guvenli-yol": a("merak", L, "hb.guvenli", { exercise: true, isNew: true }),
  "dinozor-kazi": a("merak", L, "fen.gozlem"),
  "besin-gruplari": a("merak", L, "hb.saglik"),
  "hava-durumu": a("merak", L, "hb.doga"),
  mevsimler: a("merak", L, "hb.doga"),
  "bitki-buyume": a("merak", L, "hb.doga"),
  vucudumuz: a("merak", L, "hb.saglik"),
  "su-dongu": a("merak", L, "hb.doga"),
  gezegenler: a("merak", L, "hb.doga"),
  hayvanlar: a("merak", L, "hb.doga"),
  // blok
  "blok-dunyasi": a("blok", C, "mat.simetri", { isNew: true }),
  // baba
  "dovus-arenasi": a("baba", K, "ef.refleks"),
  "tank-savasi": a("baba", K, "ef.refleks"),
  "uzayli-istilasi": a("baba", K, "ef.refleks"),
  "uzay-savunma": a("baba", K, "ef.refleks"),
  asteroids: a("baba", K, "ef.refleks"),
  "pinball-space-cadet": a("baba", K, "ef.refleks"),
  "meyve-bicagi": a("baba", K, "ef.refleks"),
};

const WORLD_BY_ID = new Map(WORLDS.map((w) => [w.id, w]));

export function getWorld(id: WorldId): World {
  const w = WORLD_BY_ID.get(id);
  if (!w) throw new Error(`Bilinmeyen ada: ${id}`);
  return w;
}

export function getActivityInfo(slug: string): ActivityInfo | undefined {
  return ACTIVITY_INFO[slug];
}

/** Bir adanın etkinlikleri, tablo sırasıyla. */
export function activitiesInWorld(id: WorldId, opts: { includeHidden?: boolean } = {}): string[] {
  return Object.entries(ACTIVITY_INFO)
    .filter(([, info]) => info.world === id && (opts.includeHidden || !info.hidden))
    .map(([slug]) => slug);
}
