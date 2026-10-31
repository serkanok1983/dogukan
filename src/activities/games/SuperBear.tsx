"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { matchGameKey } from "@/lib/gameKeys";
import {
  drawParticles,
  spawnBurst,
  updateParticles,
  type Particle,
} from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameBoot, useRegisterRestart } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { useCanvasFit } from "@/hooks/useCanvasFit";
import { decay, lerpFactor, useGameLoop } from "@/hooks/useGameLoop";
import { useActivityStats } from "@/hooks/useProgress";
import { sounds } from "@/lib/sounds";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { GameTouchBar } from "@/components/GameTouchBar";
import { GROUND_Y, VIEW_H } from "./superBearConstants";
import {
  DEFAULT_EASE,
  MAX_LEVELS,
  VIEW_W,
  buildProceduralLevel,
  type Enemy,
  type Pickup,
  type Plat,
} from "./superBearLevelGen";
import { canvasFont } from "@/lib/canvasFont";

// Kare başına (60 Hz) sabitler; döngü `dt` ile ölçekler.
const GRAVITY = 0.55;
const JUMP = -12.5;
const JUMP2 = -10;
const MOVE = 4.8;
const PLAYER_W = 34;
const PLAYER_H = 38;
const ATTACK_FRAMES = 14;
const INTER_LEVEL_FRAMES = 85;
const VICTORY_FRAMES = 140;

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/** Düşmanları devriye aralığında yürütür (simülasyon durumu ref'lerde, yerinde güncellenir). */
function patrolEnemies(list: Enemy[], dt: number) {
  for (const e of list) {
    e.x += e.vx * dt;
    if (e.x < e.minX || e.x > e.maxX) e.vx *= -1;
  }
}

function takePickup(p: Pickup) {
  p.taken = true;
}

const GAME_SLUG = "super-ayi";

