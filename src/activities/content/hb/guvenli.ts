/**
 * `hb.guvenli` — Güvenli Yol: trafik, evdeki tehlikeler, kaybolunca yardım,
 * 112 ve "ekranda korkunç bir şey" senaryoları. Her madde bir sahne + seçenekler.
 * L1: 2 seçenek · L2: 3 seçenek · L3: 3–4 seçenek ve ek senaryolar.
 *
 * Emoji sözlüğü tüm senaryolarda tutarlıdır (testle korunur): bir emoji bir
 * senaryoda doğru, başka birinde yanlış seçenek olmaz. ✋ = dur/hayır,
 * 🙋 = büyüğüne/görevliye söyle, 🙅 = uzak dur, 🏃 = koşarım (hep yanlış).
 * Trafik: Türkiye'de öğretilen sıra "önce sola, sonra sağa, sonra yine sola".
 */
import type { Choice, Exercise, Generator } from "@/activities/engine/types";
import { pick, shuffled } from "@/lib/rng";
import type { SkillLevel } from "@/lib/skills";
import { choiceCount, sample } from "../util";

const SKILL = "hb.guvenli" as const;

type Option = { emoji?: string; text: string; say?: string };

type Scenario = {
  key: string;
  minLevel: 1 | 2 | 3;
  scene: string;
  caption: string;
  say: string;
  correct: Option;
  wrong: readonly Option[];
  retry: string;
  reveal: string;
};

