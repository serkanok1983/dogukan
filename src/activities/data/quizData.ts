import type { QuizQuestion } from "../shared/QuizGame";

const LETTERS = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");
const VOWELS = ["A", "E", "I", "İ", "O", "Ö", "U", "Ü"];

export const harfTania: QuizQuestion[] = LETTERS.slice(0, 12).map((L) => ({
  prompt: `Hangi harf "${L}"?`,
  emoji: "🔤",
  answer: L,
  options: LETTERS,
  hint: `Sesini söyle: ${L}`,
}));

export const sesliHarf: QuizQuestion[] = VOWELS.map((L) => ({
  prompt: `"${L}" sesli harf mi?`,
  emoji: "🎵",
  answer: "Evet",
  options: ["Evet", "Hayır"],
}));

export const kelimeOkuma: QuizQuestion[] = [
  { prompt: "Bu kelime ne?", emoji: "🐱", answer: "KEDİ", options: ["KEDİ", "KUŞ", "KAPI", "KALE"], hint: "Miyavlayan hayvan" },
  { prompt: "Bu kelime ne?", emoji: "☀️", answer: "GÜNEŞ", options: ["GÜNEŞ", "GÖL", "GEMİ", "GÜL"], hint: "Gündüz gökyüzünde parlar" },
  { prompt: "Bu kelime ne?", emoji: "🍎", answer: "ELMA", options: ["ELMA", "EKMEK", "EV", "DENİZ"], hint: "Kırmızı meyve" },
  { prompt: "Bu kelime ne?", emoji: "📚", answer: "KİTAP", options: ["KİTAP", "KALEM", "KUM", "KUZU"], hint: "Okumak için" },
  { prompt: "Bu kelime ne?", emoji: "🏠", answer: "EV", options: ["EV", "ARABA", "AĞAÇ", "SU"], hint: "İçinde yaşarız" },
];

export const heceBirlestir: QuizQuestion[] = [
  { prompt: "el + ma = ?", emoji: "🧱", answer: "elma", options: ["elma", "alem", "mela", "lame"], hint: "Meyve" },
  { prompt: "ka + pa = ?", emoji: "🧱", answer: "kapa", options: ["kapa", "apak", "paka", "akap"], hint: "Kapağı kapat" },
  { prompt: "ba + la = ?", emoji: "🧱", answer: "bala", options: ["bala", "alab", "laba", "abla"], hint: "Arı yapar" },
  { prompt: "a + ta = ?", emoji: "🧱", answer: "ata", options: ["ata", "taa", "aat", "tat"], hint: "Babaanne dediğimiz" },
];

export const cumleKur: QuizQuestion[] = [
  { prompt: "Doğru sıra?", emoji: "✏️", answer: "Ben okula giderim", options: ["Ben okula giderim", "Okula ben giderim", "Giderim ben okula", "Okula giderim ben"] },
  { prompt: "Doğru sıra?", emoji: "✏️", answer: "Annem yemek yapar", options: ["Annem yemek yapar", "Yemek annem yapar", "Yapar annem yemek", "Yemek yapar annem"] },
];

export const alfabeSirasi: QuizQuestion[] = [
  { prompt: "C'den sonra hangi harf gelir?", emoji: "🔠", answer: "Ç", options: LETTERS, hint: "Türk alfabesi sırası" },
  { prompt: "F'den sonra?", emoji: "🔠", answer: "G", options: LETTERS },
  { prompt: "K'den sonra?", emoji: "🔠", answer: "L", options: LETTERS },
];

export const benzerKelime: QuizQuestion[] = [
  { prompt: "Hangisi 'anne' ile aynı aileden?", emoji: "👯", answer: "baba", options: ["baba", "masa", "kalem", "top"], hint: "Aile" },
  { prompt: "Hangisi 'kedi' gibi hayvan?", emoji: "👯", answer: "köpek", options: ["köpek", "araba", "ev", "kitap"] },
];

