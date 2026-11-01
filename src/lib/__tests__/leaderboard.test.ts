import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { checkLiveMilestone, getHighScore, recordScore } from "@/lib/leaderboard";
import { BANNED_WORDS, PRAISE_LINES, _resetPraiseForTests } from "@/lib/praise";

const PERSON_OR_RIVAL = /Doğukan|Serkan|Aferin|Süpersin|Vay be|geçtin|yakaladın|geçiyorsun/;

function setScores(player: "dogukan" | "serkan", board: Record<string, number>) {
  localStorage.setItem(`dogukan-scores-${player}`, JSON.stringify(board));
}

/** Satırın `praise()` havuzundan geldiğini doğrular (önek/sonek atılarak). */
function expectPraiseLine(message: string, pool: readonly string[]) {
  expect(pool.some((line) => message.includes(line)), message).toBe(true);
  expect(message).not.toMatch(BANNED_WORDS);
  expect(message).not.toMatch(PERSON_OR_RIVAL);
}

beforeEach(() => {
  localStorage.clear();
  _resetPraiseForTests(() => 0.5);
});

describe("leaderboard: Firebase tembel ve kimlik doğrulamalı", () => {
  it("SDK statik içe aktarılmaz (harita/oyun paketine girmez)", () => {
    const src = readFileSync(join(process.cwd(), "src/lib/leaderboard.ts"), "utf8");
    const staticImports = [...src.matchAll(/^import\s+(?!type\b)[^;]*from\s+"([^"]+)"/gm)].map((m) => m[1]);
    expect(staticImports.filter((m) => m?.startsWith("firebase") || m === "./firebase" || m === "@/lib/firebase")).toEqual([]);
    expect(src).toContain('await import("./firebase")');
    expect(src).toContain("getAuthedDb()");
    expect(src).not.toMatch(/getFirebaseDb|leaderboardRef|leaderboardRootRef/);
  });

  it("gallery.ts da oturum açılmış veritabanını bekler", () => {
    const src = readFileSync(join(process.cwd(), "src/activities/games/blocks/gallery.ts"), "utf8");
    expect(src).toContain("getAuthedDb()");
    expect(src).not.toContain("getFirebaseDb");
  });
});

describe("recordScore: yerel öncelikli, çocuk dili praise()'den", () => {
  it("yeni rekor: yerel yazılır, satır praise(run_end); kişi/baba yok", async () => {
    setScores("dogukan", { tetris: 100 });
    setScores("serkan", { tetris: 900 });
    const r = await recordScore("tetris", "dogukan", 400, { rivalVisible: false });
    expect(r).toMatchObject({ isNewRecord: true, celebrate: true });
    expect(r.message.startsWith("🏆 400! ")).toBe(true);
    expectPraiseLine(r.message, PRAISE_LINES.run_end);
    expect(r.message).not.toContain("Baba");
    expect(getHighScore("tetris", "dogukan")).toBe(400);
  });

  it("rivalVisible açıkken rakip yalnızca nötr sayı: '· 🏆 Baba: N'", async () => {
    setScores("serkan", { tetris: 900 });
    const r = await recordScore("tetris", "dogukan", 1000, { rivalVisible: true });
    expect(r.beatRival).toBe(true);
    expect(r.message).toMatch(/ · 🏆 Baba: 900$/);
    expectPraiseLine(r.message, PRAISE_LINES.run_end);
  });

  it("babayı geçmek/yakalamak tek başına kutlanmaz", async () => {
    setScores("dogukan", { tetris: 5000 });
    setScores("serkan", { tetris: 900 });
    const r = await recordScore("tetris", "dogukan", 1000, { rivalVisible: true });
    expect(r).toMatchObject({ isNewRecord: false, beatRival: true, celebrate: false, message: "" });
  });
});

describe("checkLiveMilestone: yalnızca kendi ilerlemesi", () => {
  it("rakip türü üretilmez, rivalVisible açık olsa bile", async () => {
    setScores("dogukan", { tetris: 1000 });
    setScores("serkan", { tetris: 100 });
    const m = await checkLiveMilestone("tetris", "dogukan", 300, 0, { rivalVisible: true });
    expect(m.kind).not.toBe("rival");
    expect(m.celebrate).toBe(false);
  });

  it("eski rekor aşılınca satır praise(run_end); 'Üç kere denedin' yok", async () => {
    setScores("dogukan", { tetris: 100 });
    const m = await checkLiveMilestone("tetris", "dogukan", 150, 0, { rivalVisible: true });
    expect(m.kind).toBe("record");
    expectPraiseLine(m.message, PRAISE_LINES.run_end);
    expect(m.message).not.toContain("Üç kere");
  });

  it("puan eşiği satırı da praise()'den", async () => {
    const m = await checkLiveMilestone("tetris", "dogukan", 600, 0);
    expect(m).toMatchObject({ kind: "mark", mark: 500 });
    expectPraiseLine(m.message, PRAISE_LINES.correct_first);
  });
});
