import { describe, expect, it } from "vitest";
import {
  GAME_MS,
  PHASE_MS,
  initialDgState,
  isTarget,
  phaseOf,
  reduceDg,
  type Creature,
  type DgState,
} from "@/activities/shared/durGitLogic";
import { createRng } from "@/lib/rng";

function play(seed: number, ms: number, s: DgState = reduceDg(initialDgState(), { type: "start" })): DgState {
  const rng = createRng(seed);
  let state = s;
  for (let t = 0; t < ms; t += 100) {
    state = reduceDg(state, { type: "tick", dt: 100, rand: [rng(), rng(), rng(), rng()] });
  }
  return state;
}

const fish = (color: Creature["color"]): Creature => ({ id: 1, kind: "fish", color, lane: 0, dir: "ltr", durationMs: 4000 });
const shark: Creature = { ...fish("mavi"), kind: "shark" };

describe("Dur-Git mantığı", () => {
  it("45 sn sonra biter, üç bölüm var", () => {
    expect(phaseOf(0)).toBe(1);
    expect(phaseOf(PHASE_MS)).toBe(2);
    expect(phaseOf(2 * PHASE_MS)).toBe(3);
    const end = play(1, GAME_MS + 500);
    expect(end.status).toBe("over");
    expect(end.creatures).toHaveLength(0);
  });

  it("kurallar: köpekbalığı hiç hedef değil; 3. bölümde yalnız kırmızı balık", () => {
    expect(isTarget(shark, 1)).toBe(false);
    expect(isTarget(fish("mavi"), 2)).toBe(true);
    expect(isTarget(fish("mavi"), 3)).toBe(false);
    expect(isTarget(fish("kirmizi"), 3)).toBe(true);
  });

  it("canlılar çıkar, aynı anda en çok 4, şeritler geçerli", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = createRng(seed);
      let s = reduceDg(initialDgState(), { type: "start" });
      let seen = 0;
      for (let t = 0; t < GAME_MS - 100; t += 100) {
        s = reduceDg(s, { type: "tick", dt: 100, rand: [rng(), rng(), rng(), rng()] });
        expect(s.creatures.length).toBeLessThanOrEqual(4);
        seen = Math.max(seen, s.nextId - 1);
        for (const c of s.creatures) {
          expect(c.lane).toBeGreaterThanOrEqual(0);
          expect(c.lane).toBeLessThan(4);
          expect(c.durationMs).toBeGreaterThan(2000);
        }
        // Ekranı boşalt ki yeni canlılar gelsin.
        for (const c of s.creatures) s = reduceDg(s, { type: "escape", id: c.id });
      }
      expect(seen).toBeGreaterThan(20);
    }
  });

  it("doğru dokunuş puan verir, yanlış dokunuş puanı 0'ın altına düşürmez", () => {
    let s: DgState = { ...reduceDg(initialDgState(), { type: "start" }), creatures: [shark] };
    s = reduceDg(s, { type: "tap", id: 1 });
    expect(s.score).toBe(0);
    expect(s.errors).toBe(1);
    s = { ...s, creatures: [fish("mavi")] };
    s = reduceDg(s, { type: "tap", id: 1 });
    expect(s.score).toBe(1);
    expect(s.hits).toBe(1);
    // Aynı canlıya ikinci dokunuş sayılmaz.
    expect(reduceDg(s, { type: "tap", id: 1 })).toBe(s);
  });

  it("yeniden başlatma durumu yerinde sıfırlar ve koşu numarasını artırır", () => {
    const end = play(3, GAME_MS + 100);
    const again = reduceDg(end, { type: "start" });
    expect(again.status).toBe("playing");
    expect(again.run).toBe(end.run + 1);
    expect(again.score).toBe(0);
    expect(again.elapsed).toBe(0);
  });
});
