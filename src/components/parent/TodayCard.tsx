"use client";

import { dayKey, emptyDay } from "@/lib/progress/time";
import type { Progress } from "@/lib/progress/types";
import type { Settings } from "@/lib/settings";
import { capSeconds, honeyCells, isGraceDay } from "@/lib/wellbeing";
import { Card } from "./Card";
import { formatMin, minutes } from "./parentData";

const R = 52;
const C = 2 * Math.PI * R;

export function TodayCard({ p, now, settings }: { p: Progress; now: number; settings: Settings }) {
  const d = p.days[dayKey(now)] ?? emptyDay();
  const cap = capSeconds(settings, d, now);
  const ratio = cap > 0 ? Math.min(1, d.totalSec / cap) : 0;
  const honey = honeyCells(settings, d);
  const grace = isGraceDay(settings, now);
  const discover = d.capsuleSec;
  const arcade = d.arcadeSec + d.coplaySec;

  return (
    <Card id="bugun" title="Bugün" icon="📅">
      <div className="parent-today">
        <svg className="parent-ring" viewBox="0 0 120 120" role="img" aria-label={`${minutes(d.totalSec)} / ${minutes(cap)} dakika`}>
          <circle cx="60" cy="60" r={R} className="parent-ring-track" />
          <circle
            cx="60"
            cy="60"
            r={R}
            className={ratio >= 1 ? "parent-ring-fill is-full" : "parent-ring-fill"}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - ratio)}
          />
          <text x="60" y="58" textAnchor="middle" className="parent-ring-num">
            {minutes(d.totalSec)}
          </text>
          <text x="60" y="78" textAnchor="middle" className="parent-ring-sub">
            / {minutes(cap)} dk
          </text>
        </svg>
        <div className="parent-today-text">
          <p className="parent-lead">
            Bugün {formatMin(d.totalSec)} · {minutes(d.learningSec)} öğrenme · {minutes(arcade)} oyun ·{" "}
            {minutes(discover)} keşif
            {d.creativeSec > 0 ? ` · ${minutes(d.creativeSec)} blok` : ""}
          </p>
          <ul className="parent-facts">
            <li>
              🍯 Kavanoz: {honey.left}/{honey.capacity} hücre
              {grace ? " (tanışma günü — kavanoz kapı değil)" : ""}
            </li>
            {d.coplaySec > 0 ? <li>👨‍👦 Birlikte: {formatMin(d.coplaySec)}</li> : null}
            <li>
              🧘 Mola: {d.breaksTaken} alındı
              {d.breaksSkippedByParent > 0 ? ` · ${d.breaksSkippedByParent} ebeveyn atlattı` : ""}
            </li>
            <li>{d.bedtimeBlocks === 0 ? "🌙 Yatma saati: ✓" : `🌙 Gece açma denemesi: ${d.bedtimeBlocks}`}</li>
            <li>⏹️ Sınırla biten oturum: {d.sessionsEndedBy.limit}</li>
            {d.extensions > 0 ? (
              <li>
                ➕ Uzatma: {d.extensions} kez, {d.extensionMinutes} dk
              </li>
            ) : null}
            <li>
              ⭐ Set: {d.setsDone} · Kapsül: {d.episodesDone}
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
