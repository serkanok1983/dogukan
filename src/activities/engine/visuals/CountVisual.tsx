import { createRng, seedFrom, shuffled } from "@/lib/rng";

type Layout = "rows5" | "tenframe" | "scatter";

type Props = {
  emoji: string;
  n: number;
  layout: Layout;
  /** Etkileşimli sayma: dokunulan nesnelerin sırası (dokunma sırasıyla index'ler). */
  tapOrder?: readonly number[];
  onTap?: (index: number) => void;
  disabled?: boolean;
};

const COLS = 5;

function chunk(n: number, size: number): number[][] {
  const rows: number[][] = [];
  for (let i = 0; i < n; i += size) {
    rows.push(Array.from({ length: Math.min(size, n - i) }, (_, k) => i + k));
  }
  return rows;
}

/**
 * Sayılacak nesneler: beşli sıralar (şipşak algı), onluk çerçeve (11–20) ya
 * da dağınık. `onTap` verilirse her nesne bir düğmedir (TapCount).
 */
export function CountVisual({ emoji, n, layout, tapOrder, onTap, disabled }: Props) {
  const count = Math.max(0, Math.min(30, Math.floor(n)));
  const interactive = onTap !== undefined;

  const obj = (i: number) => {
    const order = tapOrder ? tapOrder.indexOf(i) : -1;
    const tapped = order >= 0;
    if (!interactive) {
      return (
        <span key={i} className="ex-obj" aria-hidden>
          {emoji}
        </span>
      );
    }
    return (
      <button
        key={i}
        type="button"
        className={tapped ? "ex-obj is-tapped" : "ex-obj"}
        aria-label={tapped ? `${order + 1}` : "Dokun ve say"}
        aria-pressed={tapped}
        disabled={disabled}
        onClick={() => onTap(i)}
      >
        <span aria-hidden>{emoji}</span>
        {tapped ? (
          <span className="ex-obj-badge" aria-hidden>
            {order + 1}
          </span>
        ) : null}
      </button>
    );
  };

  const a11y = interactive
    ? { role: "group", "aria-label": "Nesneler" }
    : { role: "img", "aria-label": `${count} ${emoji}` };

  if (layout === "tenframe") {
    const frames = Math.max(1, Math.ceil(count / 10));
    return (
      <div className="ex-count ex-count--tenframe" {...a11y}>
        {Array.from({ length: frames }, (_, f) => (
          <div key={f} className="ex-tenframe">
            {Array.from({ length: 10 }, (_, c) => {
              const i = f * 10 + c;
              return (
                <div key={c} className="ex-tenframe-cell">
                  {i < count ? obj(i) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  if (layout === "scatter") {
    const rows = Math.ceil(count / COLS) + 1;
    const rng = createRng(seedFrom(`${emoji}:${count}`));
    const cells = shuffled(
      rng,
      Array.from({ length: rows * COLS }, (_, k) => k),
    ).slice(0, count);
    return (
      <div className="ex-count ex-count--scatter" style={{ gridTemplateRows: `repeat(${rows}, auto)` }} {...a11y}>
        {cells.map((cell, i) => (
          <div
            key={i}
            className="ex-scatter-cell"
            style={{
              gridRow: Math.floor(cell / COLS) + 1,
              gridColumn: (cell % COLS) + 1,
              transform: `translate(${Math.round((rng() - 0.5) * 14)}px, ${Math.round((rng() - 0.5) * 14)}px)`,
            }}
          >
            {obj(i)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="ex-count ex-count--rows5" {...a11y}>
      {chunk(count, COLS).map((row, r) => (
        <div key={r} className="ex-count-row">
          {row.map(obj)}
        </div>
      ))}
    </div>
  );
}
