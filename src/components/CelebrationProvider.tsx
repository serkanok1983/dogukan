"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { assetPath } from "@/lib/asset";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { sounds } from "@/lib/sounds";

const DURATION_MS = 3200;

type CelebrationState = {
  message: string;
} | null;

type CelebrationContextValue = {
  show: (message: string) => void;
  isCelebrating: boolean;
};

const CelebrationContext = createContext<CelebrationContextValue>({
  show: () => {},
  isCelebrating: false,
});

export function useCelebration() {
  return useContext(CelebrationContext);
}

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CelebrationState>(null);
  const particles = useRef<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const show = useCallback((message: string) => {
    clearTimer();
    particles.current = [];
    for (let i = 0; i < 8; i++) {
      spawnBurst(particles.current, 160 + Math.random() * 200, 200 + Math.random() * 150, 18, [
        "#fde047",
        "#f472b6",
        "#60a5fa",
        "#4ade80",
        "#fff",
      ]);
    }
    sounds.win();
    setState({ message });
    timerRef.current = setTimeout(() => {
      setState(null);
      timerRef.current = null;
    }, DURATION_MS);
  }, []);

  useEffect(() => () => clearTimer(), []);

  useEffect(() => {
    if (!state) return;
    document.body.classList.add("game-celebrating");
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updateParticles(particles.current);
      drawParticles(ctx, particles.current);
      if (Math.random() > 0.65) {
        spawnBurst(
          particles.current,
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          8,
          ["#fde047", "#fbbf24", "#fff"],
        );
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      document.body.classList.remove("game-celebrating");
    };
  }, [state]);

  const isCelebrating = !!state;

  return (
    <CelebrationContext.Provider value={{ show, isCelebrating }}>
      {children}
      {state && (
        <div
          className="celebration-overlay"
          role="dialog"
          aria-modal="true"
          aria-live="assertive"
        >
          <canvas ref={canvasRef} className="celebration-canvas" width={400} height={300} />
          <div className="celebration-card">
            <div
              className="celebration-photo"
              style={{ backgroundImage: `url(${assetPath("/dogukan.jpg")})` }}
            />
            <p className="celebration-msg">{state.message}</p>
          </div>
        </div>
      )}
    </CelebrationContext.Provider>
  );
}
