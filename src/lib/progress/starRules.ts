/**
 * Arcade yıldız eşikleri (CONTRACT §10.4, MASTER_PLAN §2.7, game-designer §2.1).
 * Sahibi S5. Öğrenme setlerinin yıldızı `reducers.setStars` ile hesaplanır.
 *
 * Her satır: [1 ⭐, 2 ⭐, 3 ⭐] eşikleri ve ölçü.
 * - `score`: oyunun `submitFinal(score)` ile bildirdiği puan.
 * - `level`: koşuda ulaşılan seviye (`run_end.level`); yoksa `fallback` puan eşikleri.
 *
 * Tablodaki puanlar ilgili oyunun puanlama kodundan türetildi (yorumlar).
 * Babanın `/bilgi` verisiyle bir hafta sonra ayarlanması beklenir.
 */
import type { Stars } from "./types";

export type Thresholds = readonly [number, number, number];

export type StarRule =
  | { measure: "score"; t: Thresholds }
  | { measure: "level"; t: Thresholds; fallback: Thresholds };

export const DEFAULT_THRESHOLDS: Thresholds = [1, 50, 200];

export const STAR_TABLE: Readonly<Record<string, StarRule>> = {
  // game-designer §2.1 tablosu
  // Süper Ayı: ulaşılan seviye 2/4/7. Puan yedeği: seviye başına ~10 toplanan (30–80) + bitiş bonusu.
  "super-ayi": { measure: "level", t: [2, 4, 7], fallback: [500, 1800, 4500] },
  "flappy-bird": { measure: "score", t: [3, 8, 15] }, // boru başına 1
  "kosu-macera": { measure: "score", t: [300, 800, 1500] },
  "ziplama-adasi": { measure: "score", t: [200, 600, 1200] },
  // Yağmur: 10/25/45 yakalama; yakalama başına 5 + seri (≤ 10) puan.
  "yagmur-damlasi": { measure: "score", t: [100, 300, 600] },
  // Yıldız Yakala: 10/25/45 yakalama; nesne 10–50 + seri×2 (ort. ~18).
  "top-yakala": { measure: "score", t: [180, 450, 800] },
  // Baloncuk: 20/50/90 patlatma; patlatma başına 10 + seri×3.
  "baloncuk-patlat": { measure: "score", t: [250, 700, 1400] },
  "royal-match": { measure: "score", t: [300, 900, 1800] },
  // Tetris: 3/10/20 satır. Tek satır 100×seviye; seviye her 10 satırda artar
  // → en az 300 / 1000 / 3000 puan.
  tetris: { measure: "score", t: [300, 1000, 3000] },
  // Köstebek: 8/16/26 vuruş; vuruş başına 10 + (≤ 3) bonus.
  "kostebek-vur": { measure: "score", t: [80, 180, 300] },
  // Hafıza: 6/10/14 çift (Kolay/Orta/Zor bitirildi). Puan = bitirilen çift sayısı;
  // `level` 1–3 (zorluk) bildirilirse o da sayılır (bkz. starsForRun).
  "hafiza-kartlari": { measure: "score", t: [6, 10, 14] },

  // Diğerleri: oyun kodundaki puanlamadan türetildi.
  "balon-patlat": { measure: "score", t: [4, 5, 6] }, // 6 tur, doğru başına 1 (set gibi)
  "serit-yarisi": { measure: "score", t: [500, 1500, 3000] }, // kare başına 1–2, nesne 40
  "tugla-kir": { measure: "score", t: [100, 300, 600] }, // tuğla 10, duvar 60 tuğla
  "yilan-oyunu": { measure: "score", t: [50, 150, 300] }, // yem 10
  pong: { measure: "score", t: [2, 6, 12] }, // 20'ye kadar sayı
  "uzayli-istilasi": { measure: "score", t: [150, 420, 840] }, // dalga 21 uzaylı ≈ 420
  "uzay-savunma": { measure: "score", t: [150, 450, 900] }, // kaya 15–40
  "tank-savasi": { measure: "score", t: [160, 480, 960] }, // tank 80
  "dovus-arenasi": { measure: "score", t: [150, 350, 600] }, // tur 100 + tur×50
  asteroids: { measure: "score", t: [300, 1000, 2500] }, // kaya 20/50/100
  "pinball-space-cadet": { measure: "score", t: [500, 1500, 3500] }, // tampon 60–80
  "meyve-bicagi": { measure: "score", t: [150, 400, 800] }, // meyve 8–15 + seri
  "renk-yaris": { measure: "score", t: [20, 60, 120] }, // doğru 1 + seri×2
  // Dur-Git (durGitLogic): 45 sn, hedef başına +1, hata −1. Doğan hedef sayısı
  // ~18–27 (kusursuz oyun benzetimi: medyan 22, %10'luk dilim 18); bkz. starRules.test.
  "dur-git": { measure: "score", t: [8, 14, 19] },
};

function byThresholds(value: number, t: Thresholds): Stars {
  if (value >= t[2]) return 3;
  if (value >= t[1]) return 2;
  if (value >= t[0]) return 1;
  return 0;
}

export function starRuleFor(slug: string): StarRule {
  return STAR_TABLE[slug] ?? { measure: "score", t: DEFAULT_THRESHOLDS };
}

export function starsForRun(
  slug: string,
  run: { score: number; level?: number },
): Stars {
  const score = Number.isFinite(run.score) ? run.score : 0;
  const level =
    run.level !== undefined && Number.isFinite(run.level) ? run.level : undefined;
  const rule = starRuleFor(slug);
  if (rule.measure === "level") {
    return level !== undefined
      ? byThresholds(level, rule.t)
      : byThresholds(score, rule.fallback);
  }
  const stars = byThresholds(score, rule.t);
  if (
    slug === "hafiza-kartlari" &&
    level !== undefined &&
    level >= 1 &&
    level <= 3
  ) {
    return Math.max(stars, level) as Stars;
  }
  return stars;
}
