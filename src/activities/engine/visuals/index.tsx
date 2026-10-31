import type { Visual } from "../types";
import { CountVisual } from "./CountVisual";
import { LetterCard } from "./LetterCard";
import { NumberLine } from "./NumberLine";
import { PatternStrip } from "./PatternStrip";
import { PictureVisual } from "./PictureVisual";
import { ClockVisual, CoinsVisual, GridVisual, LabVisual } from "./Placeholders";
import { SceneVisual } from "./SceneVisual";
import { TenFrame } from "./TenFrame";

export { CountVisual, LetterCard, NumberLine, PatternStrip, PictureVisual, SceneVisual, TenFrame };

function render(visual: Visual) {
  switch (visual.type) {
    case "picture":
      return <PictureVisual emoji={visual.emoji} alt={visual.alt} />;
    case "count":
      return <CountVisual emoji={visual.emoji} n={visual.n} layout={visual.layout} />;
    case "tenframe":
      return <TenFrame a={visual.a} b={visual.b} op={visual.op} />;
    case "numberline":
      return <NumberLine from={visual.from} to={visual.to} start={visual.start} hops={visual.hops} />;
    case "letter":
      return <LetterCard char={visual.char} case={visual.case} highlight={visual.highlight} />;
    case "pattern":
      return <PatternStrip items={visual.items} blankIndex={visual.blankIndex} />;
    case "scene":
      return <SceneVisual emoji={visual.emoji} caption={visual.caption} />;
    case "lab":
      return <LabVisual mode={String(visual.mode)} />;
    case "clock":
      return <ClockVisual hour={visual.hour} half={visual.half} />;
    case "coins":
      return <CoinsVisual values={visual.values} />;
    case "grid":
      return <GridVisual size={visual.size} left={visual.left} />;
    default:
      return null;
  }
}

/** Sorunun görseli; `hint` iken nabız gibi atar (MASTER_PLAN §2.8). */
export function ExerciseVisual({ visual, hint }: { visual: Visual; hint?: boolean }) {
  return <div className={hint ? "ex-visual is-hint" : "ex-visual"}>{render(visual)}</div>;
}
