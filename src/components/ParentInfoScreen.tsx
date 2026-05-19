"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchDogukanActivity,
  subscribeDogukanActivity,
  type ActivitySummary,
  type LoginEvent,
  type VisitEvent,
} from "@/lib/activityLog";
import { isFirebaseConfigured } from "@/lib/firebase";
import { findActivity } from "@/lib/menu";

function groupVisitsByDay(visits: VisitEvent[]) {
  const map = new Map<string, VisitEvent[]>();
  for (const v of visits) {
    const day = new Date(v.at).toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(v);
  }
  return [...map.entries()];
}

export function ParentInfoScreen() {
  const [data, setData] = useState<ActivitySummary>({ logins: [], visits: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchDogukanActivity().then((d) => {
      setData(d);
      setLoading(false);
    });
    const unsub = subscribeDogukanActivity(setData);
    return () => unsub?.();
  }, []);

  const visitDays = groupVisitsByDay(data.visits);

  return (
    <div className="info-page">
      <header className="info-header">
        <Link href="/" className="back-btn">
          ← Ana sayfa
        </Link>
        <h1>📊 Bilgi — Doğukan</h1>
        <p className="info-sub">
          Doğukan&apos;ın siteye girişleri ve gezdiği sayfalar (Firebase ile senkron).
        </p>
      </header>

      {!isFirebaseConfigured() && (
        <p className="info-warn" role="alert">
          Firebase yapılandırılmamış; kayıtlar görüntülenemiyor.
        </p>
      )}

      {loading ? (
        <p className="info-loading">Yükleniyor…</p>
      ) : (
        <>
          <section className="info-section">
            <h2>🚪 Girişler</h2>
            {data.logins.length === 0 ? (
              <p className="info-empty">Henüz kayıtlı giriş yok.</p>
            ) : (
              <ul className="info-list">
                {data.logins.slice(0, 30).map((e: LoginEvent, i) => (
                  <li key={`${e.at}-${i}`}>
                    <time dateTime={new Date(e.at).toISOString()}>{e.iso}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="info-section">
            <h2>🧭 Gezilen sayfalar</h2>
            {data.visits.length === 0 ? (
              <p className="info-empty">Henüz sayfa ziyareti kaydı yok.</p>
            ) : (
              visitDays.map(([day, items]) => (
                <div key={day} className="info-day-group">
                  <h3>{day}</h3>
                  <ul className="info-list">
                    {items.map((v, i) => {
                      const label = findActivity(v.slug)?.label ?? v.title;
                      return (
                        <li key={`${v.at}-${i}`}>
                          <time dateTime={new Date(v.at).toISOString()}>{v.iso}</time>
                          <span className="info-visit-label">
                            {label}
                            {v.slug !== "ana-sayfa" && (
                              <span className="info-visit-slug"> ({v.slug})</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
