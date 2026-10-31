/**
 * /bilgi için saf veri yardımcıları (S6). Gözetim değil içgörü: zaman damgası
 * listesi yok, gece denemeleri yalnızca günlük sayı (MASTER_PLAN K28).
 */
import { TALK_QUESTIONS } from "@/lib/activityTalk";
import { findActivity, MENU } from "@/lib/menu";
import type { SkillSummary } from "@/lib/mastery";
import { addDays, TIME_ZONE } from "@/lib/progress/time";
import type {
  DayKey,
  DayUsage,
  Progress,
  SessionEndReason,
  Stars,
} from "@/lib/progress/types";
import { SKILLS, SKILL_IDS, type SkillId } from "@/lib/skills";

export const LEARNING_TARGET_PCT = 35;

export function minutes(sec: number): number {
  return Math.round(Math.max(0, sec) / 60);
}

export function formatMin(sec: number): string {
  return `${minutes(sec)} dk`;
}

const weekdayFormat = new Intl.DateTimeFormat("tr-TR", {
  weekday: "short",
  timeZone: TIME_ZONE,
});
const dateFormat = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  weekday: "long",
  timeZone: TIME_ZONE,
});

function noonUtc(day: DayKey): Date {
  return new Date(`${day}T12:00:00Z`);
}

export function weekdayShort(day: DayKey): string {
  return weekdayFormat.format(noonUtc(day));
}

export function dayLabel(day: DayKey, today: DayKey): string {
  if (day === today) return "Bugün";
  if (day === addDays(today, -1)) return "Dün";
  return dateFormat.format(noonUtc(day));
}

export type DayBar = {
  day: DayKey;
  label: string;
  learningSec: number; // öğrenme + kapsül
  arcadeSec: number; // arcade + birlikte
  creativeSec: number;
  totalSec: number;
  opened: boolean;
};

/** Son 7 gün, eskiden yeniye. */
export function weekBars(p: Progress, today: DayKey): DayBar[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    const d = p.days[day];
    return {
      day,
      label: weekdayShort(day),
      learningSec: d ? d.learningSec + d.capsuleSec : 0,
      arcadeSec: d ? d.arcadeSec + d.coplaySec : 0,
      creativeSec: d ? d.creativeSec : 0,
      totalSec: d ? d.totalSec : 0,
      opened: Boolean(d && (d.opens > 0 || d.totalSec > 0)),
    };
  });
}

export type WeekVerdict = {
  pct: number | null;
  ok: boolean;
  text: string;
  daysOpened: number;
  totalSec: number;
  breaksPerHour: number | null;
};

export function weekVerdict(p: Progress, today: DayKey): WeekVerdict {
  const bars = weekBars(p, today);
  const totalSec = bars.reduce((n, b) => n + b.totalSec, 0);
  const learningSec = bars.reduce((n, b) => n + b.learningSec, 0);
  const breaks = bars.reduce((n, b) => n + (p.days[b.day]?.breaksTaken ?? 0), 0);
  const daysOpened = bars.filter((b) => b.opened).length;
  if (totalSec <= 0) {
    return {
      pct: null,
      ok: false,
      text: "Bu hafta henüz oynanmadı.",
      daysOpened,
      totalSec,
      breaksPerHour: null,
    };
  }
  const pct = Math.round((100 * learningSec) / totalSec);
  const ok = pct >= LEARNING_TARGET_PCT;
  return {
    pct,
    ok,
    text: `Öğrenme payı %${pct} — hedef %${LEARNING_TARGET_PCT}${ok ? " ✓" : ""}`,
    daysOpened,
    totalSec,
    breaksPerHour: Math.round((breaks / (totalSec / 3600)) * 10) / 10,
  };
}

export type PlayItem = {
  slug: string;
  label: string;
  emoji: string;
  sec: number;
  runs: number;
  stars: Stars;
};

export type PlayDay = {
  day: DayKey;
  items: PlayItem[];
  totalSec: number;
  endedBy: Record<SessionEndReason, number>;
  bedtimeBlocks: number;
};

/** Güne göre gruplanmış oynananlar (yeniden eskiye), zaman damgası yok. */
export function playsByDay(p: Progress, today: DayKey, span = 7): PlayDay[] {
  const out: PlayDay[] = [];
  for (let i = 0; i < span; i++) {
    const day = addDays(today, -i);
    const d: DayUsage | undefined = p.days[day];
    if (!d) continue;
    const items = Object.entries(d.plays)
      .map(([slug, v]) => {
        const a = findActivity(slug);
        return {
          slug,
          label: a?.label ?? slug,
          emoji: a?.emoji ?? "🎮",
          sec: v.sec,
          runs: v.runs,
          stars: v.stars,
        };
      })
      .sort((a, b) => b.sec - a.sec);
    if (items.length === 0 && d.totalSec === 0) continue;
    out.push({
      day,
      items,
      totalSec: d.totalSec,
      endedBy: d.sessionsEndedBy,
      bedtimeBlocks: d.bedtimeBlocks,
    });
  }
  return out;
}

export const ENDED_LABELS: Readonly<Record<SessionEndReason, string>> = {
  run_end: "koşu sonu",
  map: "haritaya dönüş",
  limit: "günlük sınır",
  bedtime: "yatma saati",
  background: "uygulamadan çıkış",
};

/** Tüm etkinlikler (MENU sırası, tekrarsız). */
export function allActivities(): {
  slug: string;
  label: string;
  emoji: string;
  category: string;
}[] {
  const seen = new Set<string>();
  const out: { slug: string; label: string; emoji: string; category: string }[] = [];
  for (const cat of MENU) {
    for (const item of cat.items) {
      if (seen.has(item.slug)) continue;
      seen.add(item.slug);
      out.push({ ...item, category: cat.title });
    }
  }
  return out;
}

/**
 * "Bu akşam birlikte" sorusu: bugün (yoksa bu hafta) en çok oynanan etkinliğin
 * bilgi kartındaki konuşma sorusu (`TALK_QUESTIONS`); yoksa genel bir soru.
 */
export function talkQuestion(p: Progress, today: DayKey): string | null {
  const recent = playsByDay(p, today, 7);
  const item =
    recent[0]?.day === today
      ? recent[0].items[0]
      : recent.flatMap((d) => d.items)[0];
  if (!item) return null;
  const specific = TALK_QUESTIONS[item.slug];
  return specific
    ? `Sor (${item.label}): ${specific}`
    : `Sor: “${item.label}” oynarken en zor yer neresiydi? Nasıl geçtin?`;
}

/** Zorlanılan, sonra öğrenilen becerilerden ipucu olanı; yoksa ilk Faz 1 ipucu. */
export function pickTip(s: SkillSummary): { skill: SkillId; tip: string } | null {
  const order: SkillId[] = [
    ...s.struggling,
    ...s.learning.map((l) => l.skill),
    ...SKILL_IDS,
  ];
  for (const id of order) {
    const tip = SKILLS[id]?.tip;
    if (tip && (SKILLS[id].phase1 || s.learning.some((l) => l.skill === id)))
      return { skill: id, tip };
  }
  return null;
}

/** Kazanım satırı: doğrulanmış kod varsa kod + alan, yoksa yalnızca alan (K21). */
export function mebLine(id: SkillId): string {
  const def = SKILLS[id];
  return def.mebCode ? `${def.mebCode} · ${def.mebArea}` : def.mebArea;
}
