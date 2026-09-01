import Link from "next/link";
import type { ActivityLearning } from "@/lib/activityLearning.types";

type Props = {
  title: string;
  learning: ActivityLearning;
};

export function ActivityKnowledgePanel({ title, learning }: Props) {
  const headingId = `activity-knowledge-${learning.relatedTopic.slug}`;

  return (
    <section
      id="oyunun-fikri"
      className="activity-knowledge"
      aria-labelledby={headingId}
    >
      <div className="activity-knowledge-ribbon" aria-hidden="true">
        <span>OYUN</span>
        <i>→</i>
        <span>MERAK</span>
        <i>→</i>
        <span>BİLGİ</span>
      </div>

      <header className="activity-knowledge-head">
        <div className="activity-knowledge-mark" aria-hidden="true">
          💡
        </div>
        <div>
          <p className="activity-knowledge-eyebrow">{title} · Keşif kartı</p>
          <h2 id={headingId}>Bu oyunda hangi fikri keşfediyorum?</h2>
          <p className="activity-knowledge-lead">{learning.idea}</p>
        </div>
      </header>

      <div className="activity-knowledge-grid">
        <article className="activity-knowledge-note concept-note">
          <span className="activity-knowledge-note-icon" aria-hidden="true">
            🔎
          </span>
          <div>
            <h3>Temel kavram</h3>
            <strong>{learning.concept.term}</strong>
            <p>{learning.concept.definition}</p>
          </div>
        </article>

        <article className="activity-knowledge-note life-note">
          <span className="activity-knowledge-note-icon" aria-hidden="true">
            🏡
          </span>
          <div>
            <h3>Gerçek hayatta nerede?</h3>
            <p>{learning.realLife}</p>
          </div>
        </article>

        <article className="activity-knowledge-note talk-note">
          <span className="activity-knowledge-note-icon" aria-hidden="true">
            💬
          </span>
          <div>
            <h3>Birlikte konuşalım</h3>
            <p>{learning.talkQuestion}</p>
            <small>Tek bir doğru cümle aramayın; tahmini ve gerekçesini konuşun.</small>
          </div>
        </article>
      </div>

      <Link
        href={`/kesfet/${learning.relatedTopic.slug}/`}
        className="activity-knowledge-link"
        aria-label={`${learning.relatedTopic.title} ansiklopedi keşfine git`}
      >
        <span className="activity-knowledge-topic-icon" aria-hidden="true">
          {learning.relatedTopic.emoji}
        </span>
        <span>
          <small>Ansiklopedide devam et</small>
          <strong>{learning.relatedTopic.title}</strong>
          <span>{learning.relatedTopic.summary}</span>
        </span>
        <b aria-hidden="true">→</b>
      </Link>
    </section>
  );
}
