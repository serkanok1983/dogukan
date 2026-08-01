import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BubbleBg } from "@/components/BubbleBg";
import { EncyclopediaTools } from "@/components/encyclopedia/EncyclopediaTools";
import { InteractiveLab } from "@/components/encyclopedia/InteractiveLab";
import { KnowledgeCheck } from "@/components/encyclopedia/KnowledgeCheck";
import { CATEGORIES, TOPICS, getTopic } from "@/lib/encyclopedia";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return TOPICS.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) return {};
  return {
    title: topic.title,
    description: topic.summary,
  };
}

export default async function EncyclopediaTopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();

  const category = CATEGORIES.find((item) => item.id === topic.category);
  const currentIndex = TOPICS.findIndex((item) => item.slug === topic.slug);
  const previous = currentIndex > 0 ? TOPICS[currentIndex - 1] : undefined;
  const next = currentIndex < TOPICS.length - 1 ? TOPICS[currentIndex + 1] : undefined;
  const narrationText = [
    topic.bigQuestion,
    topic.summary,
    ...topic.sections.flatMap((section) => [section.title, section.body]),
    ...topic.facts.flatMap((fact) => [fact.label, fact.value, fact.detail]),
  ].join(". ");

  return (
    <div
      className="encyclopedia-page encyclopedia-topic-page"
      style={{ "--topic-color": category?.color ?? "#0ea5e9" } as React.CSSProperties}
    >
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
        <Link href="/kesfet/" className="encyclopedia-back">
          <span aria-hidden>←</span> Tüm keşifler
        </Link>
        <span>{category?.emoji} {category?.title}</span>
        <span className="encyclopedia-topbar-mark" aria-hidden>{topic.emoji}</span>
      </header>

      <main className="encyclopedia-article" id="encyclopedia-main" tabIndex={-1}>
        <header className="topic-hero">
          <div className="topic-hero-visual" aria-hidden>
            <span>{topic.emoji}</span>
            <i />
            <i />
            <i />
          </div>
          <div className="topic-hero-copy">
            <span className="eyebrow">{category?.title} · {topic.readingTime}</span>
            <h1>{topic.title}</h1>
            <p className="topic-big-question">{topic.bigQuestion}</p>
            <p>{topic.summary}</p>
            <EncyclopediaTools
              slug={topic.slug}
              title={topic.title}
              narrationText={narrationText}
            />
          </div>
        </header>

        <section className="topic-reading" aria-label={`${topic.title} konu anlatımı`}>
          <div className="topic-reading-intro">
            <span aria-hidden>📖</span>
            <div>
              <small>Keşif hikâyesi</small>
              <strong>Önce oku veya “Bana oku” düğmesini kullan</strong>
            </div>
          </div>
          {topic.sections.map((section, index) => (
            <article className="topic-section" key={section.title}>
              <span className="topic-section-number" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2>{section.title}</h2>
                {section.body.split(/\n{2,}/).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="fact-shelf" aria-labelledby="facts-title">
          <div className="fact-shelf-heading">
            <small>Şaşırtıcı ama doğru</small>
            <h2 id="facts-title">Üç cep bilgisi</h2>
          </div>
          <div className="fact-cards">
            {topic.facts.map((fact, index) => (
              <article key={fact.label}>
                <span aria-hidden>{["✦", "⌁", "◎"][index % 3]}</span>
                <small>{fact.label}</small>
                <strong>{fact.value}</strong>
                <p>{fact.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <InteractiveLab mode={topic.lab} />

        <section className="home-mission" aria-labelledby="mission-title">
          <div className="mission-ticket" aria-hidden>GÖZLEM<br />BİLETİ</div>
          <div className="mission-copy">
            <small>Gerçek dünyada dene</small>
            <h2 id="mission-title">{topic.mission.title}</h2>
            <ol>
              {topic.mission.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            {topic.mission.safety ? (
              <p className="mission-safety">
                <span aria-hidden>🛟</span>
                <strong>Güvenlik:</strong> {topic.mission.safety}
              </p>
            ) : null}
          </div>
        </section>

        <section className="word-garden" aria-labelledby="words-title">
          <div>
            <small>Bilimin sözcükleri</small>
            <h2 id="words-title">Sözcük bahçesi</h2>
            <p>Bir sözcüğü öğrendiğinde, gördüğün şeyi daha açık anlatabilirsin.</p>
          </div>
          <dl>
            {topic.glossary.map((item) => (
              <div key={item.term}>
                <dt>{item.term}</dt>
                <dd>{item.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>

        <KnowledgeCheck slug={topic.slug} questions={topic.quiz} />

        {topic.relatedActivities.length ? (
          <section className="related-activities" aria-labelledby="related-activities-title">
            <div className="related-activities-heading">
              <span aria-hidden>🎮</span>
              <div>
                <small>Bağlantıyı oyunda yakala</small>
                <h2 id="related-activities-title">Keşfi oyunla sürdür</h2>
                <p>
                  Aynı fikri başka bir biçimde kullan. Oynarken hangi bilimsel
                  bağlantıyı gördüğünü kendi sözlerinle anlat.
                </p>
              </div>
            </div>
            <div className="related-activities-grid">
              {topic.relatedActivities.map((activity) => (
                <Link
                  key={activity.slug}
                  href={`/aktivite/${activity.slug}/`}
                  className="related-activity-card"
                >
                  <span className="related-activity-emoji" aria-hidden>
                    {activity.emoji}
                  </span>
                  <span>
                    <strong>{activity.title}</strong>
                    <small>{activity.reason}</small>
                  </span>
                  <b aria-hidden>→</b>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <aside className="parent-note">
          <span aria-hidden>💬</span>
          <div>
            <small>Büyüklere not</small>
            <h2>Birlikte konuşma ipucu</h2>
            <p>{topic.mission.parentNote}</p>
          </div>
        </aside>

        <nav className="topic-neighbors" aria-label="Diğer keşifler">
          {previous ? (
            <Link href={`/kesfet/${previous.slug}/`}>
              <small>Önceki keşif</small>
              <strong><span aria-hidden>{previous.emoji}</span> {previous.title}</strong>
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/kesfet/${next.slug}/`}>
              <small>Sıradaki keşif</small>
              <strong>{next.title} <span aria-hidden>{next.emoji}</span></strong>
            </Link>
          ) : null}
        </nav>
      </main>
    </div>
  );
}
