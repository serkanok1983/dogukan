/**
 * Hareket Kartları (proposals/parent-wellbeing.md F4, MASTER_PLAN §2.11). Sahibi S6.
 *
 * - Halka süresi kartta değil, ayarda: `settings.breakSeconds` (30–45 sn, K13).
 * - Cümleler ≤ 14 kelime (testle korunur); sayım `count` ile sesli yapılır.
 * - Gün içinde tekrar yok: o günün sırası tarihten türetilir, n. mola n. kartı alır.
 * - İlk mola her zaman `zipla` ve babayla yapılır.
 * - `saril` yalnızca bir yetişkin yanındayken (birlikte oyun açıkken) gelir.
 */
import type { BearPose } from "@/components/home/BearAvatar";
import type { BreakId, DayKey } from "@/lib/progress/types";
import { createRng, seedFrom, shuffled } from "@/lib/rng";

export type BreakCard = {
  id: BreakId;
  emoji: string;
  title: string;
  say: string;
  clip: string;
  /** Sesli sayım: 1…count. 0 = sayım yok. */
  count: number;
  bearFrame: BearPose;
  needsAdult?: true;
};

export const BREAKS: readonly BreakCard[] = [
  {
    id: "goz",
    emoji: "👀",
    title: "Uzağa bak",
    say: "Pencereye bak. En uzaktaki şeyi bul. Ona kadar sayalım.",
    clip: "br-goz",
    count: 10,
    bearFrame: "idle",
  },
  {
    id: "zipla",
    emoji: "🦘",
    title: "Zıpla",
    say: "Ayağa kalk. Beş kere zıpla!",
    clip: "br-zipla",
    count: 5,
    bearFrame: "jump",
  },
  {
    id: "gerin",
    emoji: "🙆",
    title: "Gerin",
    say: "Ayı gibi gerin. Kollar yukarı, yavaşça aşağı. Üç kere.",
    clip: "br-gerin",
    count: 3,
    bearFrame: "stretch",
  },
  {
    id: "flamingo",
    emoji: "🦩",
    title: "Flamingo",
    say: "Flamingo ol! Tek ayak üstünde dur. Beşe kadar sayalım.",
    clip: "br-flamingo",
    count: 5,
    bearFrame: "stretch",
  },
  {
    id: "nefes",
    emoji: "🌬️",
    title: "Nefes",
    say: "Burnundan bal kokla. Ağzından mumu söndür. Üç kere.",
    clip: "br-nefes",
    count: 3,
    bearFrame: "idle",
  },
  {
    id: "su",
    emoji: "🥛",
    title: "Su iç",
    say: "Bir bardak su iç. Dönünce bana el salla.",
    clip: "br-su",
    count: 0,
    bearFrame: "wave",
  },
  {
    id: "bul",
    emoji: "🔴",
    title: "Kırmızı bul",
    say: "Odada üç kırmızı şey bul. Bana göster!",
    clip: "br-bul",
    count: 3,
    bearFrame: "wave",
  },
  {
    id: "saril",
    emoji: "🤗",
    title: "Anlat",
    say: "Yanında biri var mı? Ona bugün ne oynadığını anlat.",
    clip: "br-saril",
    count: 0,
    bearFrame: "wave",
    needsAdult: true,
  },
];

const BY_ID = new Map(BREAKS.map((b) => [b.id, b]));

export function getBreak(id: BreakId): BreakCard {
  return BY_ID.get(id) ?? BREAKS[1];
}

/** O günün kart sırası (tarihten tohumlanır, gün içinde sabit). */
export function breakOrderForDay(day: DayKey, opts: { ziplaFirst?: boolean } = {}): BreakId[] {
  const order = shuffled(createRng(seedFrom(`mola:${day}`)), BREAKS.map((b) => b.id));
  if (!opts.ziplaFirst) return order;
  return ["zipla", ...order.filter((id) => id !== "zipla")];
}

/**
 * Sıradaki mola kartı. `takenToday` = bugün alınan + atlanan mola sayısı.
 * `ziplaFirst` kurulum gününde verilir; böylece ilk molanın `zipla`'sı o gün tekrar gelmez.
 */
export function pickBreak(opts: {
  day: DayKey;
  takenToday: number;
  firstEver: boolean;
  adultPresent: boolean;
  ziplaFirst?: boolean;
}): BreakId {
  if (opts.firstEver) return "zipla";
  const order = breakOrderForDay(opts.day, { ziplaFirst: opts.ziplaFirst }).filter(
    (id) => opts.adultPresent || !getBreak(id).needsAdult,
  );
  return order[Math.max(0, opts.takenToday) % order.length] ?? "zipla";
}
