"use client";

import { useEffect, useState } from "react";
import {
  readEncyclopediaProgress,
  updateEncyclopediaProgress,
} from "@/lib/encyclopediaProgress";
import { sounds } from "@/lib/sounds";

type Props = {
  slug: string;
  title: string;
  narrationText: string;
};

function findTurkishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return voices.find((voice) => voice.lang.toLocaleLowerCase("tr").startsWith("tr"));
}

export function EncyclopediaTools({ slug, title, narrationText }: Props) {
  const [favorite, setFavorite] = useState(false);
  const [complete, setComplete] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speechMessage, setSpeechMessage] = useState("");

  useEffect(() => {
    const refresh = () => {
      const saved = readEncyclopediaProgress()[slug];
      setFavorite(Boolean(saved?.favorite));
      setComplete(Boolean(saved?.complete));
    };
    updateEncyclopediaProgress(slug, { lastVisited: new Date().toISOString() });
    const frame = window.requestAnimationFrame(refresh);
    window.addEventListener("dogukan-encyclopedia-progress", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("dogukan-encyclopedia-progress", refresh);
      window.removeEventListener("storage", refresh);
      window.speechSynthesis?.cancel();
    };
  }, [slug]);

  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) {
      setSpeechMessage("Bu tarayıcı sesli anlatımı desteklemiyor. Metnin tamamı ekranda.");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setSpeechMessage("Sesli anlatım durdu.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(`${title}. ${narrationText}`);
    utterance.lang = "tr-TR";
    utterance.rate = 0.9;
    utterance.pitch = 1.04;
    const voice = findTurkishVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      setSpeaking(false);
      setSpeechMessage("Sesli anlatım tamamlandı.");
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setSpeechMessage("Sesli anlatım başlatılamadı; metin ekranda okunabilir.");
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
    setSpeechMessage("Sesli anlatım başladı.");
  };

  return (
    <div className="encyclopedia-tools" aria-label="Keşif araçları">
      <button
        type="button"
        className={speaking ? "active" : ""}
        aria-pressed={speaking}
        onClick={toggleSpeech}
      >
        <span aria-hidden>{speaking ? "■" : "🔊"}</span>
        {speaking ? "Durdur" : "Bana oku"}
      </button>
      <button
        type="button"
        className={favorite ? "active" : ""}
        aria-pressed={favorite}
        onClick={() => {
          const next = !favorite;
          setFavorite(next);
          updateEncyclopediaProgress(slug, { favorite: next });
          sounds.star();
        }}
      >
        <span aria-hidden>{favorite ? "★" : "☆"}</span>
        {favorite ? "Favorimde" : "Favorime ekle"}
      </button>
      <button
        type="button"
        className={complete ? "active complete" : ""}
        aria-pressed={complete}
        onClick={() => {
          const next = !complete;
          setComplete(next);
          updateEncyclopediaProgress(slug, { complete: next });
          if (next) sounds.win();
          else sounds.tap();
        }}
      >
        <span aria-hidden>{complete ? "✓" : "○"}</span>
        {complete ? "Keşfettim!" : "Keşfi tamamla"}
      </button>
      <span className="sr-only" aria-live="polite">{speechMessage}</span>
    </div>
  );
}
