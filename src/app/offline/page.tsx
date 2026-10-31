import type { Metadata } from "next";
import Link from "next/link";
import { SayButton } from "@/components/SayButton";

export const metadata: Metadata = { title: "İnternet yok" };

/**
 * Service worker, hiç açılmamış bir sayfa çevrimdışı istenirse bunu gösterir
 * (public/sw.js). Önbelleğe alınır; depolama okumaz (S8).
 */
export default function OfflinePage() {
  return (
    <main className="err-page">
      <div className="err-card err-card-page">
        <div className="err-card-emoji" aria-hidden>
          📶
        </div>
        <div className="err-card-title">
          <h2>Bu oyun için bir kez internete bağlan 📶</h2>
          <SayButton text="Bu oyun için bir kez internete bağlan. Sonra internetsiz de oynarsın." />
        </div>
        <p className="err-card-note">Daha önce açtığın oyunlar internetsiz de çalışır.</p>
        <div className="err-card-actions">
          <Link href="/" className="err-btn err-btn-retry">
            Haritaya dön 🗺️
          </Link>
        </div>
      </div>
    </main>
  );
}
