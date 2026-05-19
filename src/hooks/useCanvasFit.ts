"use client";

import { useEffect, type RefObject } from "react";

type Options = {
  /** Üstteki HUD / skor satırının bulunduğu kapsayıcı */
  hudRef?: RefObject<HTMLElement | null>;
  minWidth?: number;
  padX?: number;
  padY?: number;
};

/** Açelya oyunlarındaki gibi canvas'ı kalan ekrana sığdırır */
export function useCanvasFit(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  gameW: number,
  gameH: number,
  options: Options = {},
) {
  const { hudRef, minWidth = 220, padX = 16, padY = 12 } = options;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = () => {
      const panel = canvas.closest(".acelya-game") as HTMLElement | null;
      const hudBottom = hudRef?.current?.getBoundingClientRect().bottom ?? 0;
      const panelTop = panel?.getBoundingClientRect().top ?? 0;
      const touchBar = panel?.querySelector(".game-touch-bar") as HTMLElement | null;
      const touchH = touchBar?.offsetHeight ?? 0;

      const top = Math.max(hudBottom, panelTop);
      const availW = window.innerWidth - padX * 2;
      const availH = window.innerHeight - top - touchH - padY * 2;
      const scale = Math.min(availW / gameW, availH / gameH) * 0.98;
      const w = Math.max(minWidth, gameW * scale);
      const h = w * (gameH / gameW);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    fit();
    window.addEventListener("resize", fit);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      vv?.removeEventListener("resize", fit);
    };
  }, [canvasRef, gameW, gameH, hudRef, minWidth, padX, padY]);
}
