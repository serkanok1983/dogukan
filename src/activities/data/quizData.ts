import type { QuizQuestion } from "../shared/QuizGame";

const LETTERS = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");
const VOWELS = ["A", "E", "I", "İ", "O", "Ö", "U", "Ü"];
/** Harf her zaman bir resimli kelimeyle anılır: TTS'e tek ünsüz söyletilmez ("be" der). */
const VOWEL_TEST_WORDS: readonly { word: string; emoji: string }[] = [
  { word: "arı", emoji: "🐝" },
  { word: "balık", emoji: "🐟" },
  { word: "elma", emoji: "🍎" },
  { word: "kedi", emoji: "🐱" },
  { word: "ışık", emoji: "💡" },
  { word: "muz", emoji: "🍌" },
  { word: "ördek", emoji: "🦆" },
  { word: "su", emoji: "💧" },
  { word: "üzüm", emoji: "🍇" },
  { word: "yıldız", emoji: "⭐" },
];

const trUpper = (s: string) => s.replace(/i/g, "İ").replace(/ı/g, "I").toUpperCase();

export const sesliHarf: QuizQuestion[] = VOWEL_TEST_WORDS.map(({ word, emoji }) => {
  const L = trUpper(word.charAt(0));
  return {
    prompt: `${trUpper(word)}: "${L}" sesli harf mi?`,
    say: `${word}… ${word} kelimesinin ilk harfi sesli harf mi?`,
    emoji,
    answer: VOWELS.includes(L) ? "Evet" : "Hayır",
    options: ["Evet", "Hayır"],
    hint: "Sesli harfler: A, E, I, İ, O, Ö, U, Ü",
  };
});

export const kelimeOkuma: QuizQuestion[] = [
  { prompt: "Bu kelime ne?", emoji: "🐱", answer: "KEDİ", options: ["KEDİ", "KUŞ", "KAPI", "KALE"], hint: "Miyavlayan hayvan" },
  { prompt: "Bu kelime ne?", emoji: "☀️", answer: "GÜNEŞ", options: ["GÜNEŞ", "GÖL", "GEMİ", "GÜL"], hint: "Gündüz gökyüzünde parlar" },
  { prompt: "Bu kelime ne?", emoji: "🍎", answer: "ELMA", options: ["ELMA", "EKMEK", "EV", "DENİZ"], hint: "Kırmızı meyve" },
  { prompt: "Bu kelime ne?", emoji: "📚", answer: "KİTAP", options: ["KİTAP", "KALEM", "KUM", "KUZU"], hint: "Okumak için" },
  { prompt: "Bu kelime ne?", emoji: "🏠", answer: "EV", options: ["EV", "ARABA", "AĞAÇ", "SU"], hint: "İçinde yaşarız" },
  { prompt: "Bu kelime ne?", emoji: "🐕", answer: "KÖPEK", options: ["KÖPEK", "KEDİ", "KUŞ", "BALIK"], hint: "Hav hav der" },
  { prompt: "Bu kelime ne?", emoji: "🌳", answer: "AĞAÇ", options: ["AĞAÇ", "ÇİÇEK", "OT", "YAPRAK"], hint: "Parkta büyük bitki" },
  { prompt: "Bu kelime ne?", emoji: "🚌", answer: "OTOBÜS", options: ["OTOBÜS", "UÇAK", "GEMİ", "TREN"], hint: "Yolcu taşır" },
  { prompt: "Bu kelime ne?", emoji: "🎂", answer: "PASTA", options: ["PASTA", "EKMEK", "PEYNİR", "ÇORBA"], hint: "Doğum gününde" },
  { prompt: "Bu kelime ne?", emoji: "⚽", answer: "TOP", options: ["TOP", "RAKET", "KALEM", "SANDALYE"], hint: "Oyunlarda atılır" },
];

