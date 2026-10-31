"use client";

/**
 * Koşu sonu sayfası (CONTRACT §10.4, MASTER_PLAN §2.6, parent-wellbeing F2). Sahibi S5.
 *
 * - Kazanılan yıldızlar animasyonla gelir; 1,5 sn sonra dokununca atlanır.
 * - `praise()` satırı sesli okunur. Otomatik kapanma / yeniden başlatma yoktur.
 * - İki EŞİT düğme: ▶ Tekrar · 🗺️ Harita.
 * - Kavanoz boşsa: 🍯 Bal topla (3 soru) · 🗺️ Harita (oturumda ≤ 2 kez; sonra yalnız Harita).
 * - Aynı oyunda art arda 3 koşudan sonra oturumda bir kez: "Başka bir adaya bakalım mı?"
 */
import "./progress.css";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HoneyJar } from "@/components/wellbeing/HoneyJar";
import { VOICE } from "@/content/voice";
import { useWellbeing } from "@/hooks/useWellbeing";
import { haptic } from "@/lib/haptics";
import { praise } from "@/lib/praise";
import { useQuests } from "@/lib/quests";
import { notifyNaturalPause } from "@/lib/sessionClock";
import { sounds } from "@/lib/sounds";
import { speak } from "@/lib/speech";
import { HoneyGate } from "./HoneyGate";
import {
  canOfferHoney,
  canSuggestIsland,
  markHoneyOffered,
  markIslandSuggested,
} from "./session";
import type { RunResult } from "./useRunResult";

export const SUGGEST_LINE = "Başka bir adaya bakalım mı?";
const SKIP_AFTER_MS = 1500;

type Variant = "normal" | "honey" | "mapOnly";

function StarRow({
  count,
  newStar,
  skipped,
}: {
  count: number;
  newStar: boolean;
  skipped: boolean;
}) {
  return (
    <div
      className={`pr-stars${skipped ? " is-skipped" : ""}${newStar ? " is-new" : ""}`}
      role="img"
      aria-label={`${count} yıldız`}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={i < count ? "pr-star is-on" : "pr-star"}
          style={{ animationDelay: `${0.4 + i * 0.45}s` }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

export function RewardSheet(props: {
  slug: string;
  result: RunResult;
  onRestart: () => void;
  onMap: () => void;
}) {
  const { slug, result, onRestart, onMap } = props;
  const { jarEmpty } = useWellbeing();
  const { items } = useQuests();

  // Bağlam bir kez, açılışta belirlenir (sonraki çizimlerde değişmez).
  const [newStar] = useState(result.isNewStar);
  const [line] = useState(() => praise(newStar ? "new_star" : "run_end"));
  const [variant] = useState<Variant>(() =>
    jarEmpty ? (canOfferHoney() ? "honey" : "mapOnly") : "normal",
  );
  const [suggest] = useState(() => canSuggestIsland(slug));
  const [canSkip, setCanSkip] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const counted = useRef(false);

  useEffect(() => {
    if (!counted.current) {
      counted.current = true;
      if (variant === "honey") markHoneyOffered();
      if (suggest) markIslandSuggested();
    }
    notifyNaturalPause("run_end");
    speak(line);
    if (variant !== "normal") speak(VOICE.jarEmpty, { interrupt: false });
    if (suggest) speak(SUGGEST_LINE, { interrupt: false });
    if (newStar) {
      sounds.star();
      haptic("win");
    }
    const t = setTimeout(() => setCanSkip(true), SKIP_AFTER_MS);
    return () => clearTimeout(t);
    // Bağımlılıkların hepsi açılışta sabitlenir → yalnızca bir kez çalışır.
  }, [line, variant, suggest, newStar]);

  const stars = result.runStars ?? result.starsAfter;
  const nextQuest = items.find((q) => !q.done);
  const suggestHref = nextQuest?.href ?? "/";

  if (gateOpen) {
    return (
      <div
        className="pr-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Bal topla"
      >
        <div className="pr-sheet-card pr-sheet-card--gate">
          <HoneyGate onFilled={onRestart} onMap={onMap} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="pr-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="Oyun bitti"
    >
      <div className="pr-sheet-card">
        <button
          type="button"
          className="pr-sheet-stage"
          onClick={() => {
            if (skipped) speak(line);
            else if (canSkip) setSkipped(true);
          }}
          aria-label={line}
        >
          <StarRow count={stars} newStar={result.isNewStar} skipped={skipped} />
          {result.isNewStar && (
            <span
              className={`pr-newstar${skipped ? " is-skipped" : ""}`}
              aria-hidden
            >
              ✨ Yeni yıldız! ✨
            </span>
          )}
          <span className="pr-line">{line}</span>
          <span className="pr-score" aria-hidden>
            🎯 {result.score}
          </span>
        </button>

        {variant !== "normal" && (
          <div className="pr-jar" aria-hidden>
            <HoneyJar size="sm" />
          </div>
        )}

        <div className={`pr-actions${variant === "mapOnly" ? " is-single" : ""}`}>
          {variant === "normal" && (
            <button
              type="button"
              className="pr-btn pr-btn--again"
              onClick={onRestart}
            >
              ▶ Tekrar
            </button>
          )}
          {variant === "honey" && (
            <button
              type="button"
              className="pr-btn pr-btn--honey"
              onClick={() => setGateOpen(true)}
            >
              🍯 Bal topla (3 soru)
            </button>
          )}
          <button type="button" className="pr-btn pr-btn--map" onClick={onMap}>
            🗺️ Harita
          </button>
        </div>

        {suggest && (
          <Link
            href={suggestHref}
            className="pr-btn pr-btn--suggest"
            onClick={() => speak(SUGGEST_LINE)}
          >
            <span aria-hidden>{nextQuest?.emoji ?? "🏝️"}</span> {SUGGEST_LINE}
          </Link>
        )}
      </div>
    </div>
  );
}
