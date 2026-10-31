"use client";

import "./auth.css";
import Link from "next/link";
import { loginAs, useSession, type PlayerId } from "@/lib/auth";
import { unlockAudio } from "@/lib/speech";
import { sounds } from "@/lib/sounds";

/**
 * ParentGate geçildikten sonra ebeveynin seçenekleri: kendisi olarak oynamak
 * (leaderboard için `serkan`) ya da ebeveyn paneli. Çıkış düğmesi yoktur;
 * çıkış yalnızca `/bilgi`'den yapılır.
 */
export function ParentChoice({ onClose }: { onClose: () => void }) {
  const { player } = useSession();

  const playAs = (id: PlayerId) => {
    unlockAudio();
    sounds.unlock();
    loginAs(id);
    onClose();
  };

  return (
    <div className="auth-backdrop">
      <div className="auth-gate" role="dialog" aria-modal="true" aria-label="Ebeveyn seçenekleri">
        <h2 className="auth-gate-title">Anne-Baba</h2>
        <div className="auth-choices">
          {player !== "serkan" && (
            <button type="button" className="auth-primary" onClick={() => playAs("serkan")}>
              🎮 Baba olarak oyna
            </button>
          )}
          {player === "serkan" && (
            <button type="button" className="auth-primary" onClick={() => playAs("dogukan")}>
              🧒 Doğukan oynasın
            </button>
          )}
          <Link href="/bilgi/" className="auth-primary auth-secondary" onClick={onClose}>
            📊 Ebeveyn paneli
          </Link>
        </div>
        <button type="button" className="auth-cancel" onClick={onClose}>
          Kapat
        </button>
      </div>
    </div>
  );
}
