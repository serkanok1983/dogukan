"use client";

import { useEffect, useRef, useState } from "react";
import { acelyaSounds } from "@/lib/acelyaSounds";
import { createGameJuice } from "@/lib/gameJuice";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { useGameRunning } from "@/hooks/useGameRunning";
import { useGameScore } from "@/hooks/useGameScore";
import { ScoreHud } from "@/components/ScoreHud";
import { GameTouchBar } from "@/components/GameTouchBar";
import { useCanvasFit } from "@/hooks/useCanvasFit";

const GAME_SLUG = "pong";
const GAME_W = 800;
const GAME_H = 400;
const MAX_SCORE = 20;

export function Pong() {
  const active = useGameActive();
  const running = useGameRunning();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const juiceRef = useRef(createGameJuice());
  useCanvasFit(canvasRef, GAME_W, GAME_H, { hudRef, minWidth: 280 });
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [ballSpeed, setBallSpeed] = useState(3);
  const [ended, setEnded] = useState(false);
  const scoreGame = useGameScore(GAME_SLUG);
  const submitted = useRef(false);

  const state = useRef({
    playerY: GAME_H / 2 - 40,
    computerY: GAME_H / 2 - 40,
    ballX: GAME_W / 2,
    ballY: GAME_H / 2,
    ballDX: 3,
    ballDY: 2,
    ballSpeed: 3,
    playerScore: 0,
    computerScore: 0,
    up: false,
    down: false,
    prevTotal: 0,
    ended: false,
  });

  const reset = () => {
    const s = state.current;
    s.playerY = GAME_H / 2 - 40;
    s.computerY = GAME_H / 2 - 40;
    s.ballSpeed = 3;
    s.ballDX = 3 * (Math.random() > 0.5 ? 1 : -1);
    s.ballDY = 2 * (Math.random() > 0.5 ? 1 : -1);
    s.prevTotal = 0;
    s.ended = false;
    submitted.current = false;
    resetBall();
    s.playerScore = 0;
    s.computerScore = 0;
    setPlayerScore(0);
    setComputerScore(0);
    setBallSpeed(3);
    setEnded(false);
    scoreGame.resetMilestones();
  };

  const resetBall = () => {
    const s = state.current;
    s.ballX = GAME_W / 2;
    s.ballY = GAME_H / 2;
    s.ballDX = s.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    s.ballDY = s.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
  };

  useGameBoot(reset);

  useEffect(() => {
    const stars = starsRef.current;
    if (!stars) return;
    const ctx = stars.getContext("2d");
    if (!ctx) return;
    const sync = () => {
      stars.width = window.innerWidth;
      stars.height = window.innerHeight;
    };
    sync();
    const dots = Array.from({ length: 100 }, () => ({
      x: Math.random() * stars.width,
      y: Math.random() * stars.height,
      s: Math.random() * 1.5 + 0.3,
      sp: Math.random() + 0.4,
    }));
    let raf = 0;
    const anim = () => {
      ctx.clearRect(0, 0, stars.width, stars.height);
      ctx.fillStyle = "#fff";
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.s, 0, Math.PI * 2);
        ctx.fill();
        d.y += d.sp;
        if (d.y > stars.height) d.y = 0;
      }
      raf = requestAnimationFrame(anim);
    };
    anim();
    window.addEventListener("resize", sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", sync);
    };
  }, []);

  useEffect(() => {
    if (ended && !submitted.current) {
      submitted.current = true;
      void scoreGame.submitFinal(playerScore);
    }
  }, [ended, playerScore, scoreGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const paddleH = 80;
    const paddleW = 10;
    const fx = juiceRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        state.current.up = true;
        e.preventDefault();
      }
      if (e.key === "ArrowDown") {
        state.current.down = true;
        e.preventDefault();
      }
      if (e.code === "Space") {
        e.preventDefault();
        const s = state.current;
        if (!s.ended && s.ballSpeed < 10) {
          const next = Math.min(s.ballSpeed * 1.08, 10);
          const ratio = next / s.ballSpeed;
          s.ballSpeed = next;
          s.ballDX *= ratio;
          s.ballDY *= ratio;
          setBallSpeed(next);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") state.current.up = false;
      if (e.key === "ArrowDown") state.current.down = false;
    };

    const cssToY = (clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return ((clientY - rect.top) / rect.height) * GAME_H;
    };
    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length) {
        const y = cssToY(e.touches[0].clientY);
        state.current.playerY = Math.max(0, Math.min(GAME_H - paddleH, y - paddleH / 2));
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    canvas.addEventListener("touchmove", onTouch, { passive: false });

    let raf = 0;
    const loop = () => {
      const s = state.current;
      if (running && !s.ended) {
        if (s.up && s.playerY > 0) s.playerY -= 8;
        if (s.down && s.playerY < GAME_H - paddleH) s.playerY += 8;
        if (s.computerY + paddleH / 2 < s.ballY - 20) s.computerY += 8 * 0.7;
        else if (s.computerY + paddleH / 2 > s.ballY + 20) s.computerY -= 8 * 0.7;
        s.computerY = Math.max(0, Math.min(GAME_H - paddleH, s.computerY));

        s.ballX += s.ballDX;
        s.ballY += s.ballDY;
        if (s.ballY < 0 || s.ballY > GAME_H) s.ballDY *= -1;

        if (s.ballX < paddleW && s.ballY > s.playerY && s.ballY < s.playerY + paddleH) {
          s.ballDX = Math.abs(s.ballDX);
          acelyaSounds.hit();
          fx.burst(s.ballX, s.ballY, "#5eead4", 10);
          fx.shakeScreen(3);
        }
        if (
          s.ballX > GAME_W - paddleW &&
          s.ballY > s.computerY &&
          s.ballY < s.computerY + paddleH
        ) {
          s.ballDX = -Math.abs(s.ballDX);
          acelyaSounds.hit();
          fx.burst(s.ballX, s.ballY, "#a78bfa", 8);
        }

        if (s.ballX < 0) {
          s.computerScore++;
          setComputerScore(s.computerScore);
          resetBall();
        }
        if (s.ballX > GAME_W) {
          s.playerScore++;
          setPlayerScore(s.playerScore);
          resetBall();
        }

        const total = s.playerScore + s.computerScore;
        if (total > s.prevTotal) {
          s.prevTotal = total;
          if (total > 0 && total % 5 === 0 && s.ballSpeed < 10) {
            const next = Math.min(s.ballSpeed * 1.1, 10);
            const ratio = next / s.ballSpeed;
            s.ballSpeed = next;
            s.ballDX *= ratio;
            s.ballDY *= ratio;
            setBallSpeed(next);
          }
          void scoreGame.checkMilestone(s.playerScore);
        }

        if (s.playerScore >= MAX_SCORE || s.computerScore >= MAX_SCORE) {
          s.ended = true;
          fx.shakeScreen(12);
          fx.flashScreen(0.22);
          setEnded(true);
          void scoreGame.submitFinal(s.playerScore);
        }
      }

      ctx.clearRect(0, 0, GAME_W, GAME_H);
      fx.wrapDraw(ctx, GAME_W, GAME_H, () => {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, s.playerY, paddleW, paddleH);
        ctx.fillRect(GAME_W - paddleW, s.computerY, paddleW, paddleH);
        ctx.beginPath();
        ctx.arc(s.ballX, s.ballY, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("touchstart", onTouch);
      canvas.removeEventListener("touchmove", onTouch);
    };
  }, [running, scoreGame]);

  return (
    <div className="game-panel canvas-game acelya-game pong-game fullscreen-game">
      <canvas ref={starsRef} className="pong-stars" aria-hidden />
      <div ref={hudRef} className="acelya-hud">
        <ScoreHud
          score={playerScore}
          selfHigh={scoreGame.selfHigh}
          rivalHigh={scoreGame.rivalHigh}
          rivalName={scoreGame.rivalName}
        />
        <p className="round-label">
          Sen: {playerScore} | Bilgisayar: {computerScore} · Hız: {ballSpeed.toFixed(2)}x
        </p>
        {!active && <p className="game-waiting">ℹ️ Başla&apos;ya basınca maç başlar</p>}
      </div>
      <div className="acelya-game-stage pong-stage">
        <canvas ref={canvasRef} width={GAME_W} height={GAME_H} className="game-canvas touch-canvas pong-canvas" />
      </div>
      <GameTouchBar gameId="pong" />
      {ended && (
        <div className="game-over">
          <p>{playerScore >= MAX_SCORE ? "🎉 Kazandın!" : "💀 Bilgisayar kazandı!"}</p>
          <button type="button" className="btn-primary" onClick={reset}>
            Tekrar oyna
          </button>
        </div>
      )}
    </div>
  );
}
