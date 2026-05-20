export type Guide = {
  type: string;
  intro: string;
  controls: string[];
  learn: string;
};

export const GUIDES: Record<string, Guide> = {
  "hafiza-kartlari": {
    type: "Oyun",
    intro: "Kartları çevir ve aynı harf veya sayıları eşleştir. Az hamlede bitirmeye çalış!",
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
    intro: "Topu raketle sektir, renkli tuğlaları kır. Top aşağı düşerse kaybedersin.",
    controls: ["← → veya yatay kaydırma"],
    learn: "Çarpışma açısı topun yansıma yönünü belirler.",
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
  "harf-tanima": {
    type: "Okuma",
    intro: "Söylenen harfi bul ve üzerine dokun.",
    controls: ["Sesi dinle", "Doğru harfe dokun"],
    learn: "Türk alfabesinde 29 harf vardır. Her harfin bir sesi vardır.",
  },
  "gezegenler": {
    type: "Bilim",
    intro: "Güneş sistemindeki gezegenleri keşfet. Sırayla Güneş'e uzaklıkları artar.",
    controls: ["Gezegene dokun — bilgi", "Kaydır — tüm gezegenler"],
    learn: "Dünya, Güneş'in etrafında döner. Ay, Dünya'nın uydusudur.",
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
