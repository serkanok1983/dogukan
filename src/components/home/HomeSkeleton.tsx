import "./home.css";
import type { CSSProperties } from "react";
import { WORLDS } from "@/lib/worlds";

/**
 * Sunucuda çizilen harita iskeleti (MASTER_PLAN §2.4): JS gelmeden önce ekran
 * boş kalmasın. Depolama okumaz. `HomeClient` hazır olunca kendi kökünü
 * (`.home-live`) bu öğeden önce çizer ve CSS kardeş seçicisi iskeleti gizler.
 */
export function HomeSkeleton() {
  const worlds = WORLDS.filter((w) => w.gated !== "coplay");
  return (
    <div className="home-skeleton" aria-busy="true">
      <div className="home-map">
        <div className="home-bar home-bar-skeleton" aria-hidden>
          <span className="home-bear-btn">
            <span className="home-bear" style={{ "--bear-size": "56px" } as CSSProperties}>
              <span className="home-bear-face">🐻</span>
            </span>
          </span>
        </div>
        <ul className="home-islands">
          {worlds.map((w) => (
            <li key={w.id}>
              <div className="home-tile-wrap" style={{ "--tile-accent": w.accent } as CSSProperties}>
                <div className="home-tile home-island">
                  <span className="home-island-ring" aria-hidden>
                    <span className="home-island-emoji">{w.emoji}</span>
                  </span>
                  <span className="home-tile-label">{w.name}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
