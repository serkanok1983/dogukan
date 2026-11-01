/**
 * Merak Kapsülleri (CONTRACT §10.5, MASTER_PLAN §2.9). Owner: S7.
 *
 * Healthy "shorts": exactly 12 full-screen cards per episode, ≤ 8 spoken words
 * per card, one tap per card, card 12 is a real-world mission. Order:
 * hook → (wonder → lab POE → fact) ×2 → wonder → word → 2 quiz → mission.
 *
 * Additive fields (owner extension, allowed by CONTRACT header):
 * - `visual.from` (lab only): preset shown before the tap is answered; after a
 *   `predict`/`choose` pick the stage moves to `preset` (predict → observe).
 * - `CapsuleChoice.preset` (lab only): tapping the choice sets the stage to
 *   this preset; such cards can be played freely (several taps).
 */
import type { EncyclopediaTopic } from "@/lib/encyclopedia";

export type CapsuleChoice = {
  id: string;
  emoji: string;
  label: string;
  say: string;
  preset?: number;
};
export type CapsuleCardKind =
  "hook" | "fact" | "wonder" | "lab" | "word" | "quiz" | "mission";

export type CapsuleCard = {
  id: string;
  kind: CapsuleCardKind;
  say: string;
  text?: string;
  visual:
    | { type: "emoji"; scene: string }
    | { type: "lab"; mode: EncyclopediaTopic["lab"]; preset: number; from?: number };
  tap: {
    type: "predict" | "choose" | "listen" | "done";
    prompt?: string;
    choices?: CapsuleChoice[];
    answerId?: string;
    explain?: string;
  };
};

export type CapsuleEpisode = {
  topic: string;
  title: string;
  emoji: string;
  previewEmoji: string;
  cards: CapsuleCard[];
  parentNote: string;
};

const emoji = (scene: string) => ({ type: "emoji", scene }) as const;

