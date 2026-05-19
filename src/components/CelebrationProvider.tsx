"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { assetPath } from "@/lib/asset";
import { drawParticles, spawnBurst, updateParticles, type Particle } from "@/lib/particles";
import { sounds } from "@/lib/sounds";
import { useEffect, useRef } from "react";

type CelebrationState = {
  message: string;
} | null;

const CelebrationContext = createContext<{
  show: (message: string) => void;
}>({ show: () => {} });

export function useCelebration() {
  return useContext(CelebrationContext);
}

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CelebrationState>(null);
  const particles = useRef<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const show = useCallback((message: string) => {
    particles.current = [];
    for (let i = 0; i < 6; i++) {
      spawnBurst(particles.current, 160 + Math.random() * 200, 200 + Math.random() * 150, 16, [
        "#fde047",
        "#f472b6",
        "#60a5fa",
        "#4ade80",
        "#fff",
      ]);
    }
    sounds.win();
    setState({ message });
    setTimeout(() => setState(null), 3200);
  }, []);

  useEffect(() => {
    if (!state) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const loop = () => {
      if (!state) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updateParticles(particles.current);
      drawParticles(ctx, particles.current);
      if (Math.random() > 0.7) {
        spawnBurst(
          particles.current,
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          6,
          ["#fde047", "#fbbf24", "#fff"],
        );
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  return (
    <CelebrationContext.Provider value={{ show }}>
      {children}
      {state && (
        <div className="celebration-overlay" role="dialog" aria-live="assertive">
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