export const heceBirlestir: QuizQuestion[] = [
  { prompt: "el + ma = ?", say: "el… ma… Birleştir. Hangi kelime olur?", emoji: "🧱", answer: "elma", options: ["elma", "alem", "mela", "lame"], hint: "Meyve" },
  { prompt: "ka + lem = ?", say: "ka… lem… Birleştir. Hangi kelime olur?", emoji: "🧱", answer: "kalem", options: ["kalem", "kelam", "lemka", "mekal"], hint: "Yazı yazarken kullanırız" },
  { prompt: "ba + lık = ?", say: "ba… lık… Birleştir. Hangi kelime olur?", emoji: "🧱", answer: "balık", options: ["balık", "kalıb", "lıkba", "bılık"], hint: "Suda yaşayan hayvan" },
  { prompt: "a + rı = ?", say: "a… rı… Birleştir. Hangi kelime olur?", emoji: "🧱", answer: "arı", options: ["arı", "rıa", "ıra", "aır"], hint: "Bal yapan böcek" },
];

export const cumleKur: QuizQuestion[] = [
  { prompt: "“Kim? → Nereye? → Ne yapıyor?” sırasını seç.", emoji: "✏️", answer: "Ben okula giderim", options: ["Ben okula giderim", "Ben giderim okula", "Giderim okula ben", "Okula giderim ben"], hint: "Önce kim, en sonda ne yaptığı gelir." },
  { prompt: "“Kim? → Ne? → Ne yapıyor?” sırasını seç.", emoji: "✏️", answer: "Annem yemek yapar", options: ["Annem yemek yapar", "Annem yapar yemek", "Yapar yemek annem", "Yemek yapar annem"], hint: "Önce kim, en sonda ne yaptığı gelir." },
  { prompt: "“Kim? → Nerede? → Ne yapıyor?” sırasını seç.", emoji: "✏️", answer: "Kedi bahçede uyuyor", options: ["Kedi bahçede uyuyor", "Bahçede uyuyor kedi", "Uyuyor kedi bahçede", "Kedi uyuyor bahçede"], hint: "Önce işi yapanı, sonra yeri, en son eylemi söyle." },
  { prompt: "“Kim? → Ne zaman? → Ne yapacak?” sırasını seç.", emoji: "✏️", answer: "Ece yarın yüzecek", options: ["Ece yarın yüzecek", "Yarın yüzecek Ece", "Yüzecek Ece yarın", "Ece yüzecek yarın"], hint: "Ne yapacağı en sona gelir." },
  { prompt: "Hangisi tam bir cümle?", emoji: "✏️", answer: "Çocuklar parkta oynadı", options: ["Çocuklar parkta oynadı", "Parkta çocuklar", "Oynadı parkta", "Çocuklar ve parkta"], explanation: "Kim oynadı, nerede oynadı; hepsi belli." },
  { prompt: "Hangisi bir soru?", emoji: "❓", answer: "Bugün bize gelir misin", options: ["Bugün bize gelir misin", "Bugün bize geldin", "Yarın okul açılıyor", "Kitabımı masaya koydum"], explanation: "'Gelir misin' diye soruyoruz." },
];

export const alfabeSirasi: QuizQuestion[] = [
  { prompt: "C'den sonra hangi harf gelir?", emoji: "🔠", answer: "Ç", options: LETTERS, hint: "Türk alfabesi sırası" },
  { prompt: "F'den sonra?", emoji: "🔠", answer: "G", options: LETTERS },
  { prompt: "K'den sonra?", emoji: "🔠", answer: "L", options: LETTERS },
  { prompt: "A'dan sonra?", emoji: "🔠", answer: "B", options: LETTERS },
];

export const benzerKelime: QuizQuestion[] = [
  { prompt: "Hangisi 'anne' ile aynı gruptadır?", emoji: "👯", answer: "baba", options: ["baba", "masa", "kalem", "top"], hint: "Aile üyeleri" },
  { prompt: "Hangisi 'kedi' ile aynı gruptadır?", emoji: "👯", answer: "köpek", options: ["köpek", "araba", "ev", "kitap"], hint: "Hayvanlar" },
  { prompt: "Hangisi 'elma' ile aynı gruptadır?", emoji: "👯", answer: "armut", options: ["armut", "bardak", "çorap", "otobüs"], hint: "Meyveleri düşün." },
  { prompt: "Hangisi 'mavi' ile aynı gruptadır?", emoji: "👯", answer: "yeşil", options: ["yeşil", "üçgen", "yavaş", "kalem"], hint: "Renk adlarını düşün." },
  { prompt: "Hangisi 'koşmak' ile aynı gruptadır?", emoji: "👯", answer: "yüzmek", options: ["yüzmek", "sandalye", "sarı", "elma"], explanation: "Koşmak da yüzmek de yaptığımız işler." },
];

