"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { randInt } from "@/lib/utils";

const W = 360;
const H = 520;
const GAME_SLUG = "tank-savasi";

type Bullet = { x: number; y: number; vx: number; vy: number; friendly: boolean };
type Enemy = { x: number; y: number; hp: number; cd: number; spd: number };
type Block = { x: number; y: number; w: number; h: number; hp: number };

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

export function TankBattle() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [over, setOver] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);

  const px = useRef(W / 2 - 18);
  const py = useRef(H - 70);
  const bullets = useRef<Bullet[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const blocks = useRef<Block[]>([]);
  const particles = useRef<Particle[]>([]);
  const juiceRef = useRef(createGameJuice());
  const frame = useRef(0);
  const shootCd = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const overRef = useRef(false);
  const moveDir = useRef(0);
  const submitted = useRef(false);

  const buildBlocks = useCallback(() => {
    const b: Block[] = [];
    const cols = 5;
    const rows = 3;
    const bw = 44;
    const bh = 22;
    const gap = 8;
    const totalW = cols * bw + (cols - 1) * gap;
    const startX = (W - totalW) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 1 && (c === 0 || c === 4)) continue;
        b.push({
          x: startX + c * (bw + gap),
          y: 180 + r * (bh + gap),
          w: bw,
          h: bh,
          hp: 2 + (r === 0 ? 1 : 0),
        });
      }
    }
    return b;
  }, []);

  const reset = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = 3;
    overRef.current = false;
    submitted.current = false;
    bullets.current = [];
    enemies.current = [];
    blocks.current = buildBlocks();
    particles.current = [];
    px.current = W / 2 - 18;
    py.current = H - 70;
    moveDir.current = 0;
    shootCd.current = 0;
    frame.current = 0;
    setScore(0);
    setLives(3);
    setOver(false);
    scoreGame.resetMilestones();
  }, [buildBlocks, scoreGame]);

  useGameBoot(reset);

  useEffect(() => {
    if (over && !submitted.current) {
      submitted.current = true;
      scoreGame.submitFinal(score);
    }
  }, [over, score, scoreGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tankW = 36;
    const tankH = 28;

    const explode = (x: number, y: number, big = false) => {
      spawnBurst(particles.current, x, y, big ? 28 : 14, [
        "#f97316",
        "#fde047",
        "#ef4444",
        "#94a3b8",
        "#fff",
      ]);
      sounds.pop();
    };

    const shoot = (friendly: boolean, x: number, y: number) => {
      bullets.current.push({
        x,
        y,
        vx: 0,
        vy: friendly ? -7 : 5,
        friendly,
      });
      if (friendly) sounds.shoot();
    };

    const spawnEnemy = () => {
      enemies.current.push({
        x: randInt(40, W - 76),
        y: -30,
        hp: 1 + Math.floor(scoreRef.current / 400),
        cd: randInt(40, 100),
        spd: 0.6 + Math.min(1.2, scoreRef.current * 0.0008),
      });
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") moveDir.current = -1;
      if (e.key === "ArrowRight" || e.key === "d") moveDir.current = 1;
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        if (shootCd.current <= 0 && !overRef.current && running) {
          shoot(true, px.current + tankW / 2 - 2, py.current);
          shootCd.current = 14;
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "ArrowRight" || e.key === "d")
        moveDir.current = 0;
    };

    const setMoveFromX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * W;
      moveDir.current = x < W / 2 ? -1 : 1;
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      const t = "touches" in e ? e.touches[0] : e;
      if (t) setMoveFromX(t.clientX);
    };
    const onEnd = () => {
      moveDir.current = 0;
    };

    const fireBtn = (e: Event) => {
      e.preventDefault();
      if (shootCd.current <= 0 && !overRef.current && running) {
        shoot(true, px.current + tankW / 2 - 2, py.current);
        shootCd.current = 14;
      }
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("mouseup", onEnd);
    canvas.addEventListener("touchend", onEnd);
    canvas.addEventListener("touchstart", fireBtn);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);

    let raf = 0;
    const loop = () => {
      frame.current++;
      if (shootCd.current > 0) shootCd.current--;

      if (running && !overRef.current) {
        px.current += moveDir.current * 4.2;
        px.current = Math.max(8, Math.min(W - tankW - 8, px.current));

        if (frame.current % Math.max(55, 90 - Math.floor(scoreRef.current / 80)) === 0) {
          spawnEnemy();
        }

        for (const e of enemies.current) {
          e.y += e.spd;
          e.cd--;
          if (e.cd <= 0 && e.y > 40 && e.y < H - 120) {
            shoot(false, e.x + 16, e.y + 28);
            e.cd = randInt(70, 140);
          }
        }

        for (const b of bullets.current) {
          b.x += b.vx;
          b.y += b.vy;
        }
        bullets.current = bullets.current.filter((b) => b.y > -20 && b.y < H + 20);

        for (const b of bullets.current) {
          if (b.friendly) {
            for (let i = enemies.current.length - 1; i >= 0; i--) {
              const e = enemies.current[i];
              if (rectsOverlap(b.x - 4, b.y - 4, 8, 8, e.x, e.y, 32, 32)) {
                e.hp--;
                b.y = -999;
                if (e.hp <= 0) {
                  const ex = e.x + 16;
                  const ey = e.y + 16;
                  explode(ex, ey, true);
                  juiceRef.current.burst(ex, ey, "#f97316", 20);
                  juiceRef.current.popScore(ex, ey - 14, "+80");
                  juiceRef.current.shakeScreen(5);
                  enemies.current.splice(i, 1);
                  scoreRef.current += 80;
                  setScore(scoreRef.current);
                  if (frame.current % 30 === 0) scoreGame.checkMilestone(scoreRef.current);
                  sounds.success();
                } else explode(e.x + 16, e.y + 16);
                break;
              }
            }
            for (const bl of blocks.current) {
              if (bl.hp > 0 && rectsOverlap(b.x - 4, b.y - 4, 8, 8, bl.x, bl.y, bl.w, bl.h)) {
                bl.hp--;
                b.y = -999;
                const bx = bl.x + bl.w / 2;
                const by = bl.y + bl.h / 2;
                explode(bx, by);
                if (bl.hp <= 0) {
                  scoreRef.current += 15;
                  juiceRef.current.popScore(bx, by - 10, "+15");
                }
                break;
              }
            }
          } else {
            if (
              rectsOverlap(b.x - 4, b.y - 4, 8, 8, px.current, py.current, tankW, tankH) &&
              !overRef.current
            ) {
              b.y = -999;
              livesRef.current--;
              setLives(livesRef.current);
              explode(px.current + tankW / 2, py.current + tankH / 2, true);
              sounds.wrong();
              if (livesRef.current <= 0) {
                overRef.current = true;
                setOver(true);
              }
            }
            for (const bl of blocks.current) {
              if (bl.hp > 0 && rectsOverlap(b.x - 4, b.y - 4, 8, 8, bl.x, bl.y, bl.w, bl.h)) {
                bl.hp--;
                b.y = -999;
                explode(bl.x + bl.w / 2, bl.y + bl.h / 2);
                break;
              }
            }
          }
        }

        for (let i = enemies.current.length - 1; i >= 0; i--) {
          const e = enemies.current[i];
          if (e.y > H + 40) enemies.current.splice(i, 1);
          else if (
            rectsOverlap(px.current, py.current, tankW, tankH, e.x, e.y, 32, 32) &&
            !overRef.current
          ) {
            enemies.current.splice(i, 1);
            livesRef.current--;
            setLives(livesRef.current);
            explode(px.current + tankW / 2, py.current + tankH / 2, true);
            sounds.wrong();
            if (livesRef.current <= 0) {
              overRef.current = true;
              setOver(true);
            }
          }
        }
      }

      updateParticles(particles.current);

      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#1e293b");
      g.addColorStop(1, "#0f172a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#334155";
      for (let y = 0; y < H; y += 40) ctx.fillRect(0, y, W, 2);

      for (const bl of blocks.current) {
        if (bl.hp <= 0) continue;
        const shades = ["#b45309", "#d97706", "#f59e0b"];
        ctx.fillStyle = shades[Math.min(bl.hp - 1, 2)] ?? "#78716c";
        ctx.fillRect(bl.x, bl.y, bl.w, bl.h);
        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 2;
        ctx.strokeRect(bl.x, bl.y, bl.w, bl.h);
      }

      for (const e of enemies.current) {
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(e.x, e.y, 32, 32);
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(e.x + 12, e.y - 8, 8, 14);
      }

      ctx.fillStyle = "#22c55e";
      ctx.fillRect(px.current, py.current, tankW, tankH);
      ctx.fillStyle = "#14532d";
      ctx.fillRect(px.current + tankW / 2 - 4, py.current - 14, 8, 16);

      for (const b of bullets.current) {
        ctx.fillStyle = b.friendly ? "#fde047" : "#f87171";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      drawParticles(ctx, particles.current);
      const fx = juiceRef.current;
      fx.update();
      fx.draw(ctx, W, H);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px var(--font-nunito), sans-serif";
      ctx.fillText(`💥 ${scoreRef.current}`, 10, 22);
      ctx.fillText(`❤️ ${livesRef.current}`, W - 50, 22);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("mouseup", onEnd);
      canvas.removeEventListener("touchend", onEnd);
      canvas.removeEventListener("touchstart", fireBtn);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [running, scoreGame]);

  return (
    <div className="game-panel canvas-game tank-game">
      <ScoreHud
        score={score}
        selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
        playerName={scoreGame.playerName}
      />
      <p className="round-label">Sol/sağ kaydır · Dokun = ateş · Tuğlaları kır, düşmanları vur!</p>
      {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca savaş başlar</p>}
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas tank-canvas" />
      <div className="tank-mobile-pad">
        <button
          type="button"
          className="tank-btn"
          aria-label="Sol"
          onPointerDown={() => {
            moveDir.current = -1;
          }}
          onPointerUp={() => {
            moveDir.current = 0;
          }}
          onPointerLeave={() => {
            moveDir.current = 0;
          }}
        >
          ◀
        </button>
        <button
          type="button"
          className="tank-btn tank-fire"
          aria-label="Ateş"
          onPointerDown={(e) => {
            e.preventDefault();
            if (shootCd.current <= 0 && !overRef.current && running) {
              bullets.current.push({
                x: px.current + 16,
                y: py.current,
                vx: 0,
                vy: -7,
                friendly: true,
              });
              shootCd.current = 14;
              sounds.shoot();
            }
          }}
        >
          🔥
        </button>
        <button
          type="button"
          className="tank-btn"
          aria-label="Sağ"
          onPointerDown={() => {
            moveDir.current = 1;
          }}
          onPointerUp={() => {
            moveDir.current = 0;
          }}
          onPointerLeave={() => {
            moveDir.current = 0;
          }}
        >
          ▶
        </button>
      </div>
      {over && (
        <div className="game-over">
          <p>💥 Tank savaşı bitti! Puan: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
