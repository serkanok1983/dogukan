export type Guide = {
  type: string;
  intro: string;
  controls: string[];
  learn: string;
};

export const GUIDES: Record<string, Guide> = {
  // ==================== 🎮 OYUNLAR ====================
  "hafiza-kartlari": {
    type: "Oyun",
    intro: "Kartları çevir ve aynı emojileri eşleştir. Az hamlede bitirmeye çalış!",
    controls: ["Karta dokun — çevir", "İki aynı kart eşleşince kalır"],
    learn: "Hafıza ve dikkat gelişir; gördüğün yerleri hatırlamak önemli.",
  },
  "yilan-oyunu": {
    type: "Oyun",
    intro: "Yılanı ok tuşları veya kaydırarak yönlendir. Elma ye, uzat. Kendine çarpma!",
    controls: ["Ok tuşları veya kaydırma", "Elma = +10 puan"],
    learn: "Planlama: bir sonraki hamleyi düşün.",
  },
  "dovus-arenasi": {
    type: "Dövüş Oyunu",
    intro:
      "Street Fighter tarzı 2D dövüş! Tek karakterle 3 arcade rauntunu kazan. Yumruk, tekme, blok ve ateş topu!",
    controls: [
      "Önce karakterini seç: Doğukan veya Serkan",
      "← → — yürü · ↑ — zıpla · geri yön — blok",
      "Z/X/C/V — yumruk ve tekme · B — yakalama (throw)",
      "↓ basılı + Z — ateş topu · Serkan güçlü, Doğukan hızlı",
    ],
    learn: "Mesafe, blok ve zamanlama — gerçek dövüş oyunlarının temeli.",
  },
  "flappy-bird": {
    type: "Arcade Oyunu",
    intro: "Klasik Flappy Bird! Küçük kuşu boruların arasından geçir. Her boru +1 puan. Çarpınca oyun biter.",
    controls: ["Ekrana dokun veya Space — zıpla", "Boruların ortasından geç"],
    learn: "Zamanlama ve sabır: çok hızlı veya yavaş zıplama boruya çarptırır.",
  },
  "super-ayi": {
    type: "Macera Oyunu",
    intro:
      "Cesur ayıyı kontrol et! 100 seviyelik kampanya: her bölüm biraz daha zorlar (daha geniş harita, daha çok düşman, daha hızlı hareket). Bal topla, düşmanlara yumruk at veya üstlerine zıpla; her seviyede bayrağa ulaşınca bir sonrakine geçersin. Son seviyeyi bitirince kutlama ekranı gelir.",
    controls: [
      "← → — koş",
      "↑ veya Space — zıpla (havada bir kez daha!)",
      "Shift — yumruk",
      "Düşmana üstten zıpla veya yumrukla vur",
    ],
    learn: "Keşif, zamanlama ve cesaret — Super Bear Adventure gibi macera!",
  },
  tetris: {
    type: "Oyun",
    intro: "Düşen blokları döndür ve satır doldur. Tam satır silinir; seviye arttıkça hız artar.",
    controls: ["← → — hareket", "↑ — döndür", "↓ — hızlı düşür", "Space — anında düşür"],
    learn: "Uzamsal örüntü ve planlama becerisi.",
  },
  pong: {
    type: "Oyun",
    intro: "Klasik Pong: Sol raketi sen kontrol edersin. Önce 20 sayıya ulaşan kazanır.",
    controls: ["↑ ↓ veya parmakla kaydır", "Space — topu hızlandır"],
    learn: "Açılı çarpışmada top yön değiştirir.",
  },
  asteroids: {
    type: "Oyun",
    intro: "Uzay gemini döndür, it ve kayaları lazerle parçala. Büyük kayalar küçüğe bölünür.",
    controls: ["← → — dönüş", "↑ — itiş", "Space — lazer"],
    learn: "Momentum korunur; sürtünme yoksa gemi kaymaya devam eder.",
  },
  "tugla-kir": {
    type: "Oyun",
    intro: "Breakout: hassas raket kontrolüyle topu sektir, tüm tuğlaları temizle.",
    controls: ["← → veya yatay sürükleme", "Top rakete hangi noktada vurursa açı ona göre değişir"],
    learn: "Çarpışma açısı topun yansıma yönünü belirler.",
  },
  "pinball-space-cadet": {
    type: "Arcade Oyun",
    intro: "Klasik Space Cadet tarzı pinball: bumpers, flipperlar ve launch lane ile yüksek skor kovala.",
    controls: ["← / → — sol ve sağ flipper", "Space — launch gücü doldur, bırakınca fırlat"],
    learn: "Refleks + açı kontrolü: doğru zamanda flipper basmak topu masada tutar.",
  },
  "tank-savasi": {
    type: "Tank Oyunu",
    intro: "Yeşil tankını hareket ettir, tuğlaları kır, kırmızı düşmanları vur! Patlamalar ve puan yağmuru.",
    controls: ["◀ ▶ tuşları veya alt pad", "🔥 veya ekrana dokun — ateş"],
    learn: "Strateji ve nişan alma; engelleri kalkan gibi kullan.",
  },
  "uzay-savunma": {
    type: "Uzay Oyunu",
    intro: "Roketini kaydır, meteorlara ateş et! Üç canın var.",
    controls: ["Parmakla kaydır — roket", "Dokun — lazer ateşi"],
    learn: "El-göz koordinasyonu ve refleks gelişir.",
  },
  "ziplama-adasi": {
    type: "Platform Oyunu",
    intro: "Yeşil adalara zıplayarak yüksel. Yıldızları topla, düşme!",
    controls: ["◀ ▶ veya ekranın sol/sağı — hareket", "Otomatik zıplama"],
    learn: "Zamanlama ve dikkat: doğru platforma iniş önemli.",
  },
  "serit-yarisi": {
    type: "Yarış Oyunu",
    intro: "75 saniye boyunca sür! Yıldız, nitro ve kalkan topla.",
    controls: ["Sol / Sağ veya kaydır", "🛡️ bir çarpışmayı engeller"],
    learn: "Hızlı karar verme ve odaklanma.",
  },
  "baloncuk-patlat": {
    type: "Baloncuk Oyunu",
    intro: "Renkli baloncuklara dokun, patlat! Seri yapınca bonus puan.",
    controls: ["Baloncuğa dokun — patlat", "45 saniye süren var"],
    learn: "El-göz koordinasyonu ve hız.",
  },
  "kosu-macera": {
    type: "Koşu Oyunu",
    intro: "Karakter otomatik koşar. Zıpla, kaktüs ve kuşlardan kaç, altınları topla!",
    controls: ["Ekrana dokun — zıpla", "60 saniye dayan"],
    learn: "Zamanlama ve refleks.",
  },
  "kaydir-puzzle": {
    type: "Puzzle",
    intro:
      "9 karelik bir yapboz! Emojileri üstteki hedef sıraya getir. Boş kare sağ altta olmalı.",
    controls: [
      "Boş kareye yan yana bir emojiye dokun — o kare kayar",
      "Sadece yanındaki kareler hareket eder (parlayanlar)",
      "Hepsi doğru sırada olunca kazanırsın",
    ],
    learn: "Plan yap: hangi emojiyi önce kaydırmalısın? Az hamlede bitirmeye çalış.",
  },
  "kostebek-vur": {
    type: "Refleks Oyunu",
    intro:
      "Köstebekler deliklerden çıkıyor! Hepsine vur ve puan topla. Ama dikkat — 💀 işaretli yeşil kafalı olanlar zehirli, onlara vurma!",
    controls: [
      "Köstebeğe dokun — vur (+10 puan, bonuslu)",
      "💀 yeşil olana dokunma (-20 puan)",
      "30 saniye süren var, puan arttıkça köstebekler hızlanır",
    ],
    learn: "El-göz koordinasyonu ve hızlı refleks gelişir.",
  },
  "balon-patlat": {
    type: "Matematik Oyunu",
    intro: "Toplama işleminin cevabını balonlarda bul ve doğru balonu patlat! 6 tur boyunca puan topla.",
    controls: ["İşleme bak", "Doğru cevaplı balona dokun"],
    learn: "Zihinden toplama: sayıları kafanda birleştirmeyi öğrenirsin.",
  },
  "renk-yaris": {
    type: "Renk Oyunu",
    intro: "Söylenen rengi bul ve dokun! Seri doğru cevaplarla kombo puan kazan. 40 saniye süren var.",
    controls: ["Renk adını oku veya dinle", "Doğru renge hızlıca dokun"],
    learn: "Renkleri tanıma, hızlı düşünme ve el-göz koordinasyonu gelişir.",
  },
  "top-yakala": {
    type: "Yakalama Oyunu",
    intro: "Sepeti kaydır, gökten düşen yıldız ve meyveleri yakala! 💣 bombalardan kaçın. 60 saniye.",
    controls: ["Parmağını kaydır — sepeti hareket ettir", "⭐🌟✨ yakala · 💣🌧️ kaçın"],
    learn: "Hızlı karar verme: iyi ve kötü nesneleri ayırt etmeyi öğrenirsin.",
  },
  labirent: {
    type: "Labirent Oyunu",
    intro: "Ok tuşları veya kaydırarak karakteri labirentten çıkar. Duvarlara çarpma!",
    controls: ["← → ↑ ↓ veya kaydırma", " Hedefe ulaşınca yeni tur"],
    learn: "Yön bulma ve mekansal düşünme: bir yol planla ve takip et.",
  },
  "hizli-matematik": {
    type: "Matematik Oyunu",
    intro: "Toplama ve çıkarma sorularını hızlıca çöz! Ne kadar hızlı o kadar çok puan.",
    controls: ["Soruyu oku", "Doğru cevaba dokun"],
    learn: "Hızlı zihinden işlem: matematik reflekslerini geliştirir.",
  },
  "kelime-avcisi": {
    type: "Okuma Oyunu",
    intro: "Emojilere bak, doğru kelimeyi seç! Kedi, güneş, kitap gibi günlük kelimeler.",
    controls: ["Emojiyi gör", "Doğru kelimeye dokun"],
    learn: "Kelime tanıma ve okuma: emoji ile kelime eşleştirme becerisi.",
  },
  "hedef-vur": {
    type: "Matematik Oyunu",
    intro: "Toplama işlemlerini çözerek hedefi vur! Ne kadar doğru o kadar çok puan.",
    controls: ["İşleme bak", "Doğru cevaba dokun"],
    learn: "Toplama pratiği: eğlenerek matematik.",
  },

  // ==================== 📖 OKUMA & YAZMA ====================
  "harf-tanima": {
    type: "Okuma",
    intro: "Söylenen harfi bul ve üzerine dokun.",
    controls: ["Sesi dinle", "Doğru harfe dokun"],
    learn: "Türk alfabesinde 29 harf vardır. Her harfin bir sesi vardır.",
  },
  "hece-birlestir": {
    type: "Okuma",
    intro: "Verilen heceleri birleştir ve ortaya çıkan kelimeyi bul!",
    controls: ["Hece parçalarını oku", "Birleşince oluşan kelimeye dokun"],
    learn: "Hece birleştirme okumanın temelidir: el+ma = elma gibi.",
  },
  "kelime-okuma": {
    type: "Okuma",
    intro: "Emojinin ne olduğunu bul ve doğru kelimeyi seç!",
    controls: ["Emojiyi gör", "Doğru kelimeye dokun"],
    learn: "Görsel ipuçlarıyla kelime dağarcığın gelişir.",
  },
  "sesli-harf": {
    type: "Okuma",
    intro: "Harfin sesli harf olup olmadığını bul! Sesli harfler: A, E, I, İ, O, Ö, U, Ü.",
    controls: ["Harfe bak", "Evet (sesli) veya Hayır (sessiz)"],
    learn: "Sesli harfler ağzımızdan rahat çıkar, tek başına okunabilir.",
  },
  "cumle-kur": {
    type: "Okuma",
    intro: "Kelimeleri doğru sıraya koyarak anlamlı bir cümle oluştur.",
    controls: ["Kelimelere bak", "Doğru sıralanmış cümleyi seç"],
    learn: "Cümle yapısı: özne + yüklem + nesne sırasını öğrenirsin.",
  },
  "alfabe-sirasi": {
    type: "Okuma",
    intro: "Alfabede harflerin sırasını bul. Bir harften sonra hangisi gelir?",
    controls: ["Harfi gör", "Sıradaki harfi seç"],
    learn: "Türk alfabesi sırası: ezberlemeden mantığını kavra.",
  },
  "benzer-kelime": {
    type: "Okuma",
    intro: "Verilen kelimeyle aynı aileden olan kelimeyi bul.",
    controls: ["Kelimeleri oku", "Aynı gruptan olanı seç"],
    learn: "Kelimeler arası anlam ilişkisi: eş anlam ve kategori kavramı.",
  },
  "bosluk-doldur": {
    type: "Okuma",
    intro: "Cümledeki boşluğa en uygun kelimeyi seç.",
    controls: ["Cümleyi oku", "Boşluğa uyan kelimeye dokun"],
    learn: "Bağlamdan anlam çıkarma: cümlenin gelişinden doğru kelimeyi tahmin et.",
  },

  // ==================== 🔢 SAYILAR ====================
  "sayma-oyunu": {
    type: "Sayılar",
    intro: "Ekrandaki nesneleri say ve doğru sayıyı seç.",
    controls: ["Nesnelere bak", "Doğru sayıya dokun"],
    learn: "Sayma, matematiğin temelidir. Parmağınla sayabilirsin.",
  },
  "toplama-oyunu": {
    type: "Sayılar",
    intro: "İki grubu birleştir ve toplamı bul. Görseller sana yardım eder.",
    controls: ["Grupları say", "Doğru cevabı seç"],
    learn: "Toplama = bir araya getirmek. 3 + 2 = 5.",
  },
  "cikarma-oyunu": {
    type: "Sayılar",
    intro: "Bir gruptan diğerini çıkar ve sonucu bul!",
    controls: ["İşlemi gör", "Doğru cevabı seç"],
    learn: "Çıkarma = eksiltme. 8'den 3 çıkarsa 5 kalır.",
  },
  "sayi-sirasi": {
    type: "Sayılar",
    intro: "Sayıları küçükten büyüğe doğru sırala.",
    controls: ["En küçük sayıya dokun", "Sırayla hepsini seç"],
    learn: "Sayıları karşılaştırma ve sıralama becerisi.",
  },
  "cift-tek": {
    type: "Sayılar",
    intro: "Sayı çift mi tek mi bul! Çift sayılar 2'ye tam bölünür.",
    controls: ["Sayıyı gör", "Çift veya Tek seç"],
    learn: "Çift sayılar 2'şerli gruplanabilir; birler basamağı 0,2,4,6,8'dir.",
  },
  "onluk-birlik": {
    type: "Sayılar",
    intro: "İki basamaklı sayıların onluk ve birlik değerlerini bul.",
    controls: ["Sayıyı incele", "Onluk veya birlik sayısını seç"],
    learn: "23 = 2 onluk + 3 birlik. Basamak değeri kavramı.",
  },
  "saat-ogren": {
    type: "Sayılar",
    intro: "Saat üzerinde akrep ve yelkovanın konumunu öğren.",
    controls: ["Saat görseline bak", "Akrep hangi sayıda?"],
    learn: "Tam saatler: akrep sayıyı, yelkovan 12'yi gösterir.",
  },
  "para-say": {
    type: "Sayılar",
    intro: "Paraları topla ve toplam tutarı bul!",
    controls: ["Paraları gör", "Toplam tutarı seç"],
    learn: "TL hesabı: günlük hayatta para saymayı öğrenirsin.",
  },
  karsilastir: {
    type: "Sayılar",
    intro: "Sayıları karşılaştır: hangisi daha büyük, hangisi daha küçük?",
    controls: ["Sayıları gör", "Doğru karşılaştırmayı seç"],
    learn: "Büyüktür (>), küçüktür (<) işaretleri: timsah ağzı büyüğe açılır.",
  },

  // ==================== 🔷 ŞEKİLLER ====================
  "sekil-tani": {
    type: "Şekiller",
    intro: "Gösterilen şeklin adını bul! Üçgen, kare, daire ve daha fazlası.",
    controls: ["Şekli gör", "Doğru ismi seç"],
    learn: "Temel geometrik şekilleri isimleriyle eşleştirme.",
  },
  "sekil-ciz": {
    type: "Şekiller",
    intro: "Parmağınla ekrana çiz! Farklı renklerde daire, kare, üçgen ve yıldız çizmeyi dene.",
    controls: ["Parmağını sürükle — çiz", "🎨 Şekil seç — renk değişir"],
    learn: "İnce motor becerileri ve şekil tanıma gelişir.",
  },
  simetri: {
    type: "Şekiller",
    intro: "Ayna görüntüsü gibi iki tarafı aynı olan simetrik şekilleri bul!",
    controls: ["Şekillere bak", "Simetrik olanı seç"],
    learn: "Simetri: bir çizginin iki tarafının birbirinin aynası olmasıdır.",
  },
  "desen-tamamla": {
    type: "Şekiller",
    intro: "Devam eden desende sıradaki öğeyi bul! 🔴🔵🔴🔵 sonra ne gelir?",
    controls: ["Deseni incele", "Sıradaki öğeyi seç"],
    learn: "Örüntü tanıma: matematiksel düşünmenin temeli.",
  },
  "sekil-say": {
    type: "Şekiller",
    intro: "Ekranda kaç tane üçgen, kaç kare var say!",
    controls: ["Şekilleri say", "Doğru sayıyı seç"],
    learn: "Gruplandırma ve sayma: farklı şekilleri birbirinden ayır.",
  },
  tangram: {
    type: "Şekiller",
    intro: "Parçaları birleştirerek bir ev şekli oluştur!",
    controls: ["Parçaya dokun — yerleştir", "Tüm parçaları kullan"],
    learn: "Uzamsal düşünme: parçaları döndürüp birleştirerek bütün oluşturma.",
  },

  // ==================== 🔬 BİLİM & DOĞA ====================
  "hava-durumu": {
    type: "Bilim",
    intro: "Farklı hava koşullarında ne giymeli, ne yapmalı öğren!",
    controls: ["Soruyu oku", "Doğru cevabı seç"],
    learn: "Hava durumuna göre hazırlık: güneşli, yağmurlu veya karlı havada ne yapılır.",
  },
  gezegenler: {
    type: "Bilim",
    intro: "Güneş sistemindeki gezegenleri keşfet. Sırayla Güneş'e uzaklıkları artar.",
    controls: ["Gezegene dokun — bilgi", "Kaydır — tüm gezegenler"],
    learn: "Dünya, Güneş'in etrafında döner. Ay, Dünya'nın uydusudur.",
  },
  vucudumuz: {
    type: "Bilim",
    intro: "Vücudumuzdaki organları ve görevlerini öğren!",
    controls: ["Soruyu oku", "Doğru organı seç"],
    learn: "Kalp kan pompalar, akciğer nefes alır, beyin düşünür.",
  },
  "besin-gruplari": {
    type: "Bilim",
    intro: "Yiyecekleri doğru besin grubuna yerleştir! Süt, sebze, tahıl...",
    controls: ["Yiyeceği gör", "Grubunu seç"],
    learn: "Besin grupları: süt ürünleri, sebzeler, meyveler, tahıllar ve proteinler.",
  },
  "bitki-buyume": {
    type: "Bilim",
    intro: "Bir tohum nasıl bitki olur? Büyüme aşamalarını öğren!",
    controls: ["Soruyu oku", "Doğru aşamayı seç"],
    learn: "Bitkiler su, güneş ve toprakla büyür. Önce filizlenir, sonra yaprak açar.",
  },
  hayvanlar: {
    type: "Bilim",
    intro: "Hayvanlar aleminde geziye çık! Aslan, balık, kuş ve arıyı yakından tanı.",
    controls: ["Hayvana dokun — bilgi kartı açılır", "Kaydırarak diğerlerine geç"],
    learn: "Her hayvan farklı yaşar: karada, suda, havada. Beslenme ve hareketleri değişir.",
  },
  mevsimler: {
    type: "Bilim",
    intro: "Dört mevsimi ve özelliklerini öğren! İlkbahar, yaz, sonbahar, kış.",
    controls: ["Soruyu oku", "Doğru mevsimi seç"],
    learn: "Mevsimler Dünya'nın Güneş etrafında dönmesiyle oluşur. Her mevsim 3 ay sürer.",
  },
  "su-dongu": {
    type: "Bilim",
    intro: "Su gökyüzüne nasıl çıkar ve yağmur olarak geri döner? Su döngüsünü keşfet!",
    controls: ["Soruyu oku", "Doğru adımı seç"],
    learn: "Su buharlaşır → bulut olur → yağmur yağar → göllere döner. Bu döngü hiç bitmez!",
  },

  // ==================== 🧠 MANTIK ====================
  "sira-bul": {
    type: "Mantık",
    intro: "Sayı, renk veya harf dizilerindeki sırayı bul! Sıradaki öğeyi tahmin et.",
    controls: ["Diziyi incele", "Sıradakini seç"],
    learn: "Örüntü ve dizi mantığı: 2,4,6,? → 8. A,B,C,? → D.",
  },
  "boyut-sirala": {
    type: "Mantık",
    intro: "Nesneleri boyutlarına göre sırala: en küçük hangisi, en büyük hangisi?",
    controls: ["Nesnelere bak", "Doğru boyuttakini seç"],
    learn: "Karşılaştırma: karınca < kedi < fil. Göreceli büyüklük kavramı.",
  },
  "mantik-eslestir": {
    type: "Mantık",
    intro: "Aralarındaki ilişkiyi bul! Elma—Meyve ise Köpek—?",
    controls: ["İlişkiyi düşün", "Doğru eşleşeni seç"],
    learn: "Analojik düşünme: A ile B arasındaki ilişki, C ile D arasında da aynıdır.",
  },
  "fark-bul": {
    type: "Mantık",
    intro: "Dört seçenekten hangisi diğerlerinden farklı? Dikkatli bak!",
    controls: ["Seçenekleri incele", "Farklı olana dokun"],
    learn: "Dikkat ve ayırt etme becerisi: küçük farklılıkları fark etmek.",
  },
  grupla: {
    type: "Mantık",
    intro: "Hangisi gruba ait değil? Meyveler arasında ekmek, taşıtlar arasında masa...",
    controls: ["Grubu tanı", "Ait olmayanı seç"],
    learn: "Kategorileme: nesneleri ortak özelliklerine göre gruplandırma.",
  },
};

const DEFAULT_GUIDE: Guide = {
  type: "Keşif",
  intro: "Bu oyunda soruları cevapla, sürükle-bırak veya dokunarak keşfet. Yanlış cevapta tekrar dene!",
  controls: ["Dokun veya sürükle", "ℹ️ ile bu yardımı tekrar aç"],
  learn: "Oyun oynarken öğrenmek en eğlenceli yoldur!",
};

export function getGuide(slug: string): Guide {
  return GUIDES[slug] ?? DEFAULT_GUIDE;
}