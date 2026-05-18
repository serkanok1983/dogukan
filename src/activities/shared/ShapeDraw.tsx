"use client";

import { useRef, useState } from "react";
import { sounds } from "@/lib/sounds";

const SHAPES = ["⭕", "⬜", "🔺", "⭐"];

export function ShapeDraw() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shape, setShape] = useState(0);
  const drawing = useRef(false);

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    draw(e);
  };

  const end = () => {
    drawing.current = false;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.strokeStyle = ["#ff6b9d", "#4ecdc4", "#ffd93d", "#a78bfa"][shape];
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    sounds.tap();
  };

  const initCanvas = (el: HTMLCanvasElement | null) => {
    if (!el) return;
    canvasRef.current = el;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, el.width, el.height);
  };

  return (
    <div className="game-panel">
      <p className="round-label">Şekil çiz: {SHAPES[shape]}</p>
      <div className="shape-picker">
        {SHAPES.map((s, i) => (
          <button
            key={s}
            type="button"
            className={`shape-btn ${shape === i ? "active" : ""}`}
            onClick={() => {
              setShape(i);
              sounds.tap();
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <canvas
        ref={initCanvas}
        width={300}
        height={220}
        className="draw-canvas"
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={end}
      />
      <button type="button" className="btn-ghost clear-btn" onClick={clear}>
        Temizle 🧽
      </button>
    </div>
  );
}
