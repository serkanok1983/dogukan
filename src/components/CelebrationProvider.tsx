"use client";

import "./game/game-frame.css";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { assetPath } from "@/lib/asset";
import {
  drawParticles,
  spawnBurst,
  updateParticles,
  type Particle,
} from "@/lib/particles";
import { sounds } from "@/lib/sounds";
import { isSpeaking, speak } from "@/lib/speech";

const DURATION_MS = 3200;
/** Toast ekranda kalma süresi (CONTRACT §10.3: 1.2–1.8 sn). */
export const TOAST_MS = 1600;

/** Toast metninin sesli hali: emoji okunmasın. */
export function toastSpeech(message: string): string {
  return message
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

type CelebrationState = {
  message: string;
} | null;

type ToastState = { id: number; message: string } | null;

type CelebrationContextValue = {
  /** Tam ekran kutlama (koşu sonu). Oyunu duraklatır. */
  show: (message: string) => void;
  /** Bloklamayan küçük bildirim (koşu içi). Oyunu duraklatmaz. */
  toast: (message: string) => void;
  isCelebrating: boolean;
};

const CelebrationContext = createContext<CelebrationContextValue>({
  show: () => {},
  toast: () => {},
  isCelebrating: false,
});

export function useCelebration() {
  return useContext(CelebrationContext);
}

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CelebrationState>(null);
  const [toastState, setToastState] = useState<ToastState>(null);
  const particles = useRef<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastSeq = useRef(0);

  const show = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    particles.current = [];
    for (let i = 0; i < 8; i++) {
      spawnBurst(
        particles.current,
        160 + Math.random() * 200,
        200 + Math.random() * 150,
        18,
        ["#fde047", "#f472b6", "#60a5fa", "#4ade80", "#fff"],
      );
    }
    sounds.win();
    setState({ message });
    timerRef.current = setTimeout(() => {
      setState(null);
      timerRef.current = null;
    }, DURATION_MS);
  }, []);

  const toast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastSeq.current += 1;
    sounds.star();
    // Okuma bilmeyen çocuk için sesli; süren bir konuşmayı (oyun yönergesi) kesmez.
    const line = toastSpeech(message);
    if (line && !isSpeaking()) speak(line);
    setToastState({ id: toastSeq.current, message });
    toastTimerRef.current = setTimeout(() => {
      setToastState(null);
      toastTimerRef.current = null;
    }, TOAST_MS);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

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
  const value = useMemo(
    () => ({ show, toast, isCelebrating }),
    [show, toast, isCelebrating],
  );

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      {toastState && (
        <div
          key={toastState.id}
          className="gf-toast"
          role="status"
          aria-live="polite"
        >
          {toastState.message}
        </div>
      )}
      {state && (
        <div
          className="celebration-overlay"
          role="dialog"
          aria-modal="true"
          aria-live="assertive"
        >
          <canvas
            ref={canvasRef}
            className="celebration-canvas"
            width={400}
            height={300}
          />
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
