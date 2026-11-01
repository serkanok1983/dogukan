import { describe, expect, it } from "vitest";
import { EPISODES, episodeHref, getEpisode, type CapsuleCard } from "@/lib/capsules";
import { getTopic } from "@/lib/encyclopedia";

// CONTRACT §8.1 phoneme rule: TTS never speaks a bare consonant.
const BARE_CONSONANT = /^\s*[bcçdfgğhjklmnprsştvyz]\s*[.?!]?\s*$/i;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

function spokenLines(card: CapsuleCard): string[] {
  return [
    card.say,
    card.tap.prompt,
    card.tap.explain,
    ...(card.tap.choices ?? []).map((c) => c.say),
  ].filter((s): s is string => typeof s === "string");
}

describe("capsules data", () => {
  it("ships the two required Phase-1 episodes", () => {
    const topics = EPISODES.map((e) => e.topic);
    expect(topics).toContain("isik-ve-golge");
    expect(topics).toContain("kalbim-ve-nefesim");
    expect(new Set(topics).size).toBe(topics.length);
  });

  it("getEpisode and episodeHref", () => {
    expect(getEpisode("isik-ve-golge")?.title).toBe("Işık ve gölge");
    expect(getEpisode("yok")).toBeUndefined();
    expect(episodeHref("isik-ve-golge")).toBe("/kesfet/isik-ve-golge/kapsul/");
  });

  describe.each(EPISODES.map((e) => [e.topic, e] as const))("%s", (_topic, episode) => {
    const topic = getTopic(episode.topic);

    it("belongs to an encyclopedia topic and has parent copy", () => {
      expect(topic).toBeDefined();
      expect(episode.parentNote.length).toBeGreaterThan(40);
      expect(episode.previewEmoji.trim()).not.toBe("");
    });

    it("has exactly 12 cards, unique ids, and ends with the mission", () => {
      expect(episode.cards).toHaveLength(12);
      expect(new Set(episode.cards.map((c) => c.id)).size).toBe(12);
      const last = episode.cards[11];
      expect(last?.kind).toBe("mission");
      expect(last?.tap.type).toBe("done");
      expect(last?.say.startsWith("Babanla dene:")).toBe(true);
      expect(episode.cards.filter((c) => c.kind === "mission")).toHaveLength(1);
      expect(episode.cards.filter((c) => c.tap.type === "done")).toHaveLength(1);
    });

    it("shows exactly what it says (word cards show the spoken word); no grey-box emoji", () => {
      for (const card of episode.cards) {
        if (card.kind === "word") {
          expect(card.text).toBeTruthy();
          expect(card.say.toLocaleLowerCase("tr")).toContain(card.text?.toLocaleLowerCase("tr"));
        } else {
          expect(card.text ?? card.say, card.id).toBe(card.say);
        }
        const scenes = [
          card.visual.type === "emoji" ? card.visual.scene : "",
          ...(card.tap.choices ?? []).map((c) => c.emoji),
        ];
        // ZWJ family emoji (👨‍👦) renders as a grey silhouette box on recent Apple systems.
        for (const s of scenes) expect(s, card.id).not.toMatch(/[\u{1F468}\u{1F469}]\u200D[\u{1F466}\u{1F467}]/u);
        // Unicode 14+ emoji (🫥 🫲 🪷 🫏 …) are missing on older phones.
        for (const s of scenes) expect(s, card.id).not.toMatch(/[\u{1FAE0}-\u{1FAFF}\u{1FA75}-\u{1FA77}\u{1FAA9}-\u{1FAAF}\u{1FAB7}-\u{1FABF}\u{1FAC3}-\u{1FACF}\u{1FADA}-\u{1FADF}]/u);
      }
    });

    it("pulse is felt on the chest, not the wrist (hard for a 6-year-old)", () => {
      for (const card of episode.cards) {
        for (const line of spokenLines(card)) expect(line).not.toMatch(/bile[kğ]/i);
      }
    });

    it("follows hook → … → word → 2 quiz → mission", () => {
      const kinds = episode.cards.map((c) => c.kind);
      expect(kinds[0]).toBe("hook");
      expect(kinds.slice(8)).toEqual(["word", "quiz", "quiz", "mission"]);
      expect(kinds.filter((k) => k === "lab").length).toBeGreaterThanOrEqual(2);
    });

    it.each(episode.cards.map((c) => [c.id, c] as const))("%s obeys the card rules", (_id, card) => {
      expect(card.tap).toBeDefined();
      expect(card.say.trim()).not.toBe("");
      expect(words(card.say)).toBeLessThanOrEqual(8);
      for (const line of spokenLines(card)) expect(line).not.toMatch(BARE_CONSONANT);
      if (card.tap.explain) expect(words(card.tap.explain)).toBeLessThanOrEqual(8);

      const choices = card.tap.choices ?? [];
      if (card.tap.type === "predict" || card.tap.type === "choose") {
        expect(choices.length).toBeGreaterThanOrEqual(2);
        expect(choices.length).toBeLessThanOrEqual(3);
        expect(new Set(choices.map((c) => c.id)).size).toBe(choices.length);
        for (const c of choices) {
          expect(c.emoji.trim()).not.toBe("");
          expect(words(c.label)).toBe(1);
          expect(c.say.trim()).not.toBe("");
          if (c.preset !== undefined) expect(card.visual.type).toBe("lab");
        }
      } else {
        expect(choices).toHaveLength(0);
      }

      if (card.tap.type === "choose") {
        expect(choices.filter((c) => c.id === card.tap.answerId)).toHaveLength(1);
        expect(card.tap.explain).toBeTruthy();
      } else {
        // predict has no wrong answer; listen/done have nothing to grade
        expect(card.tap.answerId).toBeUndefined();
      }

      if (card.visual.type === "lab") {
        expect(card.visual.mode).toBe(topic?.lab);
        expect(Number.isFinite(card.visual.preset)).toBe(true);
      } else {
        expect(card.visual.scene.trim()).not.toBe("");
      }
    });
  });
});
