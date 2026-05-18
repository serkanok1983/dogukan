"use client";

import { useEffect, useRef } from "react";

type Bubble = { x: number; y: number; r: number; sp: number; hue: number; a: number };

export function BubbleBg() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let bubbles: Bubble[] = [];
    let raf = 0;

    const sync = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const seed = () => {
      bubbles = [];
      const n = Math.min(40, Math.floor((canvas.width * canvas.height) / 28000));
      for (let i = 0; i < n; i++) {
        bubbles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 28 + 8,
          sp: Math.random() * 0.4 + 0.15,
          hue: Math.random() * 60 + 180,
          a: Math.random() * 0.15 + 0.06,
        });
      }
    };

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bubbles.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${b.hue}, 85%, 65%, ${b.a})`;
        ctx.fill();
        ctx.strokeStyle = `hsla(${b.hue}, 90%, 80%, ${b.a + 0.1})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        b.y -= b.sp;
        if (b.y + b.r < 0) {
          b.y = canvas.height + b.r;
          b.x = Math.random() * canvas.width;
        }
      });
      raf = requestAnimationFrame(tick);
    };

    sync();
    seed();
    tick();
    const onResize = () => {
      sync();
      seed();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} className="bubble-canvas" aria-hidden />;
}
