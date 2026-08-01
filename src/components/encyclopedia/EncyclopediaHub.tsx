"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CategoryId, EncyclopediaCategory } from "@/lib/encyclopedia";
import {
  countCompleted,
  readEncyclopediaProgress,
  type EncyclopediaProgress,
} from "@/lib/encyclopediaProgress";
import { normalizeSearch } from "@/lib/utils";
import { sounds } from "@/lib/sounds";

export type EncyclopediaTopicSummary = {
  slug: string;
  category: CategoryId;
  title: string;
  emoji: string;
  bigQuestion: string;
  summary: string;
  readingTime: string;
};

type Props = {
  categories: EncyclopediaCategory[];
  topics: EncyclopediaTopicSummary[];
};

export function EncyclopediaHub({ categories, topics }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | CategoryId>("all");
  const [progress, setProgress] = useState<EncyclopediaProgress>({});

  useEffect(() => {
    const refresh = () => setProgress(readEncyclopediaProgress());
    refresh();
    window.addEventListener("dogukan-encyclopedia-progress", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("dogukan-encyclopedia-progress", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const visible = useMemo(() => {
    const needle = normalizeSearch(query.trim());
    return topics.filter((topic) => {
      if (category !== "all" && topic.category !== category) return false;
      if (!needle) return true;
      const categoryTitle = categories.find((item) => item.id === topic.category)?.title ?? "";
      return normalizeSearch(
        `${topic.title} ${topic.bigQuestion} ${topic.summary} ${categoryTitle}`,
      ).includes(needle);
    });
  }, [categories, category, query, topics]);

  const completed = countCompleted(progress);
  const lastVisited = Object.entries(progress)
    .filter(([, entry]) => entry.lastVisited)
    .toSorted((a, b) =>
      String(b[1].lastVisited).localeCompare(String(a[1].lastVisited)),
    )[0]?.[0];
  const continueTopic = topics.find((topic) => topic.slug === lastVisited && !progress[topic.slug]?.complete);

  return (
    <>
      <section className="encyclopedia-progress-card" aria-label="Keşif ilerlemesi">
        <div>
          <span className="eyebrow">Merak haritan</span>
          <strong>{completed} / {topics.length} keşif tamamlandı</strong>
          <p>Her keşifte bir fikri dene, gözle ve kendi sözlerinle anlat.</p>
        </div>
        <div
          className="encyclopedia-progress-ring"
          style={{ "--progress": `${Math.round((completed / topics.length) * 360)}deg` } as React.CSSProperties}
          aria-label={`Yüzde ${Math.round((completed / topics.length) * 100)} tamamlandı`}
        >
          <span>{Math.round((completed / topics.length) * 100)}%</span>
        </div>
      </section>

      {continueTopic ? (
        <Link
          href={`/kesfet/${continueTopic.slug}/`}
          className="continue-discovery"
          onClick={() => sounds.tap()}
        >
          <span className="continue-emoji" aria-hidden>{continueTopic.emoji}</span>
          <span>
            <small>Kaldığın yerden</small>
            <strong>{continueTopic.title}</strong>
            <span>{continueTopic.bigQuestion}</span>
          </span>
          <b aria-hidden>→</b>
        </Link>
      ) : null}

      <section className="encyclopedia-controls" aria-labelledby="discoveries-title">
        <div>
          <span className="eyebrow">Yedi keşif dünyası</span>
          <h2 id="discoveries-title">Bugün neyi merak ediyorsun?</h2>
        </div>
        <label className="encyclopedia-search">
          <span aria-hidden>⌕</span>
          <span className="sr-only">Keşiflerde ara</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Örneğin: gölge, kalp, mıknatıs…"
          />
        </label>
        <div className="encyclopedia-tabs" role="group" aria-label="Keşif dünyasını seç">
          <button
            type="button"
            className={category === "all" ? "active" : ""}
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            ✦ Hepsi
          </button>
          {categories.map((item) => (
            <button
              type="button"
              key={item.id}
              className={category === item.id ? "active" : ""}
              aria-pressed={category === item.id}
              onClick={() => {
                sounds.tap();
                setCategory(item.id);
              }}
            >
              {item.emoji} {item.title}
            </button>
          ))}
        </div>
      </section>

      {visible.length ? (
        <div className="discovery-grid">
          {visible.map((topic, index) => {
            const topicCategory = categories.find((item) => item.id === topic.category);
            const state = progress[topic.slug];
            return (
              <Link
                key={topic.slug}
                href={`/kesfet/${topic.slug}/`}
                className={`discovery-card ${state?.complete ? "is-complete" : ""}`}
                style={{
                  "--world-color": topicCategory?.color ?? "#0ea5e9",
                  "--delay": `${Math.min(index, 8) * 45}ms`,
                } as React.CSSProperties}
                onClick={() => sounds.tap()}
              >
                <span className="discovery-card-top">
                  <span className="discovery-emoji" aria-hidden>{topic.emoji}</span>
                  <span className="discovery-time">{topic.readingTime}</span>
                </span>
                <small>{topicCategory?.title}</small>
                <h3>{topic.title}</h3>
                <p className="discovery-question">{topic.bigQuestion}</p>
                <p>{topic.summary}</p>
                <span className="discovery-card-bottom">
                  <b>{state?.complete ? "Yeniden keşfet" : "Keşfe başla"}</b>
                  <span aria-hidden>{state?.complete ? "✓" : "→"}</span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty-discoveries" role="status">
          <span aria-hidden>🔭</span>
          <h3>Bu pusulada henüz bir iz bulamadık.</h3>
          <p>Başka bir sözcük dene ya da “Hepsi” dünyasına dön.</p>
          <button type="button" onClick={() => { setQuery(""); setCategory("all"); }}>
            Tüm keşifleri göster
          </button>
        </div>
      )}
    </>
  );
}
