/**
 * Beceri grafı (MASTER_PLAN §3.1, CONTRACT §6.1).
 *
 * `mebCode` bilerek boş: resmî programdan doğrulanmadan kazanım kodu
 * yazılmaz (MASTER_PLAN K21). Ebeveyn paneli bu durumda `mebArea` gösterir.
 */
export const SKILL_IDS = [
  "tr.ses-ayirt", "tr.ses-harf", "tr.harf-yaz", "tr.hece", "tr.kelime", "tr.cumle", "tr.dinle", "tr.sozcuk",
  "mat.sayma", "mat.rakam", "mat.sira", "mat.ritmik", "mat.toplama", "mat.cikarma", "mat.eksik", "mat.oruntu",
  "mat.sekil", "mat.cisim", "mat.simetri", "mat.uzamsal", "mat.olcme", "mat.zaman", "mat.para", "mat.veri",
  "hb.saglik", "hb.guvenli", "hb.duygular", "hb.doga",
  "fen.tahmin", "fen.gozlem", "fen.siniflama",
  "ef.hafiza", "ef.isitsel", "ef.dikkat", "ef.ketleme", "ef.planlama", "ef.refleks",
] as const;

export type SkillId = (typeof SKILL_IDS)[number];
export type SkillLevel = 1 | 2 | 3 | 4 | 5;
export type Strand = "tr" | "mat" | "hb" | "fen" | "ef";

export type SkillDef = {
  id: SkillId;
  strand: Strand;
  label: string;
  labelParent: string;
  mebArea: string;
  mebCode?: string;
  prereq: { skill: SkillId; level: SkillLevel }[];
  levels: readonly [string, string, string, string, string];
  phase1: boolean;
  tip?: string;
};

export const SOUND_GROUPS: readonly (readonly string[])[] = [
  ["e", "l", "a", "k", "i", "n"],
  ["o", "m", "u", "t", "ü", "y"],
  ["ö", "r", "ı", "d", "s", "b"],
  ["z", "ç", "g", "ş", "c", "p"],
  ["h", "v", "ğ", "f", "j"],
];

export function lettersUpToGroup(group: 1 | 2 | 3 | 4 | 5): string[] {
  return SOUND_GROUPS.slice(0, group).flat();
}

const TR = "Türkçe 1 · İlk okuma yazma";
const TR_DIL = "Türkçe 1 · Dinleme ve söz varlığı";
const MAT = "Matematik 1 · Sayılar ve işlemler";
const GEO = "Matematik 1 · Geometri";
const OLC = "Matematik 1 · Ölçme";
const VER = "Matematik 1 · Veri";
const HB = "Hayat Bilgisi 1";
const FEN = "Fen temelleri · Bilimsel süreç";
const EF = "Okul öncesi · Bilişsel gelişim";

type Def = Omit<SkillDef, "id" | "strand">;

function def(
  label: string,
  labelParent: string,
  mebArea: string,
  levels: SkillDef["levels"],
  opts: { prereq?: SkillDef["prereq"]; phase1?: boolean; tip?: string } = {},
): Def {
  return {
    label,
    labelParent,
    mebArea,
    levels,
    prereq: opts.prereq ?? [],
    phase1: opts.phase1 ?? false,
    tip: opts.tip,
  };
}

