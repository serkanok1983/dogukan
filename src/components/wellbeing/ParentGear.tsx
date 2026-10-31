"use client";

import { useState, type ReactNode } from "react";
import { ParentGate } from "@/components/auth/ParentGate";

/**
 * Kaplamalardaki ebeveyn çarkı: ⚙️ → ParentGate → yalnızca yetişkinin göreceği
 * eylemler (`children`, kapatma fonksiyonu alır).
 */
export function ParentGear({ children }: { children: (close: () => void) => ReactNode }) {
  const [step, setStep] = useState<"idle" | "gate" | "open">("idle");
  const close = () => setStep("idle");
  return (
    <>
      <button
        type="button"
        className="wb-gear"
        aria-label="Ebeveyn"
        onClick={(e) => {
          e.stopPropagation();
          setStep("gate");
        }}
      >
        <span aria-hidden>⚙️</span>
      </button>
      {step === "gate" ? <ParentGate onPass={() => setStep("open")} onCancel={close} /> : null}
      {step === "open" ? (
        <div className="wb-parent-sheet" role="dialog" aria-modal="true" aria-label="Ebeveyn seçenekleri">
          <p className="wb-parent-title">Ebeveyn</p>
          {children(close)}
          <button type="button" className="wb-btn wb-btn-ghost" onClick={close}>
            Kapat
          </button>
        </div>
      ) : null}
    </>
  );
}
