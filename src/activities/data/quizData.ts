import type { QuizQuestion } from "../shared/QuizGame";

const LETTERS = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");
const VOWELS = ["A", "E", "I", "İ", "O", "Ö", "U", "Ü"];
const VOWEL_TEST_LETTERS = ["A", "B", "E", "K", "I", "M", "Ö", "S", "Ü", "Y"];

const LETTER_CLUES = [
  ["A", "Arı"], ["B", "Balık"], ["C", "Ceviz"], ["Ç", "Çilek"],
  ["D", "Deniz"], ["E", "Elma"], ["F", "Fil"], ["G", "Güneş"],
  ["Ğ", "Dağ kelimesinin sonu"], ["H", "Havuç"], ["I", "Işık"], ["İ", "İnek"],
  ["J", "Jilet"], ["K", "Kedi"], ["L", "Limon"], ["M", "Masa"],
  ["N", "Nar"], ["O", "Okul"], ["Ö", "Ördek"], ["P", "Papatya"],
  ["R", "Rüzgâr"], ["S", "Saat"], ["Ş", "Şemsiye"], ["T", "Top"],
  ["U", "Uçak"], ["Ü", "Üzüm"], ["V", "Vapur"], ["Y", "Yıldız"],
  ["Z", "Zeytin"],
] as const;

export const harfTania: QuizQuestion[] = LETTER_CLUES.map(([letter, clue]) => ({
  prompt: letter === "Ğ"
    ? `“${clue}” ipucunda hangi harf anlatılıyor?`
    : `“${clue}” kelimesi hangi harfle başlar?`,
  emoji: "🔤",
  answer: letter,
  options: LETTERS,
  hint: letter === "Ğ"
    ? "Ğ, Türkçede sözcük başında bulunmaz; ünlüler arasında veya sözcük sonunda görülür."
    : `${clue} kelimesini yavaşça söyle ve ilk sesi dinle.`,
  explanation: letter === "Ğ"
    ? "Dağ sözcüğü Ğ ile biter. Ğ, kendinden önceki ünlünün söylenişini etkileyen Türkçe bir harftir."
    : `${clue}, ${letter} harfiyle başlar.`,
}));

export const sesliHarf: QuizQuestion[] = VOWEL_TEST_LETTERS.map((L) => ({
  prompt: `"${L}" sesli harf mi?`,
  emoji: "🎵",
  answer: VOWELS.includes(L) ? "Evet" : "Hayır",
  options: ["Evet", "Hayır"],
  hint: "Sesli harfler: A, E, I, İ, O, Ö, U, Ü",
}));

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
  { prompt: "el + ma = ?", emoji: "🧱", answer: "elma", options: ["elma", "alem", "mela", "lame"], hint: "Meyve" },
  { prompt: "ka + lem = ?", emoji: "🧱", answer: "kalem", options: ["kalem", "kelam", "lemka", "mekal"], hint: "Yazı yazarken kullanırız" },
  { prompt: "ba + lık = ?", emoji: "🧱", answer: "balık", options: ["balık", "kalıb", "lıkba", "bılık"], hint: "Suda yaşayan hayvan" },
  { prompt: "a + ta = ?", emoji: "🧱", answer: "ata", options: ["ata", "taa", "aat", "tat"], hint: "Geçmişte yaşamış büyüklerimizden biri" },
];

export const cumleKur: QuizQuestion[] = [
  { prompt: "“Kim? → Nereye? → Ne yapıyor?” sırasını seç.", emoji: "✏️", answer: "Ben okula giderim", options: ["Ben okula giderim", "Ben giderim okula", "Giderim okula ben", "Okula giderim ben"], hint: "Kurallı cümlede yüklem genellikle sondadır." },
  { prompt: "“Kim? → Ne? → Ne yapıyor?” sırasını seç.", emoji: "✏️", answer: "Annem yemek yapar", options: ["Annem yemek yapar", "Annem yapar yemek", "Yapar yemek annem", "Yemek yapar annem"], hint: "Kurallı cümlede yüklem genellikle sondadır." },
  { prompt: "“Kim? → Nerede? → Ne yapıyor?” sırasını seç.", emoji: "✏️", answer: "Kedi bahçede uyuyor", options: ["Kedi bahçede uyuyor", "Bahçede uyuyor kedi", "Uyuyor kedi bahçede", "Kedi uyuyor bahçede"], hint: "Önce işi yapanı, sonra yeri, en son eylemi söyle." },
  { prompt: "“Kim? → Ne zaman? → Ne yapacak?” sırasını seç.", emoji: "✏️", answer: "Ece yarın yüzecek", options: ["Ece yarın yüzecek", "Yarın yüzecek Ece", "Yüzecek Ece yarın", "Ece yüzecek yarın"], hint: "Yüklem genellikle cümlenin sonundadır." },
  { prompt: "Hangi seçenek tamamlanmış ve kurallı bir cümledir?", emoji: "✏️", answer: "Çocuklar parkta oynadı", options: ["Çocuklar parkta oynadı", "Parkta çocuklar", "Oynadı parkta", "Çocuklar ve parkta"], explanation: "Tamamlanmış cümle bir yargı bildirir; burada 'oynadı' yüklemdir." },
  { prompt: "Hangi cümlenin sonunda soru işareti kullanılmalıdır?", emoji: "❓", answer: "Bugün bize gelir misin", options: ["Bugün bize gelir misin", "Bugün bize geldin", "Yarın okul açılıyor", "Kitabımı masaya koydum"], explanation: "'Gelir misin' yanıt bekleyen bir soru bildirir." },
];

