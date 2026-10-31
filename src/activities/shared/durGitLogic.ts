/**
 * Dur-Git (ef.ketleme) oyun mantığı: saf indirgeyici. Rastgelelik eylemle
 * gelir (`tick.rand`), böylece mantık testte tekrar üretilebilir.
 *
 * 45 sn, üç bölüm:
 *  1 (0–15 sn): balığa dokun, köpekbalığına dokunma.
 *  2 (15–30 sn): daha hızlı, daha çok köpekbalığı.
 *  3 (30–45 sn): kural değişir — yalnızca kırmızı balık.
 */

export const GAME_MS = 45_000;
export const PHASE_MS = 15_000;
export const LANES = 4;

export type Phase = 1 | 2 | 3;
export type FishColor = "kirmizi" | "mavi";
export type Creature = {
  id: number;
  kind: "fish" | "shark";
  color: FishColor;
  lane: number;
  dir: "ltr" | "rtl";
  durationMs: number;
};

export type DgState = {
  status: "ready" | "playing" | "over";
  run: number;
  elapsed: number;
  score: number;
  hits: number;
  errors: number;
  creatures: Creature[];
  nextId: number;
  nextSpawnAt: number;
  lastLane: number;
};

export type DgAction =
  | { type: "start" }
  | { type: "tick"; dt: number; rand: readonly [number, number, number, number] }
  | { type: "tap"; id: number }
  | { type: "escape"; id: number };

const PHASE_RULES: Record<Phase, { every: number; shark: number; swimMs: number; max: number }> = {
  1: { every: 1400, shark: 0.25, swimMs: 5200, max: 3 },
  2: { every: 1000, shark: 0.35, swimMs: 4000, max: 4 },
  3: { every: 1100, shark: 0.25, swimMs: 4600, max: 4 },
};

export function initialDgState(): DgState {
  return {
    status: "ready",
    run: 0,
    elapsed: 0,
    score: 0,
    hits: 0,
    errors: 0,
    creatures: [],
    nextId: 1,
    nextSpawnAt: 600,
    lastLane: -1,
  };
}

export function phaseOf(elapsed: number): Phase {
  return elapsed < PHASE_MS ? 1 : elapsed < 2 * PHASE_MS ? 2 : 3;
}

/** Bu bölümde dokunulması gereken mi? */
export function isTarget(c: Creature, phase: Phase): boolean {
  if (c.kind === "shark") return false;
  return phase < 3 || c.color === "kirmizi";
}

export function secondsLeft(s: DgState): number {
  return Math.max(0, Math.ceil((GAME_MS - s.elapsed) / 1000));
}

function spawn(s: DgState, rand: readonly [number, number, number, number]): DgState {
  const phase = phaseOf(s.elapsed);
  const rule = PHASE_RULES[phase];
  const [r1, r2, r3, r4] = rand;
  let lane = Math.min(LANES - 1, Math.floor(r2 * LANES));
  if (lane === s.lastLane) lane = (lane + 1) % LANES;
  const creature: Creature = {
    id: s.nextId,
    kind: r1 < rule.shark ? "shark" : "fish",
    color: r3 < 0.5 ? "kirmizi" : "mavi",
    lane,
    dir: r4 < 0.5 ? "ltr" : "rtl",
    durationMs: Math.round(rule.swimMs + (r4 - 0.5) * 800),
  };
  return {
    ...s,
    creatures: [...s.creatures, creature],
    nextId: s.nextId + 1,
    nextSpawnAt: s.elapsed + rule.every,
    lastLane: lane,
  };
}

export function reduceDg(s: DgState, a: DgAction): DgState {
  switch (a.type) {
    case "start":
      return { ...initialDgState(), status: "playing", run: s.run + 1 };
    case "tick": {
      if (s.status !== "playing") return s;
      const elapsed = s.elapsed + a.dt;
      if (elapsed >= GAME_MS) return { ...s, elapsed: GAME_MS, status: "over", creatures: [] };
      const next = { ...s, elapsed };
      const phase = phaseOf(elapsed);
      if (elapsed >= s.nextSpawnAt && s.creatures.length < PHASE_RULES[phase].max) return spawn(next, a.rand);
      return next;
    }
    case "tap": {
      if (s.status !== "playing") return s;
      const c = s.creatures.find((x) => x.id === a.id);
      if (!c) return s;
      const creatures = s.creatures.filter((x) => x.id !== a.id);
      if (isTarget(c, phaseOf(s.elapsed))) {
        return { ...s, creatures, score: s.score + 1, hits: s.hits + 1 };
      }
      return { ...s, creatures, score: Math.max(0, s.score - 1), errors: s.errors + 1 };
    }
    case "escape":
      return { ...s, creatures: s.creatures.filter((x) => x.id !== a.id) };
  }
}
