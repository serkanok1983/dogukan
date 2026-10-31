"use client";

/**
 * Bal topla (CONTRACT §10.4, MASTER_PLAN §2.6, K4). Sahibi S5.
 * En zayıf beceriden 3 sesli soru (`ExerciseSession mode="gate"`). Reducer,
 * `exercise_set_end(mode:"gate")` ile kavanoza +1 hücre ekler; sonra `onFilled`.
 * Kapı asla oyunun üstüne kayan bir duvar değildir: Harita her zaman açık.
 */
import "./progress.css";
import { useState } from "react";
import { ExerciseSession } from "@/activities/engine/ExerciseSession";
import { pickForGate } from "@/lib/mastery";
import { getProgress } from "@/lib/progress/store";
import type { SkillId } from "@/lib/skills";

/** Olaylarda kullanılan sözde slug; haritada görünmez. */
export const HONEY_GATE_SLUG = "bal-topla";
const FALLBACK_SKILL: SkillId = "mat.sayma";

function weakestForGate(): SkillId {
  return pickForGate(getProgress(), Date.now())[0]?.skill ?? FALLBACK_SKILL;
}

export function HoneyGate(props: { onFilled: () => void; onMap: () => void }) {
  const { onFilled, onMap } = props;
  const [skill] = useState(weakestForGate);

  return (
    <div className="pr-gate">
      <p className="pr-gate-head" aria-hidden>
        🍯 <span className="pr-gate-dots">● ● ●</span>
      </p>
      <ExerciseSession
        slug={HONEY_GATE_SLUG}
        skill={skill}
        mode="gate"
        onDone={() => onFilled()}
        onExit={onMap}
      />
    </div>
  );
}
