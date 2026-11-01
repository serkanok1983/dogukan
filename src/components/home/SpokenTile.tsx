"use client";

import "./home.css";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { sayOnly, useSpokenNav } from "./spokenNav";

type Props = {
  href: string;
  emoji?: string;
  /** Emoji yerine etiketin üstünde gösterilecek görsel. */
  visual?: ReactNode;
  label: string;
  /** Dokununca söylenen tek kelimelik etiket; varsayılan `label`. */
  say?: string;
  /** 🔊 çipinin söylediği; varsayılan `say`. */
  chipSay?: string;
  accent?: string;
  className?: string;
  /** Sağ üstte küçük rozet (💤, ✓, 🆕…). */
  badge?: string;
  /** Verilirse gezinme yerine bu çalışır (kapı, uyuyan ada). */
  onActivate?: () => void;
  children?: ReactNode;
};

/**
 * Konuşan kutucuk (MASTER_PLAN K18): dokun → etiketi söyle → `onEnd` ya da en geç
 * 600 ms sonra git. Görünür 🔊 çipi etiketi tekrarlar. Uzun basma yoktur.
 */
export function SpokenTile({
  href,
  emoji,
  visual,
  label,
  say,
  chipSay,
  accent,
  className,
  badge,
  onActivate,
  children,
}: Props) {
  const go = useSpokenNav();
  const spoken = say ?? label;
  return (
    <div
      className="home-tile-wrap"
      style={accent ? ({ "--tile-accent": accent } as CSSProperties) : undefined}
    >
      <Link
        href={href}
        className={className ? `home-tile ${className}` : "home-tile"}
        onClick={(e) => {
          e.preventDefault();
          if (onActivate) onActivate();
          else go(spoken, href);
        }}
      >
        {visual ??
          (emoji && (
            <span className="home-tile-emoji" aria-hidden>
              {emoji}
            </span>
          ))}
        <span className="home-tile-label" lang="tr">
          {label}
        </span>
        {children}
        {badge && (
          <span className="home-tile-badge" aria-hidden>
            {badge}
          </span>
        )}
      </Link>
      <button
        type="button"
        className="home-chip"
        aria-label={`${label}: tekrar dinle`}
        onClick={() => sayOnly(chipSay ?? spoken)}
      >
        <span aria-hidden>🔊</span>
      </button>
    </div>
  );
}

/** 0–3 yıldız satırı. */
export function StarRow({ stars }: { stars: number }) {
  return (
    <span className="home-stars" aria-label={`${stars} yıldız`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={i < stars ? "home-star is-on" : "home-star"}
          aria-hidden
        >
          ★
        </span>
      ))}
    </span>
  );
}