export const alfabeSirasi: QuizQuestion[] = [
  { prompt: "C'den sonra hangi harf gelir?", emoji: "🔠", answer: "Ç", options: LETTERS, hint: "Türk alfabesi sırası" },
  { prompt: "F'den sonra?", emoji: "🔠", answer: "G", options: LETTERS },
  { prompt: "K'den sonra?", emoji: "🔠", answer: "L", options: LETTERS },
];

export const benzerKelime: QuizQuestion[] = [
  { prompt: "Hangisi 'anne' ile aynı gruptadır?", emoji: "👯", answer: "baba", options: ["baba", "masa", "kalem", "top"], hint: "Aile üyeleri" },
  { prompt: "Hangisi 'kedi' ile aynı gruptadır?", emoji: "👯", answer: "köpek", options: ["köpek", "araba", "ev", "kitap"], hint: "Hayvanlar" },
  { prompt: "Hangisi 'elma' ile aynı gruptadır?", emoji: "👯", answer: "armut", options: ["armut", "bardak", "çorap", "otobüs"], hint: "Meyveleri düşün." },
  { prompt: "Hangisi 'mavi' ile aynı gruptadır?", emoji: "👯", answer: "yeşil", options: ["yeşil", "üçgen", "yavaş", "kalem"], hint: "Renk adlarını düşün." },
  { prompt: "Hangisi 'koşmak' ile aynı gruptadır?", emoji: "👯", answer: "yüzmek", options: ["yüzmek", "sandalye", "sarı", "elma"], explanation: "Koşmak ve yüzmek birer eylemdir." },
  { prompt: "Hangisi 'sevinçli' sözcüğüne anlamca en yakındır?", emoji: "👯", answer: "mutlu", options: ["mutlu", "öfkeli", "uykulu", "ıslak"], explanation: "Sevinçli ve mutlu yakın anlamlı sözcüklerdir." },
];

export const boslukDoldur: QuizQuestion[] = [
  { prompt: "Güneş gökyüzünde ___", emoji: "📝", answer: "parlar", options: ["parlar", "yüzer", "uçar", "koşar"], hint: "Işık verir" },
  { prompt: "Balıklar suda ___", emoji: "📝", answer: "yüzer", options: ["yüzer", "uçar", "yürür", "konuşur"] },
  { prompt: "Kuşlar yuvalarını dallara ___", emoji: "📝", answer: "kurabilir", options: ["kurabilir", "içebilir", "okuyabilir", "sayabilir"] },
  { prompt: "Yağmur yağınca toprak ___", emoji: "📝", answer: "ıslanır", options: ["ıslanır", "uçar", "yanar", "kaybolur"] },
  { prompt: "Kitabı dikkatle ___", emoji: "📝", answer: "okudum", options: ["okudum", "yüzdüm", "kokladım", "uçtum"], explanation: "Kitapla anlamlı bir eylem kuran sözcük 'okudum'dur." },
  { prompt: "Fidan büyüyünce bir ___ olabilir", emoji: "📝", answer: "ağaç", options: ["ağaç", "bulut", "bardak", "taş"], explanation: "Fidan, genç ağaçtır; uygun koşullarda gelişerek büyür." },
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
  { prompt: "23 sayısının onluk basamağındaki rakam nedir?", emoji: "🧮", answer: "2", options: ["2", "3", "23", "5"], explanation: "23, 2 onluk ve 3 birlikten oluşur." },
  { prompt: "45 sayısının birlik basamağındaki rakam nedir?", emoji: "🧮", answer: "5", options: ["4", "5", "45", "9"], explanation: "45, 4 onluk ve 5 birlikten oluşur." },
  { prompt: "30 sayısında kaç onluk vardır?", emoji: "🧮", answer: "3", options: ["0", "3", "30", "10"], explanation: "30, 3 onluk ve 0 birliktir." },
];

