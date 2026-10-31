"use client";

import { SHELL } from "@/content/shell";
import { useQuests } from "@/lib/quests";
import { sayOnly } from "./spokenNav";
import { SpokenTile } from "./SpokenTile";

/** Günün Görevi 🎒: üç noktalı, parlayan bir öneri kutucuğu; asla kapı değildir. */
export function QuestTile() {
  const { items, allDone } = useQuests();
  if (items.length === 0) return null;

  const next = items.find((q) => !q.done);
  const done = allDone || !next;

  return (
    <SpokenTile
      href={next?.href ?? "/"}
      emoji="🎒"
      label={SHELL.questTitle}
      say={next ? next.say : SHELL.questsDone}
      chipSay={next ? `${SHELL.questSay} ${next.say}` : SHELL.questsDone}
      className={done ? "home-quest is-done" : "home-quest"}
      onActivate={done ? () => sayOnly(SHELL.questsDone) : undefined}
    >
      <span className="home-quest-dots">
        {items.map((q) => (
          <span key={q.id} className={q.done ? "home-quest-dot is-done" : "home-quest-dot"} aria-hidden>
            {q.done ? "✓" : q.emoji}
          </span>
        ))}
      </span>
    </SpokenTile>
  );
}
