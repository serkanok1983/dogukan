type Props = { a: number; b?: number; op?: "+" | "-" };

type Dot = "a" | "b" | "gone" | null;

/**
 * Onluk çerçeve: `a` kırmızı nokta; `op "+"` ise ardından `b` mavi nokta;
 * `op "-"` ise son `b` nokta üstü çizili. 10'u aşınca ikinci çerçeve açılır.
 */
export function TenFrame({ a, b = 0, op }: Props) {
  const A = Math.max(0, Math.floor(a));
  const B = Math.max(0, Math.floor(b));
  const dots: Dot[] = [];
  if (op === "-") {
    for (let i = 0; i < A; i++) dots.push(i >= A - B ? "gone" : "a");
  } else {
    for (let i = 0; i < A; i++) dots.push("a");
    for (let i = 0; i < B; i++) dots.push("b");
  }
  const frames = Math.max(1, Math.ceil(dots.length / 10));
  const label =
    op === "-" ? `${A} eksi ${B}` : B > 0 ? `${A} artı ${B}` : `${A}`;
  return (
    <div className="ex-tf" role="img" aria-label={label}>
      {Array.from({ length: frames }, (_, f) => (
        <div key={f} className="ex-tenframe">
          {Array.from({ length: 10 }, (_, c) => {
            const d = dots[f * 10 + c] ?? null;
            return (
              <div key={c} className="ex-tenframe-cell">
                {d ? <span className={`ex-tf-dot ex-tf-dot--${d}`} /> : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
