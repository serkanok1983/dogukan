"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { getPlayerId } from "@/lib/auth";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { GameTouchBar } from "@/components/GameTouchBar";
import {
  ATTACKS,
  CHARS,
  FLOOR_Y,
  FPS,
  GRAVITY,
  JUMP_V,
  ROUND_TIME,
  STAGE_H,
  STAGE_W,
  THROW_RANGE,
  WALK_SPD,
  distFighters,
  getHitbox,
  hurtbox,
  isBlocking,
  makeFighter,
  overlap,
  startAttack,
  startThrow,
  type AttackId,
  type CharacterId,
  type Fighter,
  type Projectile,
} from "./fighting/engine";

const GAME_SLUG = "dovus-arenasi";
const KEY_LP = "KeyZ";
const KEY_HP = "KeyX";
const KEY_LK = "KeyC";
const KEY_HK = "KeyV";
const KEY_THROW = "KeyB";

type FloatText = { x: number; y: number; text: string; color: string; life: number; scale: number };
type ImpactRing = { x: number; y: number; life: number; maxLife: number; color: string; maxR: number };
type KoCinematic = {
  active: boolean;
  t: number;
  maxT: number;
  victimId: "p1" | "cpu";
  zoom: number;
};

export function FightingArena() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [announce, setAnnounce] = useState("Karakter seç");
  const [over, setOver] = useState(false);
  const [p1Char, setP1Char] = useState<CharacterId>("dogukan");
  const [charLocked, setCharLocked] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const p1 = useRef<Fighter>(makeFighter("p1", "dogukan", 90, 1, true));
  const cpu = useRef<Fighter>(makeFighter("cpu", "serkan", STAGE_W - 130, -1, false));
  const projectiles = useRef<Projectile[]>([]);
  const particles = useRef<Particle[]>([]);
  const floatTexts = useRef<FloatText[]>([]);
  const impactRings = useRef<ImpactRing[]>([]);
  const juiceRef = useRef(createGameJuice());
  const scoreRef = useRef(0);
  const roundRef = useRef(1);
  const timerRef = useRef(ROUND_TIME);
  const hitStopRef = useRef(0);
  const announceRef = useRef("ROUND 1 — FIGHT!");
  const announceTRef = useRef(0);
  const roundActiveRef = useRef(false);
  const overRef = useRef(false);
  const charLockedRef = useRef(false);
  const koCinematic = useRef<KoCinematic>({ active: false, t: 0, maxT: 110, victimId: "cpu", zoom: 1 });
  const comboDisplay = useRef(0);
  const comboShow = useRef(0);
  const frame = useRef(0);
  const shakeRef = useRef({ t: 0, amp: 0 });

  const keys = useRef({ left: false, right: false, down: false, up: false, lp: false, hp: false, lk: false, hk: false });
  const downFrames = useRef(0);
  const fireballReady = useRef(false);
  const pendingAtk = useRef<AttackId | null>(null);
  const pendingThrow = useRef(false);

  const spawnFloat = (x: number, y: number, text: string, color = "#fde047", scale = 1) => {
    floatTexts.current.push({ x, y, text, color, life: 55, scale });
  };
  const spawnImpactRing = (x: number, y: number, color: string, maxR = 70, life = 16) => {
    impactRings.current.push({ x, y, color, maxR, life, maxLife: life });
  };

  const triggerShake = (amp: number, duration = 8) => {
    shakeRef.current.amp = Math.max(shakeRef.current.amp, amp);
    shakeRef.current.t = Math.max(shakeRef.current.t, duration);
  };

  const setupFighters = useCallback((playerChar: CharacterId, r: number) => {
    const cpuChar: CharacterId = playerChar === "dogukan" ? "serkan" : "dogukan";
    const hp = 100 + (r - 1) * 8;
    p1.current = makeFighter("p1", playerChar, 90, 1, true);
    cpu.current = makeFighter("cpu", cpuChar, STAGE_W - 130, -1, false);
    p1.current.maxHp = hp;
    p1.current.hp = hp;
    cpu.current.maxHp = Math.floor(hp + 12);
    cpu.current.hp = cpu.current.maxHp;
  }, []);

  const resetRound = useCallback(
    (r: number, playerChar: CharacterId, keepScore = true) => {
      setupFighters(playerChar, r);
      projectiles.current = [];
      floatTexts.current = [];
      impactRings.current = [];
      timerRef.current = ROUND_TIME;
      hitStopRef.current = 0;
      shakeRef.current = { t: 0, amp: 0 };
      koCinematic.current = { active: false, t: 0, maxT: 110, victimId: "cpu", zoom: 1 };
      comboDisplay.current = 0;
      announceRef.current = r === 1 ? "ROUND 1 — FIGHT!" : `ROUND ${r} — FIGHT!`;
      announceTRef.current = 90;
      roundActiveRef.current = false;
      if (!keepScore) {
        scoreRef.current = 0;
        setScore(0);
        roundRef.current = 1;
        setRound(1);
      }
      setAnnounce(announceRef.current);
    },
    [setupFighters],
  );

  const pickChar = useCallback(
    (c: CharacterId) => {
      setP1Char(c);
      charLockedRef.current = true;
      setCharLocked(true);
      resetRound(1, c, false);
    },
    [resetRound],
  );

  const reset = useCallback(() => {
    const logged = getPlayerId();
    const def: CharacterId = logged === "serkan" ? "serkan" : "dogukan";
    setP1Char(def);
    charLockedRef.current = false;
    setCharLocked(false);
    setAnnounce("Karakter seç");
    overRef.current = false;
    setOver(false);
    submitted.current = false;
    scoreGame.resetMilestones();
  }, [scoreGame]);

  useGameBoot(() => {
    const logged = getPlayerId();
    if (logged) pickChar(logged);
  });

  useEffect(() => {
    if (over && !submitted.current) {
      submitted.current = true;
      void scoreGame.submitFinal(score);
    }
  }, [over, score, scoreGame]);

  const spawnFireball = (f: Fighter) => {
    projectiles.current.push({
      x: f.x + f.facing * 50,
      y: f.y - 28,
      vx: f.facing * 5.5 * f.spdMult,
      w: 36,
      h: 22,
      owner: f.id,
      charId: f.charId,
      life: 120,
      trail: [],
    });
  };

  const triggerKoCinematic = (victim: Fighter, winner: Fighter) => {
    victim.state = "ko";
    winner.state = "win";
    koCinematic.current = {
      active: true,
      t: 0,
      maxT: 110,
      victimId: victim.id,
      zoom: 1,
    };
    hitStopRef.current = 8;
    triggerShake(10, 16);
    juiceRef.current.shakeScreen(14);
    juiceRef.current.flashScreen(0.45);
    spawnFloat(STAGE_W / 2, STAGE_H / 2 - 30, "K.O.!", "#ef4444", 2.2);
    spawnImpactRing(victim.x + victim.w / 2, victim.y + victim.h * 0.45, "#ef4444", 120, 24);
    for (let i = 0; i < 5; i++) {
      spawnBurst(particles.current, victim.x + victim.w / 2, victim.y - 20, 22, [
        "#fde047",
        "#f97316",
        "#ef4444",
        "#fff",
      ]);
    }
    sounds.gameOver();
  };

  const applyHit = (atk: AttackId, attacker: Fighter, defender: Fighter, blocked: boolean) => {
    const a = ATTACKS[atk];
    if (blocked) {
      defender.hitstun = a.blockstun;
      defender.state = "block";
      defender.vx = -attacker.facing * 2.5;
      sounds.wrong();
      juiceRef.current.burst(defender.x + defender.w / 2, defender.y - 30, "#94a3b8", 8);
      spawnFloat(defender.x, defender.y - 50, "BLOCK", "#94a3b8");
      comboDisplay.current = 0;
    } else {
      const dmg = Math.floor(a.damage * attacker.dmgMult * (1 + roundRef.current * 0.02));
      defender.hp = Math.max(0, defender.hp - dmg);
      defender.hitstun = a.hitstun;
      defender.state = "hitstun";
      defender.vx = attacker.facing * a.knockback;
      defender.vy = atk === "hk" ? -4 : -2;
      attacker.comboCount++;
      comboDisplay.current++;
      comboShow.current = 40;
      hitStopRef.current = atk === "hk" || atk === "throw" ? 7 : atk === "hp" ? 5 : 3;
      triggerShake(atk === "hk" ? 7.5 : atk === "hp" ? 5.5 : 3.5, atk === "hk" ? 10 : 7);
      juiceRef.current.shakeScreen(atk === "hk" ? 12 : atk === "throw" ? 10 : 6);
      juiceRef.current.popScore(defender.x, defender.y - 40, `${dmg}!`);
      spawnBurst(particles.current, defender.x + defender.w / 2, defender.y - 36, 16, [
        attacker.accent,
        "#fde047",
        "#fff",
      ]);
      spawnImpactRing(
        defender.x + defender.w / 2,
        defender.y + defender.h * 0.42,
        atk === "hk" ? "#f97316" : atk === "hp" ? "#ef4444" : "#fde047",
        atk === "hk" ? 110 : atk === "hp" ? 88 : 68,
        atk === "hk" ? 20 : 14,
      );
      if (comboDisplay.current >= 3) {
        spawnFloat(STAGE_W / 2, 80, `${comboDisplay.current} HİT COMBO!`, "#f472b6", 1.3);
        juiceRef.current.flashScreen(0.15);
      }
      sounds.pop();
    }
    if (defender.hp <= 0 && !koCinematic.current.active) {
      triggerKoCinematic(defender, attacker);
    }
  };

  const applyThrow = (attacker: Fighter, defender: Fighter) => {
    const dmg = Math.floor(24 * attacker.dmgMult);
    defender.hp = Math.max(0, defender.hp - dmg);
    defender.vx = attacker.facing * 9;
    defender.vy = -5;
    defender.state = "hitstun";
    defender.hitstun = 28;
    attacker.comboCount++;
    hitStopRef.current = 10;
    triggerShake(8.5, 12);
    juiceRef.current.shakeScreen(12);
    juiceRef.current.flashScreen(0.3);
    spawnFloat(defender.x, defender.y - 55, "THROW!", "#a78bfa", 1.4);
    spawnFloat(defender.x, defender.y - 30, `-${dmg}`, "#f97316");
    spawnBurst(particles.current, defender.x + defender.w / 2, defender.y - 30, 20, [
      "#a78bfa",
      "#fde047",
      "#fff",
    ]);
    spawnImpactRing(defender.x + defender.w / 2, defender.y + defender.h * 0.46, "#a78bfa", 95, 18);
    sounds.success();
    attacker.state = "idle";
    attacker.attack = null;
    attacker.throwPartner = null;
    defender.throwPartner = null;
    if (defender.hp <= 0 && !koCinematic.current.active) {
      triggerKoCinematic(defender, attacker);
    }
  };

  const tryAttack = useCallback((f: Fighter, atk: AttackId) => {
    if (!startAttack(f, atk)) return;
    sounds.shoot();
  }, []);

  const tryThrow = useCallback((f: Fighter, other: Fighter) => {
    if (!f.onGround || other.state === "ko") return;
    if (distFighters(f, other) > THROW_RANGE) return;
    if (startThrow(f, other)) {
      sounds.spring();
      spawnFloat(f.x, f.y - 60, "YAKALADI!", "#c4b5fd");
    }
  }, []);

  const updateThrow = (attacker: Fighter, defender: Fighter) => {
    attacker.stateT++;
    const t = attacker.stateT;
    const midX = attacker.x + attacker.facing * 28;
    defender.x += (midX - defender.x) * 0.35;
    defender.y += (attacker.y - 8 - defender.y) * 0.25;
    if (t === 8) {
      juiceRef.current.burst(midX, defender.y - 20, "#a78bfa", 12);
    }
    if (t >= 14 && !attacker.landedHit) {
      attacker.landedHit = true;
      applyThrow(attacker, defender);
    }
    if (t >= 38) {
      attacker.state = "idle";
      attacker.attack = null;
      attacker.throwPartner = null;
    }
  };

  const updateFighter = (f: Fighter, other: Fighter, isCpu: boolean) => {
    if (f.state === "ko" || f.state === "win") return;
    if (koCinematic.current.active) return;

    if (f.state === "throwing" && f.throwPartner) {
      const partner = f.id === "p1" ? cpu.current : p1.current;
      updateThrow(f, partner);
      return;
    }
    if (f.state === "thrown") return;

    if (f.hitstun > 0) {
      f.hitstun--;
      f.state = f.hitstun > 0 ? "hitstun" : "idle";
    }

    if (f.state === "attack" && f.attack) {
      const a = ATTACKS[f.attack];
      f.stateT++;
      if (f.attackPhase === "startup" && f.stateT >= a.startup) {
        f.attackPhase = "active";
        f.stateT = 0;
        if (f.attack === "fireball") spawnFireball(f);
      } else if (f.attackPhase === "active" && f.stateT >= a.active) {
        f.attackPhase = "recovery";
        f.stateT = 0;
      } else if (f.attackPhase === "recovery" && f.stateT >= a.recovery) {
        f.state = "idle";
        f.attack = null;
        f.attackPhase = null;
        f.stateT = 0;
      }
      return;
    }

    if (!isCpu) {
      const k = keys.current;
      const awayFrom = (other.x > f.x && k.left) || (other.x < f.x && k.right);
      f.blockHeld = awayFrom;
      if (f.blockHeld && f.onGround) {
        f.state = "block";
        f.vx = 0;
        return;
      }

      if (k.down && f.onGround) {
        f.state = "crouch";
        f.vx = 0;
        downFrames.current++;
        if (downFrames.current > 8) fireballReady.current = true;
      } else {
        downFrames.current = 0;
        if (fireballReady.current && (k.lp || k.hp)) {
          fireballReady.current = false;
          tryAttack(f, "fireball");
          return;
        }
        fireballReady.current = false;
      }

      if (k.up && f.onGround && f.state !== "crouch") {
        f.vy = JUMP_V;
        f.onGround = false;
        f.state = "jump";
        sounds.jump();
        juiceRef.current.burst(f.x + f.w / 2, f.y + f.h, "#fff", 5, 2);
      }

      if (f.onGround && f.state !== "crouch") {
        const spd = WALK_SPD * f.spdMult;
        if (k.left) {
          f.vx = -spd;
          f.facing = -1;
          f.state = "walk";
        } else if (k.right) {
          f.vx = spd;
          f.facing = 1;
          f.state = "walk";
        } else {
          f.vx *= 0.6;
          f.state = "idle";
        }
      }

      if (pendingThrow.current) {
        tryThrow(f, other);
        pendingThrow.current = false;
      }
      if (pendingAtk.current) {
        tryAttack(f, pendingAtk.current);
        pendingAtk.current = null;
      }
    }

    if (f.state === "idle" || f.state === "walk") {
      f.facing = other.x + other.w / 2 > f.x + f.w / 2 ? 1 : -1;
    }

    const wasOnGround = f.onGround;
    const preLandVy = f.vy;
    f.vy += GRAVITY;
    f.x += f.vx;
    f.y += f.vy;

    if (f.y + f.h >= FLOOR_Y) {
      f.y = FLOOR_Y - f.h;
      f.vy = 0;
      f.onGround = true;
      if (!wasOnGround && preLandVy > 2.2) {
        const landX = f.x + f.w / 2;
        const heavy = preLandVy > 5.2;
        spawnBurst(particles.current, landX, FLOOR_Y - 2, heavy ? 16 : 10, ["#d6d3d1", "#a8a29e", "#fff"]);
        spawnImpactRing(landX, FLOOR_Y - 4, "rgba(245,245,244,0.9)", heavy ? 80 : 52, heavy ? 14 : 10);
        if (heavy) triggerShake(3.8, 7);
      }
    } else {
      f.onGround = false;
      if (f.state !== "attack" && f.state !== "hitstun") f.state = "jump";
    }

    f.x = Math.max(16, Math.min(STAGE_W - f.w - 16, f.x));
    if (!f.onGround) f.vx *= 0.98;
    else f.vx *= 0.75;

    const hb = getHitbox(f);
    if (hb && !f.landedHit && f.attack !== "throw") {
      const dh = hurtbox(other);
      if (overlap(hb, dh)) {
        applyHit(f.attack!, f, other, isBlocking(other, f));
        f.landedHit = true;
        f.attackPhase = "recovery";
        f.stateT = 0;
      }
    }
  };

  const cpuAI = (f: Fighter, other: Fighter) => {
    if (f.state === "ko" || f.state === "win" || f.hitstun > 0 || koCinematic.current.active) return;
    if (f.state === "attack" || f.state === "throwing") return;

    const dist = distFighters(f, other);
    const aggro = 0.38 + roundRef.current * 0.1;

    if (dist < THROW_RANGE && f.onGround && other.onGround && Math.random() < 0.035 * aggro) {
      tryThrow(f, other);
      return;
    }

    if (dist < 55 && Math.random() < 0.045 * aggro) {
      const picks: AttackId[] = ["lp", "lk", "hp", "hk"];
      startAttack(f, picks[Math.floor(Math.random() * picks.length)]!);
      return;
    }

    if (dist > 120 && Math.random() < 0.025) {
      startAttack(f, "fireball");
      return;
    }

    if (other.state === "attack" && dist < 85 && Math.random() < 0.18) {
      f.blockHeld = true;
      f.state = "block";
      return;
    }

    const distSigned = other.x - f.x;
    if (dist > 70) {
      f.vx = distSigned > 0 ? WALK_SPD * 0.88 * f.spdMult : -WALK_SPD * 0.88 * f.spdMult;
      f.facing = distSigned > 0 ? 1 : -1;
      f.state = "walk";
    } else if (Math.random() < 0.025) {
      f.vy = JUMP_V;
      f.onGround = false;
    } else {
      f.vx = 0;
      f.state = "idle";
    }
  };

  const finishRound = () => {
    if (cpu.current.state === "ko") {
      const perfect = p1.current.hp >= p1.current.maxHp;
      scoreRef.current += 100 + roundRef.current * 50 + (perfect ? 80 : 0);
      setScore(scoreRef.current);
      void scoreGame.checkMilestone(scoreRef.current);
      sounds.win();
      if (perfect) spawnFloat(STAGE_W / 2, STAGE_H / 2, "PERFECT!", "#fde047", 1.5);
      if (roundRef.current >= 3) {
        overRef.current = true;
        setOver(true);
        announceRef.current = "KAZANDIN!";
      } else {
        roundRef.current++;
        setRound(roundRef.current);
        resetRound(roundRef.current, p1Char, true);
      }
    } else {
      overRef.current = true;
      setOver(true);
      announceRef.current = "KAYBETTİN";
    }
    koCinematic.current.active = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!running || !canvas || !charLocked) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const onKey = (e: KeyboardEvent, down: boolean) => {
      const m = keys.current;
      if (e.code === "ArrowLeft" || e.code === "KeyA") m.left = down;
      if (e.code === "ArrowRight" || e.code === "KeyD") m.right = down;
      if (e.code === "ArrowDown" || e.code === "KeyS") m.down = down;
      if (e.code === "ArrowUp" || e.code === "KeyW") m.up = down;
      if (e.code === KEY_LP) m.lp = down;
      if (e.code === KEY_HP) m.hp = down;
      if (e.code === KEY_LK) m.lk = down;
      if (e.code === KEY_HK) m.hk = down;
      if (down && !e.repeat && roundActiveRef.current && !overRef.current && !koCinematic.current.active) {
        if (e.code === KEY_THROW || (e.code === KEY_HP && m.down)) {
          pendingThrow.current = true;
        } else if (fireballReady.current && e.code === KEY_LP) {
          pendingAtk.current = "fireball";
          fireballReady.current = false;
        } else if (e.code === KEY_LP) pendingAtk.current = "lp";
        else if (e.code === KEY_HP) pendingAtk.current = "hp";
        else if (e.code === KEY_LK) pendingAtk.current = "lk";
        else if (e.code === KEY_HK) pendingAtk.current = "hk";
      }
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    let raf = 0;
    let acc = 0;
    let last = performance.now();

    const loop = (now: number) => {
      if (!running) return;
      acc += now - last;
      last = now;
      const slow = koCinematic.current.active;
      const stepMs = (1000 / FPS) * (slow ? 0.28 : 1);

      while (acc >= stepMs) {
        acc -= stepMs;
        if (hitStopRef.current > 0) {
          hitStopRef.current--;
        } else if (!overRef.current) {
          frame.current++;
          if (slow) {
            koCinematic.current.t++;
            koCinematic.current.zoom = 1 + koCinematic.current.t * 0.004;
            if (koCinematic.current.t >= koCinematic.current.maxT) {
              finishRound();
            }
          } else if (announceTRef.current > 0) {
            announceTRef.current--;
            if (announceTRef.current === 0) roundActiveRef.current = true;
          } else {
            timerRef.current = Math.max(0, timerRef.current - 1 / FPS);
            updateFighter(p1.current, cpu.current, false);
            cpuAI(cpu.current, p1.current);
            updateFighter(cpu.current, p1.current, true);

            for (const pr of projectiles.current) {
              pr.x += pr.vx;
              pr.life--;
              pr.trail.push({ x: pr.x, y: pr.y });
              if (pr.trail.length > 8) pr.trail.shift();
              const target = pr.owner === "p1" ? cpu.current : p1.current;
              if (overlap({ x: pr.x, y: pr.y, w: pr.w, h: pr.h }, hurtbox(target))) {
                applyHit(
                  "fireball",
                  pr.owner === "p1" ? p1.current : cpu.current,
                  target,
                  isBlocking(target, pr.owner === "p1" ? p1.current : cpu.current),
                );
                pr.life = 0;
              }
            }
            projectiles.current = projectiles.current.filter(
              (p) => p.life > 0 && p.x > -40 && p.x < STAGE_W + 40,
            );

            if (comboShow.current > 0) comboShow.current--;

            if (cpu.current.state === "ko" && !koCinematic.current.active) {
              triggerKoCinematic(cpu.current, p1.current);
            } else if (p1.current.state === "ko" && !koCinematic.current.active) {
              triggerKoCinematic(p1.current, cpu.current);
            } else if (p1.current.state === "ko" || timerRef.current <= 0) {
              if (timerRef.current <= 0 && p1.current.state !== "ko") {
                cpu.current.state = "win";
                p1.current.state = "ko";
                triggerKoCinematic(p1.current, cpu.current);
              }
            }
          }
        }
      }

      const fx = juiceRef.current;
      updateParticles(particles.current);
      for (let i = floatTexts.current.length - 1; i >= 0; i--) {
        const ft = floatTexts.current[i];
        ft.life--;
        ft.y -= 0.6;
        if (ft.life <= 0) floatTexts.current.splice(i, 1);
      }
      for (let i = impactRings.current.length - 1; i >= 0; i--) {
        const ring = impactRings.current[i];
        ring.life--;
        if (ring.life <= 0) impactRings.current.splice(i, 1);
      }

      const slowMo = koCinematic.current.active;
      const victim = koCinematic.current.victimId === "p1" ? p1.current : cpu.current;
      const zoom = slowMo ? koCinematic.current.zoom : 1;
      if (shakeRef.current.t > 0) {
        shakeRef.current.t--;
        shakeRef.current.amp *= 0.88;
      } else {
        shakeRef.current.amp = 0;
      }

      ctx.save();
      if (shakeRef.current.amp > 0.2) {
        const sx = (Math.random() * 2 - 1) * shakeRef.current.amp;
        const sy = (Math.random() * 2 - 1) * shakeRef.current.amp * 0.7;
        ctx.translate(sx, sy);
      }
      if (slowMo) {
        const zx = victim.x + victim.w / 2;
        const zy = victim.y + victim.h / 2;
        ctx.translate(STAGE_W / 2, STAGE_H / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-zx, -zy);
      }

      const bg = ctx.createLinearGradient(0, 0, 0, STAGE_H);
      bg.addColorStop(0, slowMo ? "#450a0a" : "#1e1b4b");
      bg.addColorStop(0.5, slowMo ? "#7f1d1d" : "#312e81");
      bg.addColorStop(1, slowMo ? "#1c1917" : "#4c1d95");
      ctx.fillStyle = bg;
      ctx.fillRect(slowMo ? -80 : 0, slowMo ? -80 : 0, STAGE_W + 160, STAGE_H + 160);

      if (slowMo) {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(-80, -80, STAGE_W + 160, STAGE_H + 160);
      }

      const crowdBob = Math.sin(frame.current * 0.04) * 3;
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(20 + i * 58, 120 + (i % 2) * 30 + crowdBob, 40, STAGE_H);
      }
      for (let i = 0; i < 4; i++) {
        const beamX = ((frame.current * (0.8 + i * 0.22) + i * 110) % (STAGE_W + 140)) - 70;
        const beamAlpha = 0.06 + i * 0.015;
        ctx.fillStyle = `rgba(255,255,255,${beamAlpha})`;
        ctx.beginPath();
        ctx.moveTo(beamX, 40);
        ctx.lineTo(beamX + 56, 40);
        ctx.lineTo(beamX + 142, FLOOR_Y - 10);
        ctx.lineTo(beamX - 84, FLOOR_Y - 10);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = "#57534e";
      ctx.fillRect(0, FLOOR_Y, STAGE_W, STAGE_H - FLOOR_Y);
      ctx.fillStyle = "#78716c";
      ctx.fillRect(0, FLOOR_Y, STAGE_W, 8);

      const drawAttackVfx = (f: Fighter) => {
        if (f.state !== "attack" || !f.attack) return;
        const ph = f.attackPhase;
        const t = f.stateT;

        if (f.attack === "fireball") {
          const a = ATTACKS.fireball;
          const charge =
            ph === "startup" ? Math.min(1, t / Math.max(1, a.startup)) : ph === "active" ? 1 : 0.45;
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          const warm = f.charId === "dogukan";
          const c1 = warm ? "rgba(251,146,60," : "rgba(56,189,248,";
          const c2 = warm ? "rgba(234,88,12," : "rgba(14,165,233,";
          const r = 10 + charge * 26;
          ctx.fillStyle = `${c1}${0.35 + charge * 0.35})`;
          ctx.shadowColor = warm ? "#f97316" : "#0ea5e9";
          ctx.shadowBlur = 18 + charge * 12;
          ctx.beginPath();
          ctx.arc(14, -32, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = `${c2}${0.5 + charge * 0.25})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(14, -32, r + 6, 0, Math.PI * 2);
          ctx.stroke();
          for (let i = 0; i < 6; i++) {
            const ang = (frame.current * 0.12 + i / 6) * Math.PI * 2;
            ctx.globalAlpha = 0.35 * charge;
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(14 + Math.cos(ang) * (r * 0.4), -32 + Math.sin(ang) * (r * 0.4));
            ctx.lineTo(14 + Math.cos(ang) * (r + 18), -32 + Math.sin(ang) * (r + 18));
            ctx.stroke();
          }
          ctx.restore();
          return;
        }

        const atk = f.attack;
        const pulse =
          ph === "active" ? 0.85 + Math.sin(frame.current * 0.8) * 0.15 : ph === "startup" ? 0.35 + t * 0.04 : 0.4;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        if (atk === "lp" || atk === "hp") {
          ctx.strokeStyle =
            atk === "hp" ? `rgba(248,113,113,${pulse})` : `rgba(253,224,71,${pulse})`;
          ctx.lineWidth = atk === "hp" ? 7 : 4;
          ctx.shadowColor = atk === "hp" ? "#ef4444" : "#fbbf24";
          ctx.shadowBlur = atk === "hp" ? 18 : 10;
          ctx.beginPath();
          ctx.arc(8, -36, atk === "hp" ? 56 : 38, -0.45, 1.15);
          ctx.stroke();
          ctx.shadowBlur = 0;
          for (let i = 0; i < 5; i++) {
            ctx.globalAlpha = 0.25 * pulse;
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(22 + i * 6, -22 - i * 5);
            ctx.lineTo(44 + i * 10, -48 - i * 3);
            ctx.stroke();
          }
        } else if (atk === "lk") {
          ctx.strokeStyle = `rgba(52,211,153,${pulse})`;
          ctx.lineWidth = 5;
          ctx.shadowColor = "#22c55e";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(-6, -6);
          ctx.quadraticCurveTo(38, 12, 54, -12);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (atk === "hk") {
          ctx.strokeStyle = `rgba(251,191,36,${pulse})`;
          ctx.lineWidth = 9;
          ctx.shadowColor = "#ea580c";
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(-4, -26, 64, -0.15 * Math.PI, 1.2 * Math.PI);
          ctx.stroke();
          ctx.fillStyle = `rgba(239,68,68,${pulse * 0.45})`;
          ctx.beginPath();
          ctx.arc(52, -32, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.restore();
      };

      const drawThrowVfx = (f: Fighter) => {
        if (f.state !== "throwing") return;
        ctx.save();
        ctx.strokeStyle = "rgba(167,139,250,0.9)";
        ctx.lineWidth = 4;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(0, -32, 48, 0, Math.PI * 1.6);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      };

      const drawFighter = (f: Fighter) => {
        const flash = f.state === "hitstun" && frame.current % 4 < 2;
        if (flash) ctx.globalAlpha = 0.55;
        ctx.save();
        ctx.translate(f.x + f.w / 2, f.y + f.h);
        ctx.scale(f.facing, 1);
        let scale = 1;
        if (f.state === "crouch") scale = 0.85;
        if (f.state === "attack") scale = 1.1;
        if (f.state === "throwing" || f.state === "thrown") scale = 1.05;
        if (slowMo && f.id === koCinematic.current.victimId) scale *= 1.15;
        ctx.scale(scale, scale);
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath();
        ctx.ellipse(0, -2, 24, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        drawAttackVfx(f);
        drawThrowVfx(f);
        ctx.font = f.state === "crouch" ? "32px serif" : "40px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        let em = f.emoji;
        if (f.state === "attack" && f.attack) {
          if (f.attack === "fireball") em = f.charId === "dogukan" ? "🔥" : "⚡";
          else if (f.attack === "lp") em = "👊";
          else if (f.attack === "hp") em = "💪";
          else if (f.attack === "lk") em = "🦵";
          else if (f.attack === "hk") em = "🌀";
        }
        if (f.state === "block") em = "🛡️";
        if (f.state === "ko") em = "😵";
        if (f.state === "throwing") em = f.throwEmoji;
        if (f.state === "thrown") em = "🌀";
        if (f.state === "win") em = "🏆";
        ctx.fillText(em, 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
      };

      drawFighter(p1.current);
      drawFighter(cpu.current);

      for (const pr of projectiles.current) {
        ctx.globalAlpha = 0.35;
        for (const tr of pr.trail) {
          ctx.font = "16px serif";
          ctx.fillText(pr.charId === "dogukan" ? "🔥" : "⚡", tr.x, tr.y + pr.h);
        }
        ctx.globalAlpha = 1;
        ctx.font = "24px serif";
        ctx.fillText(pr.charId === "dogukan" ? CHARS.dogukan.fireEmoji : CHARS.serkan.fireEmoji, pr.x, pr.y + pr.h);
      }
      for (const ring of impactRings.current) {
        const t = 1 - ring.life / ring.maxLife;
        const r = 18 + ring.maxR * t;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = Math.max(0, 1 - t) * 0.65;
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 6 * (1 - t) + 1.2;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = Math.max(0, 1 - t) * 0.24;
        ctx.fillStyle = ring.color;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, r * 0.56, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (hitStopRef.current > 0) {
        const cx = (p1.current.x + p1.current.w / 2 + cpu.current.x + cpu.current.w / 2) / 2;
        const cy = (p1.current.y + p1.current.h * 0.38 + cpu.current.y + cpu.current.h * 0.38) / 2;
        const hs = hitStopRef.current;
        const k = Math.min(1, hs / 10);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const rad = 36 + (10 - hs) * 10;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, `rgba(255,255,255,${0.45 * k})`);
        g.addColorStop(0.35, `rgba(253,224,71,${0.35 * k})`);
        g.addColorStop(0.65, `rgba(248,113,113,${0.2 * k})`);
        g.addColorStop(1, "rgba(239,68,68,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${0.35 * k})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * Math.PI * 2 + frame.current * 0.05;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * 14, cy + Math.sin(ang) * 14);
          ctx.lineTo(cx + Math.cos(ang) * rad * 0.92, cy + Math.sin(ang) * rad * 0.92);
          ctx.stroke();
        }
        ctx.restore();
        if (!slowMo) {
          const split = 1 + hitStopRef.current * 0.25;
          ctx.globalCompositeOperation = "screen";
          ctx.globalAlpha = 0.09;
          ctx.drawImage(canvas, split, 0, STAGE_W - split, STAGE_H, 0, 0, STAGE_W - split, STAGE_H);
          ctx.globalAlpha = 0.09;
          ctx.drawImage(canvas, 0, 0, STAGE_W - split, STAGE_H, split, 0, STAGE_W - split, STAGE_H);
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();

      fx.update();
      fx.draw(ctx, STAGE_W, STAGE_H);

      for (const ft of floatTexts.current) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, ft.life / 40);
        ctx.fillStyle = ft.color;
        ctx.font = `bold ${18 * ft.scale}px var(--font-nunito), sans-serif`;
        ctx.textAlign = "center";
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      if (comboShow.current > 0 && comboDisplay.current >= 2) {
        ctx.fillStyle = "#f472b6";
        ctx.font = "bold 16px var(--font-nunito), sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${comboDisplay.current}x COMBO`, STAGE_W / 2, 72);
      }

      const barW = 130;
      const drawHp = (f: Fighter, x: number, align: "left" | "right") => {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(x, 14, barW, 14);
        const pct = f.hp / f.maxHp;
        ctx.fillStyle = pct < 0.25 ? "#ef4444" : f.accent;
        const w = barW * pct;
        if (align === "right") ctx.fillRect(x + barW - w, 14, w, 14);
        else ctx.fillRect(x, 14, w, 14);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px var(--font-nunito), sans-serif";
        ctx.textAlign = align;
        ctx.fillText(`${f.emoji} ${f.name}`, x + (align === "left" ? 0 : barW), 10);
      };
      drawHp(p1.current, 12, "left");
      drawHp(cpu.current, STAGE_W - barW - 12, "right");

      if (p1.current.hp / p1.current.maxHp < 0.3) {
        const v = ctx.createRadialGradient(STAGE_W / 2, STAGE_H / 2, 80, STAGE_W / 2, STAGE_H / 2, STAGE_W / 1.1);
        v.addColorStop(0, "transparent");
        v.addColorStop(1, "rgba(220,38,38,0.25)");
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, STAGE_W, STAGE_H);
      }

      ctx.fillStyle = "#fde047";
      ctx.font = "bold 20px var(--font-nunito), sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(Math.ceil(timerRef.current)), STAGE_W / 2, 28);

      if (announceTRef.current > 0) {
        const p = announceTRef.current / 90;
        const intro = 1 - p;
        const scale = 0.9 + Math.min(1, intro * 2.8) * 0.2;
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, STAGE_H / 2 - 50, STAGE_W, 100);
        ctx.save();
        ctx.translate(STAGE_W / 2, STAGE_H / 2 + 8);
        ctx.scale(scale, scale);
        ctx.globalAlpha = 0.75 + Math.min(1, intro * 2) * 0.25;
        ctx.fillStyle = "#fde047";
        ctx.strokeStyle = "rgba(0,0,0,0.45)";
        ctx.lineWidth = 4;
        ctx.font = `bold ${24 + Math.round((1 - Math.min(1, intro * 2)) * 10)}px var(--font-nunito), sans-serif`;
        ctx.strokeText(announceRef.current, 0, 0);
        ctx.fillText(announceRef.current, 0, 0);
        ctx.restore();
      }

      if (slowMo) {
        const pulse = 1 + Math.sin(frame.current * 0.2) * 0.08;
        ctx.save();
        ctx.translate(STAGE_W / 2, STAGE_H / 2 - 20);
        ctx.scale(pulse * 1.8, pulse * 1.8);
        ctx.fillStyle = "#ef4444";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 4;
        ctx.font = "bold 42px var(--font-nunito), sans-serif";
        ctx.textAlign = "center";
        ctx.strokeText("K.O.", 0, 0);
        ctx.fillText("K.O.", 0, 0);
        ctx.restore();
      }

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "10px var(--font-nunito), sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Z/X/C/V saldır · B yakalama · ↓+Z ateş", STAGE_W / 2, STAGE_H - 8);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [running, charLocked, p1Char, resetRound, scoreGame, tryAttack, tryThrow]);

  return (
    <div className="game-panel canvas-game fighting-game">
      <ScoreHud
        score={score}
        selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
        playerName={scoreGame.playerName}
      />
      <p className="round-label">
        Dövüş Arenası · Doğukan vs Serkan · 3 raunt arcade
      </p>
      {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca dövüş başlar</p>}

      {!charLocked && (
        <div className="fight-char-select">
          <p>Kimi oynayacaksın?</p>
          <div className="fight-char-btns">
            <button type="button" className="btn-primary fight-char-btn" onClick={() => pickChar("dogukan")}>
              🥋 Doğukan
            </button>
            <button type="button" className="btn-primary fight-char-btn fight-char-serkan" onClick={() => pickChar("serkan")}>
              🦸 Serkan
            </button>
          </div>
        </div>
      )}

      {charLocked && <p className="round-label">Raunt {round} · {announce}</p>}

      <canvas
        ref={canvasRef}
        width={STAGE_W}
        height={STAGE_H}
        className="game-canvas touch-canvas fighting-canvas"
      />
      {charLocked && <GameTouchBar gameId="dovus-arenasi" />}
      {over && (
        <div className="game-over">
          <p>🥋 {announceRef.current} Skor: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
