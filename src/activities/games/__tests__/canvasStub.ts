import { vi } from "vitest";

/** jsdom'da 2B bağlam yok: her yöntemi sessiz, atanan değerleri kaydeden sahte bağlam. */
export function fakeContext2d(canvas?: HTMLCanvasElement) {
  const fonts: string[] = [];
  const store: Record<string | symbol, unknown> = { canvas };
  const noopResult = { addColorStop() {}, width: 0, a: 1, d: 1 };
  const ctx = new Proxy(store, {
    get(target, key) {
      if (key in target) return target[key];
      return () => noopResult;
    },
    set(target, key, value) {
      if (key === "font") fonts.push(String(value));
      target[key] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, fonts };
}

/** Tüm tuvallere sahte bağlam verir; rAF geri çağrılarını elle çalıştırmak için toplar. */
export function stubCanvasAndFrames() {
  const frames: FrameRequestCallback[] = [];
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    return fakeContext2d(this).ctx;
  } as unknown as HTMLCanvasElement["getContext"]);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  /** Bekleyen kareleri bir kez çalıştırır (döngüler yeni kare ister, onlar sonraki tura kalır). */
  const runFrames = (now = performance.now()) => {
    const batch = frames.splice(0, frames.length);
    for (const cb of batch) cb(now);
  };
  return { runFrames, frames };
}
