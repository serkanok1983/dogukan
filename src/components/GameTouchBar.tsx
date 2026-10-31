"use client";

import "./game/game-frame.css";
import { dispatchGameKey } from "@/lib/gameKeys";

/**
 * Dokunmatik kontroller: başparmak bölgeleri (sol küme sol altta, sağ küme
 * sağ altta), ≥ 72 px düğmeler, harf yerine ikon. Düğmeler klavye olayı
 * üretir (gameKeys), böylece oyunların kodu değişmez. Sahibi S4.
 */

type Zone = "left" | "right" | "full";

type Btn = {
  id: string;
  /** Ekranda görünen ikon */
  label: string;
  /** Erişilebilirlik adı */
  aria: string;
  code: string;
  zone: Zone;
  fire?: boolean;
  span?: number;
};

type Layout = {
  className?: string;
  /** Sol kümede yön haçı (yukarı/sol/sağ/aşağı) yerleşimi */
  dpad?: boolean;
  buttons: Btn[];
};

const LAYOUTS: Record<string, Layout> = {
  "super-ayi": {
    buttons: [
      { id: "left", label: "◀", aria: "Sola git", code: "ArrowLeft", zone: "left" },
      {
        id: "right",
        label: "▶",
        aria: "Sağa git",
        code: "ArrowRight",
        zone: "left",
      },
      {
        id: "punch",
        label: "👊",
        aria: "Yumruk",
        code: "Shift",
        zone: "right",
        fire: true,
      },
      { id: "jump", label: "⤒", aria: "Zıpla", code: "ArrowUp", zone: "right" },
    ],
  },
  "flappy-bird": {
    buttons: [
      {
        id: "flap",
        label: "🐤",
        aria: "Uç",
        code: "Space",
        zone: "full",
        fire: true,
        span: 4,
      },
    ],
  },
  "dovus-arenasi": {
    className: "layout-fighting",
    buttons: [
      { id: "up", label: "▲", aria: "Zıpla", code: "ArrowUp", zone: "left" },
      { id: "down", label: "▼", aria: "Eğil", code: "ArrowDown", zone: "left" },
      { id: "left", label: "◀", aria: "Sola git", code: "ArrowLeft", zone: "left" },
      {
        id: "right",
        label: "▶",
        aria: "Sağa git",
        code: "ArrowRight",
        zone: "left",
      },
      { id: "lp", label: "✊", aria: "Hafif yumruk", code: "KeyZ", zone: "right" },
      { id: "hp", label: "👊", aria: "Güçlü yumruk", code: "KeyX", zone: "right" },
      { id: "lk", label: "🦶", aria: "Hafif tekme", code: "KeyC", zone: "right" },
      { id: "vk", label: "🦵", aria: "Güçlü tekme", code: "KeyV", zone: "right" },
      {
        id: "throw",
        label: "🤼",
        aria: "Yakala ve fırlat",
        code: "KeyB",
        zone: "right",
        fire: true,
      },
    ],
  },
  tetris: {
    className: "layout-tetris",
    buttons: [
      {
        id: "left",
        label: "◀",
        aria: "Sola kaydır",
        code: "ArrowLeft",
        zone: "left",
      },
      {
        id: "right",
        label: "▶",
        aria: "Sağa kaydır",
        code: "ArrowRight",
        zone: "left",
      },
      {
        id: "down",
        label: "▼",
        aria: "Aşağı indir",
        code: "ArrowDown",
        zone: "left",
      },
      { id: "rot", label: "↻", aria: "Döndür", code: "ArrowUp", zone: "right" },
      {
        id: "drop",
        label: "⏬",
        aria: "Hemen bırak",
        code: "Space",
        zone: "right",
        span: 4,
      },
    ],
  },
  asteroids: {
    buttons: [
      { id: "left", label: "↺", aria: "Sola dön", code: "ArrowLeft", zone: "left" },
      {
        id: "right",
        label: "↻",
        aria: "Sağa dön",
        code: "ArrowRight",
        zone: "left",
      },
      { id: "thrust", label: "🔥", aria: "İleri", code: "ArrowUp", zone: "right" },
      {
        id: "fire",
        label: "🔫",
        aria: "Ateş",
        code: "Space",
        zone: "right",
        fire: true,
      },
    ],
  },
  pong: {
    buttons: [
      { id: "up", label: "▲", aria: "Yukarı", code: "ArrowUp", zone: "left" },
      { id: "down", label: "▼", aria: "Aşağı", code: "ArrowDown", zone: "right" },
    ],
  },
  breakout: {
    buttons: [
      { id: "left", label: "◀", aria: "Sola", code: "ArrowLeft", zone: "left" },
      { id: "right", label: "▶", aria: "Sağa", code: "ArrowRight", zone: "right" },
    ],
  },
  snake: {
    className: "layout-snake",
    dpad: true,
    buttons: [
      { id: "up", label: "▲", aria: "Yukarı", code: "ArrowUp", zone: "left" },
      { id: "left", label: "◀", aria: "Sola", code: "ArrowLeft", zone: "left" },
      { id: "right", label: "▶", aria: "Sağa", code: "ArrowRight", zone: "left" },
      { id: "down", label: "▼", aria: "Aşağı", code: "ArrowDown", zone: "left" },
    ],
  },
  pinball: {
    buttons: [
      { id: "left", label: "⟪", aria: "Sol palet", code: "ArrowLeft", zone: "left" },
      {
        id: "launch",
        label: "🚀",
        aria: "Topu fırlat",
        code: "Space",
        zone: "right",
        fire: true,
        span: 2,
      },
      {
        id: "right",
        label: "⟫",
        aria: "Sağ palet",
        code: "ArrowRight",
        zone: "right",
      },
    ],
  },
};

