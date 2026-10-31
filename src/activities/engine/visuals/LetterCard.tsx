type Props = { char: string; case: "lower" | "upper"; highlight?: boolean };

/** Büyük harf kartı (Türkçe büyük/küçük harf dönüşümüyle: i ↔ İ, ı ↔ I). */
export function LetterCard({ char, case: letterCase, highlight }: Props) {
  const shown = letterCase === "upper" ? char.toLocaleUpperCase("tr") : char.toLocaleLowerCase("tr");
  return (
    <div className={highlight ? "ex-letter is-highlight" : "ex-letter"} role="img" aria-label={shown}>
      <span aria-hidden>{shown}</span>
    </div>
  );
}
