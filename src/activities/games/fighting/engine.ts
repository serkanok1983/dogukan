/** 2D dövüş motoru — Street Fighter II tarzı (web için sadeleştirilmiş) */

export const FPS = 60;
export const STAGE_W = 360;
export const STAGE_H = 480;
export const FLOOR_Y = 400;
export const GRAVITY = 0.65;
export const JUMP_V = -11.5;
export const WALK_SPD = 3.2;
export const ROUND_TIME = 60;
export const THROW_RANGE = 52;

export type CharacterId = "dogukan" | "serkan";
export type FighterId = "p1" | "cpu";
export type AttackId = "lp" | "hp" | "lk" | "hk" | "fireball" | "throw";

export type CharProfile = {
  name: string;
  emoji: string;
  accent: string;
  fireEmoji: string;
  throwEmoji: string;
  dmgMult: number;
  spdMult: number;
};

export const CHARS: Record<CharacterId, CharProfile> = {
  dogukan: {
    name: "Doğukan",
    emoji: "🥋",
    accent: "#3b82f6",
    fireEmoji: "🔥",
    throwEmoji: "🌀",
    dmgMult: 1,
    spdMult: 1.05,
  },
  serkan: {
    name: "Serkan",
    emoji: "🦸",
    accent: "#f97316",
    fireEmoji: "⚡",
    throwEmoji: "💥",
    dmgMult: 1.12,
    spdMult: 0.95,
  },
};

export type AttackDef = {
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  hitW: number;
  hitH: number;
  hitOx: number;
  hitOy: number;
  knockback: number;
  hitstun: number;
  blockstun: number;
  unblockable?: boolean;
};

export const ATTACKS: Record<AttackId, AttackDef> = {
  lp: { startup: 4, active: 3, recovery: 8, damage: 8, hitW: 38, hitH: 28, hitOx: 32, hitOy: -36, knockback: 4, hitstun: 14, blockstun: 8 },
  hp: { startup: 7, active: 4, recovery: 16, damage: 16, hitW: 48, hitH: 32, hitOx: 36, hitOy: -38, knockback: 7, hitstun: 20, blockstun: 12 },
  lk: { startup: 5, active: 4, recovery: 10, damage: 10, hitW: 40, hitH: 24, hitOx: 34, hitOy: -18, knockback: 5, hitstun: 16, blockstun: 9 },
  hk: { startup: 9, active: 5, recovery: 18, damage: 18, hitW: 52, hitH: 30, hitOx: 38, hitOy: -22, knockback: 9, hitstun: 24, blockstun: 14 },
  fireball: { startup: 12, active: 2, recovery: 20, damage: 14, hitW: 28, hitH: 20, hitOx: 40, hitOy: -30, knockback: 5, hitstun: 18, blockstun: 10 },
  throw: { startup: 4, active: 6, recovery: 24, damage: 24, hitW: 44, hitH: 40, hitOx: 20, hitOy: -32, knockback: 0, hitstun: 0, blockstun: 0, unblockable: true },
};

export type FighterState =
  | "idle"
  | "walk"
  | "jump"
  | "crouch"
  | "attack"
  | "block"
  | "hitstun"
  | "throwing"
  | "thrown"
  | "ko"
  | "win";

export type Projectile = {
  x: number;
  y: number;
  vx: number;
  w: number;
  h: number;
  owner: FighterId;
  charId: CharacterId;
  life: number;
  trail: { x: number; y: number }[];
};

export type Fighter = {
  id: FighterId;
  charId: CharacterId;
  name: string;
  emoji: string;
  accent: string;
  fireEmoji: string;
  throwEmoji: string;
  dmgMult: number;
  spdMult: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  state: FighterState;
  stateT: number;
  attack: AttackId | null;
  attackPhase: "startup" | "active" | "recovery" | null;
  onGround: boolean;
  hitstun: number;
  blockHeld: boolean;
  comboCount: number;
  isPlayer: boolean;
  landedHit: boolean;
  throwPartner: FighterId | null;
};

export function makeFighter(
  id: FighterId,
  charId: CharacterId,
  x: number,
  facing: 1 | -1,
  isPlayer: boolean,
): Fighter {
  const c = CHARS[charId];
  return {
    id,
    charId,
    name: c.name,
    emoji: c.emoji,
    accent: c.accent,
    fireEmoji: c.fireEmoji,
    throwEmoji: c.throwEmoji,
    dmgMult: c.dmgMult,
    spdMult: c.spdMult,
    x,
    y: FLOOR_Y - 72,
    vx: 0,
    vy: 0,
    w: 44,
    h: 72,
    facing,
    hp: 100,
    maxHp: 100,
    state: "idle",
    stateT: 0,
    attack: null,
    attackPhase: null,
    onGround: true,
    hitstun: 0,
    blockHeld: false,
    comboCount: 0,
    isPlayer,
    landedHit: false,
    throwPartner: null,
  };
}

export function getHitbox(f: Fighter): { x: number; y: number; w: number; h: number } | null {
  if (f.state !== "attack" || f.attackPhase !== "active" || !f.attack) return null;
  const a = ATTACKS[f.attack];
  if (f.attack === "fireball") return null;
  const ox = f.facing * a.hitOx;
  return {
    x: f.x + (f.facing > 0 ? f.w - 8 : -a.hitW + 8) + ox - (f.facing < 0 ? a.hitW : 0),
    y: f.y + a.hitOy,
    w: a.hitW,
    h: a.hitH,
  };
}

export function hurtbox(f: Fighter): { x: number; y: number; w: number; h: number } {
  if (f.state === "thrown") {
    return { x: f.x + 6, y: f.y + 10, w: f.w - 12, h: f.h - 16 };
  }
  const shrink = f.state === "crouch" ? 18 : 8;
  return {
    x: f.x + 10,
    y: f.y + shrink,
    w: f.w - 20,
    h: f.h - shrink - 4,
  };
}

export function overlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function distFighters(a: Fighter, b: Fighter) {
  return Math.abs(a.x + a.w / 2 - (b.x + b.w / 2));
}

export function startAttack(f: Fighter, atk: AttackId) {
  if (f.state === "ko" || f.state === "win" || f.hitstun > 0) return false;
  if (f.state === "attack" || f.state === "throwing" || f.state === "thrown") return false;
  f.state = "attack";
  f.attack = atk;
  f.attackPhase = "startup";
  f.stateT = 0;
  f.vx = 0;
  f.landedHit = false;
  return true;
}

export function startThrow(attacker: Fighter, defender: Fighter) {
  if (attacker.state === "ko" || defender.state === "ko") return false;
  if (attacker.state !== "idle" && attacker.state !== "walk") return false;
  if (defender.state === "attack" || defender.state === "thrown") return false;
  attacker.state = "throwing";
  attacker.attack = "throw";
  attacker.attackPhase = "active";
  attacker.stateT = 0;
  attacker.landedHit = false;
  attacker.throwPartner = defender.id;
  defender.state = "thrown";
  defender.throwPartner = attacker.id;
  defender.stateT = 0;
  defender.vx = 0;
  defender.vy = 0;
  return true;
}

export function isBlocking(f: Fighter, attacker: Fighter): boolean {
  if (ATTACKS[attacker.attack ?? "lp"]?.unblockable) return false;
  if (f.state !== "block" && !f.blockHeld) return false;
  return f.facing !== attacker.facing;
}