/** Testler ve kontroller için: her düzenin bölgeleri (≤ 2 küme). */
export function touchLayoutZones(gameId: string): Zone[] {
  const layout = LAYOUTS[gameId];
  if (!layout) return [];
  return [...new Set(layout.buttons.map((b) => b.zone))];
}

export const TOUCH_LAYOUT_IDS = Object.keys(LAYOUTS);

function releaseKey(code: string) {
  dispatchGameKey(code, "keyup");
}

function TouchButton({ b }: { b: Btn }) {
  const cls = ["gf-touch-btn", `gf-key-${b.id}`, b.fire ? "touch-fire" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      className={cls}
      aria-label={b.aria}
      onPointerDown={(e) => {
        e.preventDefault();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* bazı tarayıcılar sentetik işaretçiye izin vermez */
        }
        dispatchGameKey(b.code, "keydown");
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        releaseKey(b.code);
      }}
      onPointerLeave={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) return;
        releaseKey(b.code);
      }}
      onPointerCancel={(e) => {
        e.preventDefault();
        releaseKey(b.code);
      }}
      onLostPointerCapture={() => releaseKey(b.code)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span aria-hidden>{b.label}</span>
    </button>
  );
}

type Props = { gameId: keyof typeof LAYOUTS };

export function GameTouchBar({ gameId }: Props) {
  const layout = LAYOUTS[gameId];
  if (!layout) return null;

  const left = layout.buttons.filter((b) => b.zone === "left");
  const right = layout.buttons.filter((b) => b.zone === "right");
  const full = layout.buttons.filter((b) => b.zone === "full");

  return (
    <div
      className={`game-touch-bar gf-touchbar ${layout.className ?? ""} is-visible`
        .replace(/\s+/g, " ")
        .trim()}
      aria-label="Dokunmatik kontroller"
    >
      {full.length > 0 ? (
        <div className="gf-zone gf-zone-full">
          {full.map((b) => (
            <TouchButton key={b.id} b={b} />
          ))}
        </div>
      ) : (
        <>
          <div className={`gf-zone gf-zone-left${layout.dpad ? " gf-dpad" : ""}`}>
            {left.map((b) => (
              <TouchButton key={b.id} b={b} />
            ))}
          </div>
          <div className="gf-zone gf-zone-right">
            {right.map((b) => (
              <TouchButton key={b.id} b={b} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