export const boslukDoldur: QuizQuestion[] = [
  { prompt: "Güneş gökyüzünde ___", emoji: "📝", answer: "parlar", options: ["parlar", "yüzer", "uçar", "koşar"], hint: "Işık verir" },
  { prompt: "Balıklar suda ___", emoji: "📝", answer: "yüzer", options: ["yüzer", "uçar", "yürür", "konuşur"] },
];

export const toplama: QuizQuestion[] = Array.from({ length: 8 }, (_, i) => {
  const a = (i % 5) + 1;
  const b = (i % 4) + 1;
  const s = a + b;
  const opts = [s, s + 1, s - 1, s + 2].filter((n) => n > 0).map(String);
  return {
    prompt: `${a} + ${b} = ?`,
    emoji: "➕",
    answer: String(s),
    options: opts,
    hint: `${a} elma + ${b} elma`,
  };
});

export const cikarma: QuizQuestion[] = Array.from({ length: 8 }, (_, i) => {
  const a = (i % 5) + 5;
  const b = (i % 4) + 1;
  const s = a - b;
  return {
    prompt: `${a} − ${b} = ?`,
    emoji: "➖",
    answer: String(s),
    options: [String(s), String(s + 1), String(s - 1), String(s + 2)].filter((n) => Number(n) >= 0),
  };
});

export const ciftTek: QuizQuestion[] = [
  { prompt: "4 çift mi tek mi?", emoji: "2️⃣", answer: "Çift", options: ["Çift", "Tek"] },
  { prompt: "7 çift mi tek mi?", emoji: "2️⃣", answer: "Tek", options: ["Çift", "Tek"] },
  { prompt: "10 çift mi tek mi?", emoji: "2️⃣", answer: "Çift", options: ["Çift", "Tek"] },
  { prompt: "3 çift mi tek mi?", emoji: "2️⃣", answer: "Tek", options: ["Çift", "Tek"] },
];

export const onlukBirlik: QuizQuestion[] = [
  { prompt: "23'te kaç onluk var?", emoji: "🧮", answer: "2", options: ["2", "3", "23", "5"] },
  { prompt: "45'te kaç birlik?", emoji: "🧮", answer: "5", options: ["4", "5", "45", "9"] },
  { prompt: "30 sayısı kaç onluk?", emoji: "🧮", answer: "3", options: ["0", "3", "30", "10"] },
];

export const saatOgren: QuizQuestion[] = [
  { prompt: "Saat 3:00 — akrep nerede?", emoji: "🕐", answer: "3", options: ["3", "12", "6", "9"], hint: "Tam saat" },
  { prompt: "Saat 6:00 — akrep?", emoji: "🕕", answer: "6", options: ["3", "6", "12", "9"] },
  { prompt: "Saat 12:00 — akrep?", emoji: "🕛", answer: "12", options: ["12", "6", "3", "1"] },
];

export const paraSay: QuizQuestion[] = [
  { prompt: "1 TL + 1 TL = ?", emoji: "💰", answer: "2 TL", options: ["2 TL", "1 TL", "3 TL", "11 TL"] },
  { prompt: "5 TL + 2 TL = ?", emoji: "💰", answer: "7 TL", options: ["7 TL", "52 TL", "3 TL", "10 TL"] },
];

export const karsilastir: QuizQuestion[] = [
  { prompt: "Hangisi daha büyük?", emoji: "⚖️", answer: "9", options: ["9", "5", "3", "1"] },
  { prompt: "Hangisi daha küçük?", emoji: "⚖️", answer: "2", options: ["8", "7", "2", "6"] },
  { prompt: "7 ___ 4 (büyüktür)", emoji: "⚖️", answer: ">", options: [">", "<", "="] },
];

