"use client";

import "./auth.css";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  enterParentMode,
  getPinLockRemainingMs,
  isParentPinConfigured,
  verifyParentPin,
} from "@/lib/auth";
import { speak } from "@/lib/speech";
import { NumericKeypad, PinPad } from "./PinPad";

/**
 * Ebeveyn kapıları (CONTRACT §10.7, MASTER_PLAN §2.2 / K17).
 * - ArithmeticGate: birlikte oyun ve "Baban yazsın" için (a + b, a,b ∈ 11..49).
 * - PinGate: `/bilgi` için 4 haneli PIN; 3 hata → 30 sn kilit.
 * - ParentGate: aritmetik → PIN (PIN ayarlı değilse atlanır) → enterParentMode().
 */

type GateProps = { onPass: () => void; onCancel: () => void };

const MIN_ADDEND = 11;
const MAX_ADDEND = 49;

type Problem = { a: number; b: number };

function randomAddend(): number {
  return MIN_ADDEND + Math.floor(Math.random() * (MAX_ADDEND - MIN_ADDEND + 1));
}

function makeProblem(): Problem {
  return { a: randomAddend(), b: randomAddend() };
}

function GateDialog({
  title,
  onCancel,
  onKeyDown,
  children,
}: {
  title: string;
  onCancel: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="auth-backdrop">
      <div
        ref={ref}
        className="auth-gate"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
            return;
          }
          onKeyDown?.(e);
        }}
      >
        <h2 id={titleId} className="auth-gate-title">
          {title}
        </h2>
        {children}
        <button type="button" className="auth-cancel" onClick={onCancel}>
          Vazgeç
        </button>
      </div>
    </div>
  );
}

const MAX_ANSWER_DIGITS = 3;

export function ArithmeticGate({
  onPass,
  onCancel,
  title = "Ebeveyn kapısı",
}: GateProps & { title?: string }) {
  const [problem, setProblem] = useState(makeProblem);
  const [answer, setAnswer] = useState("");
  const [wrongCount, setWrongCount] = useState(0);

  const addDigit = (d: string) => {
    setAnswer((prev) => (prev.length >= MAX_ANSWER_DIGITS ? prev : prev + d));
  };

  const submit = () => {
    if (!answer) return;
    if (Number(answer) === problem.a + problem.b) {
      onPass();
      return;
    }
    setWrongCount((n) => n + 1);
    setAnswer("");
    setProblem(makeProblem());
  };

  return (
    <GateDialog
      title={title}
      onCancel={onCancel}
      onKeyDown={(e) => {
        if (/^[0-9]$/.test(e.key)) addDigit(e.key);
        else if (e.key === "Backspace") setAnswer((prev) => prev.slice(0, -1));
        else if (e.key === "Enter") submit();
      }}
    >
      <p className="auth-gate-hint">Bir büyük çözsün:</p>
      <p
        key={wrongCount}
        className={wrongCount > 0 ? "auth-problem auth-shake" : "auth-problem"}
      >
        <span>
          {problem.a} + {problem.b} =
        </span>
        <output className="auth-answer" aria-label="Cevap">
          {answer || "?"}
        </output>
      </p>
      <p className="auth-gate-error" role="alert">
        {wrongCount > 0 ? "Olmadı, yeni soru." : ""}
      </p>
      <NumericKeypad
        onDigit={addDigit}
        onBack={() => setAnswer((prev) => prev.slice(0, -1))}
        onOk={submit}
      />
    </GateDialog>
  );
}

const PIN_LENGTH = 4;

export function PinGate({ onPass, onCancel }: GateProps) {
  const [configured] = useState(isParentPinConfigured);
  const [pin, setPin] = useState("");
  const [lockMs, setLockMs] = useState(getPinLockRemainingMs);
  const [checking, setChecking] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const locked = lockMs > 0;

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setLockMs(getPinLockRemainingMs()), 500);
    return () => clearInterval(t);
  }, [locked]);

  const check = async (value: string) => {
    setChecking(true);
    const ok = await verifyParentPin(value);
    if (ok) {
      onPass();
      return;
    }
    const remaining = getPinLockRemainingMs();
    setPin("");
    setChecking(false);
    setWrongCount((n) => n + 1);
    setLockMs(remaining);
    if (remaining > 0) speak("Babanı çağır.");
  };

  if (!configured) {
    return (
      <GateDialog title="PIN ayarlanmadı" onCancel={onCancel}>
        <p className="auth-gate-hint">
          Ebeveyn PIN&apos;i tanımlı değil; yalnızca aritmetik kapı kullanılıyor.
        </p>
        <button type="button" className="auth-primary" onClick={onPass}>
          Devam
        </button>
      </GateDialog>
    );
  }

  const addDigit = (d: string) => {
    if (checking || locked || pin.length >= PIN_LENGTH) return;
    const next = pin + d;
    setPin(next);
    if (next.length === PIN_LENGTH) void check(next);
  };

  return (
    <GateDialog
      title="Ebeveyn PIN'i"
      onCancel={onCancel}
      onKeyDown={(e) => {
        if (/^[0-9]$/.test(e.key)) addDigit(e.key);
        else if (e.key === "Backspace") setPin((prev) => prev.slice(0, -1));
      }}
    >
      {locked ? (
        <p className="auth-lock" role="alert">
          Babanı çağır 🙂
          <span className="auth-lock-sub">{Math.ceil(lockMs / 1000)} sn</span>
        </p>
      ) : (
        <p className="auth-gate-error" role="alert">
          {wrongCount > 0 ? "PIN yanlış." : ""}
        </p>
      )}
      <PinPad
        key={wrongCount}
        value={pin}
        onChange={setPin}
        onComplete={(value) => void check(value)}
        length={PIN_LENGTH}
        disabled={checking || locked}
        shake={wrongCount > 0}
      />
    </GateDialog>
  );
}

export function ParentGate({ onPass, onCancel }: GateProps) {
  const [step, setStep] = useState<"arith" | "pin">("arith");

  const pass = () => {
    enterParentMode();
    onPass();
  };

  if (step === "arith") {
    return (
      <ArithmeticGate
        onCancel={onCancel}
        onPass={() => (isParentPinConfigured() ? setStep("pin") : pass())}
      />
    );
  }
  return <PinGate onCancel={onCancel} onPass={pass} />;
}
