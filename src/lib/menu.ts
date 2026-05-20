export type MenuCategory = {
  id: string;
  icon: string;
  title: string;
  accent: string;
  items: { slug: string; label: string; emoji: string }[];
};

export const MENU: MenuCategory[] = [
  {
    id: "oyun",
    icon: "🎮",
    title: "Oyunlar",
    accent: "#ff6b9d",
    items: [
      { slug: "super-ayi", label: "Süper Ayı", emoji: "🐻" },
      { slug: "flappy-bird", label: "Flappy Bird", emoji: "🐤" },
      { slug: "dovus-arenasi", label: "Dövüş Arenası", emoji: "🥋" },
      { slug: "tetris", label: "Tetris", emoji: "🧱" },
      { slug: "pong", label: "Masa Tenisi", emoji: "🏓" },
      { slug: "asteroids", label: "Asteroids", emoji: "☄️" },
      { slug: "tugla-kir", label: "Tuğla Kırmaca", emoji: "🧱" },
      { slug: "pinball-space-cadet", label: "Pinball Space Cadet", emoji: "🛰️" },
      { slug: "tank-savasi", label: "Tank Savaşı", emoji: "💥" },
      { slug: "uzay-savunma", label: "Uzay Savunması", emoji: "🚀" },
      { slug: "ziplama-adasi", label: "Zıplama Adası", emoji: "🏝️" },
      { slug: "serit-yarisi", label: "Şerit Yarışı", emoji: "🏎️" },
      { slug: "baloncuk-patlat", label: "Baloncuk Patlat", emoji: "🫧" },
      { slug: "kosu-macera", label: "Koşu Macerası", emoji: "🏃" },
      { slug: "hafiza-kartlari", label: "Hafıza Kartları", emoji: "🃏" },
      { slug: "yilan-oyunu", label: "Sevimli Yılan", emoji: "🐍" },
      { slug: "top-yakala", label: "Yıldız Yakala", emoji: "⭐" },
      { slug: "labirent", label: "Labirent", emoji: "🧩" },
      { slug: "balon-patlat", label: "Balon Patlat", emoji: "🎈" },
      { slug: "renk-yaris", label: "Renk Yarışı", emoji: "🌈" },
      { slug: "kaydir-puzzle", label: "Kaydırmalı Puzzle", emoji: "🧩" },
      { slug: "hizli-matematik", label: "Hızlı Matematik", emoji: "⚡" },
      { slug: "kelime-avcisi", label: "Kelime Avcısı", emoji: "🔤" },
      { slug: "hedef-vur", label: "Doğru Hedef", emoji: "🎯" },
    ],
  },
  {
    id: "okuma",
    icon: "📖",
    title: "Okuma & Yazma",
    accent: "#4ecdc4",
    items: [
      { slug: "harf-tanima", label: "Harf Tanıma", emoji: "🔤" },
      { slug: "hece-birlestir", label: "Hece Birleştir", emoji: "🧱" },
      { slug: "kelime-okuma", label: "Kelime Okuma", emoji: "📚" },
      { slug: "sesli-harf", label: "Sesli Harfler", emoji: "🎵" },
      { slug: "cumle-kur", label: "Cümle Kur", emoji: "✏️" },
      { slug: "alfabe-sirasi", label: "Alfabe Sırası", emoji: "🔠" },
      { slug: "benzer-kelime", label: "Benzer Kelimeler", emoji: "👯" },
      { slug: "bosluk-doldur", label: "Boşluk Doldur", emoji: "📝" },
    ],
  },
  {
    id: "sayi",
    icon: "🔢",
    title: "Sayılar",
    accent: "#ffd93d",
    items: [
      { slug: "sayma-oyunu", label: "Sayma Oyunu", emoji: "🍎" },
      { slug: "toplama-oyunu", label: "Toplama", emoji: "➕" },
      { slug: "cikarma-oyunu", label: "Çıkarma", emoji: "➖" },
      { slug: "sayi-sirasi", label: "Sayı Sırası", emoji: "📊" },
      { slug: "cift-tek", label: "Çift & Tek", emoji: "2️⃣" },
      { slug: "onluk-birlik", label: "Onluk & Birlik", emoji: "🧮" },
      { slug: "saat-ogren", label: "Saat Öğren", emoji: "🕐" },
      { slug: "para-say", label: "Para Sayma", emoji: "💰" },
      { slug: "karsilastir", label: "Büyük Küçük", emoji: "⚖️" },
    ],
  },
  {
    id: "sekil",
    icon: "🔷",
    title: "Şekiller",
    accent: "#a78bfa",
    items: [
      { slug: "sekil-tani", label: "Şekil Tanı", emoji: "⬛" },
      { slug: "sekil-ciz", label: "Şekil Çiz", emoji: "✏️" },
      { slug: "simetri", label: "Simetri", emoji: "🪞" },
      { slug: "desen-tamamla", label: "Desen Tamamla", emoji: "🎨" },
      { slug: "sekil-say", label: "Şekil Say", emoji: "🔺" },
      { slug: "tangram", label: "Tangram", emoji: "📐" },
    ],
  },
  {
    id: "bilim",
    icon: "🔬",
    title: "Bilim & Doğa",
    accent: "#6bcb77",
    items: [
      { slug: "hava-durumu", label: "Hava Durumu", emoji: "☀️" },
      { slug: "gezegenler", label: "Gezegenler", emoji: "🪐" },
      { slug: "vucudumuz", label: "Vücudumuz", emoji: "🫀" },
      { slug: "besin-gruplari", label: "Besin Grupları", emoji: "🥗" },
      { slug: "bitki-buyume", label: "Bitki Büyümesi", emoji: "🌱" },
      { slug: "hayvanlar", label: "Hayvanlar", emoji: "🦁" },
      { slug: "mevsimler", label: "Mevsimler", emoji: "🍂" },
      { slug: "su-dongu", label: "Su Döngüsü", emoji: "💧" },
    ],
  },
  {
    id: "mantik",
    icon: "🧠",
    title: "Mantık",
    accent: "#ff9f43",
    items: [
      { slug: "sira-bul", label: "Sıra Bul", emoji: "🔁" },
      { slug: "boyut-sirala", label: "Boyut Sırala", emoji: "📏" },
      { slug: "mantik-eslestir", label: "Mantık Eşleştir", emoji: "🔗" },
      { slug: "fark-bul", label: "Farkı Bul", emoji: "👀" },
      { slug: "grupla", label: "Grupla", emoji: "📦" },
    ],
  },
];

export const TOTAL_ACTIVITIES = MENU.reduce((n, c) => n + c.items.length, 0);

export function findActivity(slug: string) {
  for (const cat of MENU) {
    const item = cat.items.find((i) => i.slug === slug);
    if (item) return { ...item, category: cat };
  }
  return null;
}