export const sekilTani: QuizQuestion[] = [
  { prompt: "🔺 Bu şekil?", emoji: "⬛", answer: "Üçgen", options: ["Üçgen", "Kare", "Daire", "Dikdörtgen"] },
  { prompt: "⬜ Bu şekil?", emoji: "⬛", answer: "Kare", options: ["Kare", "Üçgen", "Daire", "Yıldız"] },
  { prompt: "⚫ Bu şekil?", emoji: "⬛", answer: "Daire", options: ["Daire", "Kare", "Üçgen", "Küp"] },
];

export const desenTamamla: QuizQuestion[] = [
  { prompt: "🔴🔵🔴🔵 ?", emoji: "🎨", answer: "🔴", options: ["🔴", "🔵", "🟢", "🟡"] },
  { prompt: "⭐⭐🌙⭐⭐ ?", emoji: "🎨", answer: "🌙", options: ["⭐", "🌙", "☀️", "🌈"] },
  { prompt: "1, 2, 3, ?", emoji: "🎨", answer: "4", options: ["4", "5", "2", "1"] },
];

export const sekilSay: QuizQuestion[] = [
  { prompt: "🔺🔺🔺 kaç üçgen?", emoji: "🔺", answer: "3", options: ["3", "2", "4", "1"] },
  { prompt: "⬜⬜ kaç kare?", emoji: "⬜", answer: "2", options: ["2", "3", "1", "4"] },
];

export const havaDurumu: QuizQuestion[] = [
  { prompt: "☀️ Güneşli günde ne giyilir?", emoji: "☀️", answer: "İnce kıyafet", options: ["İnce kıyafet", "Kalın mont", "Yağmurluk", "Kayak tulumu"] },
  { prompt: "🌧️ Yağmurda ne lazım?", emoji: "🌧️", answer: "Şemsiye", options: ["Şemsiye", "Güneş gözlüğü", "Şort", "Bere"] },
  { prompt: "❄️ Kar yağınca hava?", emoji: "❄️", answer: "Soğuk", options: ["Soğuk", "Sıcak", "Ilık", "Rüzgarlı deniz"] },
];

export const gezegenler: QuizQuestion[] = [
  { prompt: "Güneş sisteminde en büyük gezegen?", emoji: "🪐", answer: "Jüpiter", options: ["Jüpiter", "Mars", "Ay", "Plüton"] },
  { prompt: "Mavi gezegen hangisi?", emoji: "🌍", answer: "Dünya", options: ["Dünya", "Venüs", "Merkür", "Güneş"] },
  { prompt: "Ay nerede döner?", emoji: "🌙", answer: "Dünya", options: ["Dünya", "Güneş", "Mars", "Jüpiter"] },
];

export const vucudumuz: QuizQuestion[] = [
  { prompt: "Kan pompalayan organ?", emoji: "🫀", answer: "Kalp", options: ["Kalp", "Mide", "Beyin", "Ayak"] },
  { prompt: "Nefes almak için?", emoji: "🫁", answer: "Akciğer", options: ["Akciğer", "Kulak", "Saç", "Tırnak"] },
  { prompt: "Düşünmemizi sağlayan?", emoji: "🧠", answer: "Beyin", options: ["Beyin", "Diş", "Kol", "Diz"] },
];

export const besinGruplari: QuizQuestion[] = [
  { prompt: "🥛 Hangi grupta?", emoji: "🥗", answer: "Süt ürünleri", options: ["Süt ürünleri", "Şeker", "Sebze", "Et"] },
  { prompt: "🥕 Hangi grupta?", emoji: "🥗", answer: "Sebze", options: ["Sebze", "Şekerleme", "İçecek", "Yağ"] },
  { prompt: "🍞 Ekmek hangi grupta?", emoji: "🥗", answer: "Tahıl", options: ["Tahıl", "Meyve", "Balık", "Çikolata"] },
];

export const bitkiBuyume: QuizQuestion[] = [
  { prompt: "Tohum önce ne yapar?", emoji: "🌱", answer: "Filizlenir", options: ["Filizlenir", "Uçar", "Büyür", "Konuşur"] },
  { prompt: "Bitki neyle beslenir?", emoji: "🌱", answer: "Su ve güneş", options: ["Su ve güneş", "Sadece rüzgar", "Taş", "Plastik"] },
];

