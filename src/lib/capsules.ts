// STUB (C0) — owner: S7. Replace body, keep signature (docs/plan/CONTRACT.md §10.5).
import type { EncyclopediaTopic } from "@/lib/encyclopedia";

export type CapsuleChoice = { id: string; emoji: string; label: string; say: string };
export type CapsuleCardKind = "hook" | "fact" | "wonder" | "lab" | "word" | "quiz" | "mission";

export type CapsuleCard = {
  id: string;
  kind: CapsuleCardKind;
  say: string;
  text?: string;
  visual: { type: "emoji"; scene: string } | { type: "lab"; mode: EncyclopediaTopic["lab"]; preset: number };
  tap: {
    type: "predict" | "choose" | "listen" | "done";
    prompt?: string;
    choices?: CapsuleChoice[];
    answerId?: string;
    explain?: string;
  };
};

export type CapsuleEpisode = {
  topic: string;
  title: string;
  emoji: string;
  previewEmoji: string;
  cards: CapsuleCard[];
  parentNote: string;
};

export const EPISODES: readonly CapsuleEpisode[] = [];

export function getEpisode(topic: string): CapsuleEpisode | undefined {
  return EPISODES.find((e) => e.topic === topic);
}

export function episodeHref(topic: string): string {
  return `/kesfet/${topic}/kapsul/`;
}
