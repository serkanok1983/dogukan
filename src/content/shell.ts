/**
 * Kabuk (giriş, harita, ada ekranı) çocuk metinleri. Sahibi S1.
 * Her metin hem gösterilir hem söylenir. Yer tutucular: {ad} oyuncu adı,
 * {ayı} ayının adı (speech.fillTemplate doldurur), {ada}, {n} (burada dolar).
 * Kural: TTS'e asla tek ünsüz söyletilmez.
 */
export const SHELL = {
  whoTitle: "Kim oynuyor?",
  whoSay: "Kim oynuyor? Resmine dokun.",
  nameTitle: "Bana bir isim ver",
  nameOptions: "Bal mı, Pati mi, Fıstık mı, Kaptan mı?",
  nameWrite: "Baban yazsın",
  nameWriteSay: "Baban yazsın",
  bearGreeting: "Merhaba {ad}! Hangi adaya gidelim?",
  bearQuest: "Bugünkü görev: {gorev}",
  goodbye: "Görüşürüz {ad}!",
  continueLabel: "Devam et",
  continueSay: "Devam et: {etkinlik}.",
  questTitle: "Günün Görevi",
  questSay: "Günün görevi.",
  questsDone: "Çanta doldu!",
  stars: "{n} yıldızın var.",
  streak: "{n} günlük serin var.",
  streakZero: "Bugün bir şey öğren, serin başlasın.",
  album: "Çıkartmalarım",
  map: "Harita",
  islandSleeping: "{ada} uyuyor. Sabah görüşürüz.",
  activitySleeping: "Bu oyun uyuyor. Sabah görüşürüz.",
  babaGateTitle: "Babanla birlikte",
  babaGateSay: "Bu ada babanla açılır. Babanı çağır!",
  babaCall: "Babanı çağır",
  babaOff: "Bu ada şimdilik kapalı.",
  morePages: "Kaydır, başka oyunlar da var.",
} as const;

/** `{anahtar}` yer tutucularını doldurur ({ad}/{ayı} speak() içinde dolar). */
export function shellLine(
  text: string,
  vars: Record<string, string | number> = {},
): string {
  let line = text;
  for (const [k, v] of Object.entries(vars))
    line = line.replaceAll(`{${k}}`, String(v));
  return line;
}
