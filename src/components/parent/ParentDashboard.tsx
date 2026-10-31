"use client";

import "./parent.css";
import { useSession } from "@/lib/auth";
import { summary } from "@/lib/mastery";
import { useSettings, type Settings } from "@/lib/settings";
import { AllActivitiesCard } from "./AllActivitiesCard";
import { checklistProgress } from "./ChecklistCard";
import { GalleryCard } from "./GalleryCard";
import { HealthCard } from "./HealthCard";
import { PlaysCard } from "./PlaysCard";
import { SettingsCard } from "./SettingsCard";
import { SkillsCard } from "./SkillsCard";
import { TodayCard } from "./TodayCard";
import { TogetherCard } from "./TogetherCard";
import { useChildProgress, useNow } from "./useParentData";
import { WeekCard } from "./WeekCard";

const selectAll = (s: Settings) => s;

/** /bilgi v2: kartlar MASTER_PLAN §2.13 sırasıyla, tek kaydırma. */
export function ParentDashboard() {
  const p = useChildProgress();
  const now = useNow();
  const settings = useSettings(selectAll);
  const { player } = useSession();
  const canLog = player === "dogukan";
  const skills = summary(p, now);
  const checklist = checklistProgress(settings);

  return (
    <main className="parent-page">
      <header className="parent-header">
        <h1 className="parent-h1">Ebeveyn paneli</h1>
        <p className="parent-muted">Doğukan · bu cihazdaki veriler</p>
      </header>

      {checklist.done < checklist.total ? (
        <a className="parent-banner" href="#kurulum">
          📝 İlk kurulum listesi: {checklist.done}/{checklist.total} tamam — birkaç soru sizi bekliyor.
        </a>
      ) : null}

      <TodayCard p={p} now={now} settings={settings} />
      <WeekCard p={p} now={now} />
      <SkillsCard summary={skills} />
      <TogetherCard p={p} now={now} summary={skills} canLog={canLog} />
      <PlaysCard p={p} now={now} />
      <GalleryCard />
      <SettingsCard s={settings} now={now} canLog={canLog} />
      <HealthCard p={p} now={now} />
      <AllActivitiesCard />
    </main>
  );
}
