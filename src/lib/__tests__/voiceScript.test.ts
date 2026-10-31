import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BREAKS } from "@/content/breaks";
import {
  MISSIONS,
  NUMBER_WORDS,
  numberClip,
  TOMORROW,
  VOICE,
  VOICE_CLIPS,
  WB_LINES,
  type VoiceKey,
} from "@/content/voice";
import { praiseClip, PRAISE_LINES } from "@/lib/praise";

const script = readFileSync(
  join(process.cwd(), "docs", "plan", "VOICE_SCRIPT.md"),
  "utf8",
);

function rowOf(clip: string): string | undefined {
  return script
    .split("\n")
    .find((l) => l.startsWith("| ") && l.includes(`\`${clip}\``));
}

describe("VOICE_SCRIPT.md koddaki metinlerle eşleşir", () => {
  const entries: [string, string][] = [
    ...(Object.keys(VOICE) as VoiceKey[]).map(
      (k) => [VOICE_CLIPS[k], VOICE[k]] as [string, string],
    ),
    ...Object.values(WB_LINES).map((l) => [l.clip, l.say] as [string, string]),
    ...Object.values(TOMORROW).map((l) => [l.clip, l.say] as [string, string]),
    ...MISSIONS.map((l) => [l.clip, l.say] as [string, string]),
    ...BREAKS.map((b) => [b.clip, b.say] as [string, string]),
    ...Object.values(PRAISE_LINES).flatMap((ls) =>
      ls.map((l) => [praiseClip(l) ?? "?", l] as [string, string]),
    ),
    ...NUMBER_WORDS.map((w, i) => [numberClip(i), w] as [string, string]),
  ];

  it("~150 satır", () => {
    expect(entries.length).toBeGreaterThanOrEqual(120);
  });

  it.each(entries)("%s", (clip, text) => {
    const row = rowOf(clip);
    expect(row, clip).toBeDefined();
    expect(row).toContain(text);
  });

  it("klip kimlikleri benzersiz", () => {
    const ids = entries.map(([c]) => c);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