export const saatOgren: QuizQuestion[] = [
  { prompt: "Saat 3:00 — akrep nerede?", emoji: "🕐", answer: "3", options: ["3", "12", "6", "9"], hint: "Tam saat" },
  { prompt: "Saat 6:00 — akrep?", emoji: "🕕", answer: "6", options: ["3", "6", "12", "9"] },
  { prompt: "Saat 12:00 — akrep?", emoji: "🕛", answer: "12", options: ["12", "6", "3", "1"] },
];

export const paraSay: QuizQuestion[] = [
  { prompt: "1 TL + 1 TL toplam kaç TL eder?", emoji: "💰", answer: "2 TL", options: ["2 TL", "1 TL", "3 TL", "11 TL"] },
  { prompt: "5 TL + 2 TL toplam kaç TL eder?", emoji: "💰", answer: "7 TL", options: ["7 TL", "52 TL", "3 TL", "10 TL"] },
  { prompt: "10 TL ile 6 TL'lik bir ürün alırsan kaç TL para üstü alırsın?", emoji: "💰", answer: "4 TL", options: ["4 TL", "6 TL", "10 TL", "16 TL"], explanation: "Para üstü için ödenen tutardan fiyatı çıkarırız: 10 − 6 = 4." },
  { prompt: "2 TL + 2 TL + 1 TL toplam kaç TL eder?", emoji: "💰", answer: "5 TL", options: ["5 TL", "4 TL", "3 TL", "6 TL"] },
  { prompt: "8 TL'lik ürün için hangisi tam ödeme olur?", emoji: "💰", answer: "5 TL + 2 TL + 1 TL", options: ["5 TL + 2 TL + 1 TL", "5 TL + 1 TL", "2 TL + 2 TL", "10 TL + 1 TL"], explanation: "5 + 2 + 1 = 8 TL eder." },
  { prompt: "12 TL'nin 5 TL'sini harcarsan kaç TL kalır?", emoji: "💰", answer: "7 TL", options: ["7 TL", "5 TL", "12 TL", "17 TL"], explanation: "Kalan parayı bulmak için çıkarırız: 12 − 5 = 7." },
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
  { prompt: "⚫⚫⚫⚫ kaç daire?", emoji: "⚫", answer: "4", options: ["4", "3", "5", "2"] },
  { prompt: "🔺⬜🔺⚫🔺 dizisinde kaç üçgen var?", emoji: "🔺", answer: "3", options: ["3", "2", "4", "5"] },
  { prompt: "⬜⚫⬜⚫⬜⚫ dizisinde toplam kaç şekil var?", emoji: "🔷", answer: "6", options: ["6", "3", "4", "5"] },
  { prompt: "🔺🔺⬜⬜⬜ dizisinde kareler üçgenlerden kaç tane fazladır?", emoji: "🔷", answer: "1", options: ["1", "2", "3", "5"], explanation: "3 kare ve 2 üçgen vardır; 3 − 2 = 1." },
];

export const havaDurumu: QuizQuestion[] = [
  { prompt: "Hava sıcak ve güneşliyse hangi seçenek daha uygundur?", emoji: "☀️", answer: "İnce kıyafet ve güneşten korunma", options: ["İnce kıyafet ve güneşten korunma", "Kalın mont", "Yağmurluk", "Kayak tulumu"], explanation: "Kıyafet seçerken yalnız gökyüzüne değil sıcaklığa da bakarız; şapka ve gölge güneşten korunmaya yardım eder." },
  { prompt: "Yağmurlu havada hangisi ıslanmamaya yardım eder?", emoji: "🌧️", answer: "Şemsiye veya yağmurluk", options: ["Şemsiye veya yağmurluk", "Güneş gözlüğü", "Şort", "Yün atkı"] },
  { prompt: "❄️ Kar yağınca hava?", emoji: "❄️", answer: "Soğuk", options: ["Soğuk", "Sıcak", "Ilık", "Rüzgarlı deniz"] },
];

