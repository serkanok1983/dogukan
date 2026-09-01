"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { assetPath } from "@/lib/asset";
import { MENU, TOTAL_ACTIVITIES, type MenuCategory } from "@/lib/menu";
import { getPlayerDisplayName, getPlayerId, logout } from "@/lib/auth";
import { normalizeSearch } from "@/lib/utils";
import { sounds } from "@/lib/sounds";
import type { ActivityLearningPreviews } from "@/lib/activityLearning.types";

type Props = {
  onLogout: () => void;
  learningPreviews: ActivityLearningPreviews;
};

export function MenuScreen({ onLogout, learningPreviews }: Props) {
  const player = getPlayerId();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");

  const filtered = useMemo(() => {
    const q = normalizeSearch(search.trim());
    return MENU.map((cat) => ({
      ...cat,
      items: cat.items.filter((it) => {
        if (activeCat !== "all" && activeCat !== cat.id) return false;
        if (!q) return true;
        const learning = learningPreviews[it.slug];
        const searchText = [
          it.label,
          cat.title,
          learning?.concept,
          learning?.relatedTopicTitle,
        ]
          .filter(Boolean)
          .join(" ");
        return normalizeSearch(searchText).includes(q);
      }),
    })).filter((cat) => cat.items.length > 0);
  }, [search, activeCat, learningPreviews]);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <div className="menu-shell">
      <header className="menu-header">
        <div className="menu-header-top">
          <div className="menu-hero">
            <Image
              src={assetPath("/dogukan.jpg")}
              alt="Doğukan"
              width={96}
              height={96}
              className="menu-hero-photo"
            />
            <div>
              <h1>Doğukan&apos;ın Yeri</h1>
              <p className="tagline">
                {player
                  ? `Hoş geldin ${getPlayerDisplayName(player)}! Eğlenceli oyunlar seni bekliyor.`
                  : "Doğukan için eğlenceli oyunlar"}
              </p>
              <div className="stats">
                <span className="stat">
                  <strong>{TOTAL_ACTIVITIES}</strong> aktivite
                </span>
                <span className="stat">
                  <strong>{MENU.length}</strong> kategori
                </span>
              </div>
            </div>
          </div>
          <div className="menu-header-actions">
            {player === "serkan" && (
              <Link href="/bilgi/" className="btn-ghost btn-info" onClick={() => sounds.tap()}>
                📊 Bilgi
              </Link>
            )}
            <button type="button" className="btn-ghost" onClick={handleLogout}>
              Çıkış yap
            </button>
          </div>
        </div>
        <div className="search-wrap">
          <label className="sr-only" htmlFor="activity-search">
            Etkinlik adı, kavram veya ansiklopedi konusu ara
          </label>
          <span className="search-icon" aria-hidden>
            🔍
          </span>
          <input
            id="activity-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara… (ör. toplama, harf, gezegen)"
            autoComplete="off"
          />
        </div>
        <div className="category-tabs" role="group" aria-label="Etkinlik kategorisi filtresi">
          <button
            type="button"
            aria-pressed={activeCat === "all"}
            aria-controls="activity-menu-results"
            className={`tab ${activeCat === "all" ? "active" : ""}`}
            onClick={() => setActiveCat("all")}
          >
            Tümü
          </button>
          {MENU.map((cat) => (
            <button
              key={cat.id}
              type="button"
              aria-pressed={activeCat === cat.id}
              aria-controls="activity-menu-results"
              className={`tab ${activeCat === cat.id ? "active" : ""}`}
              onClick={() => setActiveCat(cat.id)}
            >
              {cat.icon} {cat.title}
            </button>
          ))}
        </div>
      </header>

      <main
        id="activity-menu-results"
        className="menu-body"
        role="region"
        aria-label={activeCat === "all" ? "Tüm etkinlikler" : `${MENU.find((cat) => cat.id === activeCat)?.title ?? "Etkinlik"} sonuçları`}
      >
        <p className="sr-only" role="status" aria-live="polite">
          {filtered.reduce((count, category) => count + category.items.length, 0)} etkinlik gösteriliyor.
        </p>
        <Link
          href="/kesfet/"
          className="merak-portal"
          onClick={() => sounds.star()}
        >
          <span className="merak-portal-visual" aria-hidden>
            <span>?</span>
            <i>🌱</i>
            <i>🌙</i>
            <i>🧲</i>
          </span>
          <span className="merak-portal-copy">
            <small>Yeni · Temel Bilimler</small>
            <strong>Merak Ansiklopedisi</strong>
            <span>
              Sesli hikâyeler, dokunarak deneyler ve gerçek dünya görevleriyle
              14 büyük keşif.
            </span>
            <b>Keşfetmeye başla →</b>
          </span>
        </Link>
        {filtered.length === 0 ? (
          <p className="empty-search">Sonuç bulunamadı. Başka bir kelime dene!</p>
        ) : (
          filtered.map((cat) => (
            <MenuSection
              key={cat.id}
              cat={cat}
              learningPreviews={learningPreviews}
            />
          ))
        )}
      </main>
    </div>
  );
}

function MenuSection({
  cat,
  learningPreviews,
}: {
  cat: MenuCategory & { items: MenuCategory["items"] };
  learningPreviews: ActivityLearningPreviews;
}) {
  const headingId = `menu-category-${cat.id}`;
  return (
    <section className="menu-section" aria-labelledby={headingId}>
      <div className="section-head">
        <span className="icon">{cat.icon}</span>
        <h2 id={headingId}>{cat.title}</h2>
        <span className="count">{cat.items.length}</span>
      </div>
      <div className="card-grid">
        {cat.items.map((it) => {
          const learning = learningPreviews[it.slug];
          return (
            <article
              key={it.slug}
              className="menu-card-wrap"
              style={{ "--card-accent": cat.accent } as React.CSSProperties}
            >
              <Link
                href={`/aktivite/${it.slug}/`}
                className="menu-card"
                onClick={() => sounds.tap()}
              >
                <span className="card-emoji" aria-hidden="true">
                  {it.emoji}
                </span>
                <span className="card-copy">
                  <span className="card-label">{it.label}</span>
                  {learning ? (
                    <span className="card-concept">💡 {learning.concept}</span>
                  ) : null}
                </span>
                <span className="card-play" aria-hidden="true">
                  ▶
                </span>
              </Link>
              {learning ? (
                <Link
                  href={`/kesfet/${learning.relatedTopicSlug}/`}
                  className="menu-knowledge-link"
                  prefetch={false}
                  onClick={() => sounds.star()}
                  aria-label={`${it.label} ile ilgili ${learning.relatedTopicTitle} ansiklopedi keşfine git`}
                >
                  <span aria-hidden="true">{learning.relatedTopicEmoji}</span>
                  <span>{learning.relatedTopicTitle}</span>
                  <b aria-hidden="true">→</b>
                </Link>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
