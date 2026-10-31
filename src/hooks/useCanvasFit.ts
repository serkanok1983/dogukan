"use client";

import { useEffect, type RefObject } from "react";

type Options = {
  /** Üstteki HUD / skor satırının bulunduğu kapsayıcı */
  hudRef?: RefObject<HTMLElement | null>;
  minWidth?: number;
  padX?: number;
  padY?: number;
  /**
   * Arka tampon çözünürlüğü.
   * - `1` (varsayılan): eski davranış, tampon `gameW×gameH` kalır, yalnızca CSS boyutu değişir.
   *   Göç etmemiş oyunlar (kendi dönüşümünü yöneten motorlar dahil) böyle kalır.
   * - `"auto"`: tampon = CSS boyutu × min(devicePixelRatio, 2) ve
   *   `ctx.setTransform` ile çizim mantıksal piksellerde kalır (keskin görüntü).
   */
  dpr?: 1 | "auto";
};

/** Canvas'ı kalan ekrana sığdırır (görünür alan yüksekliği, HUD ve dokunmatik çubuk düşülür). */
export function useCanvasFit(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  gameW: number,
  gameH: number,
  options: Options = {},
) {
  const { hudRef, minWidth = 220, padX = 16, padY = 12, dpr = 1 } = options;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = () => {
      const panel = canvas.closest<HTMLElement>(".game-panel, .acelya-game");
      const hudBottom = hudRef?.current?.getBoundingClientRect().bottom ?? 0;
      const panelTop = panel?.getBoundingClientRect().top ?? 0;
      const touchBar = panel?.querySelector<HTMLElement>(".game-touch-bar");
      const touchH = touchBar?.offsetHeight ?? 0;

      const viewH = window.visualViewport?.height ?? window.innerHeight;
      const viewW = window.visualViewport?.width ?? window.innerWidth;
      const top = Math.max(hudBottom, panelTop);
      // `.game-canvas { max-width: 100% }` genişliği kısarsa en-boy oranı bozulmasın
      // diye panelin iç genişliği (çerçeve 2×3 px düşülür) de sınırdır.
      let panelW = Infinity;
      if (panel) {
        const cs = getComputedStyle(panel);
        panelW =
          panel.clientWidth -
          (parseFloat(cs.paddingLeft) || 0) -
          (parseFloat(cs.paddingRight) || 0) -
          6;
      }
      const availW = Math.min(viewW - padX * 2, panelW > 0 ? panelW : Infinity);
      const availH = viewH - top - touchH - padY * 2;
      const scale = Math.min(availW / gameW, availH / gameH) * 0.98;
      const w = Math.max(minWidth, gameW * scale);
      const h = w * (gameH / gameW);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      if (dpr === "auto") {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const bw = Math.max(1, Math.round(w * ratio));
        const bh = Math.max(1, Math.round(h * ratio));
        if (canvas.width !== bw) canvas.width = bw;
        if (canvas.height !== bh) canvas.height = bh;
        canvas.getContext("2d")?.setTransform(bw / gameW, 0, 0, bh / gameH, 0, 0);
      }
    };

    fit();
    // Yazı tipleri / HUD yerleştikten sonra bir kez daha ölç.
    const raf = requestAnimationFrame(fit);
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
      vv?.removeEventListener("resize", fit);
    };
  }, [canvasRef, gameW, gameH, hudRef, minWidth, padX, padY, dpr]);
}
