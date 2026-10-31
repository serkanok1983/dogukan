"use client";

import { useSyncExternalStore } from "react";

export type DisplayMode = "standalone" | "browser";

const QUERY = "(display-mode: standalone)";

function getSnapshot(): DisplayMode {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const media = typeof window.matchMedia === "function" && window.matchMedia(QUERY).matches;
  return iosStandalone || media ? "standalone" : "browser";
}

function getServerSnapshot(): DisplayMode {
  return "browser";
}

function subscribe(onChange: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener?.("change", onChange);
  window.addEventListener("appinstalled", onChange);
  return () => {
    mql.removeEventListener?.("change", onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

/** Ana ekrana eklenmiş (standalone) olarak mı çalışıyoruz? Sunucuda "browser". */
export function useDisplayMode(): DisplayMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
