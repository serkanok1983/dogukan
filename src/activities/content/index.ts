// STUB (C0) — owner: S3. Replace body, keep signature (docs/plan/CONTRACT.md §10.1).
import type { Generator } from "@/activities/engine/types";
import type { SkillId } from "@/lib/skills";

export const GENERATORS: Partial<Record<SkillId, Generator>> = {};

export function getGenerator(skill: SkillId): Generator | undefined {
  return GENERATORS[skill];
}
