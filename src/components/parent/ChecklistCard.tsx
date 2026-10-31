"use client";

import { speak } from "@/lib/speech";
import { updateSettings, type Settings } from "@/lib/settings";

/** İlk açılış kontrol listesi (MASTER_PLAN §8 + proposals F10.4). */
export const CHECKLIST: readonly { id: string; text: string; action?: "tts" }[] = [
  { id: "install", text: "Uygulamayı telefonun ana ekranına ekleyin (tam ekran açılır, veriler daha güvende kalır)." },
  { id: "phone", text: "Telefon/OS: Android Chrome mu, iPhone Safari mi? Türkçe sesi deneyin.", action: "tts" },
  { id: "school", text: "Anaokulu mu, 1. sınıf mı? Sınıf hangi ses grubunda? (Defterin ilk sayfası yeter.)" },
  { id: "limits", text: "Varsayılan süreleri kontrol edin (30/45 dk, mola 25 dk, yatma 20:30). Okul saati kilidi gerekirse bize yazın." },
  { id: "baba", text: "“Baba ile” oyunları (dövüş/atış) kalsın mı? Yukarıdaki anahtardan." },
  { id: "rival", text: "Babayla rekabet çocuğa görünsün mü? (Varsayılan: hayır.)" },
  { id: "first", text: "İlk açılışı birlikte yapın: ayıya isim verin, ilk molada birlikte zıplayın." },
  { id: "jar", text: "3. gün kavanozu birlikte gösterin: oynarken azalır, öğrenirken dolar." },
  { id: "voice", text: "İsteğe bağlı: ses satırlarını kaydedin (docs/plan/VOICE_SCRIPT.md)." },
  { id: "firebase", text: "İsteğe bağlı: Firebase konsolu (anonim giriş + kurallar, docs/ROLLOUT.md)." },
  { id: "mom", text: "“Anne” için ikinci ebeveyn profili gerekli mi? Gerekirse bize yazın." },
];

export function checklistProgress(s: Settings): { done: number; total: number } {
  const map = s.parentChecklist ?? {};
  return { done: CHECKLIST.filter((c) => map[c.id]).length, total: CHECKLIST.length };
}

export function ChecklistCard({ s }: { s: Settings }) {
  const map = s.parentChecklist ?? {};
  const { done, total } = checklistProgress(s);
  return (
    <div className="parent-checklist" id="kurulum" data-field="parentChecklist">
      <h3 className="parent-sub">
        İlk kurulum listesi <span className="parent-muted">· {done}/{total}</span>
      </h3>
      <ul className="parent-list">
        {CHECKLIST.map((c) => (
          <li key={c.id} className="parent-check">
            <label>
              <input
                type="checkbox"
                checked={Boolean(map[c.id])}
                onChange={(e) => updateSettings({ parentChecklist: { ...map, [c.id]: e.target.checked } })}
              />
              <span>{c.text}</span>
            </label>
            {c.action === "tts" ? (
              <button type="button" className="parent-btn parent-btn-small" onClick={() => speak("Merhaba {ad}! Ben {ayı}.")}>
                🔊 Sesi dene
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
