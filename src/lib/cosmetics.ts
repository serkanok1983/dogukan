/**
 * Ayı kozmetikleri (CONTRACT §10.4, MASTER_PLAN §2.7, K1). Sahibi S5.
 * Yalnızca YILDIZLA alınır (asla balla). Fiyat sabittir; rastgele kutu yoktur.
 * `BearAvatar({ cosmetic })` (S1) bu kimlikleri çizer.
 */
import type { CosmeticId, Progress } from "@/lib/progress/types";

export type CosmeticDef = {
  id: CosmeticId;
  emoji: string;
  name: string;
  say: string;
  price: number;
};

export const COSMETICS: readonly CosmeticDef[] = [
  { id: "kep", emoji: "🧢", name: "Kep", say: "Kep", price: 6 },
  { id: "atki", emoji: "🧣", name: "Atkı", say: "Atkı", price: 12 },
  {
    id: "gozluk",
    emoji: "🕶️",
    name: "Güneş gözlüğü",
    say: "Güneş gözlüğü",
    price: 20,
  },
  { id: "fiyonk", emoji: "🎀", name: "Fiyonk", say: "Fiyonk", price: 30 },
  { id: "tac", emoji: "👑", name: "Taç", say: "Taç", price: 45 },
];

export function getCosmetic(id: CosmeticId): CosmeticDef | undefined {
  return COSMETICS.find((c) => c.id === id);
}

/**
 * Harcanan yıldız, sahip olunan kozmetiklerin katalog fiyatlarından türetilir;
 * `recorded` (eski sayaç) yalnızca katalogda olmayan kimlikler için alt sınırdır.
 * İki sekmede aynı anda alınan iki kozmetik birleşince ikisinin fiyatı da sayılır.
 */
export function spentStars(
  owned: readonly CosmeticId[],
  recorded: number = 0,
): number {
  let n = 0;
  for (const id of new Set(owned)) n += getCosmetic(id)?.price ?? 0;
  return Math.max(n, recorded);
}

/** Harcanabilir yıldız: toplam yıldız − harcanan. */
export function starsAvailable(p: Progress): number {
  let n = 0;
  for (const a of Object.values(p.activities)) n += a.stars;
  return Math.max(
    0,
    n - spentStars(p.rewards.cosmetics.owned, p.rewards.starsSpent),
  );
}
