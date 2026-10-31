"use client";

import { dayKey } from "@/lib/progress/time";
import type { Progress, SessionEndReason } from "@/lib/progress/types";
import { Card } from "./Card";
import { dayLabel, ENDED_LABELS, formatMin, playsByDay } from "./parentData";

const REASONS: readonly SessionEndReason[] = ["map", "background", "limit", "bedtime", "run_end"];

export function PlaysCard({ p, now }: { p: Progress; now: number }) {
  const today = dayKey(now);
  const days = playsByDay(p, today, 7);
  return (
    <Card id="ne-oynadi" title="Ne oynadı" icon="🎮">
      {days.length === 0 ? (
        <p className="parent-muted">Son 7 günde kayıt yok.</p>
      ) : (
        days.map((d) => {
          const ended = REASONS.filter((r) => d.endedBy[r] > 0)
            .map((r) => `${ENDED_LABELS[r]} ${d.endedBy[r]}`)
            .join(" · ");
          return (
            <div key={d.day} className="parent-day">
              <h3 className="parent-sub">
                {dayLabel(d.day, today)} <span className="parent-muted">· {formatMin(d.totalSec)}</span>
              </h3>
              {d.items.length ? (
                <ul className="parent-plays">
                  {d.items.map((it) => (
                    <li key={it.slug}>
                      <span aria-hidden>{it.emoji}</span> {it.label}
                      <span className="parent-muted">
                        {" "}
                        · {formatMin(it.sec)}
                        {it.runs > 0 ? ` · ${it.runs} tur` : ""}
                        {it.stars > 0 ? ` · ${"⭐".repeat(it.stars)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="parent-muted">Haritada / menüde vakit geçirdi.</p>
              )}
              {ended ? <p className="parent-note">Nasıl bitti: {ended}</p> : null}
              {d.bedtimeBlocks > 0 ? <p className="parent-note">Gece açma denemesi: {d.bedtimeBlocks}</p> : null}
            </div>
          );
        })
      )}
    </Card>
  );
}