export const hayvanlar: QuizQuestion[] = [
  { prompt: "🦁 Aslan nerede yaşar?", emoji: "🦁", answer: "Kara", options: ["Kara", "Deniz", "Uzay", "Buzul"] },
  { prompt: "🐟 Balık nerede yaşar?", emoji: "🐟", answer: "Su", options: ["Su", "Çöl", "Dağ", "Bulut"] },
  { prompt: "🐦 Kuş nasıl hareket eder?", emoji: "🐦", answer: "Uçar", options: ["Uçar", "Yüzer", "Kazar", "Patlar"] },
];

export const mevsimler: QuizQuestion[] = [
  { prompt: "Yapraklar dökülür hangi mevsim?", emoji: "🍂", answer: "Sonbahar", options: ["Sonbahar", "Yaz", "İlkbahar", "Kış"] },
  { prompt: "Kar yağar genelde?", emoji: "❄️", answer: "Kış", options: ["Kış", "Yaz", "İlkbahar", "Sonbahar"] },
];

export const suDongu: QuizQuestion[] = [
  { prompt: "Su güneşle buharlaşınca?", emoji: "💧", answer: "Buluta çıkar", options: ["Buluta çıkar", "Kaybolur", "Taşa dönüşür", "Çikolata olur"] },
  { prompt: "Bulut şişince?", emoji: "💧", answer: "Yağmur yağar", options: ["Yağmur yağar", "Gökkuşağı yer", "Deniz kurur", "Rüzgar durur"] },
];

export const siraBul: QuizQuestion[] = [
  { prompt: "2, 4, 6, ?", emoji: "🔁", answer: "8", options: ["8", "7", "5", "10"] },
  { prompt: "🔴🔵🔴🔵 ?", emoji: "🔁", answer: "🔴", options: ["🔴", "🔵", "🟢", "⬛"] },
  { prompt: "A, B, C, ?", emoji: "🔁", answer: "D", options: ["D", "F", "Z", "A"] },
];

export const boyutSirala: QuizQuestion[] = [
  { prompt: "En küçük hangisi?", emoji: "📏", answer: "Karınca", options: ["Karınca", "Kedi", "Fil", "At"] },
  { prompt: "En büyük hangisi?", emoji: "📏", answer: "Fil", options: ["Karınca", "Kedi", "Fil", "Fare"] },
];

export const mantikEslestir: QuizQuestion[] = [
  { prompt: "Elma — Meyve, Köpek — ?", emoji: "🔗", answer: "Hayvan", options: ["Hayvan", "Renk", "Sayı", "Taş"] },
  { prompt: "Kırmızı — Renk, Daire — ?", emoji: "🔗", answer: "Şekil", options: ["Şekil", "Meyve", "Ses", "Koku"] },
];

export const farkBul: QuizQuestion[] = [
  { prompt: "Hangisi farklı?", emoji: "👀", answer: "🐶", options: ["🐱", "🐱", "🐶", "🐱"] },
  { prompt: "Hangisi farklı?", emoji: "👀", answer: "🔵", options: ["🔴", "🔴", "🔴", "🔵"] },
];

export const grupla: QuizQuestion[] = [
  { prompt: "Hangisi meyve değil?", emoji: "📦", answer: "Ekmek", options: ["Elma", "Muz", "Ekmek", "Portakal"] },
  { prompt: "Hangisi ulaşım değil?", emoji: "📦", answer: "Masa", options: ["Araba", "Uçak", "Masa", "Bisiklet"] },
];

export const hizliMatematik: QuizQuestion[] = [...toplama, ...cikarma].slice(0, 10);

export const kelimeAvcisi: QuizQuestion[] = kelimeOkuma;

export const hedefVur: QuizQuestion[] = toplama.slice(0, 6);
