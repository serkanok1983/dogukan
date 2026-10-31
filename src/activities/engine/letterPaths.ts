/**
 * TraceCanvas yazım yolları (MASTER_PLAN §3.3): 1–2. ses grubunun 12 küçük
 * harfi (e l a k i n o m u t ü y), büyükleri ve 0–9 rakamları. Dik temel harf.
 *
 * Koordinatlar 0–100 kutusunda, y aşağı doğru. Her harf vuruş sırasıyla
 * verilen vuruşlardan oluşur; her vuruş kendi yazım yönündedir. Tek noktalı
 * vuruş bir noktadır (i, ü, İ, Ü noktaları).
 *
 * Çizgiler: büyük harf/rakam üstü 12, küçük harf orta çizgisi 42, taban 82,
 * alt uzantı 98. Büyük harfler `LetterTrace.tsx` yollarından türetildi.
 */
export type Pt = readonly [number, number];
export type Stroke = readonly Pt[];

export const GUIDE = { top: 12, mid: 42, base: 82, desc: 98 } as const;

/** Açılar derece; 0 = sağ, 90 = aşağı (ekran koordinatı). Artan açı saat yönü. */
function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number): Pt[] {
  const steps = Math.max(2, Math.ceil(Math.abs(to - from) / 12));
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    pts.push([round(cx + rx * Math.cos(a)), round(cy + ry * Math.sin(a))]);
  }
  return pts;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

const dot = (x: number, y: number): Stroke => [[x, y]];

// ---- küçük harfler ----
const lower: Record<string, Stroke[]> = {
  e: [[[30, 62], [70, 62], ...arc(50, 62, 20, 20, 0, -320)]],
  l: [[[50, 12], [50, 82]]],
  a: [arc(46, 62, 19, 20, -30, -390), [[65, 42], [65, 82]]],
  k: [[[35, 12], [35, 82]], [[66, 42], [35, 64], [68, 82]]],
  i: [[[50, 42], [50, 82]], dot(50, 27)],
  n: [[[35, 42], [35, 82]], [...arc(50, 57, 15, 15, 180, 360), [65, 82]]],
  o: [arc(50, 62, 20, 20, -90, -450)],
  m: [
    [[28, 42], [28, 82]],
    [...arc(39, 55, 11, 13, 180, 360), [50, 82]],
    [...arc(61, 55, 11, 13, 180, 360), [72, 82]],
  ],
  u: [[[35, 42], ...arc(50, 67, 15, 15, 180, 0), [65, 42]], [[65, 42], [65, 82]]],
  t: [[[45, 18], ...arc(55, 72, 10, 10, 180, 60)], [[32, 42], [62, 42]]],
  ü: [
    [[35, 42], ...arc(50, 67, 15, 15, 180, 0), [65, 42]],
    [[65, 42], [65, 82]],
    dot(42, 28),
    dot(58, 28),
  ],
  y: [[[33, 42], [50, 76]], [[67, 42], [40, 98]]],
};

// ---- büyük harfler ----
const upper: Record<string, Stroke[]> = {
  E: [[[30, 12], [30, 82]], [[30, 12], [70, 12]], [[30, 47], [64, 47]], [[30, 82], [70, 82]]],
  L: [[[32, 12], [32, 82], [70, 82]]],
  A: [[[50, 12], [25, 82]], [[50, 12], [75, 82]], [[34, 58], [66, 58]]],
  K: [[[32, 12], [32, 82]], [[70, 12], [32, 52]], [[44, 43], [72, 82]]],
  İ: [[[50, 24], [50, 82]], dot(50, 10)],
  I: [[[50, 12], [50, 82]]],
  N: [[[30, 82], [30, 12]], [[30, 12], [70, 82]], [[70, 82], [70, 12]]],
  O: [arc(50, 47, 24, 35, -90, -450)],
  M: [[[24, 82], [24, 12]], [[24, 12], [50, 58], [76, 12]], [[76, 12], [76, 82]]],
  U: [[[30, 12], ...arc(50, 60, 20, 22, 180, 0), [70, 12]]],
  T: [[[25, 12], [75, 12]], [[50, 12], [50, 82]]],
  Ü: [[[30, 24], ...arc(50, 62, 20, 20, 180, 0), [70, 24]], dot(41, 10), dot(59, 10)],
  Y: [[[28, 12], [50, 47]], [[72, 12], [50, 47]], [[50, 47], [50, 82]]],
};

// ---- rakamlar ----
const digits: Record<string, Stroke[]> = {
  "0": [arc(50, 47, 20, 35, -90, -450)],
  "1": [[[37, 27], [54, 12], [54, 82]]],
  "2": [[...arc(50, 31, 18, 18, 200, 380), [30, 82], [72, 82]]],
  "3": [[...arc(50, 29, 16, 16, 210, 450), ...arc(50, 64, 18, 18, 270, 510).slice(1)]],
  "4": [[[58, 12], [26, 62], [76, 62]], [[60, 32], [60, 82]]],
  "5": [[[36, 12], [35, 44], ...arc(48, 62, 20, 21, 235, 510)], [[36, 12], [68, 12]]],
  "6": [[[64, 14], [48, 22], [37, 38], [32, 56], ...arc(50, 64, 18, 18, 180, -180)]],
  "7": [[[28, 12], [72, 12], [42, 82]]],
  "8": [[...arc(50, 30, 16, 16, -90, -270), ...arc(50, 64, 18, 18, -90, 270).slice(1), ...arc(50, 30, 16, 16, 90, -90).slice(1)]],
  "9": [[...arc(50, 32, 18, 18, 0, -360), [66, 82]]],
};

export const LETTER_PATHS: Readonly<Record<string, readonly Stroke[]>> = {
  ...lower,
  ...upper,
  ...digits,
};

/** Desteklenen karakterler (S3 üreticileri yalnızca bunları istemeli). */
export const TRACE_CHARS: readonly string[] = Object.keys(LETTER_PATHS);

export function getLetterPath(char: string): readonly Stroke[] | undefined {
  return LETTER_PATHS[char] ?? LETTER_PATHS[char.normalize("NFC")];
}

/** Küçük harf mi (kılavuz çizgileri için)? */
export function isLowerTrace(char: string): boolean {
  return char in lower;
}
