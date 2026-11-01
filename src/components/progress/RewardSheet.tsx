"use client";

/**
 * Koşu sonu sayfası (CONTRACT §10.4, MASTER_PLAN §2.6, parent-wellbeing F2). Sahibi S5.
 *
 * - Kazanılan yıldızlar animasyonla gelir; 1,5 sn sonra dokununca atlanır.
 * - `praise()` satırı sesli okunur. Otomatik kapanma / yeniden başlatma yoktur.
 * - İki EŞİT düğme: ▶ Tekrar · 🗺️ Harita.
 * - Arcade kavanozu boşsa: 🍯 Bal topla (3 soru) · 🗺️ Harita (oturumda ≤ 2 kez, StartCard
 *   ile ortak; tavan dolmuşsa hiç; sonra yalnız Harita). Bal topla bitince oyun yalnızca
 *   kavanozda gerçekten hücre varsa yeniden başlar.
 * - Akşam başladıysa arcade için Tekrar yok: yalnız Harita (Bal topla da yok).
 * - Birlikte oyunda kavanoz/akşam kapı değildir (`arcadeOpen`).
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
import { canStartArcadeNow, notifyNaturalPause } from "@/lib/sessionClock";
import type { WellbeingState } from "@/lib/sessionClock";
import { getActivityInfo } from "@/lib/worlds";
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
/** Kavanoz boş ve Bal topla sunulmuyor: yalnız Harita (StartCard da kullanır). */
export const JAR_MAP_LINE = "Bal bitti. Haritada öğrenme adaları açık.";
const SKIP_AFTER_MS = 1500;

type Variant = "normal" | "honey" | "mapOnly" | "sleep";

/** Arcade bu an başlatılamazsa hangi düğmeler? Bal topla sunulursa sayacı işaretlemek çağıranın işi. */
function decideVariant(wb: WellbeingState, arcade: boolean): Variant {
  if (!arcade || wb.arcadeOpen) return "normal";
  if (wb.evening) return "sleep";
  if (wb.jarEmpty) return wb.honeyRefill && canOfferHoney() ? "honey" : "mapOnly";
  return "normal"; // gece/sınır: kaplama zaten açılır
}

function variantLine(variant: Variant): string | null {
  if (variant === "honey") return VOICE.jarEmpty;
  if (variant === "mapOnly") return JAR_MAP_LINE;
  if (variant === "sleep") return VOICE.eveningTile;
  return null;
}

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
  const wb = useWellbeing();
  const { items } = useQuests();
  const arcade = getActivityInfo(slug)?.kind === "arcade";

  // Bağlam bir kez, açılışta belirlenir; yalnızca düğme işleyicileri sonradan değiştirir.
  const [newStar] = useState(result.isNewStar);
  const [line] = useState(() => praise(newStar ? "new_star" : "run_end"));
  const [initialVariant] = useState<Variant>(() => decideVariant(wb, arcade));
  const [lateVariant, setLateVariant] = useState<Variant | null>(null);
  const variant = lateVariant ?? initialVariant;
  const [suggest] = useState(() => canSuggestIsland(slug));
  const [canSkip, setCanSkip] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const counted = useRef(false);

  useEffect(() => {
    if (!counted.current) {
      counted.current = true;
      if (initialVariant === "honey") markHoneyOffered();
      if (suggest) markIslandSuggested();
    }
    notifyNaturalPause("run_end");
    speak(line);
    const jarLine = variantLine(initialVariant);
    if (jarLine) speak(jarLine, { interrupt: false });
    if (suggest) speak(SUGGEST_LINE, { interrupt: false });
    if (newStar) {
      sounds.star();
      haptic("win");
    }
    const t = setTimeout(() => setCanSkip(true), SKIP_AFTER_MS);
    return () => clearTimeout(t);
    // Bağımlılıkların hepsi açılışta sabitlenir → yalnızca bir kez çalışır.
  }, [line, initialVariant, suggest, newStar]);

  /** Sayfa açıkken akşam başladıysa / kavanoz bittiyse düğmeler yeniden seçilir. */
  const switchTo = (next: Variant) => {
    if (next === "honey") markHoneyOffered();
    setLateVariant(next);
    setGateOpen(false);
    const say = variantLine(next);
    if (say) speak(say);
  };

  const again = () => {
    const next = decideVariant(wb, arcade);
    if (next !== "normal") switchTo(next);
    else onRestart();
  };

  const onHoneyFilled = () => {
    if (canStartArcadeNow()) onRestart();
    else switchTo("mapOnly");
  };

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
          <HoneyGate onFilled={onHoneyFilled} onMap={onMap} />
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

        {(variant === "honey" || variant === "mapOnly") && (
          <div className="pr-jar" aria-hidden>
            <HoneyJar size="sm" />
          </div>
        )}

        <div
          className={`pr-actions${variant === "mapOnly" || variant === "sleep" ? " is-single" : ""}`}
        >
          {variant === "normal" && (
            <button type="button" className="pr-btn pr-btn--again" onClick={again}>
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
