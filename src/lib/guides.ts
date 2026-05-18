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
