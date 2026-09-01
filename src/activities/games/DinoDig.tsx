"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sounds } from "@/lib/sounds";

const W = 300;
const H = 300;

type Bone = {
  x: number;
  y: number;
  r: number;
  emoji: string;
  revealed: boolean;
};

const DINO_BONES: Record<string, { bones: Bone[]; name: string; emoji: string }> = {
  trex: {
    name: "T-Rex",
    emoji: "🦖",
    bones: [
      { x: 0.5, y: 0.25, r: 18, emoji: "🦴", revealed: false },
      { x: 0.35, y: 0.5, r: 16, emoji: "🦴", revealed: false },
      { x: 0.5, y: 0.5, r: 22, emoji: "🦴", revealed: false },
      { x: 0.65, y: 0.5, r: 16, emoji: "🦴", revealed: false },
      { x: 0.25, y: 0.75, r: 14, emoji: "🦴", revealed: false },
      { x: 0.5, y: 0.75, r: 18, emoji: "🦴", revealed: false },
      { x: 0.75, y: 0.75, r: 14, emoji: "🦴", revealed: false },
    ],
  },
  triceratops: {
    name: "Triceratops",
    emoji: "🦕",
    bones: [
      { x: 0.5, y: 0.2, r: 14, emoji: "🦴", revealed: false },
      { x: 0.4, y: 0.45, r: 20, emoji: "🦴", revealed: false },
      { x: 0.6, y: 0.45, r: 20, emoji: "🦴", revealed: false },
      { x: 0.3, y: 0.7, r: 16, emoji: "🦴", revealed: false },
      { x: 0.5, y: 0.7, r: 22, emoji: "🦴", revealed: false },
      { x: 0.7, y: 0.7, r: 16, emoji: "🦴", revealed: false },
    ],
  },
  stego: {
    name: "Stegosaurus",
    emoji: "🦎",
    bones: [
      { x: 0.25, y: 0.6, r: 16, emoji: "🦴", revealed: false },
      { x: 0.5, y: 0.35, r: 24, emoji: "🦴", revealed: false },
      { x: 0.5, y: 0.6, r: 20, emoji: "🦴", revealed: false },
      { x: 0.75, y: 0.6, r: 16, emoji: "🦴", revealed: false },
      { x: 0.3, y: 0.35, r: 14, emoji: "🦴", revealed: false },
      { x: 0.7, y: 0.35, r: 14, emoji: "🦴", revealed: false },
    ],
  },
};

const DINO_KEYS = Object.keys(DINO_BONES);

