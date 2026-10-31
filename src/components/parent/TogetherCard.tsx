"use client";

import { EPISODES } from "@/lib/capsules";
import type { SkillSummary } from "@/lib/mastery";
import { trackEvent } from "@/lib/progress/events";
import { dayKey } from "@/lib/progress/time";
import type { Progress } from "@/lib/progress/types";
import { SKILLS } from "@/lib/skills";
import { Card } from "./Card";
import { pickTip, talkQuestion } from "./parentData";

function capsuleMission(p: Progress, today: string): { title: string; text: string } | null {
  const doneToday = EPISODES.find((e) => {
    const at = p.topics[e.topic]?.capsuleDoneAt;
    return at ? dayKey(at) === today : false;
  });
  if (doneToday) {
    const mission = doneToday.cards.at(-1)?.say ?? "";
    return { title: `${doneToday.emoji} ${doneToday.title}`, text: `${mission} ${doneToday.parentNote}`.trim() };
  }
  const next = EPISODES.find((e) => !p.topics[e.topic]?.capsuleDone);
  return next ? { title: `${next.emoji} Sıradaki kapsül: ${next.title}`, text: next.parentNote } : null;
}

export function TogetherCard({
  p,
  now,
  summary,
  canLog,
}: {
  p: Progress;
  now: number;
  summary: SkillSummary;
  canLog: boolean;
}) {
  const today = dayKey(now);
  const mission = capsuleMission(p, today);
  const question = talkQuestion(p, today);
  const tip = pickTip(summary);
  const done = Boolean(p.days[today]?.togetherDone);

  return (
    <Card id="birlikte" title="Bu akşam birlikte" icon="🤝">
      <ul className="parent-together">
        <li>
          <strong>Kapsül görevi</strong>
          {mission ? (
            <span>
              {mission.title}: {mission.text}
            </span>
          ) : (
            <span className="parent-muted">Kapsüller yakında; bugün bir görev yok.</span>
          )}
        </li>
        <li>
          <strong>Sohbet sorusu</strong>
          {question ? <span>{question}</span> : <span className="parent-muted">Bugün henüz oynamadı.</span>}
        </li>
        <li>
          <strong>Beceri ipucu</strong>
          {tip ? (
            <span>
              {SKILLS[tip.skill].labelParent}: {tip.tip}
            </span>
          ) : (
            <span className="parent-muted">İpucu yok.</span>
          )}
        </li>
      </ul>
      <button
        type="button"
        className="parent-btn parent-btn-primary"
        disabled={done || !canLog}
        onClick={() => trackEvent({ type: "together_done" })}
      >
        {done ? "Yaptık ✓ (bugün kaydedildi)" : "Yaptık ✓"}
      </button>
      {!canLog && !done ? (
        <p className="parent-note">Kayıt için bu cihazda Doğukan oturumu açık olmalı.</p>
      ) : null}
    </Card>
  );
}
