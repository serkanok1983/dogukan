/**
 * Faz 2 görselleri için sade yer tutucular (lab, saat, para, ızgara).
 * Çalışır ve okunur bir görüntü verirler; tam göstericiler Faz 2'de gelir.
 */

/** LabStage geçişi: Faz 1'de yalnızca simge (deney sahneleri S7 kapsüllerinde). */
export function LabVisual({ mode }: { mode: string }) {
  return (
    <div className="ex-picture" role="img" aria-label={`Deney: ${mode}`}>
      <span aria-hidden>🔬</span>
    </div>
  );
}

export function ClockVisual({ hour, half }: { hour: number; half: boolean }) {
  const h = ((Math.floor(hour) % 12) + 12) % 12;
  const hourAngle = (h + (half ? 0.5 : 0)) * 30;
  const minuteAngle = half ? 180 : 0;
  const hand = (angle: number, len: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x2: 50 + len * Math.cos(rad), y2: 50 + len * Math.sin(rad) };
  };
  return (
    <svg className="ex-clock" viewBox="0 0 100 100" role="img" aria-label={half ? `${h || 12} buçuk` : `saat ${h || 12}`}>
      <circle cx={50} cy={50} r={46} className="ex-clock-face" />
      {Array.from({ length: 12 }, (_, i) => {
        const rad = ((i * 30 - 90) * Math.PI) / 180;
        return (
          <text key={i} x={50 + 36 * Math.cos(rad)} y={50 + 36 * Math.sin(rad) + 4} textAnchor="middle" className="ex-clock-num">
            {i === 0 ? 12 : i}
          </text>
        );
      })}
      <line x1={50} y1={50} {...hand(hourAngle, 22)} className="ex-clock-hour" />
      <line x1={50} y1={50} {...hand(minuteAngle, 32)} className="ex-clock-min" />
      <circle cx={50} cy={50} r={3} className="ex-clock-pin" />
    </svg>
  );
}

export function CoinsVisual({ values }: { values: number[] }) {
  return (
    <div className="ex-coins" role="img" aria-label={values.map((v) => `${v} lira`).join(", ")}>
      {values.map((v, i) => (
        <span key={i} className="ex-coin" aria-hidden>
          {v}₺
        </span>
      ))}
    </div>
  );
}

export function GridVisual({ size, left }: { size: 4 | 6; left: boolean[][] }) {
  const half = size / 2;
  return (
    <div className="ex-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }} role="img" aria-label="Simetri ızgarası">
      {Array.from({ length: size * size }, (_, k) => {
        const r = Math.floor(k / size);
        const c = k % size;
        const on = c < half ? Boolean(left[r]?.[c]) : false;
        return <span key={k} className={`ex-grid-cell${on ? " is-on" : ""}${c === half ? " is-mirror" : ""}`} />;
      })}
    </div>
  );
}
