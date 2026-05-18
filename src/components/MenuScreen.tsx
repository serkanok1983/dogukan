"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { assetPath } from "@/lib/asset";
import { MENU, TOTAL_ACTIVITIES, type MenuCategory } from "@/lib/menu";
import { logout } from "@/lib/auth";
import { normalizeSearch } from "@/lib/utils";
import { sounds } from "@/lib/sounds";

type Props = { onLogout: () => void };

export function MenuScreen({ onLogout }: Props) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");

  const filtered = useMemo(() => {
    const q = normalizeSearch(search.trim());
    return MENU.map((cat) => ({
      ...cat,
      items: cat.items.filter((it) => {
        if (activeCat !== "all" && activeCat !== cat.id) return false;
        if (!q) return true;
        return normalizeSearch(it.label).includes(q) || normalizeSearch(cat.title).includes(q);
      }),
    })).filter((cat) => cat.items.length > 0);
  }, [search, activeCat]);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <div className="menu-shell">
      <header className="menu-header">
        <div className="menu-header-top">
          <div className="menu-hero">
            <img
              src={assetPath("/dogukan.jpg")}
              alt="Doğukan"
              width={96}
              height={96}
              className="menu-hero-photo"
            />
            <div>
              <h1>Doğukan&apos;ın Dünyası</h1>
              <p className="tagline">İlkokul için eğlenceli öğrenme oyunları</p>
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
          <button type="button" className="btn-ghost" onClick={handleLogout}>
            Çıkış yap
          </button>
        </div>
        <div className="search-wrap">
          <span className="search-icon" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara… (ör. toplama, harf, gezegen)"
            autoComplete="off"
          />
        </div>
        <div className="category-tabs" role="tablist">
          <button
            type="button"
            className={`tab ${activeCat === "all" ? "active" : ""}`}
            onClick={() => setActiveCat("all")}
          >
            Tümü
          </button>
          {MENU.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`tab ${activeCat === cat.id ? "active" : ""}`}
              onClick={() => setActiveCat(cat.id)}
            >
              {cat.icon} {cat.title}
            </button>
          ))}
        </div>
      </header>

      <main className="menu-body">
        {filtered.length === 0 ? (
          <p className="empty-search">Sonuç bulunamadı. Başka bir kelime dene!</p>
        ) : (
          filtered.map((cat) => (
            <MenuSection key={cat.id} cat={cat} />
          ))
        )}
      </main>
    </div>
  );
}

function MenuSection({ cat }: { cat: MenuCategory & { items: MenuCategory["items"] } }) {
  return (
    <section className="menu-section">
      <div className="section-head">
        <span className="icon">{cat.icon}</span>
        <h2>{cat.title}</h2>
        <span className="count">{cat.items.length}</span>
      </div>
      <div className="card-grid">
        {cat.items.map((it) => (
          <Link
            key={it.slug}
            href={`/aktivite/${it.slug}/`}
            className="menu-card"
            style={{ "--card-accent": cat.accent } as React.CSSProperties}
            onClick={() => sounds.tap()}
          >
            <span className="card-emoji">{it.emoji}</span>
            <span className="card-label">{it.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