export function SuperBear() {
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [campaignDone, setCampaignDone] = useState(false);
  const [over, setOver] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);
  const ease = useActivityStats(GAME_SLUG)?.ease ?? DEFAULT_EASE;
  const submitted = useRef(false);

  const px = useRef(80);
  const py = useRef(GROUND_Y - PLAYER_H);
  const vx = useRef(0);
  const vy = useRef(0);
  const facing = useRef(1);
  const grounded = useRef(true);
  const jumpsLeft = useRef(2);
  const camX = useRef(0);
  const plats = useRef<Plat[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const pickups = useRef<Pickup[]>([]);
  const goalX = useRef(2000);
  const levelW = useRef(3200);
  const particles = useRef<Particle[]>([]);
  const juiceRef = useRef(createGameJuice());
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const overRef = useRef(false);
  const campaignDoneRef = useRef(false);
  const levelRef = useRef(1);
  const interLevelRef = useRef(0);
  const victoryAnimRef = useRef(0);
  const invUntil = useRef(0);
  const attackT = useRef(0);
  const leftHeld = useRef(false);
  const rightHeld = useRef(false);
  const frame = useRef(0);
  const parallax = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      x: i * 180,
      y: 40 + (i % 4) * 35,
      s: 0.6 + (i % 3) * 0.2,
      layer: i % 3,
    })),
  );

  const goalConsumed = useRef(false);

  useCanvasFit(canvasRef, VIEW_W, VIEW_H, { hudRef, minWidth: 300, dpr: "auto" });

  const applyLevelData = useCallback(
    (lev: number) => {
      const data = buildProceduralLevel(lev, ease);
      plats.current = data.plats;
      enemies.current = data.enemies.map((e) => ({ ...e }));
      pickups.current = data.pickups.map((p) => ({ ...p }));
      goalX.current = data.goalX;
      levelW.current = data.levelW;
      px.current = 80;
      py.current = GROUND_Y - PLAYER_H;
      vx.current = 0;
      vy.current = 0;
      facing.current = 1;
      grounded.current = true;
      jumpsLeft.current = 2;
      camX.current = 0;
      particles.current = [];
      invUntil.current = 0;
      attackT.current = 0;
      frame.current = 0;
      goalConsumed.current = false;
    },
    [ease],
  );

  const reset = useCallback(() => {
    levelRef.current = 1;
    setLevel(1);
    applyLevelData(1);
    scoreRef.current = 0;
    livesRef.current = 3;
    overRef.current = false;
    campaignDoneRef.current = false;
    setCampaignDone(false);
    interLevelRef.current = 0;
    victoryAnimRef.current = 0;
    leftHeld.current = false;
    rightHeld.current = false;
    setScore(0);
    setOver(false);
    submitted.current = false;
    scoreGame.resetMilestones();
  }, [applyLevelData, scoreGame]);

  useGameBoot(reset);
  useRegisterRestart(reset);

  useEffect(() => {
    if ((over || campaignDone) && !submitted.current) {
      submitted.current = true;
      void scoreGame.submitFinal(score, { level });
    }
  }, [over, campaignDone, score, level, scoreGame]);

  const jump = useCallback(() => {
    if (!running || overRef.current || campaignDoneRef.current) return;
    if (interLevelRef.current > 0) return;
    if (jumpsLeft.current > 0) {
      vy.current = jumpsLeft.current === 2 ? JUMP : JUMP2;
      grounded.current = false;
      jumpsLeft.current--;
      sounds.jump();
      juiceRef.current.burst(px.current, py.current + PLAYER_H, "#fde047", 8, 3);
    }
  }, [running]);

  const punch = useCallback(() => {
    if (
      !running ||
      overRef.current ||
      campaignDoneRef.current ||
      interLevelRef.current > 0
    )
      return;
    if (attackT.current > 0) return;
    attackT.current = ATTACK_FRAMES;
    sounds.shoot();
  }, [running]);

  useEffect(() => {
    if (!running || over || campaignDone) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (matchGameKey(e, "ArrowLeft") || e.key === "a") leftHeld.current = true;
      if (matchGameKey(e, "ArrowRight") || e.key === "d") rightHeld.current = true;
      if (matchGameKey(e, "ArrowUp") || matchGameKey(e, "Space") || e.key === "w") {
        e.preventDefault();
        if (!e.repeat) jump();
      }
      if (matchGameKey(e, "Shift") || e.key === "z" || e.key === "x") {
        e.preventDefault();
        punch();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (matchGameKey(e, "ArrowLeft") || e.key === "a") leftHeld.current = false;
      if (matchGameKey(e, "ArrowRight") || e.key === "d") rightHeld.current = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      // Duraklatılınca keyup kaybolabilir; ayı kendi kendine yürümesin.
      leftHeld.current = false;
      rightHeld.current = false;
    };
  }, [running, over, campaignDone, jump, punch]);

  const loseLife = () => {
    const fx = juiceRef.current;
    livesRef.current--;
    invUntil.current = frame.current + 90;
    sounds.wrong();
    if (livesRef.current <= 0) {
      overRef.current = true;
      setOver(true);
      sounds.gameOver();
      fx.haptic("fail");
    } else {
      fx.haptic("hit");
    }
  };

  const step = (dt: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || overRef.current || campaignDoneRef.current) return;
    const fx = juiceRef.current;
    frame.current += dt;

    if (victoryAnimRef.current > 0) {
      victoryAnimRef.current = Math.max(0, victoryAnimRef.current - dt);
      if (victoryAnimRef.current === 0) {
        campaignDoneRef.current = true;
        setCampaignDone(true);
      }
    }

    if (interLevelRef.current > 0) {
      interLevelRef.current = Math.max(0, interLevelRef.current - dt);
      if (interLevelRef.current === 0) {
        levelRef.current += 1;
        setLevel(levelRef.current);
        applyLevelData(levelRef.current);
      }
    } else {
      if (leftHeld.current) {
        vx.current = -MOVE;
        facing.current = -1;
      } else if (rightHeld.current) {
        vx.current = MOVE;
        facing.current = 1;
      } else {
        vx.current *= decay(0.72, dt);
      }

      if (attackT.current > 0) attackT.current = Math.max(0, attackT.current - dt);

      const prevVy = vy.current;
      vy.current += GRAVITY * dt;
      px.current += vx.current * dt;
      py.current += vy.current * dt;

      grounded.current = false;
      for (const p of plats.current) {
        const feet = py.current + PLAYER_H;
        const wasAbove = feet - vy.current * dt <= p.y + 4;
        if (
          wasAbove &&
          feet >= p.y &&
          feet <= p.y + p.h + 8 &&
          px.current + PLAYER_W > p.x + 4 &&
          px.current < p.x + p.w - 4
        ) {
          const landVy = vy.current;
          py.current = p.y - PLAYER_H;
          vy.current = 0;
          grounded.current = true;
          jumpsLeft.current = 2;
          if (landVy > 8) {
            fx.burst(px.current + PLAYER_W / 2, p.y, "#86efac", 6, 2.5);
          }
          break;
        }
      }

      if (py.current > VIEW_H + 40) {
        fx.shakeScreen(10);
        fx.flashScreen(0.35);
        loseLife();
        if (!overRef.current) {
          px.current = Math.max(40, camX.current + 60);
          py.current = GROUND_Y - PLAYER_H;
          vy.current = 0;
        }
      }

      const lw = levelW.current;
      px.current = Math.max(8, Math.min(lw - PLAYER_W - 8, px.current));

      const targetCam = Math.max(
        0,
        Math.min(lw - VIEW_W, px.current - VIEW_W * 0.38),
      );
      camX.current += (targetCam - camX.current) * lerpFactor(0.12, dt);

      patrolEnemies(enemies.current, dt);

      const hitBox = () => {
        const ax = px.current + (facing.current > 0 ? PLAYER_W - 4 : -28);
        return { x: ax, y: py.current + 8, w: 32, h: 24 };
      };

      if (attackT.current > 0 && attackT.current > ATTACK_FRAMES - 4) {
        const hb = hitBox();
        for (let i = enemies.current.length - 1; i >= 0; i--) {
          const e = enemies.current[i];
          if (rectsOverlap(hb.x, hb.y, hb.w, hb.h, e.x, e.y, e.w, e.h)) {
            const ex = e.x + e.w / 2;
            const ey = e.y + e.h / 2;
            spawnBurst(particles.current, ex, ey, 16, [
              "#f97316",
              "#fde047",
              "#fff",
            ]);
            fx.burst(ex, ey, "#fbbf24", 18);
            fx.popScore(ex, ey - 20, "+50");
            fx.shakeScreen(4);
            fx.haptic("hit");
            scoreRef.current += 50;
            setScore(scoreRef.current);
            sounds.success();
            enemies.current.splice(i, 1);
          }
        }
      }

      for (let i = enemies.current.length - 1; i >= 0; i--) {
        const e = enemies.current[i];
        if (frame.current < invUntil.current || overRef.current) continue;
        if (
          rectsOverlap(
            px.current + 4,
            py.current + 8,
            PLAYER_W - 8,
            PLAYER_H - 8,
            e.x,
            e.y,
            e.w,
            e.h,
          )
        ) {
          const stomp = prevVy > 2 && py.current + PLAYER_H < e.y + e.h * 0.55;
          if (stomp) {
            const ex = e.x + e.w / 2;
            spawnBurst(particles.current, ex, e.y, 14, ["#a3e635", "#fde047"]);
            fx.burst(ex, e.y, "#86efac", 16);
            fx.popScore(ex, e.y, "Zıpla! +50");
            fx.haptic("tick");
            scoreRef.current += 50;
            setScore(scoreRef.current);
            sounds.star();
            vy.current = JUMP2;
            enemies.current.splice(i, 1);
          } else {
            fx.shakeScreen(8);
            fx.flashScreen(0.3);
            spawnBurst(
              particles.current,
              px.current + PLAYER_W / 2,
              py.current + PLAYER_H / 2,
              12,
              ["#ef4444", "#fca5a5", "#fff"],
            );
            loseLife();
          }
        }
      }

      for (const p of pickups.current) {
        if (p.taken) continue;
        const pr = 18;
        if (
          rectsOverlap(
            px.current,
            py.current,
            PLAYER_W,
            PLAYER_H,
            p.x - pr,
            p.y - pr,
            pr * 2,
            pr * 2,
          )
        ) {
          takePickup(p);
          const pts = p.kind === "star" ? 80 : 30;
          scoreRef.current += pts;
          setScore(scoreRef.current);
          void scoreGame.checkMilestone(scoreRef.current);
          spawnBurst(particles.current, p.x, p.y, 12, [
            "#fbbf24",
            "#fde047",
            "#fff",
          ]);
          fx.burst(p.x, p.y, p.kind === "star" ? "#fde047" : "#f59e0b", 14);
          fx.popScore(p.x, p.y - 16, `+${pts}`);
          fx.haptic("tick");
          sounds.coin();
        }
      }

      if (
        !overRef.current &&
        !goalConsumed.current &&
        px.current + PLAYER_W > goalX.current - 20 &&
        interLevelRef.current === 0 &&
        victoryAnimRef.current === 0
      ) {
        goalConsumed.current = true;
        const bonus = 120 + levelRef.current * 35;
        scoreRef.current += bonus;
        setScore(scoreRef.current);
        void scoreGame.checkMilestone(scoreRef.current);
        scoreGame.reportLevel(levelRef.current);
        for (let i = 0; i < 8; i++) {
          spawnBurst(particles.current, px.current + i * 18, py.current, 22, [
            "#fde047",
            "#f472b6",
            "#60a5fa",
            "#4ade80",
          ]);
        }
        fx.flashScreen(0.35);
        fx.haptic("win");
        sounds.win();

        if (levelRef.current === MAX_LEVELS) {
          scoreRef.current += 800;
          setScore(scoreRef.current);
          victoryAnimRef.current = VICTORY_FRAMES;
          fx.shakeScreen(6);
        } else {
          interLevelRef.current = INTER_LEVEL_FRAMES;
          fx.popScore(VIEW_W / 2, VIEW_H / 2 - 40, `SEVİYE ${levelRef.current} ✓`);
        }
      }
    }

    updateParticles(particles.current, dt);

    const cx = camX.current;
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    sky.addColorStop(0, "#7dd3fc");
    sky.addColorStop(0.45, "#bae6fd");
    sky.addColorStop(1, "#bbf7d0");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    for (const cloud of parallax.current) {
      const pxCloud =
        ((cloud.x - cx * (0.15 + cloud.layer * 0.1)) % (VIEW_W + 120)) - 60;
      ctx.globalAlpha = 0.35 + cloud.layer * 0.15;
      ctx.font = `${28 + cloud.layer * 8}px serif`;
      ctx.fillText("☁️", pxCloud, cloud.y);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#4ade80";
    ctx.fillRect(0, GROUND_Y + 40, VIEW_W, VIEW_H - GROUND_Y);

    for (let x = -((cx * 0.3) % 80); x < VIEW_W + 80; x += 80) {
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.ellipse(x, GROUND_Y + 52, 36, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(-cx, 0);

    for (const p of plats.current) {
      if (p.x + p.w < cx - 40 || p.x > cx + VIEW_W + 40) continue;
      if (p.kind === "grass") {
        ctx.fillStyle = "#65a30d";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "#84cc16";
        ctx.fillRect(p.x, p.y, p.w, 12);
      } else if (p.kind === "log") {
        ctx.fillStyle = "#92400e";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "#b45309";
        ctx.fillRect(p.x, p.y, p.w, 6);
      } else {
        ctx.fillStyle = "#64748b";
        ctx.fillRect(p.x, p.y, p.w, p.h);
      }
    }

    for (const p of pickups.current) {
      if (p.taken) continue;
      if (p.x < cx - 40 || p.x > cx + VIEW_W + 40) continue;
      const bob = Math.sin(frame.current * 0.08 + p.x) * 4;
      ctx.font = "26px serif";
      ctx.textAlign = "center";
      ctx.fillText(p.kind === "star" ? "⭐" : "🍯", p.x, p.y + bob);
    }

    const gx = goalX.current;
    ctx.font = "42px serif";
    ctx.textAlign = "center";
    ctx.fillText("🏁", gx, GROUND_Y - 8);

    for (const e of enemies.current) {
      if (e.x + e.w < cx - 40 || e.x > cx + VIEW_W + 40) continue;
      ctx.font = e.kind === "bee" ? "28px serif" : "32px serif";
      ctx.textAlign = "center";
      ctx.fillText(e.kind === "bee" ? "🐝" : "🐺", e.x + e.w / 2, e.y + e.h / 2 + 6);
    }

    const blink = frame.current < invUntil.current && frame.current % 8 < 4;
    if (!blink) {
      const squash = grounded.current
        ? 1
        : 0.92 + Math.min(0.08, Math.abs(vy.current) * 0.01);
      const sx = px.current + PLAYER_W / 2;
      const sy = py.current + PLAYER_H;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(facing.current * (attackT.current > 0 ? 1.08 : 1), squash);
      ctx.font = attackT.current > 0 ? "38px serif" : "34px serif";
      ctx.textAlign = "center";
      ctx.fillText(
        attackT.current > 0
          ? "🐻💥"
          : jumpsLeft.current < 2 && !grounded.current
            ? "🐻✨"
            : "🐻",
        0,
        -4,
      );
      ctx.restore();
      if (attackT.current > 0) {
        ctx.font = "20px serif";
        ctx.fillText("👊", sx + facing.current * 28, sy - 22);
      }
    }

    // Vuruş / toplama / seviye patlamaları dünya koordinatında çizilir.
    drawParticles(ctx, particles.current);

    ctx.restore();

    // fx.draw sarsıntıyı dünyaya uygular; HUD sabit kalır.
    fx.update(dt);
    fx.draw(ctx, VIEW_W, VIEW_H);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(8, 8, 200, 52);
    ctx.fillStyle = "#fff";
    ctx.font = canvasFont("bold 13px var(--font-nunito), sans-serif");
    ctx.textAlign = "left";
    ctx.fillText(`🍯 ${scoreRef.current}`, 16, 26);
    ctx.fillText(`❤️ ${Math.max(0, livesRef.current)}`, 16, 42);
    ctx.fillText(`📍 ${levelRef.current}/${MAX_LEVELS}`, 16, 56);

    const prog = Math.min(1, px.current / goalX.current);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(8, VIEW_H - 22, VIEW_W - 16, 10);
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(8, VIEW_H - 22, (VIEW_W - 16) * prog, 10);

    if (interLevelRef.current > 0) {
      const a = interLevelRef.current / INTER_LEVEL_FRAMES;
      ctx.fillStyle = `rgba(0,0,0,${0.45 + (1 - a) * 0.25})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = "#fde047";
      ctx.font = canvasFont("bold 22px var(--font-nunito), sans-serif");
      ctx.textAlign = "center";
      ctx.fillText(
        `SEVİYE ${levelRef.current} TAMAMLANDI!`,
        VIEW_W / 2,
        VIEW_H / 2 - 20,
      );
      ctx.font = canvasFont("16px var(--font-nunito), sans-serif");
      ctx.fillStyle = "#fff";
      ctx.fillText(
        `Sonraki: ${levelRef.current + 1} · Hazırlan…`,
        VIEW_W / 2,
        VIEW_H / 2 + 14,
      );
    }

    if (victoryAnimRef.current > 0) {
      const t = victoryAnimRef.current / VICTORY_FRAMES;
      ctx.fillStyle = `rgba(15,23,42,${0.35 + (1 - t) * 0.35})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = "#fde047";
      ctx.font = canvasFont(`bold ${28 + (1 - t) * 12}px var(--font-nunito), sans-serif`);
      ctx.textAlign = "center";
      ctx.fillText("🏆 100 SEVİYE!", VIEW_W / 2, VIEW_H / 2 - 30);
      ctx.fillStyle = "#fff";
      ctx.font = canvasFont("18px var(--font-nunito), sans-serif");
      ctx.fillText("Efsane bir macera!", VIEW_W / 2, VIEW_H / 2 + 8);
      for (let i = 0; i < 12; i++) {
        const ang = (frame.current * 0.08 + i) * Math.PI * 2 * 0.08;
        const r = 100 + Math.sin(frame.current * 0.1 + i) * 30;
        ctx.font = "24px serif";
        ctx.fillText(
          "✨",
          VIEW_W / 2 + Math.cos(ang) * r,
          VIEW_H / 2 + 60 + Math.sin(ang) * r * 0.3,
        );
      }
    }
  };

  useGameLoop(running && !over && !campaignDone, step);

  return (
    <div className="game-panel canvas-game acelya-game super-bear-game fullscreen-game">
      <div ref={hudRef} className="super-bear-hud">
        <ScoreHud
          score={score}
          selfHigh={scoreGame.selfHigh}
          rivalHigh={scoreGame.rivalHigh}
          rivalName={scoreGame.rivalName}
          playerName={scoreGame.playerName}
        />
      </div>

      <div className="acelya-game-stage">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          className="game-canvas touch-canvas super-bear-canvas"
        />
      </div>

      <GameTouchBar gameId="super-ayi" />

      {campaignDone && (
        <div className="super-bear-victory" role="dialog" aria-live="polite">
          <div className="super-bear-victory-card">
            <p className="super-bear-victory-emoji">🐻🏆</p>
            <h2>Tebrikler!</h2>
            <p>
              Tüm {MAX_LEVELS} seviyeyi bitirdin. Skor: <strong>{score}</strong>
            </p>
            <button type="button" className="btn-primary" onClick={reset}>
              Baştan oyna
            </button>
          </div>
        </div>
      )}
      {over && (
        <div className="game-over">
          <p>
            🐻 Oyun bitti! Skor: {score} · Seviye: {level}
          </p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar dene
          </button>
        </div>
      )}
    </div>
  );
}
