"use client";

import "./auth.css";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

type KeypadProps = {
  onDigit: (d: string) => void;
  onBack: () => void;
  /** Verilirse sağ alt köşede "Tamam" tuşu çıkar; yoksa boş kalır. */
  onOk?: () => void;
  disabled?: boolean;
};

/** 64 px tuşlu rakam klavyesi (yalnızca rakam). */
export function NumericKeypad({ onDigit, onBack, onOk, disabled }: KeypadProps) {
  return (
    <div className="auth-keypad" role="group" aria-label="Rakam tuşları">
      {DIGITS.map((d) => (
        <button key={d} type="button" className="auth-key" disabled={disabled} onClick={() => onDigit(d)}>
          {d}
        </button>
      ))}
      <button type="button" className="auth-key auth-key-soft" disabled={disabled} onClick={onBack} aria-label="Sil">
        ⌫
      </button>
      <button type="button" className="auth-key" disabled={disabled} onClick={() => onDigit("0")}>
        0
      </button>
      {onOk ? (
        <button type="button" className="auth-key auth-key-ok" disabled={disabled} onClick={onOk} aria-label="Tamam">
          ✓
        </button>
      ) : (
        <span aria-hidden />
      )}
    </div>
  );
}

type PinPadProps = {
  value: string;
  onChange: (next: string) => void;
  /** Son hane girildiğinde bir kez çağrılır. */
  onComplete: (pin: string) => void;
  length?: number;
  disabled?: boolean;
  shake?: boolean;
};

/** 4 haneli PIN girişi: nokta geri bildirimi + rakam klavyesi. Kontrollü bileşen. */
export function PinPad({ value, onChange, onComplete, length = 4, disabled, shake }: PinPadProps) {
  const addDigit = (d: string) => {
    if (disabled || value.length >= length) return;
    const next = value + d;
    onChange(next);
    if (next.length === length) onComplete(next);
  };

  return (
    <div className="auth-pinpad">
      <div className={shake ? "auth-dots auth-shake" : "auth-dots"} aria-label={`${value.length} / ${length} hane`} role="status">
        {Array.from({ length }, (_, i) => (
          <span key={i} className={i < value.length ? "auth-dot is-filled" : "auth-dot"} aria-hidden />
        ))}
      </div>
      <NumericKeypad onDigit={addDigit} onBack={() => onChange(value.slice(0, -1))} disabled={disabled} />
    </div>
  );
}