export function DinoDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dinoIdx, setDinoIdx] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const [brushPos, setBrushPos] = useState<{ x: number; y: number } | null>(null);
  const revealedRef = useRef<Set<number>>(new Set());
  const dinoKey = DINO_KEYS[dinoIdx];
  const dino = DINO_BONES[dinoKey];
  const isDigging = useRef(false);
  const lastReveal = useRef(0);

  const totalBones = dino.bones.length;
  const revealedCount = revealed.size;

  const resetDino = (idx: number) => {
    const empty = new Set<number>();
    revealedRef.current = empty;
    setDinoIdx(idx);
    setRevealed(empty);
    setDone(false);
    sounds.tap();
  };

  const draw = useCallback((brushAt?: { x: number; y: number } | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dirt background with noise
    ctx.fillStyle = "#8B6914";
    ctx.fillRect(0, 0, W, H);

    // Noise texture
    for (let i = 0; i < 200; i++) {
      const nx = ((i * 173 + 31) % W);
      const ny = ((i * 97 + 67) % H);
      ctx.fillStyle = `rgba(${110 + (i % 40)},${80 + (i % 30)},${20 + (i % 20)},0.5)`;
      ctx.fillRect(nx, ny, 2 + (i % 3), 2 + (i % 3));
    }

    // Revealed holes (where bones were)
    ctx.fillStyle = "#A0865C";
    dino.bones.forEach((b, i) => {
      if (revealed.has(i)) {
        const bx = b.x * W;
        const by = b.y * H;
        ctx.beginPath();
        ctx.arc(bx, by, b.r + 6, 0, Math.PI * 2);
        ctx.fill();

        // Bone glow
        ctx.strokeStyle = "rgba(255,255,200,0.4)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });

    // Revealed bones
    dino.bones.forEach((b, i) => {
      if (revealed.has(i)) {
        ctx.font = "28px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(b.emoji, b.x * W, b.y * H);
        ctx.font = "16px serif";
        ctx.fillText("✨", b.x * W, b.y * H - 22);
      }
    });

    // Brush indicator
    if (brushAt) {
      ctx.strokeStyle = "rgba(210,180,140,0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(brushAt.x, brushAt.y, 20, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(210,180,140,0.3)";
      ctx.fill();
    }
  }, [dino.bones, revealed]);

  const initCanvas = (el: HTMLCanvasElement | null) => {
    if (!el) return;
    canvasRef.current = el;
    draw();
  };

  useEffect(() => {
    draw(brushPos);
  }, [brushPos, draw]);

  const revealBone = (boneIndex: number) => {
    if (revealedRef.current.has(boneIndex)) return;
    const next = new Set(revealedRef.current);
    next.add(boneIndex);
    revealedRef.current = next;
    setRevealed(next);
    sounds.coin();
    if (next.size >= totalBones) {
      setDone(true);
      sounds.win();
    }
  };

  const getPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const tryReveal = (mx: number, my: number) => {
    const now = Date.now();
    if (now - lastReveal.current < 80) return;
    lastReveal.current = now;

    const normX = mx / W;
    const normY = my / H;

    for (let i = 0; i < dino.bones.length; i++) {
      if (revealedRef.current.has(i)) continue;
      const b = dino.bones[i];
      if (Math.hypot(normX - b.x, normY - b.y) < 0.1) {
        revealBone(i);
        break;
      }
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    const pos = getPos(clientX, clientY);
    if (!pos) return;
    setBrushPos(pos);
    if (isDigging.current) {
      tryReveal(pos.x, pos.y);
    }
  };

  const handleStart = (clientX: number, clientY: number) => {
    isDigging.current = true;
    const pos = getPos(clientX, clientY);
    if (!pos) return;
    setBrushPos(pos);
    tryReveal(pos.x, pos.y);
  };

  const handleEnd = () => {
    isDigging.current = false;
  };

  const nextDino = () => {
    const next = (dinoIdx + 1) % DINO_KEYS.length;
    resetDino(next);
  };

  const revealNextBone = () => {
    const nextBone = dino.bones.findIndex(
      (_, index) => !revealedRef.current.has(index),
    );
    if (nextBone < 0) return;
    revealBone(nextBone);
  };

  if (done) {
    return (
      <div className="game-panel result-panel">
        <div className="result-emoji">{dino.emoji}</div>
        <h2>{dino.name} Bulundu!</h2>
        <p className="result-score">Tüm kemikleri ortaya çıkardın!</p>
        <button type="button" className="btn-primary" onClick={nextDino} style={{ marginRight: 8 }}>
          Sonraki Dinozor
        </button>
        <button type="button" className="btn-primary" onClick={() => resetDino(0)}>
          Başa Dön
        </button>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <p className="round-label">
        {dino.emoji} {dino.name} · Kemik {revealedCount}/{totalBones}
      </p>
      <p className="count-prompt">Parmağınla toprağı kaz, fosilleri bul!</p>
      <canvas
        ref={initCanvas}
        width={W}
        height={H}
        className="draw-canvas"
        role="img"
        aria-label={`${dino.name} fosil kazısı: ${totalBones} kemiğin ${revealedCount} tanesi bulundu`}
        aria-describedby="dino-dig-status"
        style={{ touchAction: "none", borderRadius: 16, border: "3px solid #8B6914", cursor: "crosshair" }}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handleStart(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          handleMove(t.clientX, t.clientY);
        }}
        onTouchEnd={handleEnd}
      />
      <p id="dino-dig-status" className="hint-text" aria-live="polite">
        {revealedCount}/{totalBones} kemik bulundu.
      </p>
      <button type="button" className="btn-primary" onClick={revealNextBone}>
        Fırçayla Sıradaki Bölgeyi Aç
      </button>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {DINO_KEYS.map((key, i) => (
          <button
            key={key}
            type="button"
            className="option-btn"
            style={{
              padding: "8px 14px",
              fontSize: "0.85rem",
              background: i === dinoIdx ? "#fef3c7" : undefined,
              border: i === dinoIdx ? "2px solid #f59e0b" : undefined,
            }}
            onClick={() => resetDino(i)}
          >
            {DINO_BONES[key].emoji} {DINO_BONES[key].name}
          </button>
        ))}
      </div>
      <p className="hint-text" style={{ marginTop: 8 }}>
        🪥 Parmağını sürükle = fırçala!
      </p>
    </div>
  );
}
