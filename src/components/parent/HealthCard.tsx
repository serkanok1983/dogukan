"use client";

import { isParentPinConfigured } from "@/lib/auth";
import { readErrors } from "@/lib/errors";
import { isFirebaseConfigured } from "@/lib/firebaseConfig";
import { addDays, dayKey, TIME_ZONE } from "@/lib/progress/time";
import type { Progress } from "@/lib/progress/types";
import { getVoiceName, hasTurkishVoice, isSpeechSupported, speak } from "@/lib/speech";
import { Card } from "./Card";

const clockFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TIME_ZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

export function HealthCard({ p, now }: { p: Progress; now: number }) {
  const errors = readErrors().slice().reverse();
  const firebase = isFirebaseConfigured();
  const pin = isParentPinConfigured();
  const tts = isSpeechSupported();
  const voice = getVoiceName();
  const turkish = hasTurkishVoice();
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = dayKey(now);
  const jumps = Array.from({ length: 7 }, (_, i) => p.days[addDays(today, -i)]?.clockJumps ?? 0).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <Card id="saglik" title="Sağlık" icon="🩺">
      <ul className="parent-facts">
        <li>
          🕰️ Telefon saati: {now ? clockFormat.format(now) : "—"} (İstanbul)
          {deviceZone && deviceZone !== TIME_ZONE ? ` · cihaz saat dilimi: ${deviceZone}` : ""}
        </li>
        <li>{jumps > 0 ? `⚠️ Son 7 günde ${jumps} saat atlaması kaydedildi (yalnızca kayıt, kilit yok).` : "✓ Saat atlaması yok."}</li>
        <li>
          {firebase
            ? "☁️ Firebase yapılandırılmış: gün özetleri eşitlenir."
            : "📱 Bu cihazda yerel; Firebase yok. Veriler yalnızca bu telefonda."}
        </li>
        <li>{pin ? "🔐 Ebeveyn PIN'i ayarlı." : "⚠️ PIN ayarlı değil: panel yalnızca toplama sorusuyla korunuyor."}</li>
        <li>
          {!tts
            ? "🔇 Bu tarayıcı sesli okumayı desteklemiyor."
            : turkish
              ? `🗣️ Türkçe ses: ${voice ?? "bulundu"} ✓`
              : "⚠️ Türkçe ses bulunamadı. Google Metin Okuma'da Türkçe sesi indirin."}
          <button type="button" className="parent-btn parent-btn-small" onClick={() => speak("Merhaba {ad}! Ben {ayı}.")}>
            🔊 Dene
          </button>
        </li>
      </ul>
      <h3 className="parent-sub">Çökmeler</h3>
      {errors.length === 0 ? (
        <p className="parent-muted">Kayıtlı çökme yok.</p>
      ) : (
        <ul className="parent-errors">
          {errors.map((e, i) => (
            <li key={`${e.at}-${i}`}>
              <strong>{e.slug ?? "genel"}</strong> · {new Date(e.at).toLocaleString("tr-TR")}
              <br />
              <code>{e.message}</code>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
