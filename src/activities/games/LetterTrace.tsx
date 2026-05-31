"use client";

import { useRef, useState } from "react";
import { sounds } from "@/lib/sounds";

const LETTERS = [
  { char: "A", points: [
    [0.5, 0.85], [0.35, 0.55], [0.25, 0.3], [0.35, 0.1], [0.5, 0.05],
    [0.65, 0.1], [0.75, 0.3], [0.65, 0.55], [0.5, 0.55], [0.5, 0.5],
  ]},
  { char: "E", points: [
    [0.2, 0.85], [0.2, 0.15], [0.75, 0.15],
    [0.2, 0.5], [0.6, 0.5],
    [0.2, 0.85], [0.75, 0.85],
  ]},
  { char: "B", points: [
    [0.2, 0.85], [0.2, 0.1], [0.55, 0.1], [0.65, 0.2], [0.55, 0.35],
    [0.2, 0.35], [0.2, 0.5], [0.55, 0.5], [0.65, 0.6], [0.55, 0.75],
    [0.2, 0.85],
  ]},
  { char: "S", points: [
    [0.7, 0.2], [0.45, 0.15], [0.25, 0.2], [0.2, 0.35], [0.35, 0.45],
    [0.6, 0.5], [0.75, 0.6], [0.7, 0.75], [0.5, 0.85], [0.25, 0.8],
  ]},
  { char: "T", points: [
    [0.25, 0.15], [0.75, 0.15],
    [0.5, 0.15], [0.5, 0.85],
  ]},
  { char: "O", points: [
    [0.5, 0.1], [0.2, 0.25], [0.2, 0.75], [0.5, 0.9], [0.8, 0.75],
    [0.8, 0.25], [0.5, 0.1],
  ]},
  { char: "K", points: [
    [0.2, 0.1], [0.2, 0.85],
    [0.2, 0.47], [0.6, 0.1],
    [0.2, 0.47], [0.6, 0.85],
  ]},
  { char: "M", points: [
    [0.15, 0.85], [0.15, 0.15], [0.5, 0.45], [0.85, 0.15], [0.85, 0.85],
  ]},
];

type Dot = { x: number; y: number; touched: boolean };

export function LetterTrace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [letterIdx, setLetterIdx] = useState(0);
  const [dots, setDots] = useState<Dot[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [done, setDone] = useState(false);
  const progressRef = useRef<Set<number>>(new Set());

  const letter = LETTERS[letterIdx];

  const startLetter = (idx: number) => {
    const lv = LETTERS[idx];
    setLetterIdx(idx);
    setDots(lv.points.map(([x, y]) => ({ x, y, touched: false })));
    setDone(false);
    progressRef.current = new Set();
    drawDots(lv);
  };

  const drawDots = (lv = letter) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);

    // Draw guide lines
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    lv.points.forEach(([px, py], i) => {
      const x = px * W;
      const y = py * H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw dots
    lv.points.forEach(([px, py], i) => {
      const x = px * W;
      const y = py * H;
      const touched = progressRef.current.has(i);
      ctx.beginPath();
      ctx.arc(x, y, touched ? 16 : 12, 0, Math.PI * 2);
      ctx.fillStyle = touched ? "#4ade80" : "#d1d5db";
      ctx.fill();
      ctx.strokeStyle = touched ? "#22c55e" : "#9ca3af";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), x, y);
    });
  };

  const initCanvas = (el: HTMLCanvasElement | null) => {
    if (!el) return;
    canvasRef.current = el;
    startLetter(0);
  };

  const findNearDot = (clientX: number, clientY: number): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) / rect.width;
    const my = (clientY - rect.top) / rect.height;

    for (let i = 0; i < letter.points.length; i++) {
      if (progressRef.current.has(i)) continue;
      const [dx, dy] = letter.points[i];
      if (Math.hypot(mx - dx, my - dy) < 0.12) return i;
    }
    return null;
  };

  const handlePointer = (clientX: number, clientY: number) => {
    const idx = findNearDot(clientX, clientY);
    if (idx === null) return;

    // Must be the next in sequence
    const touched = Array.from(progressRef.current).sort((a, b) => a - b);
    const expected = touched.length > 0 ? touched[touched.length - 1] + 1 : 0;
    if (idx !== expected) {
      sounds.wrong();
      return;
    }

    progressRef.current.add(idx);
    sounds.tap();
    drawDots();

    if (progressRef.current.size >= letter.points.length) {
      sounds.success();
      setTimeout(() => {
        if (letterIdx + 1 >= LETTERS.length) {
          setDone(true);
          sounds.win();
        } else {
          startLetter(letterIdx + 1);
        }
      }, 500);
    }
  };

  const restart = () => {
    progressRef.current = new Set();
    startLetter(0);
  };

  if (done) {
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">✍️</div>
        <h2>Harikasın!</h2>
        <p className="result-score">Tüm harfleri tamamladın!</p>
        <button type="button" className="btn-primary" onClick={restart}>
          Tekrar Oyna
        </button>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <p className="round-label">
        Harf {letterIdx + 1}/{LETTERS.length}: <strong>{letter.char}</strong>
      </p>
      <p className="count-prompt">Noktalara sırayla dokunarak harfi yaz!</p>
      <canvas
        ref={initCanvas}
        width={300}
        height={300}
        className="draw-canvas"
        style={{ touchAction: "none", borderRadius: 16, border: "2px solid #e5e7eb" }}
        onClick={(e) => handlePointer(e.clientX, e.clientY)}
      />
      <p className="hint-text" style={{ marginTop: 8 }}>
        1→2→3→ sırayla noktalara dokun ✨
      </p>
    </div>
  );
}