"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { sounds } from "@/lib/sounds";
import { randInt, pickRandom } from "@/lib/utils";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";

const GAME_SLUG = "kostebek-vur";
const W = 360;
const H = 440;
const COLS = 3;
const ROWS = 3;
const HOLE_R = 28;
const MOLE_R = 22;
const DURATION = 30;

type Mole = {
  col: number;
  row: number;
  ttl: number; // frames remaining before mole hides
  bad: boolean;
};

const GOOD_COLORS = ["#8B4513", "#A0522D", "#6B3410"];
const BAD_COLORS = ["#2d2d2d", "#4a4a4a"];
const CHEEK_COLORS = ["#f4a7b9", "#f48fb1", "#f06292"];

export function WhackMole() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [done, setDone] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const molesRef = useRef<Mole[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const juiceRef = useRef(createGameJuice());
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(DURATION);
  const frameRef = useRef(0);
  const spawnCdRef = useRef(0);
  const overRef = useRef(false);
  const hitMarkerRef = useRef<{ x: number; y: number; ttl: number } | null>(null);

  const holeCenters = useRef<{ cx: number; cy: number }[]>([]);
  const inited = useRef(false);

  const initHoles = useCallback(() => {
    const gapX = W / (COLS + 1);
    const gapY = H / (ROWS + 2);
    const centers: { cx: number; cy: number }[] = [];
    const topPad = 70;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        centers.push({
          cx: gapX * (c + 1),
          cy: topPad + gapY * (r + 0.5),
        });
      }
    }
    holeCenters.current = centers;
    inited.current = true;
  }, []);

  const reset = useCallback(() => {
    molesRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    frameRef.current = 0;
    spawnCdRef.current = 0;
    overRef.current = false;
    timeLeftRef.current = DURATION;
    hitMarkerRef.current = null;
    setScore(0);
    setTimeLeft(DURATION);
    setDone(false);
    submitted.current = false;
    scoreGame.resetMilestones();
    if (!inited.current) initHoles();
  }, [scoreGame, initHoles]);

  useGameBoot(reset);

  useEffect(() => {
    if (done && !submitted.current) {
      submitted.current = true;
      scoreGame.submitFinal(score);
    }
  }, [done, score, scoreGame]);

  // Timer interval
  useEffect(() => {
    if (!running || done) return;
    const t = setInterval(() => {
      timeLeftRef.current = timeLeftRef.current - 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        overRef.current = true;
        setDone(true);
        sounds.win();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [running, done]);

  // Canvas game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!inited.current) initHoles();

    const handleClick = (clientX: number, clientY: number) => {
      if (!running || overRef.current || done) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const mx = (clientX - rect.left) * scaleX;
      const my = (clientY - rect.top) * scaleY;

      for (let i = molesRef.current.length - 1; i >= 0; i--) {
        const m = molesRef.current[i];
        const hc = holeCenters.current[m.row * COLS + m.col];
        if (!hc) continue;
        const dx = mx - hc.cx;
        const dy = my - (hc.cy - 14);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < HOLE_R + 4) {
          if (m.bad) {
            scoreRef.current = Math.max(0, scoreRef.current - 20);
            setScore(scoreRef.current);
            sounds.wrong();
            spawnBurst(particlesRef.current, hc.cx, hc.cy - 14, 12, ["#4ade80", "#a3e635", "#fff"]);
            juiceRef.current.burst(hc.cx, hc.cy - 14, "#ef4444", 10);
            juiceRef.current.popScore(hc.cx, hc.cy - 30, "-20", "#ef4444");
            hitMarkerRef.current = { x: hc.cx, y: hc.cy - 14, ttl: 20 };
          } else {
            const bonus = Math.min(Math.floor(scoreRef.current / 50), 3);
            const gained = 10 + bonus;
            scoreRef.current += gained;
            setScore(scoreRef.current);
            sounds.coin();
            spawnBurst(particlesRef.current, hc.cx, hc.cy - 14, 14, ["#fde047", "#fbbf24", "#fff"]);
            juiceRef.current.burst(hc.cx, hc.cy - 14, "#fde047", 14);
            juiceRef.current.popScore(hc.cx, hc.cy - 30, `+${gained}`);
            hitMarkerRef.current = { x: hc.cx, y: hc.cy - 14, ttl: 20 };
            if (scoreRef.current % 60 < gained) scoreGame.checkMilestone(scoreRef.current);
          }
          molesRef.current.splice(i, 1);
          return;
        }
      }
    };

    const onPointer = (e: PointerEvent) => {
      e.preventDefault();
      handleClick(e.clientX, e.clientY);
    };

    canvas.addEventListener("pointerdown", onPointer);

    let raf = 0;
    const loop = () => {
      frameRef.current++;
      const speedLevel = Math.floor(scoreRef.current / 80);
      const spawnInterval = Math.max(25, 55 - speedLevel * 3);
      const moleTtl = Math.max(35, 80 - speedLevel * 4);

      if (running && !overRef.current) {
        spawnCdRef.current--;
        if (spawnCdRef.current <= 0 && molesRef.current.length < 3) {
          const c = randInt(0, COLS - 1);
          const r = randInt(0, ROWS - 1);
          const occupied = molesRef.current.some(
            (m) => m.col === c && m.row === r,
          );
          if (!occupied) {
            const bad = Math.random() < 0.12;
            molesRef.current.push({ col: c, row: r, ttl: moleTtl, bad });
            spawnCdRef.current = spawnInterval;
          }
        }

        // Age moles
        for (let i = molesRef.current.length - 1; i >= 0; i--) {
          molesRef.current[i].ttl--;
          if (molesRef.current[i].ttl <= 0) {
            molesRef.current.splice(i, 1);
          }
        }
      }

      // Draw scene
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#86efac");
      grad.addColorStop(0.5, "#fde047");
      grad.addColorStop(1, "#facc15");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Ground
      ctx.fillStyle = "#65a30d";
      ctx.fillRect(0, H - 30, W, 30);

      // Grass patches
      ctx.fillStyle = "#4d7c0f";
      for (let x = 0; x < W; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, H - 30);
        ctx.lineTo(x + 6, H - 42);
        ctx.lineTo(x + 12, H - 30);
        ctx.fill();
      }

      // Draw holes
      for (const hc of holeCenters.current) {
        // Hole shadow
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.ellipse(hc.cx, hc.cy + 6, HOLE_R, HOLE_R * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hole
        ctx.fillStyle = "#451a03";
        ctx.beginPath();
        ctx.ellipse(hc.cx, hc.cy + 2, HOLE_R, HOLE_R * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hole rim
        ctx.fillStyle = "#78350f";
        ctx.beginPath();
        ctx.ellipse(hc.cx, hc.cy, HOLE_R + 4, (HOLE_R + 4) * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner dark
        ctx.fillStyle = "#2d1306";
        ctx.beginPath();
        ctx.ellipse(hc.cx, hc.cy + 2, HOLE_R - 4, (HOLE_R - 4) * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw moles
      for (const m of molesRef.current) {
        const hc = holeCenters.current[m.row * COLS + m.col];
        if (!hc) continue;
        const t = Math.min(1, (80 - m.ttl) / 15);
        const popY = hc.cy - 14 - Math.max(0, t * 30);
        const mx = hc.cx;
        const my = popY;

        // Mole body
        const bodyColor = m.bad ? pickRandom(BAD_COLORS) : pickRandom(GOOD_COLORS);
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(mx, my, MOLE_R, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        const eyeY = my - 6;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(mx - 7, eyeY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mx + 7, eyeY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(mx - 6, eyeY + 1, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mx + 8, eyeY + 1, 3, 0, Math.PI * 2);
        ctx.fill();

        // Shine
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(mx - 7, eyeY - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mx + 6, eyeY - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = m.bad ? "#4ade80" : "#f472b6";
        ctx.beginPath();
        ctx.arc(mx, my + 4, 5, 0, Math.PI * 2);
        ctx.fill();

        // Cheeks
        ctx.fillStyle = pickRandom(CHEEK_COLORS);
        ctx.beginPath();
        ctx.arc(mx - 12, my + 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mx + 12, my + 2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx, my + 6, 7, 0.3, Math.PI - 0.3);
        ctx.stroke();

        // Bad mole marker
        if (m.bad) {
          ctx.fillStyle = "#4ade80";
          ctx.font = "16px serif";
          ctx.textAlign = "center";
          ctx.fillText("💀", mx, my - MOLE_R - 6);
        }

        // Teeth (whacked mole)
        if (t > 0.8) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(mx - 3, my + 4, 3, 5);
          ctx.fillRect(mx + 1, my + 4, 3, 5);
        }
      }

      // Hit marker
      if (hitMarkerRef.current) {
        const hm = hitMarkerRef.current;
        hm.ttl--;
        if (hm.ttl > 0) {
          const alpha = hm.ttl / 20;
          ctx.strokeStyle = `rgba(253,224,71,${alpha})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(hm.x, hm.y, HOLE_R + 8, 0, Math.PI * 2);
          ctx.stroke();
          // Star burst lines
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r1 = HOLE_R + 10;
            const r2 = HOLE_R + 18;
            ctx.beginPath();
            ctx.moveTo(hm.x + Math.cos(angle) * r1, hm.y + Math.sin(angle) * r1);
            ctx.lineTo(hm.x + Math.cos(angle) * r2, hm.y + Math.sin(angle) * r2);
            ctx.stroke();
          }
        } else {
          hitMarkerRef.current = null;
        }
      }

      updateParticles(particlesRef.current);
      drawParticles(ctx, particlesRef.current);

      const fx = juiceRef.current;
      fx.update();
      fx.draw(ctx, W, H);

      // HUD
      ctx.font = "bold 16px var(--font-nunito), sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "#14532d";
      ctx.fillText(`🔨 ${scoreRef.current}`, 10, 26);
      ctx.textAlign = "right";
      const tc = timeLeftRef.current <= 5 ? "#dc2626" : "#14532d";
      ctx.fillStyle = tc;
      ctx.fillText(`⏱ ${timeLeftRef.current}s`, W - 10, 26);

      // Surface mole count
      if (molesRef.current.length > 0 && running && !overRef.current) {
        ctx.fillStyle = "#78350f";
        ctx.font = "12px var(--font-nunito), sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Köstebek: ${molesRef.current.length}`, W / 2, 48);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onPointer);
    };
  }, [running, done, scoreGame, initHoles]);

  return (
    <div className="game-panel canvas-game">
      <ScoreHud
        score={score}
        selfHigh={scoreGame.selfHigh}
        rivalHigh={scoreGame.rivalHigh}
        rivalName={scoreGame.rivalName}
        playerName={scoreGame.playerName}
      />
      <p className="round-label">
        30 saniye · Köstebeklere vur (+10) · 💀 yeşil olana vurma (-20)!
      </p>
      {!active && (
        <p className="game-waiting">ℹ️ Başla&apos;ya basınca köstebekler çıkar</p>
      )}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="game-canvas touch-canvas"
        style={{ cursor: "pointer" }}
      />
      {done ? (
        <div className="game-over">
          <p>🎉 Süre doldu! Puan: {score}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      ) : null}
    </div>
  );
}
