/**
 * Günün Görevi (CONTRACT §10.4, MASTER_PLAN §2.7). Sahibi S5.
 *
 * Günde 3 slot: (0) TR odak becerisi, (1) MAT odak becerisi, (2) ek: bugün
 * bitmemiş bir kapsül bölümü ya da HB/EF seti. Zamanı gelmiş bir tekrar varsa
 * aynı alandaki slot onunla değiştirilir. Seçim gün + oyuncu tohumuyla
 * belirlenir (aynı gün aynı girdi → aynı görevler). Tamamlama reducer'dadır.
 */
import { useMemo } from "react";
import { useProgress } from "@/hooks/useProgress";
import { getPlayerId } from "@/lib/auth";
import { EPISODES, episodeHref } from "@/lib/capsules";
import { dueSkills, weakestSkills } from "@/lib/mastery";
import { findActivity } from "@/lib/menu";
import { trackEvent } from "@/lib/progress/events";
import { getProgress } from "@/lib/progress/store";
import { dayKey } from "@/lib/progress/time";
import type { Progress, QuestKind, QuestState } from "@/lib/progress/types";
import { createRng, seedFrom } from "@/lib/rng";
import { SKILL_IDS, SKILLS, type SkillId, type Strand } from "@/lib/skills";
import { ACTIVITY_INFO } from "@/lib/worlds";

export type QuestView = {
  id: string;
  emoji: string;
  say: string;
  href: string;
  done: boolean;
};

/** Görev için açılacak etkinlik: görünür ve `exercise` olan slug tercih edilir. */
export function slugForSkill(skill: SkillId): string | undefined {
  let fallback: string | undefined;
  for (const [slug, info] of Object.entries(ACTIVITY_INFO)) {
    if (info.skill !== skill || info.hidden) continue;
    if (info.exercise) return slug;
    // Yalnızca sonuç bildiren (run_end) oyunlar yedek olabilir; aksi hâlde görev hiç bitmez.
    if (fallback === undefined && info.kind === "arcade") fallback = slug;
  }
  return fallback;
}

function strandOf(skill: SkillId): Strand {
  return SKILLS[skill].strand;
}

/** Bir alanın görev atanabilir becerileri, en zayıftan başlayarak. */
function focusCandidates(p: Progress, strands: readonly Strand[]): SkillId[] {
  // weakestSkills, çalışılmış beceri varsa yalnızca onları döndürür; kalan Faz 1 becerileri sona eklenir.
  const weak = weakestSkills(p, SKILL_IDS.length);
  const rest = SKILL_IDS.filter((id) => SKILLS[id].phase1 && !weak.includes(id));
  const ordered = [...weak, ...rest].filter((id) => strands.includes(strandOf(id)));
  const usable = ordered.filter((id) => slugForSkill(id) !== undefined);
  // Egzersiz (set) olan beceri varsa yalnızca onlar; arcade yedeği son çaredir.
  const sets = usable.filter(
    (id) => ACTIVITY_INFO[slugForSkill(id) ?? ""]?.exercise === true,
  );
  return sets.length > 0 ? sets : usable;
}

function pickFocus(
  p: Progress,
  strands: readonly Strand[],
  rng: () => number,
): SkillId | undefined {
  const pool = focusCandidates(p, strands).slice(0, 2);
  if (pool.length === 0) return undefined;
  return pool[Math.floor(rng() * pool.length)] ?? pool[0];
}

function skillQuest(id: string, kind: QuestKind, skill: SkillId): QuestState | null {
  const slug = slugForSkill(skill);
  return slug ? { id, kind, slug, skill, done: false } : null;
}

function capsuleToday(p: Progress, day: string): QuestState["topic"] {
  const notToday = EPISODES.filter((ep) => {
    const t = p.topics[ep.topic];
    return !(t?.capsuleDoneAt !== undefined && dayKey(t.capsuleDoneAt) === day);
  });
  const fresh = notToday.find((ep) => !p.topics[ep.topic]?.capsuleDone);
  return (fresh ?? notToday[0])?.topic;
}

