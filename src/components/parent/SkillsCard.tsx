"use client";

import type { SkillSummary } from "@/lib/mastery";
import { SKILLS, type SkillId } from "@/lib/skills";
import { Card } from "./Card";
import { mebLine } from "./parentData";

function SkillRow({ id, extra }: { id: SkillId; extra?: string }) {
  const def = SKILLS[id];
  return (
    <li className="parent-skill">
      <span className="parent-skill-name">
        {def.labelParent}
        {extra ? <span className="parent-skill-extra"> · {extra}</span> : null}
      </span>
      <span className="parent-skill-meb">{mebLine(id)}</span>
    </li>
  );
}

export function SkillsCard({ summary }: { summary: SkillSummary }) {
  const empty =
    summary.learning.length === 0 && summary.masteredThisWeek.length === 0 && summary.struggling.length === 0;
  return (
    <Card id="beceriler" title="Beceriler" icon="🧠">
      {empty ? (
        <p className="parent-muted">Henüz alıştırma yapılmadı. İlk setlerden sonra burada görünecek.</p>
      ) : (
        <>
          <h3 className="parent-sub">Şu an öğreniyor</h3>
          <ul className="parent-list">
            {summary.learning.map((l) => (
              <SkillRow
                key={l.skill}
                id={l.skill}
                extra={`seviye ${l.level}/5 · ilk denemede %${Math.round(l.ratio * 100)}`}
              />
            ))}
          </ul>
          <h3 className="parent-sub">Bu hafta ustalaştı</h3>
          {summary.masteredThisWeek.length ? (
            <ul className="parent-list">
              {summary.masteredThisWeek.map((id) => (
                <SkillRow key={id} id={id} />
              ))}
            </ul>
          ) : (
            <p className="parent-muted">Bu hafta henüz yok.</p>
          )}
          <h3 className="parent-sub">Zorlanıyor</h3>
          {summary.struggling.length ? (
            <ul className="parent-list">
              {summary.struggling.map((id) => (
                <SkillRow key={id} id={id} extra={SKILLS[id].tip ? "ipucu: Bu akşam birlikte kartında" : undefined} />
              ))}
            </ul>
          ) : (
            <p className="parent-muted">Zorlandığı bir beceri görünmüyor.</p>
          )}
        </>
      )}
      <p className="parent-note">
        Kazanım kodları resmî programdan doğrulanana kadar yalnızca alan adı gösterilir.
      </p>
    </Card>
  );
}