const ISIK_VE_GOLGE: CapsuleEpisode = {
  topic: "isik-ve-golge",
  title: "Işık ve gölge",
  emoji: "🔦",
  previewEmoji: "🔦🐰",
  parentNote:
    "Bu akşam birlikte: Odayı karartın ve bir LED el feneriyle duvara el gölgeleri yapın (tavşan, kuş). Sonra bir oyuncağı fenere yaklaştırıp uzaklaştırın ve önce tahmin etmesini isteyin: “Gölge büyür mü, küçülür mü?” Feneri göze tutmayın; dışarıda Güneş’e doğrudan bakılmaz.",
  cards: [
    {
      id: "isik-1",
      kind: "hook",
      say: "Gölge nereden gelir?",
      visual: emoji("🔦🧸"),
      tap: {
        type: "predict",
        prompt: "Sence?",
        choices: [
          { id: "gunes", emoji: "☀️", label: "Güneş", say: "Güneşten mi?" },
          { id: "lamba", emoji: "💡", label: "Lamba", say: "Lambadan mı?" },
          { id: "oyuncak", emoji: "🧸", label: "Oyuncak", say: "Oyuncaktan mı?" },
        ],
        explain: "Hadi bakalım!",
      },
    },
    {
      id: "isik-2",
      kind: "wonder",
      say: "Fenerin önüne elini koyarsan ne olur?",
      visual: emoji("🔦✋"),
      tap: {
        type: "predict",
        prompt: "Duvarda ne görürsün?",
        choices: [
          { id: "golge", emoji: "🌑", label: "Gölge", say: "Gölge mi?" },
          { id: "gokkusagi", emoji: "🌈", label: "Gökkuşağı", say: "Gökkuşağı mı?" },
          { id: "yildiz", emoji: "⭐", label: "Yıldız", say: "Yıldız mı?" },
        ],
        explain: "Elin ışığı tutar. Duvarda gölge olur.",
      },
    },
    {
      id: "isik-3",
      kind: "lab",
      say: "Güneş tepede. Ağacın gölgesi kısa.",
      visual: { type: "lab", mode: "light", from: 80, preset: 18 },
      tap: {
        type: "predict",
        prompt: "Güneş alçalınca gölge ne olur?",
        choices: [
          { id: "uzar", emoji: "📏", label: "Uzar", say: "Uzar mı?" },
          { id: "kisalir", emoji: "🤏", label: "Kısalır", say: "Kısalır mı?" },
        ],
        explain: "Bak! Güneş alçalınca gölge uzar.",
      },
    },
    {
      id: "isik-4",
      kind: "fact",
      say: "Akşam güneş alçak. Gölgen upuzun olur.",
      visual: emoji("🌇🧍"),
      tap: {
        type: "choose",
        prompt: "Hangi gölge daha uzun?",
        choices: [
          { id: "aksam", emoji: "🌇", label: "Akşam", say: "Akşam." },
          { id: "ogle", emoji: "🌞", label: "Öğle", say: "Öğle." },
        ],
        answerId: "aksam",
        explain: "Akşam güneş alçak, gölge uzun.",
      },
    },
    {
      id: "isik-5",
      kind: "wonder",
      say: "Kedinin gölgesi neye benzer?",
      visual: emoji("🐈‍⬛💡"),
      tap: {
        type: "choose",
        prompt: "Hangisi?",
        choices: [
          { id: "kedi", emoji: "🐈", label: "Kedi", say: "Kedi." },
          { id: "balik", emoji: "🐟", label: "Balık", say: "Balık." },
        ],
        answerId: "kedi",
        explain: "Gölge, kedinin şeklini gösterir.",
      },
    },
    {
      id: "isik-6",
      kind: "lab",
      say: "Güneşi oynat, gölgeyi izle.",
      visual: { type: "lab", mode: "light", preset: 50 },
      tap: {
        type: "predict",
        prompt: "Güneş nerede olsun?",
        choices: [
          {
            id: "sabah",
            emoji: "🌄",
            label: "Sabah",
            say: "Sabah! Gölge uzun.",
            preset: 20,
          },
          {
            id: "ogle",
            emoji: "🌞",
            label: "Öğle",
            say: "Öğle! Gölge kısa.",
            preset: 85,
          },
          {
            id: "aksam",
            emoji: "🌇",
            label: "Akşam",
            say: "Akşam! Gölge yine uzun.",
            preset: 24,
          },
        ],
      },
    },
    {
      id: "isik-7",
      kind: "fact",
      say: "Cam ışığı geçirir. Duvar ışığı tutar.",
      visual: emoji("🪟🧱"),
      tap: {
        type: "choose",
        prompt: "Hangisinin gölgesi koyu?",
        choices: [
          { id: "duvar", emoji: "🧱", label: "Duvar", say: "Duvar." },
          { id: "cam", emoji: "🪟", label: "Cam", say: "Cam." },
        ],
        answerId: "duvar",
        explain: "Duvar ışığı tutar. Gölgesi koyu olur.",
      },
    },
    {
      id: "isik-8",
      kind: "wonder",
      say: "Elinle tavşan gölgesi yapabilir misin?",
      visual: emoji("🖐️🐰"),
      tap: {
        type: "predict",
        prompt: "Hangisini yaparsın?",
        choices: [
          { id: "tavsan", emoji: "🐰", label: "Tavşan", say: "Tavşan!" },
          { id: "kus", emoji: "🐦", label: "Kuş", say: "Kuş!" },
          { id: "kopek", emoji: "🐶", label: "Köpek", say: "Köpek!" },
        ],
        explain: "Akşam fenerle dene!",
      },
    },
    {
      id: "isik-9",
      kind: "word",
      say: "Gölge. Göl-ge. Gölge.",
      text: "gölge",
      visual: emoji("🌑"),
      tap: { type: "listen", prompt: "Sen de söyle: gölge!" },
    },
    {
      id: "isik-10",
      kind: "quiz",
      say: "Lamba sönünce gölge ne olur?",
      visual: emoji("💡🌑"),
      tap: {
        type: "choose",
        choices: [
          { id: "kaybolur", emoji: "🌑❌", label: "Kaybolur", say: "Kaybolur." },
          { id: "uzar", emoji: "📏", label: "Uzar", say: "Uzar." },
          { id: "kizarir", emoji: "🔴", label: "Kızarır", say: "Kızarır." },
        ],
        answerId: "kaybolur",
        explain: "Işık yoksa gölge de yok.",
      },
    },
    {
      id: "isik-11",
      kind: "quiz",
      say: "Gölge için ne lazım?",
      visual: emoji("🌑❓"),
      tap: {
        type: "choose",
        choices: [
          { id: "isik", emoji: "💡", label: "Işık", say: "Işık." },
          { id: "su", emoji: "💧", label: "Su", say: "Su." },
          { id: "ses", emoji: "🎵", label: "Ses", say: "Ses." },
        ],
        answerId: "isik",
        explain: "Gölge için ışık lazım.",
      },
    },
    {
      id: "isik-12",
      kind: "mission",
      say: "Babanla dene: fenerle duvara tavşan gölgesi yap!",
      visual: emoji("👨 🧒 🔦"),
      tap: { type: "done", prompt: "Babanı çağır, sonra Bitti'ye bas." },
    },
  ],
};