export const gezegenler: QuizQuestion[] = [
  { prompt: "Güneş sisteminde en büyük gezegen?", emoji: "🪐", answer: "Jüpiter", options: ["Jüpiter", "Mars", "Ay", "Plüton"] },
  { prompt: "Mavi gezegen hangisi?", emoji: "🌍", answer: "Dünya", options: ["Dünya", "Venüs", "Merkür", "Güneş"] },
  { prompt: "Ay hangi gök cisminin çevresinde dolanır?", emoji: "🌙", answer: "Dünya", options: ["Dünya", "Güneş", "Mars", "Jüpiter"] },
];

export const vucudumuz: QuizQuestion[] = [
  { prompt: "Kanı vücudumuza pompalayan organ hangisidir?", emoji: "🫀", answer: "Kalp", options: ["Kalp", "Mide", "Beyin", "Ayak"], explanation: "Kalp kasılarak kanı damarlar boyunca pompalar." },
  { prompt: "Havayla kan arasında oksijen ve karbondioksit alışverişi hangi organda gerçekleşir?", emoji: "🫁", answer: "Akciğer", options: ["Akciğer", "Kulak", "Saç", "Tırnak"], explanation: "Göğüs kafesi ve diyafram havanın hareketine yardım eder; gaz alışverişi akciğerlerde gerçekleşir." },
  { prompt: "Düşünme, öğrenme ve vücudun pek çok işini yönetmede hangi organ görevlidir?", emoji: "🧠", answer: "Beyin", options: ["Beyin", "Diş", "Kol", "Diz"] },
];

export const besinGruplari: QuizQuestion[] = [
  { prompt: "🥛 Hangi grupta?", emoji: "🥗", answer: "Süt ürünleri", options: ["Süt ürünleri", "Şeker", "Sebze", "Et"] },
  { prompt: "🥕 Hangi grupta?", emoji: "🥗", answer: "Sebze", options: ["Sebze", "Şekerleme", "İçecek", "Yağ"] },
  { prompt: "🍞 Ekmek hangi grupta?", emoji: "🥗", answer: "Tahıl", options: ["Tahıl", "Meyve", "Balık", "Çikolata"] },
];

export const bitkiBuyume: QuizQuestion[] = [
  { prompt: "Uygun su, sıcaklık ve hava koşullarında tohumdan ilk kök çıkmaya başladığında bu olaya ne denir?", emoji: "🌱", answer: "Çimlenme", options: ["Çimlenme", "Tozlaşma", "Buharlaşma", "Solunum"], explanation: "Çimlenme, embriyonun büyümeye başlayıp ilk kökün tohumdan çıkmasıyla başlayan süreçtir." },
  { prompt: "Bitki kendi besinini üretirken hangilerini kullanır?", emoji: "🌱", answer: "Işık, su ve karbondioksit", options: ["Işık, su ve karbondioksit", "Yalnız toprak", "Taş ve plastik", "Yalnız rüzgâr"], hint: "Bu olaya fotosentez denir." },
  { prompt: "Bitkinin topraktan su ve mineral almasına en çok hangi bölümü yardım eder?", emoji: "🌿", answer: "Kök", options: ["Kök", "Çiçek", "Meyve", "Tohum"], explanation: "Kökler bitkiyi toprağa bağlar; su ve çözünmüş minerallerin alınmasına yardım eder." },
  { prompt: "Yapraklardaki küçük açıklıklar hangi alışverişte görevlidir?", emoji: "🍃", answer: "Gaz alışverişi", options: ["Gaz alışverişi", "Taş üretimi", "Ses çıkarma", "Toprağı kazma"], explanation: "Stoma denen açıklıklar karbondioksit, oksijen ve su buharı alışverişine yardım eder." },
  { prompt: "Bir bitkinin büyümesini adil karşılaştırmak için hangisini yapmalısın?", emoji: "🧪", answer: "Tek bir koşulu değiştirip diğerlerini aynı tutmak", options: ["Tek bir koşulu değiştirip diğerlerini aynı tutmak", "Her saksıya farklı miktarda su, ışık ve toprak vermek", "Yalnız en uzun bitkiye bakmak", "Ölçüm yapmadan tahmin etmek"], explanation: "Kontrollü karşılaştırma, görülen farkın hangi koşuldan kaynaklandığını anlamayı kolaylaştırır." },
];

