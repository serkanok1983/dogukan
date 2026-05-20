/** Klavye + dokunmatik bar için tutarlı tuş eşlemesi */

const KEY_CODE_NUM: Record<string, number> = {
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

export function keyFromCode(code: string): string {
  if (code === "Space") return " ";
  if (code === "Shift") return "Shift";
  if (code.startsWith("Key")) return code.slice(3).toLowerCase();
  if (code.startsWith("Arrow")) return code;
  return code;
}

export function dispatchGameKey(code: string, type: "keydown" | "keyup") {
  const keyCode = KEY_CODE_NUM[code] ?? 0;
  document.dispatchEvent(
    new KeyboardEvent(type, {
      code,
      key: keyFromCode(code),
      keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** Hem gerçek klavye hem GameTouchBar olaylarını yakalar */
export function matchGameKey(e: KeyboardEvent, code: string): boolean {
  return e.code === code || e.key === keyFromCode(code);
}
