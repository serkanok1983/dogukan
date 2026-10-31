import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { GENERATORS } from "@/activities/content";
import { EPISODES } from "@/lib/capsules";
import { BANNED_WORDS } from "@/lib/praise";
import { createRng } from "@/lib/rng";
import type { SkillLevel } from "@/lib/skills";

const ROOT = join(process.cwd(), "src", "content");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "__tests__" ? [] : files(p);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [p] : [];
  });
}

/** Yorumları atar, kalan string literal'lerini döndürür. */
function stringLiterals(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/[^\n]*/g, "$1");
  return [...code.matchAll(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g)].map((m) => m[0].slice(1, -1));
}

function offenders(strings: readonly string[]): string[] {
  return strings.filter((s) => BANNED_WORDS.test(s));
}

describe("çocuk metni: yasaklı kelimeler (MASTER_PLAN §2.12, F11)", () => {
  const sources = files(ROOT);

  it("src/content altında dosya bulunur", () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  it.each(sources.map((p) => [relative(process.cwd(), p), p] as const))("%s", (_rel, path) => {
    expect(offenders(stringLiterals(readFileSync(path, "utf8")))).toEqual([]);
  });

  it("kapsül metinleri", () => {
    const strings = EPISODES.flatMap((e) => [
      e.title,
      ...e.cards.flatMap((c) => [
        c.say,
        c.text ?? "",
        c.tap.prompt ?? "",
        c.tap.explain ?? "",
        ...(c.tap.choices ?? []).flatMap((ch) => [ch.label, ch.say]),
      ]),
    ]);
    expect(offenders(strings)).toEqual([]);
  });

  it("üretici metinleri (L1–L3, seviye başına 40 çekiliş)", () => {
    const strings: string[] = [];
    for (const gen of Object.values(GENERATORS)) {
      if (!gen) continue;
      for (let level = 1; level <= Math.min(3, gen.maxLevel); level++) {
        const rng = createRng(1000 + level);
        for (let i = 0; i < 40; i++) {
          const ex = gen.generate(rng, level as SkillLevel);
          strings.push(
            ex.prompt.say,
            ex.prompt.text ?? "",
            ex.prompt.hintSay ?? "",
            ex.feedback.correct ?? "",
            ex.feedback.retry,
            ex.feedback.reveal,
            ...(ex.choices ?? []).flatMap((c) => [c.say, c.text ?? ""]),
          );
        }
      }
    }
    expect(offenders(strings)).toEqual([]);
  });
});
