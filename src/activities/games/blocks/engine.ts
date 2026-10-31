/**
 * Blok Dünyası saf motoru (CONTRACT §10.6). DOM yok, yan etki yok.
 * Izgara satır öncelikli bir `Uint8Array`; y = 0 en üst satır.
 * Izgarayı değiştiren yardımcılar yeni bir dizi döndürür (değişiklik yoksa aynı
 * referans), böylece geri alma yığını eski durumları güvenle saklayabilir.
 */

export const GRID_W = 12;
export const GRID_H = 18;
export const GRID_CELLS = GRID_W * GRID_H;

/** 0 boş; 1 çim 2 toprak 3 taş 4 tahta 5 cam 6 su 7 çiçek 8 bal */
export type BlockKind = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type SolidKind = Exclude<BlockKind, 0>;
export type Grid = Uint8Array;

export const MAX_KIND = 8;
export const SOLID_KINDS: readonly SolidKind[] = [1, 2, 3, 4, 5, 6, 7, 8];

export const BLOCK_NAMES: Readonly<Record<SolidKind, string>> = {
  1: "Çim",
  2: "Toprak",
  3: "Taş",
  4: "Tahta",
  5: "Cam",
  6: "Su",
  7: "Çiçek",
  8: "Bal",
};

export function isBlockKind(v: number): v is BlockKind {
  return Number.isInteger(v) && v >= 0 && v <= MAX_KIND;
}

export function emptyGrid(): Grid {
  return new Uint8Array(GRID_CELLS);
}

export function cloneGrid(grid: Grid): Grid {
  return new Uint8Array(grid);
}

export function inBounds(x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < GRID_W && y >= 0 && y < GRID_H;
}

export function cellIndex(x: number, y: number): number {
  return y * GRID_W + x;
}

/** Izgara dışı hücreler boş sayılır. */
export function getCell(grid: Grid, x: number, y: number): BlockKind {
  if (!inBounds(x, y)) return 0;
  return grid[cellIndex(x, y)] as BlockKind;
}

/** Yeni ızgara döndürür; hücre zaten bu türse veya ızgara dışıysa aynı ızgarayı döndürür. */
export function setCell(grid: Grid, x: number, y: number, kind: BlockKind): Grid {
  if (!inBounds(x, y) || grid[cellIndex(x, y)] === kind) return grid;
  const next = cloneGrid(grid);
  next[cellIndex(x, y)] = kind;
  return next;
}

/**
 * İki hücre arasındaki 4-bağlantılı çizgi (çapraz boşluk bırakmaz), başlangıç
 * ve bitiş dahil. Sürükleyerek boyarken parmak hızlı gidince arada hücre kaçmasın diye.
 */
export function lineCells(x0: number, y0: number, x1: number, y1: number): Array<[number, number]> {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x1 > x0 ? 1 : -1;
  const sy = y1 > y0 ? 1 : -1;
  const out: Array<[number, number]> = [];
  let x = x0;
  let y = y0;
  let ix = 0;
  let iy = 0;
  const n = dx + dy;
  for (let i = 0; i <= n; i++) {
    out.push([x, y]);
    if (i === n) break;
    if ((0.5 + ix) / dx < (0.5 + iy) / dy) {
      x += sx;
      ix++;
    } else {
      y += sy;
      iy++;
    }
  }
  return out;
}

/** Çizgi üzerindeki tüm hücreleri `kind` yapar. Değişiklik yoksa aynı ızgarayı döndürür. */
export function paintLine(
  grid: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  kind: BlockKind,
): Grid {
  let next: Grid | null = null;
  for (const [x, y] of lineCells(x0, y0, x1, y1)) {
    if (!inBounds(x, y)) continue;
    const i = cellIndex(x, y);
    if ((next ?? grid)[i] === kind) continue;
    next ??= cloneGrid(grid);
    next[i] = kind;
  }
  return next ?? grid;
}

export function gridsEqual(a: Grid, b: Grid): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// ---- Kodlama (localStorage / Firebase için base64) ----

export function encodeGrid(grid: Grid): string {
  let bin = "";
  for (let i = 0; i < grid.length; i++) bin += String.fromCharCode(grid[i]);
  return btoa(bin);
}

/** Bozuk, yanlış uzunlukta veya bilinmeyen blok içeren veride `null` döner. */
export function decodeGrid(encoded: string): Grid | null {
  if (typeof encoded !== "string" || encoded.length === 0) return null;
  let bin: string;
  try {
    bin = atob(encoded);
  } catch {
    return null;
  }
  if (bin.length !== GRID_CELLS) return null;
  const grid = emptyGrid();
  for (let i = 0; i < GRID_CELLS; i++) {
    const v = bin.charCodeAt(i);
    if (v > MAX_KIND) return null;
    grid[i] = v;
  }
  return grid;
}

