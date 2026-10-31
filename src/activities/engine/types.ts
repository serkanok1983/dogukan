/**
 * Egzersiz motoru tipleri (CONTRACT §10.1). C0 yazdı; sahibi S2.
 * Her üretici bu `Exercise` şeklini döndürür; `prompt.say` zorunludur.
 */
import type { EncyclopediaTopic } from "@/lib/encyclopedia";
import type { Rng } from "@/lib/rng";
import type { SkillId, SkillLevel } from "@/lib/skills";

export type Visual =
  | { type: "picture"; emoji: string; alt: string }
  | { type: "count"; emoji: string; n: number; layout: "rows5" | "tenframe" | "scatter" }
  | { type: "tenframe"; a: number; b?: number; op?: "+" | "-" }
  | { type: "numberline"; from: number; to: number; start: number; hops?: number }
  | { type: "letter"; char: string; case: "lower" | "upper"; highlight?: boolean }
  | { type: "pattern"; items: string[]; blankIndex: number }
  | { type: "scene"; emoji: string; caption?: string }
  | { type: "lab"; mode: EncyclopediaTopic["lab"]; preset: number }
  | { type: "clock"; hour: number; half: boolean }
  | { type: "coins"; values: number[] }
  | { type: "grid"; size: 4 | 6; left: boolean[][] };

export type Choice = { id: string; emoji?: string; text?: string; say: string };

export type ExerciseKind = "choice" | "tapcount" | "order" | "trace";

export type Exercise = {
  id: string;
  skill: SkillId;
  level: SkillLevel;
  kind: ExerciseKind;
  prompt: { say: string; text?: string; visual?: Visual; hintSay?: string };
  choices?: Choice[];
  answerIds: string[];
  trace?: { char: string };
  feedback: { correct?: string; retry: string; reveal: string };
  bigTap?: boolean;
};

export type Generator = {
  skill: SkillId;
  maxLevel: SkillLevel;
  generate(rng: Rng, level: SkillLevel): Exercise;
};
