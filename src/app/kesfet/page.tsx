import type { Metadata } from "next";
import Link from "next/link";
import { BubbleBg } from "@/components/BubbleBg";
import {
  EncyclopediaHub,
  type EncyclopediaTopicSummary,
} from "@/components/encyclopedia/EncyclopediaHub";
import { CATEGORIES, TOPICS } from "@/lib/encyclopedia";

export const metadata: Metadata = {
  title: "Merak Ansiklopedisi",
  description:
    "Doğukan için sesli hikâyeler, dokunarak mini deneyler ve açıklamalı sorularla temel bilimler ansiklopedisi.",
};

const topicSummaries: EncyclopediaTopicSummary[] = TOPICS.map(
  ({ slug, category, title, emoji, bigQuestion, summary, readingTime }) => ({
    slug,
    category,
    title,
    emoji,
    bigQuestion,
    summary,
    readingTime,
  }),
);

export default function KesfetPage() {
  return (
    <div className="encyclopedia-page">
      <a className="encyclopedia-skip" href="#encyclopedia-main">
        Ana içeriğe geç
      </a>
      <BubbleBg />
      <div className="encyclopedia-sky" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <header className="encyclopedia-topbar">
        <Link href="/" className="encyclopedia-back">
          <span aria-hidden>←</span> Ana sayfa
        </Link>
        <span>Merak Ansiklopedisi</span>
        <span className="encyclopedia-topbar-mark" aria-hidden>✦</span>
      </header>
      <main className="encyclopedia-main" id="encyclopedia-main" tabIndex={-1}>
        <header className="encyclopedia-hero">
          <div className="encyclopedia-hero-copy">
            <span className="eyebrow">Dinle · dokun · gözle · anlat</span>
            <h1>
              Merak edince
              <span>bilim başlar.</span>
            </h1>
            <p>
              Burada ezberlenecek uzun listeler yok. Her keşifte önce bir soru
              soracak, küçük bir modelle oynayacak ve gördüğünü kendi sözlerinle
              anlatacaksın.
            </p>
            <div className="encyclopedia-hero-badges" aria-label="Ansiklopedi özellikleri">
              <span>🔊 Sesli anlatım</span>
              <span>🧪 14 mini laboratuvar</span>
              <span>🏠 Güvenli ev gözlemleri</span>
            </div>
          </div>
          <div className="encyclopedia-orbit-visual" aria-hidden>
            <span className="orbit-core">?</span>
            <span className="orbit orbit-one"><i>🌱</i></span>
            <span className="orbit orbit-two"><i>🌙</i></span>
            <span className="orbit orbit-three"><i>🧲</i></span>
          </div>
        </header>

        <EncyclopediaHub categories={CATEGORIES} topics={topicSummaries} />

        <aside className="encyclopedia-promise">
          <span aria-hidden>🤝</span>
          <div>
            <strong>Merak sözümüz</strong>
            <p>
              Yanlış tahminler kötü değildir. Bilimde tahmin eder, dener,
              gözlemimizi yeni kanıta göre değiştiririz.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