function extraQuest(
  p: Progress,
  id: string,
  day: string,
  rng: () => number,
): QuestState | null {
  const topic = capsuleToday(p, day);
  if (topic) return { id, kind: "extra", topic, done: false };
  const skill = pickFocus(p, ["hb", "ef"], rng);
  if (skill) return skillQuest(id, "extra", skill);
  const slug = Object.keys(ACTIVITY_INFO).find((s) => ACTIVITY_INFO[s]?.flagship);
  return slug ? { id, kind: "extra", slug, done: false } : null;
}

/** Saf ve deterministik: aynı ilerleme + gün → aynı görevler. */
export function buildQuests(p: Progress, now: number): QuestState[] {
  const day = dayKey(now);
  const rng = createRng(seedFrom(`${p.player}:${day}`));
  const qid = (slot: number) => `${day}:${slot}`;
  const slots: (QuestState | null)[] = [null, null, null];

  const tr = pickFocus(p, ["tr"], rng);
  if (tr) slots[0] = skillQuest(qid(0), "tr", tr);
  const mat = pickFocus(p, ["mat"], rng);
  if (mat) slots[1] = skillQuest(qid(1), "mat", mat);
  slots[2] = extraQuest(p, qid(2), day, rng);

  // Zamanı gelmiş bir tekrar varsa aynı alandaki slotun yerine geçer (kapsül slotu korunur).
  const due = dueSkills(p, now).find((s) => slugForSkill(s) !== undefined);
  if (due) {
    const strand = strandOf(due);
    const slot =
      strand === "tr" ? 0 : strand === "mat" ? 1 : slots[2]?.topic ? -1 : 2;
    if (slot >= 0) slots[slot] = skillQuest(qid(slot), "review", due);
  }

  const out: QuestState[] = [];
  const seen = new Set<string>();
  for (const q of slots) {
    if (!q) continue;
    const key = q.topic ? `t:${q.topic}` : `s:${q.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

/** Günde bir kez `quests_set` yayar (S1 harita açılışında çağırır). */
export function ensureTodayQuests(now: number = Date.now()): void {
  if (typeof window === "undefined" || !getPlayerId()) return;
  const p = getProgress();
  const day = dayKey(now);
  if (p.quests.day === day && p.quests.items.length > 0) return;
  const items = buildQuests(p, now);
  if (items.length === 0) return;
  trackEvent({ type: "quests_set", day, items });
}

const KIND_EMOJI: Record<QuestKind, string> = {
  tr: "📖",
  mat: "🔢",
  extra: "🔬",
  review: "🔁",
};

export function questView(q: QuestState): QuestView {
  if (q.topic) {
    const ep = EPISODES.find((x) => x.topic === q.topic);
    return {
      id: q.id,
      emoji: ep?.emoji ?? KIND_EMOJI.extra,
      say: ep ? `Merak Gölü: ${ep.title}` : "Merak Gölü'nde bir bölüm",
      href: episodeHref(q.topic),
      done: q.done,
    };
  }
  const item = q.slug ? findActivity(q.slug) : null;
  const label = item?.label ?? "Bir oyun";
  return {
    id: q.id,
    emoji: item?.emoji ?? KIND_EMOJI[q.kind],
    say: q.kind === "review" ? `Hatırlıyor musun? ${label}` : label,
    href: q.slug ? `/aktivite/${q.slug}/` : "/",
    done: q.done,
  };
}

const EMPTY: { items: QuestView[]; allDone: boolean } = {
  items: [],
  allDone: false,
};

const selectQuests = (p: Progress) => p.quests;

export function useQuests(): { items: QuestView[]; allDone: boolean } {
  const quests = useProgress(selectQuests);
  return useMemo(() => {
    if (quests.day !== dayKey() || quests.items.length === 0) return EMPTY;
    const items = quests.items.map(questView);
    return { items, allDone: items.every((q) => q.done) };
  }, [quests]);
}