const KALBIM_VE_NEFESIM: CapsuleEpisode = {
  topic: "kalbim-ve-nefesim",
  title: "Kalbim ve nefesim",
  emoji: "❤️",
  previewEmoji: "❤️🫁",
  parentNote:
    "Bu akşam birlikte: Sakin oturup elinizi göğsünüze koyun ve kalp atışını birlikte hissedin. Sonra 10 kez zıplayın ve yeniden dinleyin; bir dakika dinlenince ne değiştiğini sorun. Bu bir ölçüm ya da tanı değildir, sonuçları yarıştırmayın. Baş dönmesi veya nefes darlığı olursa durun; boyundaki damara bastırmayın.",
  cards: [
    {
      id: "kalp-1",
      kind: "hook",
      say: "Koşunca kalbin ne yapar?",
      visual: emoji("❤️🏃"),
      tap: {
        type: "predict",
        prompt: "Sence?",
        choices: [
          { id: "hizli", emoji: "🐇", label: "Hızlı", say: "Hızlı mı atar?" },
          { id: "yavas", emoji: "🐢", label: "Yavaş", say: "Yavaş mı atar?" },
          { id: "uyur", emoji: "😴", label: "Uyur", say: "Uyur mu?" },
        ],
        explain: "Hadi bakalım!",
      },
    },
    {
      id: "kalp-2",
      kind: "wonder",
      say: "Elini göğsüne koy. Ne hissediyorsun?",
      visual: emoji("✋❤️"),
      tap: {
        type: "predict",
        prompt: "Ne var?",
        choices: [
          { id: "kut", emoji: "🥁", label: "Küt-küt", say: "Küt küt!" },
          { id: "sessiz", emoji: "🤫", label: "Sessiz", say: "Sessiz mi?" },
        ],
        explain: "Küt küt! Bu senin kalbin.",
      },
    },
    {
      id: "kalp-3",
      kind: "lab",
      say: "Bu kalp dinleniyor. Yavaş atıyor.",
      visual: { type: "lab", mode: "body", from: 66, preset: 130 },
      tap: {
        type: "predict",
        prompt: "Koşarsa ne olur?",
        choices: [
          { id: "hizlanir", emoji: "🐇", label: "Hızlanır", say: "Hızlanır mı?" },
          { id: "yavaslar", emoji: "🐢", label: "Yavaşlar", say: "Yavaşlar mı?" },
        ],
        explain: "Bak! Koşunca kalp hızlı atar.",
      },
    },
    {
      id: "kalp-4",
      kind: "fact",
      say: "Kalp bir pompa. Kanı her yere iter.",
      visual: emoji("❤️🩸"),
      tap: {
        type: "choose",
        prompt: "Kalp neyi iter?",
        choices: [
          { id: "kan", emoji: "🩸", label: "Kan", say: "Kan." },
          { id: "elma", emoji: "🍎", label: "Elma", say: "Elma." },
        ],
        answerId: "kan",
        explain: "Kalp kanı bütün vücuda iter.",
      },
    },
    {
      id: "kalp-5",
      kind: "wonder",
      say: "Burnundan hava al. Hava nereye gider?",
      visual: emoji("👃🌬️"),
      tap: {
        type: "predict",
        prompt: "Sence?",
        choices: [
          { id: "akciger", emoji: "🫁", label: "Akciğer", say: "Akciğere mi?" },
          { id: "ayak", emoji: "🦶", label: "Ayak", say: "Ayağa mı?" },
          { id: "kulak", emoji: "👂", label: "Kulak", say: "Kulağa mı?" },
        ],
        explain: "Hava akciğerlere gider.",
      },
    },
    {
      id: "kalp-6",
      kind: "lab",
      say: "Akciğerler balon gibi şişer, iner.",
      visual: { type: "lab", mode: "body", preset: 70 },
      tap: {
        type: "predict",
        prompt: "Koş ya da dinlen!",
        choices: [
          {
            id: "kos",
            emoji: "🏃",
            label: "Koş",
            say: "Koşunca kalp ve nefes hızlanır.",
            preset: 130,
          },
          {
            id: "dinlen",
            emoji: "🛋️",
            label: "Dinlen",
            say: "Dinlenince kalp ve nefes yavaşlar.",
            preset: 64,
          },
        ],
      },
    },
    {
      id: "kalp-7",
      kind: "fact",
      say: "Sen uyurken bile kalbin çalışır.",
      visual: emoji("😴❤️"),
      tap: {
        type: "choose",
        prompt: "Uyurken kalbin ne yapar?",
        choices: [
          { id: "atar", emoji: "❤️", label: "Atar", say: "Atar." },
          { id: "uyur", emoji: "😴", label: "Uyur", say: "Uyur." },
        ],
        answerId: "atar",
        explain: "Sen uyursun, kalbin atmaya devam eder.",
      },
    },
    {
      id: "kalp-8",
      kind: "wonder",
      say: "Beş kere zıpla. Elini göğsüne koy.",
      visual: emoji("🤸💓"),
      tap: {
        type: "predict",
        prompt: "Kalbin nasıl atıyor?",
        choices: [
          { id: "hizli", emoji: "🐇", label: "Hızlı", say: "Hızlı mı?" },
          { id: "yavas", emoji: "🐢", label: "Yavaş", say: "Yavaş mı?" },
        ],
        explain: "Hızlı! Bu atışa nabız denir.",
      },
    },
    {
      id: "kalp-9",
      kind: "word",
      say: "Nabız. Na-bız. Nabız.",
      text: "nabız",
      visual: emoji("💓"),
      tap: { type: "listen", prompt: "Sen de söyle: nabız!" },
    },
    {
      id: "kalp-10",
      kind: "quiz",
      say: "Koşunca ne hızlanır?",
      visual: emoji("🏃❓"),
      tap: {
        type: "choose",
        choices: [
          { id: "kalp", emoji: "❤️", label: "Kalp", say: "Kalp." },
          { id: "kulak", emoji: "👂", label: "Kulak", say: "Kulak." },
          { id: "dis", emoji: "🦷", label: "Diş", say: "Diş." },
        ],
        answerId: "kalp",
        explain: "Koşunca kalp ve nefes hızlanır.",
      },
    },
    {
      id: "kalp-11",
      kind: "quiz",
      say: "Hava nereden girer?",
      visual: emoji("🌬️❓"),
      tap: {
        type: "choose",
        choices: [
          { id: "burun", emoji: "👃", label: "Burun", say: "Burun." },
          { id: "kulak", emoji: "👂", label: "Kulak", say: "Kulak." },
          { id: "ayak", emoji: "🦶", label: "Ayak", say: "Ayak." },
        ],
        answerId: "burun",
        explain: "Hava burundan girer, akciğere gider.",
      },
    },
    {
      id: "kalp-12",
      kind: "mission",
      say: "Babanla dene: zıpla, sonra elini göğsüne koy!",
      visual: emoji("👨 🧒 ❤️"),
      tap: { type: "done", prompt: "Babanı çağır, sonra Bitti'ye bas." },
    },
  ],
};

export const EPISODES: readonly CapsuleEpisode[] = [
  ISIK_VE_GOLGE,
  KALBIM_VE_NEFESIM,
];

export function getEpisode(topic: string): CapsuleEpisode | undefined {
  return EPISODES.find((e) => e.topic === topic);
}

export function episodeHref(topic: string): string {
  return `/kesfet/${topic}/kapsul/`;
}
