/**
 * Faz 1 içerik üreticileri (CONTRACT §10.1, MASTER_PLAN §3.3). Sahibi S3.
 * Her üretici saf ve tohumludur: aynı `Rng` aynı maddeyi verir.
 */
import type { Generator } from "@/activities/engine/types";
import type { SkillId } from "@/lib/skills";
import { guvenli } from "./hb/guvenli";
import { cikarma } from "./mat/cikarma";
import { oruntu } from "./mat/oruntu";
import { sayma } from "./mat/sayma";
import { siralama } from "./mat/siralama";
import { toplama } from "./mat/toplama";
import { harfYaz } from "./tr/harfYaz";
import { kelime } from "./tr/kelime";
import { sesAyirt } from "./tr/sesAyirt";
import { sesHarf } from "./tr/sesHarf";

const ALL: readonly Generator[] = [
  sesAyirt,
  sesHarf,
  kelime,
  harfYaz,
  sayma,
  toplama,
  cikarma,
  oruntu,
  siralama,
  guvenli,
];

export const GENERATORS: Partial<Record<SkillId, Generator>> = Object.fromEntries(
  ALL.map((g) => [g.skill, g]),
);

export function getGenerator(skill: SkillId): Generator | undefined {
  return GENERATORS[skill];
}
