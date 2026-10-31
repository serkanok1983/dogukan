"use client";

import { useSyncExternalStore } from "react";
import { useDisplayMode } from "@/hooks/useDisplayMode";
import { KEYS, readRaw, writeRaw } from "@/lib/storage";
import { canPromptInstall, promptInstall, subscribeInstallPrompt } from "./installPrompt";

const DISMISS_EVENT = "dogukan:install-card";

function subscribeDismissed(cb: () => void): () => void {
  window.addEventListener(DISMISS_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(DISMISS_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const isDismissed = () => readRaw(KEYS.installDismissed) === "1";
const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);
const noop = () => () => {};
const serverTrue = () => true;
const serverFalse = () => false;

function dismiss() {
  writeRaw(KEYS.installDismissed, "1");
  window.dispatchEvent(new Event(DISMISS_EVENT));
}

/**
 * "Telefona ekle" kartı — **yalnızca ebeveyn yüzeyinde** (avatar ekranının
 * ebeveyn köşesi, /bilgi). Çocuğa asla gösterilmez, ısrar etmez; kapatılınca
 * hatırlanır (CONTRACT §10.9, mobile-production F3). Sahibi S8.
 */
export function InstallCard() {
  const mode = useDisplayMode();
  const dismissed = useSyncExternalStore(subscribeDismissed, isDismissed, serverTrue);
  const canPrompt = useSyncExternalStore(subscribeInstallPrompt, canPromptInstall, serverFalse);
  const ios = useSyncExternalStore(noop, isIos, serverFalse);

  if (mode === "standalone" || dismissed) return null;

  if (canPrompt) {
    return (
      <section className="pwa-install" aria-labelledby="pwa-install-title">
        <h3 id="pwa-install-title">📲 Telefona ekle</h3>
        <p>Ana ekrana eklenince tam ekran açılır, tarayıcı çubuğu kaybolur ve açılmış oyunlar internetsiz de çalışır.</p>
        <div className="pwa-install-actions">
          <button type="button" className="pwa-install-primary" onClick={() => void promptInstall()}>
            Ana ekrana ekle
          </button>
          <button type="button" onClick={dismiss}>
            Kapat
          </button>
        </div>
      </section>
    );
  }

  if (ios) {
    return (
      <section className="pwa-install" aria-labelledby="pwa-install-title">
        <h3 id="pwa-install-title">📲 Ana ekrana ekle (iPhone / iPad)</h3>
        <ol>
          <li>Safari&apos;de alttaki Paylaş ⎋ düğmesine dokunun.</li>
          <li>&quot;Ana Ekrana Ekle ➕&quot; seçeneğini seçin.</li>
          <li>Sağ üstte &quot;Ekle&quot;ye dokunun.</li>
        </ol>
        <p>Ana ekrandan açılınca ilerleme Safari&apos;nin 7 günlük temizliğinden de korunur.</p>
        <div className="pwa-install-actions">
          <button type="button" onClick={dismiss}>
            Kapat
          </button>
        </div>
      </section>
    );
  }

  return null;
}
