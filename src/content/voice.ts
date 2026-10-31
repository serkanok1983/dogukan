/**
 * Çocuk ekran metinleri (MASTER_PLAN §2.14, CONTRACT §10.2). C0 tohumladı; sahibi S6.
 * Yer tutucular: {ad} oyuncu adı, {ayı} ayının adı, {skor} rekor.
 * Övgü satırları burada değil, `praise.ts`'te.
 */
export type VoiceKey =
  | "welcome"
  | "nameAsk"
  | "nameDone"
  | "continueRecord"
  | "start"
  | "exitAsk"
  | "jarEmpty"
  | "graceHint"
  | "warn5"
  | "warn1"
  | "limit"
  | "evening"
  | "eveningTile"
  | "night"
  | "chapterEnd"
  | "error";

export const VOICE: Readonly<Record<VoiceKey, string>> = {
  welcome: "Hoş geldin {ad}!",
  nameAsk: "Ben senin ayınım. Bana bir isim ver.",
  nameDone: "{ayı}! Ne güzel isim.",
  continueRecord: "Rekorun hâlâ burada: {skor}.",
  start: "Hazır? Üç, iki, bir!",
  exitAsk: "Gidiyor muyuz?",
  jarEmpty: "Bal bitti. Üç soruyla bal toplayalım mı?",
  graceHint: "Yarından sonra bal böyle: oynarken azalır, öğrenirken dolar.",
  warn5: "Beş dakika kaldı. Son oyununu seç.",
  warn1: "Bu son tur!",
  limit: "Bugünlük bu kadar! Bugün çok şey yaptın.",
  evening: "Akşam oldu. Sakin oyunlar açık.",
  eveningTile: "Macera Adası uyuyor. Sabah görüşürüz.",
  night: "İyi geceler {ad}. Yarın görüşürüz.",
  chapterEnd: "Çanta doldu! Bugünlük bu kadar mı, devam mı?",
  error: "Oyun biraz yoruldu.",
};

/** {skor} gibi ek yer tutucuları doldurur; {ad}/{ayı} `speech.fillTemplate` ile dolar. */
export function voiceLine(key: VoiceKey, vars: Record<string, string | number> = {}): string {
  let line: string = VOICE[key];
  for (const [k, v] of Object.entries(vars)) line = line.replaceAll(`{${k}}`, String(v));
  return line;
}
