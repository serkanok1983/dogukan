"use client";

import "./auth.css";
import Image from "next/image";
import { useState } from "react";
import { SayButton } from "@/components/SayButton";
import { SHELL } from "@/content/shell";
import { VOICE } from "@/content/voice";
import { assetPath } from "@/lib/asset";
import { loginAs } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { sounds } from "@/lib/sounds";
import { speak, unlockAudio } from "@/lib/speech";
import { ParentChoice } from "./ParentChoice";
import { ParentGate } from "./ParentGate";

/** "Kim oynuyor?" — tek dokunuşla kalıcı çocuk oturumu (MASTER_PLAN §2.2). */
export function WhoIsPlaying() {
  const [parentStep, setParentStep] = useState<"none" | "gate" | "choice">("none");

  const playAsChild = () => {
    // iOS: ses ve TTS bu dokunuşun içinde açılmalı.
    unlockAudio();
    sounds.unlock();
    loginAs("dogukan");
    const firstLaunch = !getSettings().firstLaunchDone;
    speak(firstLaunch ? `${VOICE.welcome} ${VOICE.nameAsk}` : VOICE.welcome);
    void import("@/lib/activityLog")
      .then((m) => m.logDogukanLogin())
      .catch(() => undefined);
  };

  return (
    <main className="auth-who">
      <button
        type="button"
        className="auth-parent-corner"
        onClick={() => setParentStep("gate")}
      >
        Anne-Baba <span aria-hidden>🔒</span>
      </button>

      <div className="auth-who-head">
        <h1 className="auth-who-title">{SHELL.whoTitle}</h1>
        <SayButton text={SHELL.whoSay} />
      </div>

      <button
        type="button"
        className="auth-who-child"
        onClick={playAsChild}
        aria-label="Doğukan"
      >
        <Image
          className="auth-who-photo"
          src={assetPath("/avatar/dogukan.webp")}
          alt=""
          width={160}
          height={160}
          loading="eager"
          fetchPriority="high"
          unoptimized
        />
        <span className="auth-who-name">Doğukan</span>
      </button>

      {parentStep === "gate" && (
        <ParentGate
          onPass={() => setParentStep("choice")}
          onCancel={() => setParentStep("none")}
        />
      )}
      {parentStep === "choice" && (
        <ParentChoice onClose={() => setParentStep("none")} />
      )}
    </main>
  );
}
