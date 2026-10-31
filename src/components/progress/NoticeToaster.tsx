"use client";

/**
 * Bildirim kutusunu tüketir (CONTRACT §10.4). Sahibi S5.
 * Üstte küçük, bloklamayan bir kart; her seferinde bir bildirim. Çıkartma
 * 1 sn sonra kendiliğinden açılır (soyma / sürükleme yok, MASTER_PLAN K26).
 * Gösterilen bildirim `notices_ack` ile kutudan silinir.
 *
 * `quests_all_done` burada gösterilmez: haritada S1 `ChapterEnd` açar ve onaylar.
 * Önceki günlerden kalanlar ve birleştirmeden gelen çift çıkartmalar sessizce onaylanır.
 */
import "./progress.css";
import { useEffect, useState } from "react";
import { useProgress } from "@/hooks/useProgress";
import { haptic } from "@/lib/haptics";
import { findActivity } from "@/lib/menu";
import { trackEvent } from "@/lib/progress/events";
import { dayKey } from "@/lib/progress/time";
import type { Notice, Progress } from "@/lib/progress/types";
import { SKILLS } from "@/lib/skills";
import { sounds } from "@/lib/sounds";
import { speak } from "@/lib/speech";
import { getSticker } from "@/lib/stickers";

export const STICKER_REVEAL_MS = 1000;
const HOLD_MS: Record<Notice["kind"], number> = {
  new_star: 1800,
  level_up: 2200,
  sticker: 2600,
  quest_done: 2200,
  quests_all_done: 0,
  streak: 2600,
};

const selectInbox = (p: Progress) => p.inbox;

function ack(ids: string[]) {
  if (ids.length > 0) trackEvent({ type: "notices_ack", ids });
}

/** Gösterilmeden onaylanacaklar. */
function silentIds(inbox: Notice[], today: string): string[] {
  return inbox
    .filter((n, i) => {
      if (n.kind === "quests_all_done") return dayKey(n.at) !== today;
      if (n.kind !== "sticker") return false;
      if (!n.stickerId || !getSticker(n.stickerId)) return true;
      return (
        inbox.findIndex(
          (m) => m.kind === "sticker" && m.stickerId === n.stickerId,
        ) !== i
      );
    })
    .map((n) => n.id);
}

function noticeVisual(n: Notice): { emoji: string; label: string } {
  switch (n.kind) {
    case "new_star":
      return {
        emoji: `${(n.slug && findActivity(n.slug)?.emoji) || "🎮"} ⭐`,
        label: "Yeni yıldız!",
      };
    case "level_up":
      return {
        emoji: "🚀",
        label: n.skill ? `${SKILLS[n.skill].label}: yeni seviye!` : "Yeni seviye!",
      };
    case "sticker": {
      const def = n.stickerId ? getSticker(n.stickerId) : undefined;
      return { emoji: def?.emoji ?? "🃏", label: def?.name ?? "Yeni çıkartma!" };
    }
    case "quest_done":
      return { emoji: "🎒 ✓", label: "Bir görev bitti!" };
    case "streak":
      return {
        emoji: `☀️ ${n.streak ?? ""}`,
        label: `${n.streak ?? ""} gün üst üste!`,
      };
    default:
      return { emoji: "⭐", label: "" };
  }
}

export function NoticeToaster() {
  const inbox = useProgress(selectInbox);
  const [revealedId, setRevealedId] = useState<string | null>(null);

  const today = dayKey();
  const silent = silentIds(inbox, today);
  const current =
    inbox.find((n) => n.kind !== "quests_all_done" && !silent.includes(n.id)) ??
    null;
  const silentKey = silent.join("|");

  useEffect(() => {
    if (silentKey) ack(silentKey.split("|"));
  }, [silentKey]);

  useEffect(() => {
    if (!current) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const { label } = noticeVisual(current);
    switch (current.kind) {
      case "sticker": {
        const def = current.stickerId ? getSticker(current.stickerId) : undefined;
        timers.push(
          setTimeout(() => {
            setRevealedId(current.id);
            sounds.sticker();
            haptic("sticker");
            speak(`Yeni çıkartma! ${def?.say ?? ""}`, { interrupt: false });
          }, STICKER_REVEAL_MS),
        );
        break;
      }
      case "level_up":
        sounds.levelUp();
        speak(label, { interrupt: false });
        break;
      case "quest_done":
        sounds.success();
        speak(label, { interrupt: false });
        break;
      case "streak":
        sounds.levelUp();
        haptic("win");
        speak(label, { interrupt: false });
        break;
      default:
        // new_star: sesi ve övgüyü RewardSheet verir; burada yalnız görsel.
        break;
    }
    const hold =
      HOLD_MS[current.kind] + (current.kind === "sticker" ? STICKER_REVEAL_MS : 0);
    timers.push(setTimeout(() => ack([current.id]), hold));
    return () => timers.forEach(clearTimeout);
  }, [current]);

  if (!current) return <div className="pr-toaster" aria-live="polite" />;

  const isSticker = current.kind === "sticker";
  const revealed = !isSticker || revealedId === current.id;
  const { emoji, label } = noticeVisual(current);

  return (
    <div className="pr-toaster" aria-live="polite">
      <button
        type="button"
        key={current.id}
        className={`pr-toast pr-toast--${current.kind}${revealed ? " is-revealed" : ""}`}
        onClick={() => revealed && speak(label)}
        aria-label={revealed ? label : "Yeni çıkartma geliyor"}
      >
        <span className="pr-toast-emoji" aria-hidden>
          {emoji}
        </span>
        <span className="pr-toast-label">{revealed ? label : "?"}</span>
      </button>
    </div>
  );
}