const DEFS: Record<SkillId, Def> = {
  "tr.ses-ayirt": def("Ses avı", "İlk sesi ayırt etme", TR,
    ["2 resimden aynı ilk ses", "3 resimden aynı ilk ses", "Son sesi ayırt etme", "Ortadaki ses", "Ünlü/ünsüz sezgisi"],
    { phase1: true, tip: "Yemekte 'kkk-edi, kkk-apı' diye ilk sesi uzatın; aynı sesle başlayan bir şey bulsun." }),
  "tr.ses-harf": def("Harf sesi", "Ses–harf eşleme", TR,
    ["1. ses grubu (e l a k i n)", "+ 2. grup (o m u t ü y)", "+ 3. grup (ö r ı d s b)", "+ 4. grup (z ç g ş c p)", "+ 5. grup (h v ğ f j)"],
    { prereq: [{ skill: "tr.ses-ayirt", level: 2 }], phase1: true, tip: "Harfin adını değil sesini söyleyin: 'ke' değil 'kkk'." }),
  "tr.harf-yaz": def("Harf yazma", "Harf yazımı (yazım yönüyle)", TR,
    ["1. grup küçük harfler, rehberli", "1–2. grup küçük harfler", "Büyük harfler, rehberli", "Rehbersiz küçük harf", "Rehbersiz büyük harf"],
    { prereq: [{ skill: "tr.ses-harf", level: 1 }], phase1: true, tip: "Parmağıyla havada ya da kumda harf çizmesi de yazmaya hazırlıktır." }),
  "tr.hece": def("Hece", "Hece oluşturma ve birleştirme", TR,
    ["el / al / la", "1–2. gruptan iki heceli kelime", "Üç heceli kelime", "Kapalı heceler", "Serbest hece oyunu"],
    { prereq: [{ skill: "tr.ses-harf", level: 2 }] }),
  "tr.kelime": def("Kelime", "Kelime okuma (resimle)", TR,
    ["2 seçenek, 1. grup kelimeleri", "3 seçenek", "4 seçenek, kelime → resim", "Bilinen harflerle her kelime", "Hızlı okuma"],
    { prereq: [{ skill: "tr.hece", level: 1 }], phase1: true }),
  "tr.cumle": def("Cümle", "Kısa cümle okuma", TR,
    ["2 kelimelik cümle", "3 kelimelik cümle", "Soru kelimesi ile", "İki cümle", "Kısa paragraf"],
    { prereq: [{ skill: "tr.kelime", level: 3 }] }),
  "tr.dinle": def("Dinle", "Dinlediğini anlama", TR_DIL,
    ["1 soru", "2 soru", "Olay sırası (3 kart)", "Neden sorusu", "Tahmin sorusu"]),
  "tr.sozcuk": def("Sözcükler", "Söz varlığı: kategori, zıt anlam", TR_DIL,
    ["Kategori", "Zıt anlam", "Farklı olanı bul", "Neden aynı grupta?", "Benzetme"]),
  "mat.sayma": def("Sayma", "Nesne sayma (20'ye kadar)", MAT,
    ["1–5", "1–10 beşli sıralar", "11–20 onluk çerçeve", "Dağınık 20'ye kadar", "10'dan ileri sayma"],
    { phase1: true, tip: "Merdivenleri birlikte sayın; her basamakta bir sayı." }),
  "mat.rakam": def("Rakamlar", "Rakam tanıma ve yazma", MAT,
    ["0–5", "0–9", "10–15", "16–20", "Rakam yazma"]),
  "mat.sira": def("Sıra", "Önce/sonra, karşılaştırma, sıralama", MAT,
    ["10'a kadar önce/sonra", "10'a kadar az/çok", "20'ye kadar önce/sonra", "3–5 sayıyı sırala", "Arada kalan sayı"],
    { phase1: true }),
  "mat.ritmik": def("Ritmik sayma", "Ritmik sayma", MAT,
    ["Birer 20'ye kadar", "Onar", "Beşer", "İkişer", "Geriye doğru"],
    { prereq: [{ skill: "mat.sira", level: 2 }] }),
  "mat.toplama": def("Toplama", "Toplama (20'ye kadar)", MAT,
    ["Toplam ≤ 5", "Toplam ≤ 10", "Onluk çerçeveyle 20'ye kadar", "Sayı doğrusu", "Sembolle"],
    { prereq: [{ skill: "mat.sayma", level: 2 }], phase1: true, tip: "Parmaklarla '3 parmak, 2 parmak daha' oyunu oynayın." }),
  "mat.cikarma": def("Çıkarma", "Çıkarma (20'ye kadar)", MAT,
    ["≤ 5, nesne çizerek", "≤ 10", "20'ye kadar", "Sayı doğrusunda geri", "Sembolle"],
    { prereq: [{ skill: "mat.toplama", level: 1 }], phase1: true }),
  "mat.eksik": def("Eksik sayı", "Eksik terim / parça–bütün", MAT,
    ["≤ 5", "≤ 10", "≤ 20", "Parça–bütün çubuğu", "Sembolle"],
    { prereq: [{ skill: "mat.toplama", level: 2 }] }),
  "mat.oruntu": def("Örüntü", "Örüntü tamamlama", MAT,
    ["AB", "AABB / ABC", "Şekil + renk", "Büyüyen örüntü", "Kuralı söyle"],
    { phase1: true, tip: "Alkış–alkış–ayak gibi ses örüntüleri yapın; devamını o getirsin." }),
  "mat.sekil": def("Şekiller", "Düzlemsel şekiller", GEO,
    ["Şekli adlandır", "Çevrede bul", "Kenar/köşe say", "Şekillerden şekil", "Sınıflandır"]),
  "mat.cisim": def("Cisimler", "Geometrik cisimler", GEO,
    ["Küp/küre", "Silindir", "Prizma", "Günlük nesnelerle eşle", "Sınıflandır"],
    { prereq: [{ skill: "mat.sekil", level: 2 }] }),
  "mat.simetri": def("Simetri", "Simetri", GEO,
    ["Simetrik resmi bul", "4×4 ızgara tamamla", "6×6 ızgara", "Simetri doğrusu", "Kendi simetrisini yap"]),
  "mat.uzamsal": def("Yön", "Uzamsal ilişkiler", GEO,
    ["Sağ/sol, üst/alt", "1 adımlı yol", "3 adımlı yol", "Karaktere göre yön", "Harita okuma"]),
  "mat.olcme": def("Ölçme", "Uzunluk, kütle, sıvı karşılaştırma", OLC,
    ["Uzun/kısa", "Ağır/hafif", "Dolu/boş", "Sırala", "Standart dışı birim"]),
  "mat.zaman": def("Saat", "Zaman ölçme", OLC,
    ["Sabah/öğle/akşam", "Tam saat", "Yarım saat", "Günler", "Haftanın sırası"]),
  "mat.para": def("Para", "Paralarımız", OLC,
    ["Tanıma", "Hangisi çok?", "5 TL'yi oluştur", "10 TL'yi oluştur", "Basit alışveriş"]),
  "mat.veri": def("Grafik", "Veri okuma", VER,
    ["Resimli grafikte say", "En çok/en az", "İki sütunu karşılaştır", "Tablo", "Veri topla"]),
  "hb.saglik": def("Sağlık", "Sağlıklı yaşam", HB,
    ["Besin grupları", "El yıkama sırası", "Diş fırçalama sırası", "Uyku ve hareket", "Sağlıklı tabak"]),
  "hb.guvenli": def("Güvenli yol", "Güvenli yaşam", HB,
    ["Trafik ışığı", "Evde tehlikeler", "Kaybolunca kimden yardım", "112", "Ekranda korkutucu bir şey görünce"],
    { phase1: true, tip: "'Ekranda seni korkutan bir şey görürsen ne yaparsın?' diye sorun; cevap 'kapatırım ve size gösteririm'." }),
  "hb.duygular": def("Duygular", "Duyguları tanıma", HB,
    ["Yüzdeki duyguyu bul", "Ne iyi gelir?", "Sıra bekleme", "Arkadaşın duygusu", "Duyguyu anlatma"]),
  "hb.doga": def("Doğa", "Doğa ve çevre", HB,
    ["Mevsim–kıyafet", "Tohumdan çiçeğe", "Hayvan–yuva", "Hava durumu", "Geri dönüşüm"]),
  "fen.tahmin": def("Tahmin et", "Tahmin–gözlem–açıklama", FEN,
    ["Tahmin et", "Gözle", "Açıkla", "Yeni durumda dene", "Evde deney"],
    { phase1: true, tip: "Kapsül görevini birlikte yapın; önce 'sence ne olacak?' diye sorun." }),
  "fen.gozlem": def("Gözlem", "Gözlem ve karşılaştırma", FEN,
    ["Aynı mı farklı mı?", "Bir özellik söyle", "İki özellik", "Değişimi fark et", "Kaydet"]),
  "fen.siniflama": def("Sınıflama", "Sınıflandırma", FEN,
    ["Canlı/cansız", "Katı/sıvı", "Mıknatısa yapışır mı?", "Kendi ölçütünü seç", "İki ölçüt"]),
  "ef.hafiza": def("Hafıza", "Görsel çalışma belleği", EF,
    ["6 kart", "8 kart", "10 kart", "12 kart", "Ne kayboldu?"], { phase1: true }),
  "ef.isitsel": def("Ses sırası", "İşitsel bellek", EF,
    ["2 ses", "3 ses", "4 ses", "5 ses", "Geriye doğru"]),
  "ef.dikkat": def("Dikkat", "Seçici dikkat", EF,
    ["Tek hedef", "İki hedef", "Çeldiricili", "Hızlı", "Uzun süre"], { phase1: true }),
  "ef.ketleme": def("Dur-Git", "Dürtü kontrolü (ketleme)", EF,
    ["Balığa dokun, köpekbalığına dokunma", "Daha hızlı", "Kural değişir", "İki kural", "Uzun süre"]),
  "ef.planlama": def("Planlama", "Planlama ve problem çözme", EF,
    ["1 adım önceden", "2 adım", "Engelli yol", "Çok adımlı", "Strateji anlatma"], { phase1: true }),
  "ef.refleks": def("Refleks", "Zamanlama ve tepki", EF,
    ["Kolay", "Orta", "Hızlı", "Çok hızlı", "Usta"], { phase1: true }),
};

function strandOf(id: SkillId): Strand {
  return id.split(".")[0] as Strand;
}

export const SKILLS: Readonly<Record<SkillId, SkillDef>> = Object.fromEntries(
  SKILL_IDS.map((id) => [id, { id, strand: strandOf(id), ...DEFS[id] }]),
) as Record<SkillId, SkillDef>;

export function isSkillId(value: string): value is SkillId {
  return (SKILL_IDS as readonly string[]).includes(value);
}

export function skillsByStrand(strand: Strand): SkillDef[] {
  return SKILL_IDS.filter((id) => SKILLS[id].strand === strand).map((id) => SKILLS[id]);
}