// ---- Doğrulayıcılar (Faz 1: say ve ayna) ----

/** `kind` verilirse o türün, verilmezse tüm dolu hücrelerin sayısı. */
export function countBlocks(grid: Grid, kind?: BlockKind): number {
  let n = 0;
  for (let i = 0; i < grid.length; i++) {
    if (kind === undefined ? grid[i] !== 0 : grid[i] === kind) n++;
  }
  return n;
}

/** `kind` türündeki tüm blokların tek bir 4-bağlantılı parça oluşturup oluşturmadığı. */
export function isConnected(grid: Grid, kind: BlockKind): boolean {
  let start = -1;
  let total = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === kind) {
      total++;
      if (start < 0) start = i;
    }
  }
  if (total === 0) return true;
  const seen = new Uint8Array(grid.length);
  const stack = [start];
  seen[start] = 1;
  let reached = 0;
  while (stack.length > 0) {
    const i = stack.pop()!;
    reached++;
    const x = i % GRID_W;
    const y = (i - x) / GRID_W;
    const around: Array<[number, number]> = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    for (const [nx, ny] of around) {
      if (!inBounds(nx, ny)) continue;
      const j = cellIndex(nx, ny);
      if (seen[j] || grid[j] !== kind) continue;
      seen[j] = 1;
      stack.push(j);
    }
  }
  return reached === total;
}

/**
 * "Tam N blokla yap": tam sayım. `kind` verilirse o türden tam `n` blok olmalı ve
 * hepsi tek bir 4-bağlantılı parça oluşturmalı (ör. köprü). `kind` yoksa toplam
 * dolu hücre sayısı `n` olmalı.
 */
export function validateSay(grid: Grid, n: number, kind?: BlockKind): boolean {
  if (kind === undefined || kind === 0) return countBlocks(grid) === n;
  return countBlocks(grid, kind) === n && isConnected(grid, kind);
}

/** "Ayna": her satır dikey eksene göre simetrik (grid[x] === grid[W-1-x]). */
export function validateAyna(grid: Grid): boolean {
  for (let y = 0; y < GRID_H; y++) {
    const row = y * GRID_W;
    for (let x = 0; x < GRID_W / 2; x++) {
      if (grid[row + x] !== grid[row + GRID_W - 1 - x]) return false;
    }
  }
  return true;
}

/** Sütundaki en üst dolu hücrenin y'si; sütun boşsa (veya ızgara dışıysa) GRID_H. */
export function surfaceY(grid: Grid, x: number): number {
  if (!Number.isInteger(x) || x < 0 || x >= GRID_W) return GRID_H;
  for (let y = 0; y < GRID_H; y++) {
    if (grid[cellIndex(x, y)] !== 0) return y;
  }
  return GRID_H;
}

// ---- Başlangıç sahnesi ----

/** İlk açılışta ayının basabileceği bir zemin: alt satır toprak, üstü çim. */
export function starterGrid(): Grid {
  const grid = emptyGrid();
  for (let x = 0; x < GRID_W; x++) {
    grid[cellIndex(x, GRID_H - 1)] = 2;
    grid[cellIndex(x, GRID_H - 2)] = 1;
  }
  return grid;
}

// ---- Geri alma yığını (değişmez) ----

export const UNDO_LIMIT = 60;

export type History = { readonly past: readonly Grid[]; readonly present: Grid };

export function createHistory(grid: Grid): History {
  return { past: [], present: grid };
}

/** Yeni bir geri alma adımı ekler; ızgara değişmediyse aynı geçmişi döndürür. */
export function pushHistory(h: History, next: Grid, limit = UNDO_LIMIT): History {
  if (next === h.present || gridsEqual(next, h.present)) return h;
  const past = [...h.past, h.present];
  if (past.length > limit) past.splice(0, past.length - limit);
  return { past, present: next };
}

/** Aynı adım içinde (sürükleme sürerken) şimdiki durumu değiştirir. */
export function replacePresent(h: History, next: Grid): History {
  return next === h.present ? h : { past: h.past, present: next };
}

export function canUndo(h: History): boolean {
  return h.past.length > 0;
}

export function undoHistory(h: History): History {
  if (h.past.length === 0) return h;
  return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1] };
}
