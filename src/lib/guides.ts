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
    type: "Sanal Spor Karşılaşması",
    intro:
      "İki çizgi karakterin üç turluk sanal spor karşılaşmasında mesafeyi koru, doğru anda savunma ve hamle yap. Buradaki hareketler yalnızca oyun animasyonudur; gerçek hayatta kimseye uygulanmaz.",
    controls: [
      "Önce karakterini seç: Doğukan veya Serkan",
      "← → — yürü · ↑ — zıpla · geri yön — savun",
      "Z/X/C/V — farklı yakın hamleler · B — denge hamlesi",
      "↓ basılı + Z — ışık topu · Serkan dayanıklı, Doğukan hızlı",
    ],
    learn: "Mesafe, denge, savunma ve zamanlamanın bir hareketin sonucunu nasıl değiştirdiğini gözlemlersin.",
  },
  "flappy-bird": {
    type: "Klasik Beceri Oyunu",
    intro: "Klasik Flappy Bird! Küçük kuşu boruların arasından geçir. Her boru +1 puan. Çarpınca oyun biter.",
    controls: ["Ekrana dokun veya Boşluk tuşuna bas — zıpla", "Boruların ortasından geç"],
    learn: "Zamanlama ve sabır: çok hızlı veya yavaş zıplama boruya çarptırır.",
  },
  "super-ayi": {
    type: "Macera Oyunu",
    intro:
      "Cesur ayıyı kontrol et! 100 seviyelik kampanya: her bölüm biraz daha zorlar (daha geniş harita, daha çok düşman, daha hızlı hareket). Bal topla, düşmanlara yumruk at veya üstlerine zıpla; her seviyede bayrağa ulaşınca bir sonrakine geçersin. Son seviyeyi bitirince kutlama ekranı gelir.",
    controls: [
      "← → — koş",
      "↑ veya Boşluk — zıpla (havada bir kez daha!)",
      "Shift — engeli uzaklaştır",
      "Hareketli engellerin üstünden zıpla veya onları yolundan uzaklaştır",
    ],
    learn: "Keşif, zamanlama ve cesaret — Super Bear Adventure gibi macera!",
  },
  tetris: {
    type: "Oyun",
    intro: "Düşen blokları döndür ve satır doldur. Tam satır silinir; seviye arttıkça hız artar.",
    controls: ["← → — hareket", "↑ — döndür", "↓ — hızlı düşür", "Boşluk — anında düşür"],
    learn: "Uzamsal örüntü ve planlama becerisi.",
  },
  pong: {
    type: "Oyun",
    intro: "Klasik Pong: Sol raketi sen kontrol edersin. Önce 20 sayıya ulaşan kazanır.",
    controls: ["↑ ↓ veya parmakla kaydır", "Boşluk — topu hızlandır"],
    learn: "Açılı çarpışmada top yön değiştirir.",
  },
  asteroids: {
    type: "Oyun",
    intro: "Uzay gemini döndür, it ve kayaları lazerle parçala. Büyük kayalar küçüğe bölünür.",
    controls: ["← → — dönüş", "↑ — itiş", "Boşluk — ışın gönder"],
    learn: "Gemiye etki eden net kuvvet yoksa hareketini aynı hız ve yönde sürdürür; ters yöndeki itiş hareketi değiştirir.",
  },
  "tugla-kir": {
    type: "Oyun",
    intro: "Tuğla kırma oyununda raketi dikkatle yönet, topu sektir ve tüm tuğlaları temizle.",
    controls: ["← → veya yatay sürükleme", "Top rakete hangi noktada vurursa açı ona göre değişir"],
    learn: "Çarpışma açısı topun yansıma yönünü belirler.",
  },
  "pinball-space-cadet": {
    type: "Klasik Beceri Oyunu",
    intro: "Uzay temalı langırt masasında çarpma tamponlarını, kanatçıkları ve fırlatma yolunu kullanarak topu oyunda tut ve puan topla.",
    controls: ["← / → — sol ve sağ kanatçık", "Boşluk — fırlatma gücünü doldur; bırakınca topu gönder"],
    learn: "Tepki ve açı kontrolü: kanatçığa doğru anda basmak topun yönünü değiştirir.",
  },
  "tank-savasi": {
    type: "Oyuncak Araç Stratejisi",
    intro: "Yeşil oyuncak aracını hareket ettir, tuğla engeller arasından geç ve kırmızı hedef tabelalarını ışık toplarıyla işaretle.",
    controls: ["◀ ▶ tuşları veya alt yön alanı — hareket et", "Ekrana dokun — hedefe ışık topu gönder"],
    learn: "Yön, mesafe ve zamanlama: engelleri güvenli bir rota planlamak için kullanırsın.",
  },
  "uzay-savunma": {
    type: "Uzay Oyunu",
    intro: "Roketini kaydır, yaklaşan meteorları ışınla parçala ve üç hakkını dikkatli kullan.",
    controls: ["Parmakla kaydır — roketi taşı", "Dokun — ışın gönder"],
    learn: "Göz–el eşgüdümü ile hareketli nesnelerin yönünü ve yaklaşma hızını tahmin edersin.",
  },
  "ziplama-adasi": {
    type: "Zıplama Oyunu",
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
    type: "Kaydırmalı Yapboz",
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
    type: "Dikkat Oyunu",
    intro:
      "Köstebekler deliklerden kısa süreliğine görünüyor. Uygun hedeflere dokunup puan topla; yeşil uyarı işaretli olanları atla.",
    controls: [
      "Uygun köstebeğe dokun — +10 puan",
      "Yeşil uyarı işaretli olana dokunma — −20 puan",
      "30 saniye süren var, puan arttıkça köstebekler hızlanır",
    ],
    learn: "Seçici dikkat: hedefi görür, uygun olup olmadığına karar verir ve sonra dokunursun.",
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
    learn: "Yön bulma ve uzamsal düşünme: bir yol planlar ve adım adım izlersin.",
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
    intro: "Toplama işlemini çöz ve doğru sonucu taşıyan hedefi seç. Her doğru seçim puan kazandırır.",
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
    intro: "Kelimeleri verilen “kim, ne/nereye, ne yapıyor” sırasına koyarak kurallı bir cümle oluştur.",
    controls: ["Sorudaki sıra ipucunu oku", "Bu sıraya uyan cümleyi seç"],
    learn: "Türkçede kurallı cümlenin yüklemi sondadır; yaygın diziliş özne + tümleç/nesne + yüklemdir. Sözcük sırası vurguya göre değişebilir.",
  },
  "alfabe-sirasi": {
    type: "Okuma",
    intro: "Alfabede harflerin sırasını bul. Bir harften sonra hangisi gelir?",
    controls: ["Harfi gör", "Sıradaki harfi seç"],
    learn: "Türk alfabesi sırası: ezberlemeden mantığını kavra.",
  },
  "benzer-kelime": {
    type: "Okuma",
    intro: "Verilen kelimeyle aynı anlam grubunda olan kelimeyi bul.",
    controls: ["Kelimeleri oku", "Aynı gruptan olanı seç"],
    learn: "Aynı kategoriye giren kelimeleri bul: anne ve baba aile üyesidir; kedi ve köpek hayvandır.",
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
    intro: "Güneş sistemindeki sekiz gezegeni, Güneş'e yakınlık sırasıyla keşfet.",
    controls: ["Gezegene dokun — bilgi", "Kaydır — tüm gezegenler"],
    learn: "Gezegenler Güneş'in çevresinde dolanır. Güneş bir yıldızdır; Ay ise Dünya'nın doğal uydusudur.",
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
    learn: "Bitkiler fotosentez sırasında ışık enerjisi, su ve karbondioksit kullanarak şeker üretir. Topraktan su ve mineraller alırlar.",
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
    learn: "Mevsimler Dünya'nın eksen eğikliği ve Güneş çevresindeki dolanımı nedeniyle oluşur. Mevsim süreleri tam olarak eşit değildir.",
  },
  "su-dongu": {
    type: "Bilim",
    intro: "Su gökyüzüne nasıl çıkar ve yağmur olarak geri döner? Su döngüsünü keşfet!",
    controls: ["Soruyu oku", "Doğru adımı seç"],
    learn: "Su buharlaşabilir; yükselen buhar soğuyup yoğunlaşarak küçük damlacıklar oluşturabilir. Damlacıklar büyüyünce yağışla yeryüzüne döner.",
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
  "uzayli-istilasi": {
    type: "Uzay Takip Oyunu",
    intro: "Hareket eden çizgi uzaylıların yolunu izle, bir sonraki konumlarını tahmin et ve doğru anda ışık sinyali gönder.",
    controls: ["Sağa–sola hareket et", "Hedefin ilerleyeceği yere doğru ışık sinyali gönder"],
    learn: "Hız, yön ve zamanı birlikte düşünerek hareketli bir hedefin sonraki yerini tahmin edersin.",
  },
  "meyve-bicagi": {
    type: "Meyve Çizgisi Oyunu",
    intro: "Ekrandaki çizgi meyvelerin yolunu izle ve parmağınla üzerlerinden geçen bir hareket izi çiz. Bu yalnızca ekran oyunudur; gerçek kesici araçları çocuklar kullanmamalıdır.",
    controls: ["Meyvenin üstünde parmağını kaydır", "Uyarı işaretli nesnelerden uzak dur"],
    learn: "Göz–el eşgüdümü ve hareket yolu: çizginin yönünü hedefin geleceği yere göre ayarlarsın.",
  },
  "yagmur-damlasi": {
    type: "Su Döngüsü Oyunu",
    intro: "Buluttan düşen su damlalarını yakala ve kaç damlanın yeryüzüne ulaştığını gözle.",
    controls: ["Kabı sağa–sola taşı", "Damlaların düşme yolunu izle"],
    learn: "Yağış, suyun atmosferden yağmur, kar veya dolu olarak yeryüzüne dönmesidir.",
  },
  "royal-match": {
    type: "Örüntü Oyunu",
    intro: "Komşu taşların yerini değiştirerek aynı özellikteki taşlardan sıralar oluştur.",
    controls: ["Bir taşı komşusuna doğru kaydır", "Üç veya daha fazla aynı taşı yan yana getir"],
    learn: "Renk, biçim ve konuma göre örüntü arar; bir hamlenin sonraki düzeni nasıl değiştirdiğini planlarsın.",
  },
  "harf-yazma": {
    type: "Yazma Atölyesi",
    intro: "Harflerin başlangıç noktasını ve çizgi yönünü izleyerek parmağınla yazmayı dene.",
    controls: ["Harf ve renk seç", "Çizgiyi yavaşça takip et", "Gerekirse temizleyip yeniden dene"],
    learn: "Göz–el eşgüdümü, çizgi yönü ve ince motor kontrolü yazının temelini oluşturur.",
  },
  "renk-atolyesi": {
    type: "Renk Deneyi",
    intro: "Renkleri seç, karşılaştır ve karışımların nasıl yeni görünümler oluşturduğunu keşfet.",
    controls: ["Bir renk seç", "Karıştır veya hedef renkle eşleştir"],
    learn: "Bir cismin gördüğümüz rengi, gözümüze ulaşan ışıkla ilişkilidir.",
  },
  "dinozor-kazi": {
    type: "Fosil Keşfi",
    intro: "Katmanları dikkatle kaz, fosil parçalarını bul ve geçmiş canlı hakkında kanıt topla.",
    controls: ["Kazı alanına dokun", "Bulduğun parçaları bir araya getir"],
    learn: "Fosiller geçmiş canlıların kalıntı veya izleridir; bilim insanları bu kanıtlardan çıkarım yapar.",
  },
  "hazine-haritasi": {
    type: "Harita Oyunu",
    intro: "İşaretleri ve yönleri okuyarak başlangıçtan hazineye giden yolu planla.",
    controls: ["Haritadaki ipuçlarını incele", "Yönünü seç ve yolu adım adım izle"],
    learn: "Haritalar gerçek alanları küçültülmüş simge, yön ve göreli konumlarla gösteren modellerdir.",
  },
};

export function getGuide(slug: string): Guide {
  const guide = GUIDES[slug];
  if (!guide) throw new Error(`Etkinlik rehberi bulunamadı: ${slug}`);
  return guide;
}