export const SCENARIOS: readonly Scenario[] = [
  {
    key: "kirmizi-isik",
    minLevel: 1,
    scene: "🔴",
    caption: "Işık kırmızı",
    say: "Yaya ışığı kırmızı yandı. Ne yaparsın?",
    correct: { emoji: "✋", text: "Dururum" },
    wrong: [
      { emoji: "🏃", text: "Koşarak geçerim" },
      { emoji: "⚽", text: "Yolda top oynarım" },
      { emoji: "🙈", text: "Gözümü kapatıp geçerim" },
    ],
    retry: "Kırmızı ışık ne der? Düşün.",
    reveal: "Kırmızıda durulur, yeşili bekleriz.",
  },
  {
    key: "yesil-isik",
    minLevel: 1,
    scene: "🟢",
    caption: "Yaya ışığı yeşil",
    say: "Yaya ışığı yeşil yandı. Nasıl geçersin?",
    correct: { emoji: "👀", text: "Sola, sağa, sola bakıp geçerim" },
    wrong: [
      { emoji: "📱", text: "Telefona bakarak geçerim" },
      { emoji: "🏃", text: "Hiç bakmadan koşarım" },
      { emoji: "🧍", text: "Yolun ortasında dururum" },
    ],
    retry: "Geçmeden önce nereye bakarız?",
    reveal: "Önce sola, sonra sağa, sonra yine sola bak.",
  },
  {
    key: "ocak",
    minLevel: 1,
    scene: "🍲",
    caption: "Ocakta sıcak tencere",
    say: "Ocakta sıcak bir tencere var. Ne yaparsın?",
    correct: { emoji: "🙅", text: "Uzak dururum" },
    wrong: [
      { emoji: "👆", text: "Tencereye dokunurum" },
      { emoji: "🥄", text: "Kaşıkla karıştırırım" },
      { emoji: "🧗", text: "Ocağa tırmanırım" },
    ],
    retry: "Sıcak şeyler eli yakar. Düşün.",
    reveal: "Sıcak ocaktan uzak dururuz.",
  },
  {
    key: "priz",
    minLevel: 1,
    scene: "🔌",
    caption: "Duvarda priz",
    say: "Duvarda bir priz var. Ne yaparsın?",
    correct: { emoji: "🙅", text: "Prize dokunmam" },
    wrong: [
      { emoji: "🧸", text: "Prizle oynarım" },
      { emoji: "💧", text: "Prize su dökerim" },
      { emoji: "👉", text: "Parmağımı uzatırım" },
    ],
    retry: "Priz tehlikeli mi? Düşün.",
    reveal: "Prize dokunmayız, elektrik çarpar.",
  },
  {
    key: "bicak",
    minLevel: 1,
    scene: "🔪",
    caption: "Masada bıçak",
    say: "Masada keskin bir bıçak var. Ne yaparsın?",
    correct: { emoji: "🙋", text: "Büyüğüme söylerim" },
    wrong: [
      { emoji: "🤹", text: "Alıp oynarım" },
      { emoji: "🏃", text: "Elimde koşarım" },
      { emoji: "🎒", text: "Çantama koyarım" },
    ],
    retry: "Bıçağı kim kullanır? Düşün.",
    reveal: "Bıçağı büyükler kullanır. Büyüğüne söyle.",
  },
  {
    key: "ekran",
    minLevel: 1,
    scene: "📱",
    caption: "Ekranda korkunç bir şey",
    say: "Ekranda korkunç bir şey gördün. Ne yaparsın?",
    correct: {
      emoji: "🙋",
      text: "Kapatır, büyüğüme gösteririm",
      say: "Kapatırım ve büyüğüme gösteririm",
    },
    wrong: [
      { emoji: "📺", text: "Bakmaya devam ederim" },
      { emoji: "🤐", text: "Kimseye söylemem" },
      { emoji: "🤫", text: "Gizlice yine açarım" },
    ],
    retry: "Korkunca kime gideriz? Düşün.",
    reveal: "Kapat ve büyüğüne göster.",
  },
  {
    key: "kayip-market",
    minLevel: 2,
    scene: "🛒",
    caption: "Markette kayboldun",
    say: "Markette anneni göremiyorsun. Kimden yardım istersin?",
    correct: { emoji: "🧑‍💼", text: "Kasadaki görevliden" },
    wrong: [
      { emoji: "🚪", text: "Kimseye sormam, dışarı çıkarım" },
      { emoji: "🕴️", text: "Tanımadığım birinin peşinden giderim" },
      { emoji: "🙈", text: "Saklanırım" },
    ],
    retry: "Orada çalışan biri var mı? Düşün.",
    reveal: "Görevliden yardım iste, orada bekle.",
  },
  {
    key: "kayip-park",
    minLevel: 2,
    scene: "🏞️",
    caption: "Parkta kayboldun",
    say: "Parkta babanı göremiyorsun. Ne yaparsın?",
    correct: { emoji: "🙋", text: "Yerimde kalırım, çocuklu bir anneye söylerim" },
    wrong: [
      { emoji: "🏃", text: "Babamı aramaya koşarım" },
      { emoji: "🚗", text: "Arabadaki yabancıya giderim" },
      { emoji: "🚪", text: "Parktan dışarı çıkarım" },
    ],
    retry: "Kaybolunca nerede bekleriz? Düşün.",
    reveal: "Olduğun yerde kal, çocuklu bir anneye söyle.",
  },
  {
    key: "112",
    minLevel: 2,
    scene: "🚑",
    caption: "Acil yardım",
    say: "Biri yaralandı, yardım lazım. Hangi numarayı ararız?",
    correct: { text: "112", say: "yüz on iki" },
    wrong: [
      { text: "123", say: "yüz yirmi üç" },
      { text: "500", say: "beş yüz" },
      { text: "7", say: "yedi" },
    ],
    retry: "Acil numara bir, bir, iki.",
    reveal: "Acil durumda 112 aranır.",
  },
  {
    key: "yabanci-seker",
    minLevel: 2,
    scene: "🍬",
    caption: "Yabancı şeker veriyor",
    say: "Tanımadığın biri sana şeker veriyor. Ne yaparsın?",
    correct: { emoji: "✋", text: "Almam, anneme söylerim" },
    wrong: [
      { emoji: "😋", text: "Alır yerim" },
      { emoji: "🚶", text: "Onunla giderim" },
      { emoji: "🤐", text: "Alırım, kimseye söylemem" },
    ],
    retry: "Yabancıdan bir şey alınır mı?",
    reveal: "Yabancıdan bir şey alma, büyüğüne söyle.",
  },
  {
    key: "ilac",
    minLevel: 3,
    scene: "💊",
    caption: "Masada ilaç",
    say: "Masada şekere benzeyen ilaçlar var. Ne yaparsın?",
    correct: { emoji: "🙋", text: "Dokunmam, büyüğüme söylerim" },
    wrong: [
      { emoji: "😋", text: "Şeker diye yerim" },
      { emoji: "🧸", text: "Oyuncaklarıma veririm" },
      { emoji: "👖", text: "Cebime koyarım" },
    ],
    retry: "İlaç şeker midir? Düşün.",
    reveal: "İlacı yalnız büyükler verir.",
  },
  {
    key: "kemer",
    minLevel: 3,
    scene: "🚗",
    caption: "Arabaya bindin",
    say: "Arabaya bindin. İlk ne yaparsın?",
    correct: { emoji: "🔗", text: "Kemerimi takarım" },
    wrong: [
      { emoji: "🧸", text: "Kemersiz oynarım" },
      { emoji: "🪟", text: "Camdan sarkarım" },
      { emoji: "🤸", text: "Koltukta zıplarım" },
    ],
    retry: "Arabada bizi ne korur?",
    reveal: "Arabada önce kemer takılır.",
  },
];

function toChoice(o: Option, id: string): Choice {
  return {
    id,
    ...(o.emoji ? { emoji: o.emoji } : {}),
    text: o.text,
    say: o.say ?? o.text,
  };
}

export const guvenli: Generator = {
  skill: SKILL,
  maxLevel: 3,
  generate(rng, requested) {
    const level: SkillLevel = requested >= 3 ? 3 : requested;
    const s = pick(
      rng,
      SCENARIOS.filter((x) => x.minLevel <= level),
    );
    const n = Math.min(choiceCount(level), s.wrong.length + 1);
    const wrong = sample(rng, s.wrong, n - 1).map((o) =>
      toChoice(o, `${s.key}:${s.wrong.indexOf(o)}`),
    );
    const exercise: Exercise = {
      id: `${SKILL}:${level}:${s.key}`,
      skill: SKILL,
      level,
      kind: "choice",
      prompt: {
        say: s.say,
        visual: { type: "scene", emoji: s.scene, caption: s.caption },
        hintSay: s.say,
      },
      choices: shuffled(rng, [toChoice(s.correct, `${s.key}:ok`), ...wrong]),
      answerIds: [`${s.key}:ok`],
      feedback: { retry: s.retry, reveal: s.reveal },
      ...(level === 1 ? { bigTap: true } : {}),
    };
    return exercise;
  },
};
