import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FRAME_MS, decay, lerpFactor, useGameLoop } from "@/hooks/useGameLoop";

/** Elle sürülen requestAnimationFrame. */
function fakeRaf() {
  let queue = new Map<number, FrameRequestCallback>();
  let id = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    id += 1;
    queue.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (h: number) => {
    queue.delete(h);
  });
  return {
    frame(now: number) {
      const cbs = [...queue.values()];
      queue = new Map();
      for (const cb of cbs) cb(now);
    },
    pending: () => queue.size,
  };
}

/** `hz` ile `seconds` saniye boyunca kare üretir; adım başına `v * dt` biriktirir. */
function runAt(hz: number, seconds: number, v = 3) {
  const raf = fakeRaf();
  let pos = 0;
  let steps = 0;
  const { unmount } = renderHook(() =>
    useGameLoop(true, (dt) => {
      pos += v * dt;
      steps += 1;
    }),
  );
  const frameMs = 1000 / hz;
  const frames = Math.round(seconds * hz);
  for (let i = 0; i <= frames; i++) raf.frame(1000 + i * frameMs);
  unmount();
  return { pos, steps };
}

describe("useGameLoop", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("dt'yi 60 Hz birimine normalleştirir: 60 Hz ve 120 Hz aynı toplam hareketi verir", () => {
    const at60 = runAt(60, 2);
    const at120 = runAt(120, 2);
    expect(at60.steps).toBe(120);
    expect(at120.steps).toBe(240);
    // 2 sn × 60 kare × 3 px = 360 px
    expect(at60.pos).toBeCloseTo(360, 6);
    expect(at120.pos).toBeCloseTo(360, 6);
  });

  it("uzun bir kareyi 50 ms ile sınırlar", () => {
    const raf = fakeRaf();
    const dts: number[] = [];
    renderHook(() => useGameLoop(true, (dt) => dts.push(dt)));
    raf.frame(0); // zaman tabanı
    raf.frame(500); // 500 ms takılma
    expect(dts).toHaveLength(1);
    expect(dts[0]).toBeCloseTo(50 / FRAME_MS, 6);
  });

  it("maxDtMs seçeneğine uyar", () => {
    const raf = fakeRaf();
    const dts: number[] = [];
    renderHook(() => useGameLoop(true, (dt) => dts.push(dt), { maxDtMs: 20 }));
    raf.frame(0);
    raf.frame(100);
    expect(dts[0]).toBeCloseTo(20 / FRAME_MS, 6);
  });

  it("running false iken adım atmaz ve rAF istemez", () => {
    const raf = fakeRaf();
    const step = vi.fn();
    const { rerender } = renderHook(({ on }) => useGameLoop(on, step), {
      initialProps: { on: false },
    });
    expect(raf.pending()).toBe(0);
    raf.frame(0);
    raf.frame(16);
    expect(step).not.toHaveBeenCalled();

    rerender({ on: true });
    raf.frame(100);
    raf.frame(116);
    expect(step).toHaveBeenCalledTimes(1);

    rerender({ on: false });
    expect(raf.pending()).toBe(0);
  });

  it("belge gizliyken adım atmaz; dönüşte biriken süreyi atlar", () => {
    const raf = fakeRaf();
    const dts: number[] = [];
    renderHook(() => useGameLoop(true, (dt) => dts.push(dt)));
    raf.frame(0);
    raf.frame(16);
    expect(dts).toHaveLength(1);

    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    raf.frame(1000);
    raf.frame(2000);
    expect(dts).toHaveLength(1);

    hidden.mockReturnValue(false);
    raf.frame(3000); // yeni zaman tabanı
    raf.frame(3016);
    expect(dts).toHaveLength(2);
    expect(dts[1]).toBeCloseTo(16 / FRAME_MS, 6);
  });

  it("her zaman en güncel step'i çağırır", () => {
    const raf = fakeRaf();
    const calls: string[] = [];
    const { rerender } = renderHook(({ tag }) => useGameLoop(true, () => calls.push(tag)), {
      initialProps: { tag: "a" },
    });
    raf.frame(0);
    raf.frame(16);
    rerender({ tag: "b" });
    raf.frame(32);
    expect(calls).toEqual(["a", "b"]);
  });
});

describe("dt yardımcıları", () => {
  it("decay ve lerpFactor dt=1'de kare başına değeri verir, dt'ler bileşir", () => {
    expect(decay(0.72, 1)).toBeCloseTo(0.72, 10);
    expect(decay(0.72, 0.5) * decay(0.72, 0.5)).toBeCloseTo(0.72, 10);
    expect(lerpFactor(0.12, 1)).toBeCloseTo(0.12, 10);
    const half = lerpFactor(0.12, 0.5);
    expect(1 - (1 - half) * (1 - half)).toBeCloseTo(0.12, 10);
  });
});
