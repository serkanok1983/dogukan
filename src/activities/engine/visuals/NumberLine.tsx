type Props = { from: number; to: number; start: number; hops?: number };

/** Sayı doğrusu: başlangıçta 🐻, `hops` kadar +1 (ya da negatifse −1) zıplama yayı. */
export function NumberLine({ from, to, start, hops = 0 }: Props) {
  const lo = Math.floor(Math.min(from, to));
  const hi = Math.max(lo + 1, Math.floor(Math.max(from, to)));
  const span = Math.min(hi - lo, 30);
  const W = 340;
  const pad = 16;
  const x = (v: number) => pad + ((v - lo) / span) * (W - pad * 2);
  const ticks = Array.from({ length: span + 1 }, (_, i) => lo + i);
  const dir = hops < 0 ? -1 : 1;
  const steps = Math.min(Math.abs(Math.trunc(hops)), span);
  const end = start + dir * steps;
  const label = steps > 0 ? `${start}'dan ${steps} zıplama` : `${start}`;
  return (
    <svg className="ex-numberline" viewBox={`0 0 ${W} 90`} role="img" aria-label={label}>
      <line x1={pad} y1={60} x2={W - pad} y2={60} className="ex-nl-axis" />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} y1={54} x2={x(t)} y2={66} className="ex-nl-tick" />
          {span <= 20 || t % 5 === 0 ? (
            <text x={x(t)} y={84} textAnchor="middle" className="ex-nl-num">
              {t}
            </text>
          ) : null}
        </g>
      ))}
      {Array.from({ length: steps }, (_, i) => {
        const a = x(start + dir * i);
        const b = x(start + dir * (i + 1));
        const mid = (a + b) / 2;
        return (
          <path key={i} d={`M ${a} 56 Q ${mid} 22 ${b} 56`} className="ex-nl-hop" />
        );
      })}
      <text x={x(start)} y={44} textAnchor="middle" className="ex-nl-start">
        🐻
      </text>
      {steps > 0 ? <circle cx={x(end)} cy={60} r={6} className="ex-nl-end" /> : null}
    </svg>
  );
}
