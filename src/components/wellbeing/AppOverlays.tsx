"use client";

/**
 * Tüm iyi oluş kaplamaları (CONTRACT §10.2). Kök düzende bir kez bağlanır (S8).
 * Mola, Sınır, Gece, Tanışma ipucu, Birlikte oyun ve geri sayım rozeti.
 * `/bilgi` (ebeveyn paneli) üzerinde hiçbir şey göstermez.
 */
import "./wellbeing.css";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useOverlayDetails, useWellbeing } from "@/hooks/useWellbeing";
import { parkClock } from "@/lib/sessionClock";
import { sounds } from "@/lib/sounds";
import { CoPlayPrompt } from "./CoPlayPrompt";
import { CountdownBadge } from "./CountdownBadge";
import { GraceHint } from "./GraceHint";
import { LimitScreen } from "./LimitScreen";
import { MolaScreen } from "./MolaScreen";
import { NightScreen } from "./NightScreen";

export function AppOverlays() {
  const pathname = usePathname();
  const wb = useWellbeing();
  const details = useOverlayDetails();

  const parentPage = Boolean(pathname?.startsWith("/bilgi"));

  useEffect(() => {
    sounds.setMasterGain(wb.evening ? 0.5 : 1);
  }, [wb.evening]);

  // Ebeveyn panelinde geçen süre çocuğun süresine yazılmaz.
  useEffect(() => {
    if (parentPage) parkClock();
  }, [parentPage]);

  if (parentPage) return null;

  // Tanışma günü fazdan bağımsızdır (−5 dk / akşam fazı "grace"i bastırır).
  const honeyLow = wb.honey.left === 2 && !wb.graceDay;
  return (
    <>
      <CountdownBadge
        phase={wb.phase}
        honeyLow={honeyLow}
        hidden={wb.overlay !== null}
      />
      {wb.overlay === "night" ? <NightScreen /> : null}
      {wb.overlay === "limit" ? <LimitScreen /> : null}
      {wb.overlay === "mola" ? (
        <MolaScreen
          key={details.breakId ?? "zipla"}
          breakId={details.breakId ?? "zipla"}
          firstBreak={details.firstBreak}
        />
      ) : null}
      {wb.overlay === "grace-hint" ? <GraceHint /> : null}
      {wb.overlay === "coplay" ? <CoPlayPrompt /> : null}
    </>
  );
}
