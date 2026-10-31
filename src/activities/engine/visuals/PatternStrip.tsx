type Props = { items: string[]; blankIndex: number };

/** Örüntü şeridi; `blankIndex` konumu "?" kutusudur. */
export function PatternStrip({ items, blankIndex }: Props) {
  return (
    <div className="ex-pattern" role="img" aria-label="Örüntü">
      {items.map((item, i) =>
        i === blankIndex ? (
          <span key={i} className="ex-pattern-item is-blank" aria-hidden>
            ?
          </span>
        ) : (
          <span key={i} className="ex-pattern-item" aria-hidden>
            {item}
          </span>
        ),
      )}
    </div>
  );
}
