"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { assetPath } from "@/lib/asset";
import { UpdateToast } from "./UpdateToast";
// Yan etki: `beforeinstallprompt` dinleyicisini erkenden bağlar.
import "./installPrompt";

/**
 * Service worker kaydı ve güncelleme akışı (CONTRACT §10.9, mobile-production F2).
 * Yalnızca production'da çalışır. Statik export `Cache-Control` başlığı
 * veremediği için `updateViaCache: "none"` kullanılır. Yeni sürüm beklerken
 * haritada (oyun ortasında değil) bir bildirim gösterilir; dokununca yeni
 * service worker devralır ve sayfa bir kez yenilenir. Sahibi S8.
 */
export function PwaRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const updateRequested = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const container = navigator.serviceWorker;
    let registration: ServiceWorkerRegistration | null = null;
    let cancelled = false;

    const onControllerChange = () => {
      // İlk kurulumdaki clients.claim() da bu olayı tetikler; yalnızca istenince yenile.
      if (updateRequested.current) window.location.reload();
    };

    const watch = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting && container.controller) setWaiting(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const next = reg.installing;
        if (!next) return;
        next.addEventListener("statechange", () => {
          if (!cancelled && next.state === "installed" && container.controller) setWaiting(next);
        });
      });
    };

    const register = () => {
      container
        .register(assetPath("/sw.js"), { scope: assetPath("/"), updateViaCache: "none" })
        .then((reg) => {
          if (cancelled) return;
          registration = reg;
          watch(reg);
        })
        .catch((e: unknown) => console.warn("Service worker kaydedilemedi:", e));
    };

    // Uygulama günlerce açık kalabilir: öne gelince yeni sürüm var mı diye bak.
    const onVisible = () => {
      if (document.visibilityState === "visible") void registration?.update().catch(() => {});
    };

    container.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisible);
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      cancelled = true;
      container.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("load", register);
    };
  }, []);

  const applyUpdate = () => {
    if (!waiting) return;
    updateRequested.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
    // Başka bir sekme zaten devraldıysa controllerchange gelmeyebilir.
    window.setTimeout(() => window.location.reload(), 4000);
  };

  if (!waiting || pathname?.startsWith("/aktivite/")) return null;
  return <UpdateToast onUpdate={applyUpdate} />;
}
