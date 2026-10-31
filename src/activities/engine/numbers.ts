/** Türkçe sayı adları (0–999). TapCount sesli sayar: "bir, iki, üç…". */
const ONES = ["sıfır", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"] as const;
const TENS = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"] as const;

export function numberWord(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999) return String(n);
  if (n < 10) return ONES[n] ?? String(n);
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  if (h > 0) parts.push(h === 1 ? "yüz" : `${ONES[h]} yüz`);
  if (t > 0) parts.push(TENS[t] ?? "");
  if (o > 0) parts.push(ONES[o] ?? "");
  return parts.join(" ");
}