export const boslukDoldur: QuizQuestion[] = [
  { prompt: "Güneş gökyüzünde ___", say: "Güneş gökyüzünde… ne yapar?", emoji: "☀️", answer: "parlar", options: ["parlar", "yüzer", "uçar", "koşar"], hint: "Işık verir" },
  { prompt: "Balıklar suda ___", say: "Balıklar suda… ne yapar?", emoji: "🐟", answer: "yüzer", options: ["yüzer", "uçar", "yürür", "konuşur"] },
  { prompt: "Yağmur yağınca toprak ___", say: "Yağmur yağınca toprak… ne olur?", emoji: "🌧️", answer: "ıslanır", options: ["ıslanır", "uçar", "yanar", "kaybolur"] },
  { prompt: "Kitabı dikkatle ___", say: "Kitabı dikkatle… ne yaptım?", emoji: "📖", answer: "okudum", options: ["okudum", "yüzdüm", "kokladım", "uçtum"], explanation: "Kitap okunur." },
  { prompt: "Fidan büyüyünce bir ___ olabilir", say: "Fidan büyüyünce bir… ne olur?", emoji: "🌱", answer: "ağaç", options: ["ağaç", "bulut", "bardak", "taş"], explanation: "Fidan büyüyünce ağaç olur." },
];

