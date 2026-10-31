"use client";

import { dayKey } from "@/lib/progress/time";
import type { Progress } from "@/lib/progress/types";
import { Card } from "./Card";
import { formatMin, minutes, weekBars, weekVerdict } from "./parentData";

export function WeekCard({ p, now }: { p: Progress; now: number }) {
  const today = dayKey(now);
  const bars = weekBars(p, today);
  const verdict = weekVerdict(p, today);
  const maxSec = Math.max(60 * 30, ...bars.map((b) => b.totalSec));
  const streak = p.rewards.streak.count;

  return (
    <Card id="hafta" title="Bu hafta" icon="📊">
      <p className={verdict.ok ? "parent-verdict is-ok" : "parent-verdict"}>{verdict.text}</p>
      <div className="parent-bars" role="img" aria-label="Son 7 gün, dakika">
        {bars.map((b) => (
          <div key={b.day} className="parent-bar-col">
            <div className="parent-bar" title={`${b.label}: ${formatMin(b.totalSec)}`}>
              <span className="parent-bar-seg is-arcade" style={{ height: `${(100 * b.arcadeSec) / maxSec}%` }} />
              <span className="parent-bar-seg is-creative" style={{ height: `${(100 * b.creativeSec) / maxSec}%` }} />
              <span className="parent-bar-seg is-learning" style={{ height: `${(100 * b.learningSec) / maxSec}%` }} />
            </div>
            <span className="parent-bar-num">{minutes(b.totalSec)}</span>
            <span className="parent-bar-label">{b.label}</span>
          </div>
        ))}
      </div>
      <p className="parent-legend">
        <span className="parent-dot is-learning" /> öğrenme + keşif <span className="parent-dot is-arcade" /> oyun{" "}
        <span className="parent-dot is-creative" /> blok
      </p>
      <ul className="parent-facts">
        <li>🔥 Seri: {streak} gün</li>
        <li>📆 Açılan gün: {verdict.daysOpened}/7</li>
        <li>⏱️ Hafta toplamı: {formatMin(verdict.totalSec)}</li>
        {verdict.breaksPerHour !== null ? <li>🧘 Saat başına mola: {verdict.breaksPerHour}</li> : null}
      </ul>
    </Card>
  );
}
