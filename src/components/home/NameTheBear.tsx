"use client";

import "./home.css";
import { useEffect, useRef, useState } from "react";
import { ArithmeticGate } from "@/components/auth/ParentGate";
import { SayButton } from "@/components/SayButton";
import { SHELL } from "@/content/shell";
import { VOICE, voiceLine } from "@/content/voice";
import { COMPANION_NAMES, ensureFirstLaunch, updateSettings } from "@/lib/settings";
import { speak } from "@/lib/speech";
import { BearAvatar } from "./BearAvatar";
import { loadContinueRecord } from "./mapData";
import { sayOnly } from "./spokenNav";

const MAX_NAME_LENGTH = 16;

/** İlk açılışta ayıya isim verme (MASTER_PLAN §2.3, K5). */
export function NameTheBear() {
  const [writing, setWriting] = useState<"none" | "gate" | "input">("none");
  const [custom, setCustom] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (writing === "input") inputRef.current?.focus();
  }, [writing]);

  const choose = (name: string) => {
    const companionName = name.trim().slice(0, MAX_NAME_LENGTH);
    if (!companionName) return;
    ensureFirstLaunch();
    updateSettings({ companionName, firstLaunchDone: true });
    // fillTemplate {ayı}'yı yeni adla doldurur; ardından 1. gün rekoru (MASTER_PLAN §1.1).
    speak(VOICE.nameDone);
    void loadContinueRecord().then((record) => {
      if (record > 0) speak(voiceLine("continueRecord", { skor: record }), { interrupt: false });
    });
  };

  return (
    <main className="home-name">
      <BearAvatar pose="wave" size={128} />
      <div className="home-name-head">
        <h1 className="home-name-title">{SHELL.nameTitle}</h1>
        <SayButton text={`${VOICE.nameAsk} ${SHELL.nameOptions}`} />
      </div>

      <div className="home-name-chips">
        {COMPANION_NAMES.map((name) => (
          <button key={name} type="button" className="home-name-chip" onClick={() => choose(name)}>
            {name}
          </button>
        ))}
        <button
          type="button"
          className="home-name-chip home-name-chip-parent"
          onClick={() => {
            sayOnly(SHELL.nameWriteSay);
            setWriting("gate");
          }}
        >
          <span aria-hidden>⭐</span> {SHELL.nameWrite}
        </button>
      </div>

      {writing === "input" && (
        <form
          className="home-name-form"
          onSubmit={(e) => {
            e.preventDefault();
            choose(custom);
          }}
        >
          <label className="home-name-label" htmlFor="home-name-input">
            Ayının adı
          </label>
          <input
            id="home-name-input"
            ref={inputRef}
            className="home-name-input"
            type="text"
            value={custom}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="off"
            enterKeyHint="done"
            onChange={(e) => setCustom(e.target.value)}
          />
          <div className="home-name-actions">
            <button type="button" className="home-name-cancel" onClick={() => setWriting("none")}>
              Vazgeç
            </button>
            <button type="submit" className="home-name-ok" disabled={!custom.trim()}>
              Tamam ✓
            </button>
          </div>
        </form>
      )}

      {writing === "gate" && (
        <ArithmeticGate title="Baban yazsın" onPass={() => setWriting("input")} onCancel={() => setWriting("none")} />
      )}
    </main>
  );
}