export const toplama: QuizQuestion[] = Array.from({ length: 12 }, (_, i) => {
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

export const cikarma: QuizQuestion[] = Array.from({ length: 12 }, (_, i) => {
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
  { prompt: "1 onluk ve 3 birlik kaç eder?", emoji: "🧮", answer: "13", options: ["13", "31", "4", "3"], explanation: "10 ve 3, 13 eder." },
  { prompt: "1 onluk ve 5 birlik kaç eder?", emoji: "🧮", answer: "15", options: ["15", "51", "6", "10"], explanation: "10 ve 5, 15 eder." },
  { prompt: "10 ve 7 kaç eder?", emoji: "🧮", answer: "17", options: ["17", "71", "3", "8"], explanation: "10 ve 7, 17 eder." },
  { prompt: "20'de kaç onluk var?", emoji: "🧮", answer: "2", options: ["2", "20", "10", "0"], explanation: "10 ve 10, 20 eder." },
];

export const saatOgren: QuizQuestion[] = [
  { prompt: "Saat kaç? Kısa kola (akrebe) bak.", say: "Saat kaç? Kısa kola, akrebe bak.", emoji: "🕕", answer: "6", options: ["3", "6", "12", "9"] },
  { prompt: "Saat kaç? Kısa kola (akrebe) bak.", say: "Saat kaç? Kısa kola, akrebe bak.", emoji: "🕛", answer: "12", options: ["12", "6", "3", "1"] },
  { prompt: "Saat kaç? Kısa kola (akrebe) bak.", say: "Saat kaç? Kısa kola, akrebe bak.", emoji: "🕒", answer: "3", options: ["3", "12", "6", "9"] },
  { prompt: "Saat kaç? Kısa kola (akrebe) bak.", say: "Saat kaç? Kısa kola, akrebe bak.", emoji: "🕘", answer: "9", options: ["9", "3", "12", "6"] },
];

export const paraSay: QuizQuestion[] = [
  { prompt: "1 TL + 1 TL kaç TL eder?", emoji: "💰", answer: "2 TL", options: ["2 TL", "1 TL", "3 TL", "11 TL"] },
  { prompt: "1 TL + 1 TL + 1 TL kaç TL eder?", emoji: "💰", answer: "3 TL", options: ["3 TL", "2 TL", "4 TL", "1 TL"] },
  { prompt: "5 TL + 1 TL kaç TL eder?", emoji: "💰", answer: "6 TL", options: ["6 TL", "51 TL", "4 TL", "7 TL"] },
  { prompt: "5 TL + 5 TL kaç TL eder?", emoji: "💰", answer: "10 TL", options: ["10 TL", "55 TL", "5 TL", "9 TL"], explanation: "İki beş lira, on lira eder." },
  { prompt: "10 TL + 5 TL kaç TL eder?", emoji: "💰", answer: "15 TL", options: ["15 TL", "105 TL", "5 TL", "14 TL"] },
];

export const karsilastir: QuizQuestion[] = [
  { prompt: "Hangisi daha büyük?", emoji: "⚖️", answer: "9", options: ["9", "5", "3", "1"] },
  { prompt: "Hangisi daha küçük?", emoji: "⚖️", answer: "2", options: ["8", "7", "2", "6"] },
  { prompt: "En çok elma hangisinde?", emoji: "🍎", answer: "🍎🍎🍎🍎", options: ["🍎🍎🍎🍎", "🍎🍎", "🍎", "🍎🍎🍎"], optionSay: { "🍎🍎🍎🍎": "dört elma", "🍎🍎🍎": "üç elma", "🍎🍎": "iki elma", "🍎": "bir elma" } },
  { prompt: "En az balon hangisinde?", emoji: "🎈", answer: "🎈", options: ["🎈", "🎈🎈🎈", "🎈🎈", "🎈🎈🎈🎈"], optionSay: { "🎈": "bir balon", "🎈🎈": "iki balon", "🎈🎈🎈": "üç balon", "🎈🎈🎈🎈": "dört balon" } },
];

export const sekilTani: QuizQuestion[] = [
  { prompt: "Bu hangi şekil?", emoji: "🔺", answer: "Üçgen", options: ["Üçgen", "Kare", "Daire", "Dikdörtgen"] },
  { prompt: "Bu hangi şekil?", emoji: "🟦", answer: "Kare", options: ["Kare", "Üçgen", "Daire", "Yıldız"] },
  { prompt: "Bu hangi şekil?", emoji: "⚫", answer: "Daire", options: ["Daire", "Kare", "Üçgen", "Yıldız"] },
  { prompt: "Bu hangi şekil?", emoji: "⭐", answer: "Yıldız", options: ["Yıldız", "Kare", "Daire", "Üçgen"] },
];

export const sekilSay: QuizQuestion[] = [
  { prompt: "Kaç üçgen var?", emoji: "🔺🔺🔺", answer: "3", options: ["3", "2", "4", "1"] },
  { prompt: "Kaç kare var?", emoji: "🟦🟦", answer: "2", options: ["2", "3", "1", "4"] },
  { prompt: "Kaç daire var?", emoji: "⚫⚫⚫⚫", answer: "4", options: ["4", "3", "5", "2"] },
  { prompt: "Kaç üçgen var?", emoji: "🔺🟦🔺⚫🔺", answer: "3", options: ["3", "2", "4", "5"] },
  { prompt: "Toplam kaç şekil var?", emoji: "🟦⚫🟦⚫🟦⚫", answer: "6", options: ["6", "3", "4", "5"] },
];

export const havaDurumu: QuizQuestion[] = [
  { prompt: "Hava çok sıcak. Ne giyersin?", emoji: "☀️", answer: "Şort ve şapka", options: ["Şort ve şapka", "Kalın mont", "Kayak tulumu", "Yün atkı"], explanation: "Sıcakta ince giyinir, şapka takarız." },
  { prompt: "Yağmur yağıyor. Ne alırsın?", emoji: "🌧️", answer: "Şemsiye", options: ["Şemsiye", "Güneş gözlüğü", "Şort", "Terlik"] },
  { prompt: "Kar yağıyor. Hava nasıl?", emoji: "❄️", answer: "Soğuk", options: ["Soğuk", "Sıcak", "Ilık", "Bunaltıcı"] },
  { prompt: "Rüzgâr esiyor. Hangisi uçar?", emoji: "💨", answer: "Uçurtma", options: ["Uçurtma", "Taş", "Masa", "Ev"] },
];

export const vucudumuz: QuizQuestion[] = [
  { prompt: "Göğsümüzde güm güm atan hangisi?", emoji: "🫀", answer: "Kalp", options: ["Kalp", "Mide", "Beyin", "Ayak"], explanation: "Kalp kanı bütün vücuda yollar." },
  { prompt: "Nefes alınca hava nereye gider?", emoji: "🫁", answer: "Akciğer", options: ["Akciğer", "Kulak", "Saç", "Tırnak"], explanation: "Aldığımız nefes akciğerlere gider." },
  { prompt: "Düşünürken hangisini kullanırız?", emoji: "🧠", answer: "Beyin", options: ["Beyin", "Diş", "Kol", "Diz"] },
  { prompt: "Neyle görürüz?", emoji: "👀", answer: "Gözlerle", options: ["Gözlerle", "Dizlerle", "Saçlarla", "Ayaklarla"] },
  { prompt: "Neyle duyarız?", emoji: "👂", answer: "Kulaklarla", options: ["Kulaklarla", "Burunla", "Ellerle", "Dizlerle"] },
];

export const besinGruplari: QuizQuestion[] = [
  { prompt: "Süt hangi grupta?", emoji: "🥛", answer: "Süt ürünleri", options: ["Süt ürünleri", "Şeker", "Sebze", "Et"] },
  { prompt: "Havuç hangi grupta?", emoji: "🥕", answer: "Sebze", options: ["Sebze", "Şekerleme", "İçecek", "Yağ"] },
  { prompt: "Ekmek hangi grupta?", emoji: "🍞", answer: "Tahıl", options: ["Tahıl", "Meyve", "Balık", "Çikolata"] },
  { prompt: "Elma hangi grupta?", emoji: "🍎", answer: "Meyve", options: ["Meyve", "Et", "Süt ürünleri", "Tahıl"] },
  { prompt: "Yumurta hangi grupta?", emoji: "🥚", answer: "Et ve yumurta", options: ["Et ve yumurta", "Meyve", "Tahıl", "Sebze"] },
];

export const bitkiBuyume: QuizQuestion[] = [
  { prompt: "Bitki neyle başlar?", emoji: "🌰", answer: "Tohum", options: ["Tohum", "Çiçek", "Meyve", "Yaprak"], explanation: "Önce tohum, sonra filiz, sonra çiçek." },
  { prompt: "Tohumu ektik. Büyümesi için ne veririz?", emoji: "🌱", answer: "Su", options: ["Su", "Taş", "Şeker", "Plastik"] },
  { prompt: "Bitki suyu hangi parçasıyla içer?", emoji: "🌿", answer: "Kök", options: ["Kök", "Çiçek", "Meyve", "Tohum"], explanation: "Kökler topraktaki suyu alır." },
  { prompt: "Bitkiler büyümek için neye ihtiyaç duyar?", emoji: "☀️", answer: "Güneş ışığı", options: ["Güneş ışığı", "Karanlık dolap", "Buz", "Gürültü"] },
  { prompt: "Bitkinin yeşil, yassı parçası hangisi?", emoji: "🍃", answer: "Yaprak", options: ["Yaprak", "Kök", "Tohum", "Taş"] },
];

export const mevsimler: QuizQuestion[] = [
  { prompt: "Yapraklar sararıp dökülüyor. Hangi mevsim?", emoji: "🍂", answer: "Sonbahar", options: ["Sonbahar", "Yaz", "İlkbahar", "Kış"] },
  { prompt: "Kardan adam yapıyoruz. Hangi mevsim?", emoji: "⛄", answer: "Kış", options: ["Kış", "Yaz", "İlkbahar", "Sonbahar"] },
  { prompt: "Denize giriyoruz, hava çok sıcak. Hangi mevsim?", emoji: "🏖️", answer: "Yaz", options: ["Yaz", "Kış", "Sonbahar", "İlkbahar"] },
  { prompt: "Çiçekler açıyor. Hangi mevsim?", emoji: "🌸", answer: "İlkbahar", options: ["İlkbahar", "Kış", "Yaz", "Sonbahar"] },
  { prompt: "Kışın ne giyeriz?", emoji: "🧥", answer: "Mont", options: ["Mont", "Şort", "Mayo", "Terlik"] },
];

export const suDongu: QuizQuestion[] = [
  { prompt: "Güneş suyu ısıtınca su ne olur?", emoji: "☀️", answer: "Buhar olur", options: ["Buhar olur", "Taş olur", "Çikolata olur", "Kum olur"], hint: "Çaydanlıktan çıkan buhar gibi." },
  { prompt: "Bulutun içinde ne var?", emoji: "☁️", answer: "Minik su damlaları", options: ["Minik su damlaları", "Pamuk", "Taşlar", "Kum"], hint: "Soğuk camdaki buğu gibi." },
  { prompt: "Bulut ağırlaşınca ne olur?", emoji: "🌧️", answer: "Yağmur yağar", options: ["Yağmur yağar", "Güneş söner", "Ay doğar", "Rüzgâr durur"], hint: "Yağmur, kar ve dolu buluttan düşer." },
  { prompt: "Yağmur suyu sonra nereye gider?", emoji: "🏞️", answer: "Derelere ve denize", options: ["Derelere ve denize", "Uzaya", "Ateşe", "Buzdolabına"] },
];

export const boyutSirala: QuizQuestion[] = [
  { prompt: "En küçük hangisi?", emoji: "📏", answer: "Karınca", options: ["Karınca", "Kedi", "Fil", "At"] },
  { prompt: "En büyük hangisi?", emoji: "📏", answer: "Fil", options: ["Karınca", "Kedi", "Fil", "Fare"] },
  { prompt: "En uzun boylu hangisi?", emoji: "🦒", answer: "Zürafa", options: ["Zürafa", "Tavşan", "Kedi", "Fare"] },
  { prompt: "En hafif hangisi?", emoji: "🪶", answer: "Tüy", options: ["Tüy", "Taş", "Karpuz", "Masa"] },
];

export const mantikEslestir: QuizQuestion[] = [
  { prompt: "Elma — Meyve, Köpek — ?", say: "Elma bir meyve. Köpek ne?", emoji: "🔗", answer: "Hayvan", options: ["Hayvan", "Renk", "Sayı", "Taş"] },
  { prompt: "Kırmızı — Renk, Daire — ?", say: "Kırmızı bir renk. Daire ne?", emoji: "🔗", answer: "Şekil", options: ["Şekil", "Meyve", "Ses", "Koku"] },
  { prompt: "Kuş — Uçar, Balık — ?", say: "Kuş uçar. Balık ne yapar?", emoji: "🔗", answer: "Yüzer", options: ["Yüzer", "Uçar", "Havlar", "Koşar"] },
  { prompt: "Göz — Görmek, Kulak — ?", say: "Göz görmek için. Kulak ne için?", emoji: "🔗", answer: "Duymak", options: ["Duymak", "Koklamak", "Yürümek", "Yemek"] },
];

export const farkBul: QuizQuestion[] = [
  { prompt: "Hangisi farklı?", emoji: "👀", answer: "⚽", options: ["🐱", "🐶", "⚽", "🐰"], optionSay: { "🐱": "kedi", "🐶": "köpek", "⚽": "top", "🐰": "tavşan" } },
  { prompt: "Hangisi farklı?", emoji: "👀", answer: "🥦", options: ["🍎", "🍓", "🥦", "🍒"], optionSay: { "🍎": "elma", "🍓": "çilek", "🥦": "brokoli", "🍒": "kiraz" } },
  { prompt: "Hangisi farklı?", emoji: "👀", answer: "🚗", options: ["🍎", "🍌", "🚗", "🍇"], optionSay: { "🍎": "elma", "🍌": "muz", "🚗": "araba", "🍇": "üzüm" } },
  { prompt: "Hangisi farklı?", emoji: "👀", answer: "🍕", options: ["🌙", "🍕", "☀️", "⭐"], optionSay: { "🌙": "ay", "🍕": "pizza", "☀️": "güneş", "⭐": "yıldız" } },
];

export const grupla: QuizQuestion[] = [
  { prompt: "Hangisi meyve değil?", emoji: "📦", answer: "Ekmek", options: ["Elma", "Muz", "Ekmek", "Portakal"] },
  { prompt: "Hangisi ulaşım değil?", emoji: "📦", answer: "Masa", options: ["Araba", "Uçak", "Masa", "Bisiklet"] },
  { prompt: "Hangisi hayvan değil?", emoji: "📦", answer: "Top", options: ["Kedi", "Köpek", "Top", "Kuş"] },
  { prompt: "Hangisi giyilmez?", emoji: "📦", answer: "Elma", options: ["Çorap", "Şapka", "Elma", "Mont"] },
];

export const hizliMatematik: QuizQuestion[] = [...toplama, ...cikarma].slice(0, 10);

export const kelimeAvcisi: QuizQuestion[] = kelimeOkuma;

export const hedefVur: QuizQuestion[] = toplama.slice(0, 6);
