import { GROUND_Y, VIEW_H } from "./superBearConstants";

export const MAX_LEVELS = 100;
export const VIEW_W = 360;
export { VIEW_H };

export type Plat = { x: number; y: number; w: number; h: number; kind: "grass" | "log" | "stone" };
export type Enemy = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  minX: number;
  maxX: number;
  kind: "wolf" | "bee";
};
export type Pickup = { x: number; y: number; kind: "honey" | "star"; taken: boolean };

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rand(rng: () => number, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** level: 1..MAX_LEVELS — zorluk artar */
export function buildProceduralLevel(level: number): {
  plats: Plat[];
  enemies: Enemy[];
  pickups: Pickup[];
  goalX: number;
  levelW: number;
} {
  const rng = mulberry32(level * 9773 + 42);
  const L = Math.min(level, MAX_LEVELS);
  const spdMul = 1 + (L - 1) * 0.022;
  const gapTight = Math.min(18, 8 + Math.floor(L / 12));
  const levelW = 1200 + L * 28 + Math.floor(L / 10) * 40;
  const goalX = levelW - 100;

  const plats: Plat[] = [
    { x: 0, y: GROUND_Y, w: Math.min(400, 280 + L * 2), h: 72, kind: "grass" },
  ];

  let cursorX = plats[0].w - 40;
  const platCount = 11 + Math.min(14, Math.floor(L / 6));

  for (let i = 0; i < platCount; i++) {
    const stepX = rand(rng, 140, 220 + Math.min(40, L));
    cursorX += stepX;
    const yOff = rand(rng, 70, 110 + Math.min(50, Math.floor(L / 8)));
    const w = rand(rng, 72, 110 - Math.min(20, Math.floor(L / 15)));
    const roll = rng();
    const kind: Plat["kind"] = roll > 0.78 ? "stone" : roll > 0.55 ? "log" : "grass";
    plats.push({
      x: cursorX,
      y: GROUND_Y - yOff + (rng() > 0.5 ? 0 : Math.min(24, gapTight)),
      w,
      h: kind === "grass" ? 20 : 18,
      kind,
    });
    if (rng() > 0.72 && i < platCount - 2) {
      plats.push({
        x: cursorX + rand(rng, 40, 90),
        y: GROUND_Y - yOff - rand(rng, 50, 90 + Math.min(40, L)),
        w: rand(rng, 60, 95),
        h: 18,
        kind: rng() > 0.5 ? "log" : "stone",
      });
    }
  }

  plats.push({ x: goalX - 200, y: GROUND_Y, w: 320, h: 72, kind: "grass" });

  const enemies: Enemy[] = [];
  const nWolves = 2 + Math.floor(L / 7) + Math.floor(L / 25);
  const nBees = 1 + Math.floor(L / 12) + Math.floor(L / 40);

  for (let i = 0; i < nWolves; i++) {
    const x = rand(rng, 400, Math.max(450, goalX - 200));
    const patrol = 60 + rand(rng, 0, 80 + L);
    const base = (rng() > 0.5 ? 1 : -1) * (1.1 + rng() * 0.8) * spdMul;
    enemies.push({
      x,
      y: GROUND_Y - 44,
      w: 36,
      h: 32,
      vx: base,
      minX: Math.max(200, x - patrol),
      maxX: Math.min(goalX - 80, x + patrol),
      kind: "wolf",
    });
  }
  for (let i = 0; i < nBees; i++) {
    const x = rand(rng, 500, goalX - 150);
    const y = GROUND_Y - rand(rng, 100, 220 + Math.min(80, L));
    const patrol = 40 + rand(rng, 0, 50);
    enemies.push({
      x,
      y,
      w: 28,
      h: 28,
      vx: (rng() > 0.5 ? 0.85 : -0.85) * spdMul * (0.9 + rng() * 0.35),
      minX: Math.max(250, x - patrol),
      maxX: Math.min(goalX - 60, x + patrol),
      kind: "bee",
    });
  }

  const pickups: Pickup[] = [];
  const nPick = 6 + Math.floor(L / 8);
  for (let i = 0; i < nPick; i++) {
    pickups.push({
      x: rand(rng, 350, goalX - 80),
      y: GROUND_Y - rand(rng, 80, 260),
      kind: rng() > 0.72 ? "star" : "honey",
      taken: false,
    });
  }

  return { plats, enemies, pickups, goalX, levelW };
}
