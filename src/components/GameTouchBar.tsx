"use client";

type Btn = { id: string; label: string; code: string; fire?: boolean; span?: number };

const KEY_CODES: Record<string, number> = {
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Space: 32,
  Shift: 16,
  KeyZ: 90,
  KeyX: 88,
  KeyC: 67,
  KeyV: 86,
  KeyB: 66,
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
  "dovus-arenasi": {
    className: "layout-fighting",
    buttons: [
      { id: "left", label: "◀", code: "ArrowLeft" },
      { id: "down", label: "↓", code: "ArrowDown" },
      { id: "right", label: "▶", code: "ArrowRight" },
      { id: "up", label: "↑", code: "ArrowUp" },
      { id: "lp", label: "Z", code: "KeyZ" },
      { id: "hp", label: "X", code: "KeyX" },
      { id: "lk", label: "C", code: "KeyC" },
      { id: "vk", label: "V", code: "KeyV" },
      { id: "throw", label: "B", code: "KeyB", fire: true },
    ],
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
        code === "Space"
          ? " "
          : code === "Shift"
            ? "Shift"
            : code.startsWith("Key")
              ? code.slice(3).toLowerCase()
              : code.replace("Arrow", ""),
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
