"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sounds } from "@/lib/sounds";
import {
  getLetterPath,
  GUIDE,
  isLowerTrace,
  type Pt,
  type Stroke,
} from "./letterPaths";
import type { RendererProps } from "./rendererTypes";
import { checkStroke, dist, isDot, pointAt, strokeLength } from "./traceMath";

const COLOR = {
  guide: "#d6e2ee",
  template: "#e7edf3",
  current: "#cfdcea",
  done: "#22c55e",
  start: "#16a34a",
  ghost: "#f59e0b",
  live: "#0ea5e9",
} as const;

/** Bir vuruşta art arda kaç başarısız denemeden sonra motora "yanlış" denir. */
const LOCAL_TRIES = 2;
/** Ekranda vuruş kalınlığı (0–100 birim). */
const STROKE_W = 9;
const NO_STROKES: readonly Stroke[] = [];

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  pts: readonly Pt[],
  color: string,
  width: number,
) {
  const first = pts[0];
  if (!first) return;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(first[0], first[1], width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(first[0], first[1]);
  for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
  ctx.stroke();
}

/**
 * Harf/rakam yazma: kılavuz çizgileri, soluk şablon, sıradaki vuruşun yeşil
 * başlangıç noktası ve yazım yönünü gösteren hayalet nokta animasyonu. Her
 * vuruş tolerans denetiminden geçince yeşile döner. DPR uyumlu.
 * Cevap: tüm vuruşlar bitince `[char]`; bir vuruş 2 kez tutmazsa `["✗"]`.
 */
export function TraceCanvas({ ex, phase, disabled, onAnswer }: RendererProps) {
  const char = ex.trace?.char ?? ex.answerIds[0] ?? "";
  const strokes: readonly Stroke[] = getLetterPath(char) ?? NO_STROKES;
  const lower = isLowerTrace(char);
  const [done, setDone] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<Pt[] | null>(null);
  const ghostRef = useRef(-1);
  const failsRef = useRef(0);

  const reveal = phase === "reveal" || phase === "correct";
  const completed = reveal ? strokes.length : done;

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext?.("2d");
    if (!canvas || !ctx) return;
    const k = canvas.width / 100;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.setLineDash([2, 2]);
    for (const y of lower ? [GUIDE.mid, GUIDE.base] : [GUIDE.top, GUIDE.base]) {
      drawPolyline(
        ctx,
        [
          [4, y],
          [96, y],
        ],
        COLOR.guide,
        0.7,
      );
    }
    ctx.setLineDash([]);

    strokes.forEach((s, i) => {
      drawPolyline(ctx, s, i < completed ? COLOR.done : COLOR.template, STROKE_W);
    });

    const cur = strokes[completed];
    if (cur && !reveal) {
      drawPolyline(ctx, cur, COLOR.current, STROKE_W);
      const start = cur[0] as Pt;
      ctx.fillStyle = COLOR.start;
      ctx.beginPath();
      ctx.arc(start[0], start[1], 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 7px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(completed + 1), start[0], start[1] + 0.3);
      if (ghostRef.current >= 0 && !isDot(cur)) {
        const g = pointAt(cur, ghostRef.current);
        ctx.fillStyle = COLOR.ghost;
        ctx.beginPath();
        ctx.arc(g[0], g[1], 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (liveRef.current) drawPolyline(ctx, liveRef.current, COLOR.live, 6);
  }, [strokes, completed, reveal, lower]);

  // Boyut: kapsayıcı genişliği × devicePixelRatio.
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const css = wrap.clientWidth || 300;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const px = Math.round(css * dpr);
      if (canvas.width !== px) {
        canvas.width = px;
        canvas.height = px;
      }
      paint();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [paint]);

  // Yazım yönü hayaleti (hareket azaltılmışsa yalnızca başlangıç noktası).
  useEffect(() => {
    const cur = strokes[completed];
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (
      reveal ||
      !cur ||
      isDot(cur) ||
      reduce ||
      typeof requestAnimationFrame === "undefined"
    ) {
      ghostRef.current = -1;
      paint();
      return;
    }
    const dur = phase === "hint" ? 2600 : 1500;
    const pause = 700;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const e = (now - t0) % (dur + pause);
      ghostRef.current = liveRef.current ? -1 : Math.min(1, e / dur);
      paint();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paint, strokes, completed, reveal, phase]);

  const toPt = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / (r.width || 1)) * 100,
      ((e.clientY - r.top) / (r.height || 1)) * 100,
    ];
  };

  const finishStroke = () => {
    const live = liveRef.current;
    liveRef.current = null;
    const target = strokes[done];
    if (!live || !target) {
      paint();
      return;
    }
    // Kaza eseri kısa dokunuş: ceza yok.
    if (!isDot(target) && strokeLength(live) < 4) {
      paint();
      return;
    }
    if (checkStroke(target, live)) {
      failsRef.current = 0;
      sounds.pop();
      const next = done + 1;
      setDone(next);
      if (next >= strokes.length) onAnswer([char]);
      return;
    }
    failsRef.current += 1;
    paint();
    if (failsRef.current >= LOCAL_TRIES) {
      failsRef.current = 0;
      onAnswer(["✗"]);
    } else {
      sounds.softWrong();
    }
  };

  return (
    <div className="ex-trace" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="ex-trace-canvas"
        role="img"
        aria-label={`${char} yazımı, ${strokes.length} vuruş`}
        onPointerDown={(e) => {
          if (disabled || reveal || !strokes[done]) return;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          liveRef.current = [toPt(e)];
          ghostRef.current = -1;
          paint();
        }}
        onPointerMove={(e) => {
          const live = liveRef.current;
          if (!live) return;
          const p = toPt(e);
          const last = live[live.length - 1];
          if (!last || dist(p, last) >= 1) {
            live.push(p);
            paint();
          }
        }}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
      />
    </div>
  );
}
