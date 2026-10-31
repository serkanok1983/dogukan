/**
 * Övgü dili (MASTER_PLAN §2.12, proposals/parent-wellbeing.md F8). Sahibi S6.
 *
 * Kurallar (testle korunur):
 * - Süreç övülür (dikkat, deneme, strateji); kişi övülmez; kimseyle karşılaştırma yok.
 * - Satır ≤ 7 kelime; son 3 satırda tekrar yok.
 * - "Harika" oturumda en fazla bir kez; ad oturumda en fazla bir kez.
 * - Yasaklı: zeki | akıllı | en iyi | mükemmel | geçtin | kaybettin | başarısız | ders | ödev | yasak.
 */

export type PraiseContext =
  | "correct_first"
  | "correct_retry"
  | "wrong_try_again"
  | "wrong_reveal"
  | "set_done_high"
  | "set_done_low"
  | "run_end"
  | "new_star"
  | "persisted"
  | "chose_hard"
  | "break_done"
  | "day_done";

export const PRAISE_LINES: Readonly<Record<PraiseContext, readonly string[]>> = {
  correct_first: [
    "Dikkatle baktın!",
    "Buldun. Nasıl bildin?",
    "Kulağın iyi dinledi.",
    "Tam isabet.",
    "Sakin baktın, buldun.",
    "Gözlerin iyi aradı.",
    "Harika, dikkatle dinledin.",
  ],
  correct_retry: [
    "Bir daha denedin ve buldun!",
    "Pes etmedin. İşte bu.",
    "İkinci deneme, doğru!",
    "Tekrar baktın, buldun.",
    "Denedin, düşündün, buldun.",
  ],
  wrong_try_again: [
    "Henüz değil. Bir daha dinle.",
    "Hmm, tekrar bakalım.",
    "Yaklaştın. Bir kez daha.",
    "Bir daha dene, olur.",
    "Dikkatle dinle, yine dene.",
  ],
  wrong_reveal: [
    "İşte bu. Şimdi biliyorsun.",
    "Cevap buydu. Bir dahakine!",
    "Bak, bu. Şimdi öğrendin.",
    "Yanlışlar öğretir. İşte cevap.",
    "Birlikte bakalım: cevap bu.",
  ],
  set_done_high: [
    "Altı soru, hepsi senin.",
    "Çok çalıştın, oldu.",
    "Bütün sette dikkatin açıktı.",
    "Her soruya iyi baktın.",
    "Sabırla çalıştın, bitti!",
  ],
  set_done_low: [
    "Zor bir setti. Beynin çalıştı!",
    "Yanlışlar öğretir. Yarın yine.",
    "Zorlandın ama bitirdin.",
    "Denedikçe beynin büyüyor.",
    "Bitirdin! Zor sorular da öğretir.",
  ],
  run_end: [
    "İyi oynadın. Ne öğrendin?",
    "Her seferinde biraz daha ileri.",
    "Zor bölümdü, denedin.",
    "Dikkatle oynadın.",
    "Bu sefer neyi farklı yaptın?",
    "Harika bir deneme oldu.",
  ],
  new_star: [
    "Yeni yıldız! Sabrın kazandı.",
    "Yıldız geldi! Çok denedin.",
    "Bir yıldız daha! Emeğin bu.",
    "Yeni yıldız! Dikkatin işe yaradı.",
  ],
  persisted: [
    "Üç kere denedin. Bu cesaret.",
    "Vazgeçmedin. İşte bu!",
    "Tekrar tekrar denedin.",
    "Bırakmadın, devam ettin.",
  ],
  chose_hard: [
    "Zor olanı seçtin. Süper.",
    "Zoru seçtin. Bu cesaret.",
    "Zor olan beyni çalıştırır.",
    "Zor bir şey seçtin, deneyelim.",
  ],
  break_done: [
    "Gözlerin dinlendi. Hadi.",
    "Vücudun uyandı. Devam!",
    "Dinlendin, şimdi hazırsın.",
    "Güzel mola! Hadi.",
    "Nefeslendin. Haydi devam.",
  ],
  day_done: [
    "Bugün çok şey yaptın. Yarın görüşürüz.",
    "Bugün çok çalıştın. Yarın görüşürüz.",
    "Güzel bir gündü. Yarın yine!",
    "Bugün çok denedin. Hoşça kal.",
    "Bugünlük bu kadar. Yarın görüşürüz.",
  ],
};

export const BANNED_WORDS =
  /(^|[^\p{L}])(zeki|akıllı|en iyi|mükemmel|geçtin|kaybettin|başarısız|ders|ödev|yasak)/iu;

const MAX_WORDS = 7;
const RECENT = 3;
const HARIKA = /harika/iu;

let recent: string[] = [];
let harikaUsed = false;
let nameUsed = false;
let rng: () => number = Math.random;

export function wordCount(line: string): number {
  return line.trim().split(/\s+/).filter(Boolean).length;
}

export function praise(ctx: PraiseContext, opts?: { name?: string }): string {
  const lines = PRAISE_LINES[ctx];
  let pool = lines.filter(
    (l) => !recent.includes(l) && !(harikaUsed && HARIKA.test(l)),
  );
  if (pool.length === 0)
    pool = lines.filter((l) => !HARIKA.test(l) && l !== recent[recent.length - 1]);
  if (pool.length === 0) pool = [...lines];
  const line = pool[Math.floor(rng() * pool.length)] ?? lines[0];
  if (HARIKA.test(line)) harikaUsed = true;
  recent = [...recent, line].slice(-RECENT);

  const name = opts?.name?.trim();
  if (
    name &&
    !nameUsed &&
    !name.includes(" ") &&
    wordCount(line) < MAX_WORDS &&
    rng() < 0.34
  ) {
    nameUsed = true;
    return `${name}, ${line.charAt(0).toLocaleLowerCase("tr")}${line.slice(1)}`;
  }
  return line;
}

/**
 * Bir övgü satırının ses klibi kimliği (`p-<bağlam>-<sıra>`, docs/plan/VOICE_SCRIPT.md).
 * Ad eklenmiş satırlar için `undefined` (TTS okur). Kullanım:
 * `const line = praise("run_end"); speak(line, { clip: praiseClip(line) });`
 */
export function praiseClip(line: string): string | undefined {
  for (const ctx of Object.keys(PRAISE_LINES) as PraiseContext[]) {
    const i = PRAISE_LINES[ctx].indexOf(line);
    if (i >= 0) return `p-${ctx.replaceAll("_", "-")}-${i + 1}`;
  }
  return undefined;
}

/** @internal Testler için: oturum belleğini sıfırlar ve isteğe bağlı rastgele kaynağı verir. */
export function _resetPraiseForTests(random: () => number = Math.random): void {
  recent = [];
  harikaUsed = false;
  nameUsed = false;
  rng = random;
}
