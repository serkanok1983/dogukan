"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SayButton } from "@/components/SayButton";
import { sounds } from "@/lib/sounds";
import { speak } from "@/lib/speech";

type Props = {
  /** Ekranda görünen başlık (emoji dahil). */
  title: string;
  /** Başlığın sesli hâli (emoji yok). */
  say: string;
  onRetry: () => void;
  /** "page": tüm ekranı kaplar; "game": oyun alanının içinde kalır (üst çubuk yaşar). */
  variant?: "page" | "game";
};

/**
 * Çocuğa gösterilen hata kartı (S8). Hata mesajı asla gösterilmez; tek bir
 * yumuşak ses ve sesli cümle, iki dev düğme: "Tekrar dene" ve "Haritaya dön".
 */
export function ErrorCard({ title, say, onRetry, variant = "page" }: Props) {
  useEffect(() => {
    sounds.softWrong();
    speak(say);
  }, [say]);

  return (
    <div className={`err-card err-card-${variant}`} role="alert">
      <div className="err-card-emoji" aria-hidden>
        🐻
      </div>
      <div className="err-card-title">
        <h2>{title}</h2>
        <SayButton text={say} />
      </div>
      <div className="err-card-actions">
        <button type="button" className="err-btn err-btn-retry" onClick={onRetry}>
          Tekrar dene 🔁
        </button>
        <Link href="/" className="err-btn err-btn-home">
          Haritaya dön 🗺️
        </Link>
      </div>
    </div>
  );
}
