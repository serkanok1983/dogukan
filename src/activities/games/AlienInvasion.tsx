"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";

const GAME_SLUG = "uzayli-istilasi";

type Alien = { x: number; y: number; alive: boolean; type: number };
type Bullet = { x: number; y: number; vy: number; fromPlayer?: boolean };
type Shield = { x: number; y: number; health: number };

const W = 340;
const H = 500;
const COLS = 7;
const ROWS = 3;

function createAliens(): Alien[] {
  const aliens: Alien[] = [];
  const emojis = ["👾", "👾", "🛸"];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      aliens.push({
        x: col * 0.12 + 0.08,
        y: row * 0.1 + 0.08,
        alive: true,
        type: row,
      });
    }
  }
  return aliens;
}

function createShields(): Shield[] {
  const shields: Shield[] = [];
  for (let i = 0; i < 3; i++) {
    shields.push({ x: 0.22 + i * 0.28, y: 0.7, health: 6 });
  }
  return shields;
}

export function AlienInvasion() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [done, setDone] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const playerX = useRef(0.5);
  const aliens = useRef<Alien[]>([]);
  const bullets = useRef<Bullet[]>([]);
  const shields = useRef<Shield[]>([]);
  const particles = useRef<Particle[]>([]);
  const juiceRef = useRef(createGameJuice());
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const frame = useRef(0);
  const overRef = useRef(false);
  const alienDir = useRef(1);
  const alienSpeed = useRef(0.003);
  const shootCooldown = useRef(0);

  const reset = useCallback(() => {
    playerX.current = 0.5;
    aliens.current = createAliens();
    bullets.current = [];
    shields.current = createShields();
    particles.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    frame.current = 0;
    overRef.current = false;
    alienDir.current = 1;
    alienSpeed.current = 0.003;
    shootCooldown.current = 0;
    setScore(0);
    setLives(3);
    setDone(false);
    submitted.current = false;
    scoreGame.resetMilestones();
  }, [scoreGame]);

  useGameBoot(reset);

  useEffect(() => {
    if (done && !submitted.current) {
      submitted.current = true;
      scoreGame.submitFinal(score);
    }
  }, [done, score, scoreGame]);

  const shoot = () => {
    if (!running || overRef.current || done) return;
    if (shootCooldown.current > 0) return;
    sounds.shoot();
    bullets.current.push({
      x: playerX.current,
      y: 0.85,
      vy: -0.02,
      fromPlayer: true,
    });
    shootCooldown.current = 14;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!running || !canvas || done) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!running || overRef.current || done) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      playerX.current = Math.max(0.04, Math.min(0.96, (clientX - rect.left) / rect.width));
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onMove, { passive: true });

    const onClick = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      shoot();
    };
    canvas.addEventListener("mousedown", onClick);
    canvas.addEventListener("touchstart", onClick, { passive: false });

    let raf = 0;
    const loop = () => {
      if (!running || overRef.current || done) return;
      frame.current++;
      if (shootCooldown.current > 0) shootCooldown.current--;

      // Move aliens
      const alive = aliens.current.filter((a) => a.alive);
      let hitEdge = false;
      alive.forEach((a) => {
        a.x += alienDir.current * alienSpeed.current;
        if (a.x > 0.9 || a.x < 0.02) hitEdge = true;
      });

      if (hitEdge) {
        alienDir.current *= -1;
        alienSpeed.current += 0.0005;
        aliens.current.forEach((a) => {
          if (a.alive) a.y += 0.03;
          if (a.y >= 0.78) {
            overRef.current = true;
            setDone(true);
            sounds.gameOver();
          }
        });
      }

      // Alien shoot
      if (alive.length > 0 && frame.current % 40 === 0 && Math.random() < 0.3) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        bullets.current.push({ x: shooter.x, y: shooter.y + 0.04, vy: 0.015 });
      }

      // Update bullets
      bullets.current = bullets.current.filter((b) => {
        b.y += b.vy;
        const bx = b.x * W;
        const by = b.y * H;

        if (b.fromPlayer) {
          // Player bullet vs aliens
          for (const a of aliens.current) {
            if (!a.alive) continue;
            const ax = a.x * W;
            const ay = a.y * H;
            if (Math.hypot(bx - ax, by - ay) < 24) {
              a.alive = false;
              sounds.explode();
              spawnBurst(particles.current, bx, by, 14, ["#a855f7", "#c084fc", "#fff"]);
              juiceRef.current.burst(bx, by, "#a855f7", 18);
              const pts = 10 + (ROWS - a.type) * 5;
              scoreRef.current += pts;
              setScore(scoreRef.current);
              scoreGame.checkMilestone(scoreRef.current);
              juiceRef.current.popScore(bx, by - 16, `+${pts}`);
              // Check win
              if (aliens.current.every((aa) => !aa.alive)) {
                sounds.win();
                setDone(true);
              }
              return false;
            }
          }
          // Player bullet vs shields
          for (const s of shields.current) {
            if (s.health <= 0) continue;
            if (Math.abs(bx - s.x * W) < 28 && Math.abs(by - s.y * H) < 16) {
              s.health -= 1;
              spawnBurst(particles.current, bx, by, 4, ["#93c5fd", "#fff"]);
              return false;
            }
          }
        } else {
          // Alien bullet vs player
          const px = playerX.current * W;
          const py = H * 0.86;
          if (Math.hypot(bx - px, by - py) < 22) {
            livesRef.current = Math.max(0, livesRef.current - 1);
            setLives(livesRef.current);
            juiceRef.current.shakeScreen(10);
            juiceRef.current.flashScreen(0.4);
            spawnBurst(particles.current, px, py, 16, ["#ef4444", "#f97316"]);
            sounds.explode();
            if (livesRef.current <= 0) {
              overRef.current = true;
              setDone(true);
              sounds.gameOver();
            }
            return false;
          }
          // Alien bullet vs shields
          for (const s of shields.current) {
            if (s.health <= 0) continue;
            if (Math.abs(bx - s.x * W) < 28 && Math.abs(by - s.y * H) < 12) {
              s.health -= 1;
              spawnBurst(particles.current, bx, by, 4, ["#60a5fa", "#fff"]);
              return false;
            }
          }
        }
        return b.y > -0.05 && b.y < 1.05;
      });

      shields.current = shields.current.filter((s) => s.health > 0);

      updateParticles(particles.current);

      // Draw
      ctx.fillStyle = "#0a0a2e";
      ctx.fillRect(0, 0, W, H);
      // Stars
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 137 + 50) % W);
        const sy = ((i * 97 + (frame.current * 0.3)) % H);
        ctx.fillStyle = `rgba(255,255,255,${0.4 + (i % 3) * 0.2})`;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Draw shields
      shields.current.forEach((s) => {
        const alpha = s.health / 6;
        ctx.fillStyle = `rgba(59,130,246,${0.3 + alpha * 0.4})`;
        ctx.fillRect(s.x * W - 24, s.y * H - 14, 48, 28);
        ctx.strokeStyle = `rgba(59,130,246,${0.6})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x * W - 24, s.y * H - 14, 48, 28);
      });

      // Draw aliens
      const alienEmojis = ["👾", "👽", "🛸"];
      aliens.current.forEach((a) => {
        if (!a.alive) return;
        ctx.font = "26px serif";
        ctx.textAlign = "center";
        ctx.fillText(alienEmojis[a.type] ?? "👾", a.x * W, a.y * H);
      });

      // Draw player
      ctx.font = "34px serif";
      ctx.textAlign = "center";
      ctx.fillText("🚀", playerX.current * W, H * 0.88);

      // Draw bullets
      bullets.current.forEach((b) => {
        const bx = b.x * W;
        const by = b.y * H;
        ctx.fillStyle = b.fromPlayer ? "#4ade80" : "#f87171";
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = b.fromPlayer ? "#bbf7d0" : "#fecaca";
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.globalAlpha = 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      drawParticles(ctx, particles.current);
      const fx = juiceRef.current;
      fx.update();
      fx.draw(ctx, W, H);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`🛸 ${scoreRef.current}`, 12, 28);
      ctx.textAlign = "right";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("❤️".repeat(Math.max(0, livesRef.current)), W - 12, 28);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("mousedown", onClick);
      canvas.removeEventListener("touchstart", onClick);
    };
  }, [running, done, reset, scoreGame]);

  return (
    <div className="game-panel canvas-game">
      <ScoreHud score={score} selfHigh={scoreGame.selfHigh} rivalHigh={scoreGame.rivalHigh} rivalName={scoreGame.rivalName} playerName={scoreGame.playerName} />
      <p className="round-label">Uzaylıları vur! Roketini kaydır, ekrana dokun ateş et.</p>
      {!active && <p className="game-waiting">ℹ️ Başla{"'"}ya basınca oyun başlar</p>}
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas touch-canvas" />
      {done && (
        <div className="game-over">
          <p>{lives <= 0 ? "💀 Yenildin! " : "🎉 Kazandın! "}Puan: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>Tekrar oyna</button>
        </div>
      )}
    </div>
  );
}