export const hayvanlar: QuizQuestion[] = [
  { prompt: "🦁 Aslanın doğal yaşam alanlarından biri hangisidir?", emoji: "🦁", answer: "Savan", options: ["Savan", "Açık okyanus", "Uzay", "Kutup denizi"], explanation: "Aslanlar çoğunlukla Afrika'daki savan ve açık orman habitatlarında yaşar." },
  { prompt: "🐟 Balıklar oksijeni çoğunlukla hangi ortamdan solungaçlarıyla alır?", emoji: "🐟", answer: "Sudan", options: ["Sudan", "Çöl kumundan", "Buluttan", "Uzaydan"] },
  { prompt: "🐦 Birçok kuş havada ilerlemek için hangi hareketi kullanır?", emoji: "🐦", answer: "Kanat çırpar veya süzülür", options: ["Kanat çırpar veya süzülür", "Yalnız yüzer", "Toprağın altında kazar", "Hiç hareket etmez"], explanation: "Birçok kuş kanat çırparak ya da hava akımlarında süzülerek uçar; penguen gibi uçamayan kuşlar da vardır." },
];

export const mevsimler: QuizQuestion[] = [
  { prompt: "Birçok yaprak döken ağacın yaprakları hangi mevsimde renk değiştirip dökülmeye başlar?", emoji: "🍂", answer: "Sonbahar", options: ["Sonbahar", "Yaz", "İlkbahar", "Kış"] },
  { prompt: "Türkiye'nin birçok bölgesinde kar yağışı en sık hangi mevsimde görülür?", emoji: "❄️", answer: "Kış", options: ["Kış", "Yaz", "İlkbahar", "Sonbahar"] },
  { prompt: "Kuzey Yarımküre'de gündüzler genellikle hangi mevsimde en uzundur?", emoji: "☀️", answer: "Yaz", options: ["Yaz", "Kış", "Sonbahar", "İlkbahar"], explanation: "Dünya'nın eksen eğikliği nedeniyle Kuzey Yarımküre yazın Güneş'e daha dönük kalır ve gündüzler uzar." },
  { prompt: "Mevsimlerin oluşmasının temel nedeni hangisidir?", emoji: "🌍", answer: "Dünya'nın eksen eğikliği ve Güneş çevresindeki dolanımı", options: ["Dünya'nın eksen eğikliği ve Güneş çevresindeki dolanımı", "Dünya'nın yazın Güneş'e çok yaklaşması", "Ay'ın her ay biçim değiştirmesi", "Bulutların yön değiştirmesi"], explanation: "Mevsimleri belirleyen ana etken Dünya'nın eksen eğikliğidir; Güneş'e uzaklık temel neden değildir." },
  { prompt: "Türkiye ilkbaharı yaşarken Güney Yarımküre'de hangi mevsim yaşanır?", emoji: "🌏", answer: "Sonbahar", options: ["Sonbahar", "İlkbahar", "Yaz", "Kış"], explanation: "İki yarımkürede mevsimler birbirine zıttır." },
  { prompt: "Hava durumu ile mevsim arasındaki fark hangisidir?", emoji: "🌦️", answer: "Hava durumu kısa sürelidir; mevsim yıl içindeki genel örüntüdür", options: ["Hava durumu kısa sürelidir; mevsim yıl içindeki genel örüntüdür", "İkisi tamamen aynı şeydir", "Mevsim yalnız bir gün sürer", "Hava durumu her yıl hiç değişmez"], explanation: "Tek bir yağmurlu gün mevsimi değiştirmez; hava durumu kısa süreli koşulları anlatır." },
];

export const suDongu: QuizQuestion[] = [
  { prompt: "Sıvı su ısı enerjisi alınca ne olabilir?", emoji: "💧", answer: "Su buharına dönüşebilir", options: ["Su buharına dönüşebilir", "Kaybolur", "Taşa dönüşür", "Çikolataya dönüşür"], hint: "Bu değişime buharlaşma denir." },
  { prompt: "Su buharı yükselip soğuyunca ne oluşabilir?", emoji: "☁️", answer: "Küçük su damlacıkları", options: ["Küçük su damlacıkları", "Kuru taşlar", "Güneş ışınları", "Toprak parçaları"], hint: "Bu değişime yoğunlaşma denir." },
  { prompt: "Buluttaki damlacıklar büyüyüp ağırlaşınca ne olabilir?", emoji: "🌧️", answer: "Yağışla yeryüzüne döner", options: ["Yağışla yeryüzüne döner", "Tamamen yok olur", "Ateşe dönüşür", "Uzayda kalır"], hint: "Yağmur, kar veya dolu birer yağış türüdür." },
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
