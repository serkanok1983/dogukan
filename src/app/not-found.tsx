import type { Metadata } from "next";
import Link from "next/link";
import { SayButton } from "@/components/SayButton";

export const metadata: Metadata = { title: "Sayfa bulunamadı" };

/** out/404.html olur. Sunucu bileşeni; depolama okumaz (S8). */
export default function NotFound() {
  return (
    <main className="err-page">
      <div className="err-card err-card-page">
        <div className="err-card-emoji" aria-hidden>
          🧭
        </div>
        <div className="err-card-title">
          <h2>Burası boş 🙈</h2>
          <SayButton text="Burası boş. Haritaya dönelim." />
        </div>
        <div className="err-card-actions">
          <Link href="/" className="err-btn err-btn-retry">
            Haritaya dön 🗺️
          </Link>
        </div>
      </div>
    </main>
  );
}
