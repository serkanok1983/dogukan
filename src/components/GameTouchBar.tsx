"use client";

type Btn = { id: string; label: string; code: string; fire?: boolean; span?: number };

const KEY_CODES: Record<string, number> = {
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Space: 32,
  Shift: 16,
};

const LAYOUTS: Record<string, { className?: string; buttons: Btn[] }> = {
  "super-ayi": {
    buttons: [
      { id: "left", label: "◀", code: "ArrowLeft" },
      { id: "jump", label: "↑", code: "ArrowUp" },
      { id: "right", label: "▶", code: "ArrowRight" },
      { id: "punch", label: "👊", code: "Shift", fire: true },
    ],
  },
  "flappy-bird": {
    buttons: [{ id: "flap", label: "🐤 UÇ!", code: "Space", fire: true, span: 4 }],
  },
  tetris: {
    className: "layout-tetris",
    buttons: [
      { id: "left", label: "←", code: "ArrowLeft" },
      { id: "down", label: "↓", code: "ArrowDown" },
      { id: "right", label: "→", code: "ArrowRight" },
      { id: "rot", label: "↻", code: "ArrowUp" },
      { id: "drop", label: "⏬", code: "Space", span: 4 },
    ],
  },
  asteroids: {
    buttons: [
      { id: "left", label: "↺", code: "ArrowLeft" },
      { id: "thrust", label: "↑", code: "ArrowUp" },
      { id: "right", label: "↻", code: "ArrowRight" },
      { id: "fire", label: "🔫", code: "Space", fire: true },
    ],
  },
  pong: {
    buttons: [
      { id: "up", label: "▲", code: "ArrowUp" },
      { id: "down", label: "▼", code: "ArrowDown" },
    ],
  },
  breakout: {
    buttons: [
      { id: "left", label: "◀", code: "ArrowLeft" },
      { id: "right", label: "▶", code: "ArrowRight" },
    ],
  },
};

function dispatchKey(code: string, type: "keydown" | "keyup") {
  const keyCode = KEY_CODES[code] ?? 0;
  document.dispatchEvent(
    new KeyboardEvent(type, {
      code,
      key:
        code === "Space" ? " " : code === "Shift" ? "Shift" : code.replace("Arrow", ""),
      keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
    }),
  );
}

type Props = { gameId: keyof typeof LAYOUTS };

export function GameTouchBar({ gameId }: Props) {
  const layout = LAYOUTS[gameId];
  if (!layout) return null;

  return (
    <div
      className={`game-touch-bar ${layout.className ?? ""} is-visible`.trim()}
      aria-label="Dokunmatik kontroller"
    >
      {layout.buttons.map((b) => (
        <button
          key={b.id}
          type="button"
          className={b.fire ? "touch-fire" : undefined}
          style={b.span ? { gridColumn: `span ${b.span}` } : undefined}
          onPointerDown={(e) => {
            e.preventDefault();
            dispatchKey(b.code, "keydown");
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            dispatchKey(b.code, "keyup");
          }}
          onPointerLeave={(e) => {
            e.preventDefault();
            dispatchKey(b.code, "keyup");
          }}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
