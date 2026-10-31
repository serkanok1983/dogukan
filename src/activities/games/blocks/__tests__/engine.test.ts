import { describe, expect, it } from "vitest";
import {
  GRID_CELLS,
  GRID_H,
  GRID_W,
  canUndo,
  cellIndex,
  createHistory,
  decodeGrid,
  emptyGrid,
  encodeGrid,
  getCell,
  isConnected,
  lineCells,
  paintLine,
  pushHistory,
  replacePresent,
  setCell,
  starterGrid,
  surfaceY,
  undoHistory,
  validateAyna,
  validateSay,
  type BlockKind,
  type Grid,
} from "../engine";

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function randomGrid(rand: () => number): Grid {
  const g = emptyGrid();
  for (let i = 0; i < g.length; i++) g[i] = Math.floor(rand() * 9);
  return g;
}

function fill(
  cells: Array<[number, number]>,
  kind: BlockKind,
  base: Grid = emptyGrid(),
): Grid {
  let g = base;
  for (const [x, y] of cells) g = setCell(g, x, y, kind);
  return g;
}

describe("ızgara temel işlemleri", () => {
  it("boyutlar ve boş ızgara", () => {
    expect(GRID_W).toBe(12);
    expect(GRID_H).toBe(18);
    const g = emptyGrid();
    expect(g).toBeInstanceOf(Uint8Array);
    expect(g.length).toBe(GRID_CELLS);
    expect(g.every((v) => v === 0)).toBe(true);
  });

  it("setCell değişmez; aynı değerde aynı referans", () => {
    const g = emptyGrid();
    const g2 = setCell(g, 3, 4, 2);
    expect(g2).not.toBe(g);
    expect(getCell(g, 3, 4)).toBe(0);
    expect(getCell(g2, 3, 4)).toBe(2);
    expect(g2[cellIndex(3, 4)]).toBe(2);
    expect(setCell(g2, 3, 4, 2)).toBe(g2);
    expect(setCell(g2, -1, 0, 2)).toBe(g2);
    expect(setCell(g2, GRID_W, 0, 2)).toBe(g2);
    expect(getCell(g2, 99, 99)).toBe(0);
  });
});

describe("encode/decode", () => {
  it("rastgele ızgaralarda gidiş-dönüş", () => {
    const rand = seeded(42);
    for (let n = 0; n < 50; n++) {
      const g = randomGrid(rand);
      const decoded = decodeGrid(encodeGrid(g));
      expect(decoded).not.toBeNull();
      expect(Array.from(decoded!)).toEqual(Array.from(g));
    }
  });

  it("216 bayt → 288 karakter base64", () => {
    expect(encodeGrid(starterGrid())).toHaveLength(288);
  });

  it("bozuk veriyi reddeder", () => {
    expect(decodeGrid("")).toBeNull();
    expect(decodeGrid("%%%not base64%%%")).toBeNull();
    expect(decodeGrid(btoa("kisa"))).toBeNull();
    const bad = new Uint8Array(GRID_CELLS);
    bad[5] = 9;
    expect(decodeGrid(btoa(String.fromCharCode(...bad)))).toBeNull();
  });
});

describe("paintLine", () => {
  it("yatay, dikey ve tek hücre", () => {
    expect(lineCells(2, 3, 2, 3)).toEqual([[2, 3]]);
    expect(lineCells(0, 0, 3, 0)).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ]);
    expect(lineCells(1, 5, 1, 2)).toEqual([
      [1, 5],
      [1, 4],
      [1, 3],
      [1, 2],
    ]);
  });

  it("çapraz çizgi 4-bağlantılı ve uçları kapsar", () => {
    const cells = lineCells(0, 0, 5, 3);
    expect(cells[0]).toEqual([0, 0]);
    expect(cells[cells.length - 1]).toEqual([5, 3]);
    expect(cells).toHaveLength(5 + 3 + 1);
    for (let i = 1; i < cells.length; i++) {
      const [ax, ay] = cells[i - 1];
      const [bx, by] = cells[i];
      expect(Math.abs(ax - bx) + Math.abs(ay - by)).toBe(1);
    }
  });

  it("boyanan ızgara çizginin tüm hücrelerini içerir ve tek parça olur", () => {
    const g = paintLine(emptyGrid(), 11, 17, 0, 6, 4);
    for (const [x, y] of lineCells(11, 17, 0, 6)) expect(getCell(g, x, y)).toBe(4);
    expect(isConnected(g, 4)).toBe(true);
    expect(validateSay(g, 11 + 11 + 1, 4)).toBe(true);
  });

  it("değişiklik yoksa aynı referans; silgi siler", () => {
    const g = paintLine(emptyGrid(), 0, 0, 4, 0, 3);
    expect(paintLine(g, 0, 0, 4, 0, 3)).toBe(g);
    const erased = paintLine(g, 1, 0, 2, 0, 0);
    expect([0, 1, 2, 3, 4].map((x) => getCell(erased, x, 0))).toEqual([
      3, 0, 0, 3, 3,
    ]);
    expect(getCell(g, 1, 0)).toBe(3);
  });
});

describe("validateSay", () => {
  it("tür verilmeden toplam blok sayısı", () => {
    const g = fill(
      [
        [0, 0],
        [5, 5],
        [11, 17],
      ],
      2,
    );
    expect(validateSay(g, 3)).toBe(true);
    expect(validateSay(g, 2)).toBe(false);
    expect(validateSay(emptyGrid(), 0)).toBe(true);
  });

  it("tür verilince sayı + 4-bağlantı (köprü)", () => {
    const bridge = paintLine(emptyGrid(), 2, 10, 9, 10, 4); // 8 tahta
    expect(validateSay(bridge, 8, 4)).toBe(true);
    expect(validateSay(bridge, 7, 4)).toBe(false);
    expect(validateSay(bridge, 8, 3)).toBe(false);

    // Başka tür bloklar sayımı etkilemez.
    const withStone = setCell(bridge, 0, 0, 3);
    expect(validateSay(withStone, 8, 4)).toBe(true);
    expect(validateSay(withStone, 9)).toBe(true);
  });

  it("parçalı veya yalnız çapraz değen bloklar bağlı sayılmaz", () => {
    const split = fill(
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [5, 0],
        [6, 0],
      ],
      8,
    );
    expect(validateSay(split, 5)).toBe(true);
    expect(validateSay(split, 5, 8)).toBe(false);

    const diagonal = fill(
      [
        [0, 0],
        [1, 1],
      ],
      1,
    );
    expect(validateSay(diagonal, 2, 1)).toBe(false);

    const lShape = fill(
      [
        [0, 0],
        [0, 1],
        [1, 1],
      ],
      1,
    );
    expect(validateSay(lShape, 3, 1)).toBe(true);
  });
});

describe("validateAyna", () => {
  it("boş ve simetrik ızgaralar", () => {
    expect(validateAyna(emptyGrid())).toBe(true);
    expect(validateAyna(starterGrid())).toBe(true);
    const g = fill(
      [
        [0, 3],
        [11, 3],
        [5, 7],
        [6, 7],
      ],
      6,
    );
    expect(validateAyna(g)).toBe(true);
  });

  it("asimetrik satır ya da farklı tür reddedilir", () => {
    expect(validateAyna(setCell(emptyGrid(), 0, 3, 6))).toBe(false);
    const g = setCell(setCell(emptyGrid(), 2, 9, 6), 9, 9, 5);
    expect(validateAyna(g)).toBe(false);
    expect(validateAyna(setCell(g, 9, 9, 6))).toBe(true);
  });

  it("orta sütun çifti (5 ↔ 6) de denetlenir", () => {
    expect(validateAyna(setCell(emptyGrid(), 5, 0, 1))).toBe(false);
  });
});

describe("surfaceY", () => {
  it("en üst dolu hücre; boş sütunda GRID_H", () => {
    const g = fill(
      [
        [4, 10],
        [4, 15],
        [7, 0],
      ],
      3,
    );
    expect(surfaceY(g, 4)).toBe(10);
    expect(surfaceY(g, 7)).toBe(0);
    expect(surfaceY(g, 0)).toBe(GRID_H);
    expect(surfaceY(starterGrid(), 3)).toBe(GRID_H - 2);
  });

  it("ızgara dışı sütun GRID_H", () => {
    const g = starterGrid();
    expect(surfaceY(g, -1)).toBe(GRID_H);
    expect(surfaceY(g, GRID_W)).toBe(GRID_H);
  });
});

describe("geri alma yığını", () => {
  it("push / replace / undo", () => {
    const a = emptyGrid();
    const b = setCell(a, 0, 0, 1);
    const c = setCell(b, 1, 0, 1);
    let h = createHistory(a);
    expect(canUndo(h)).toBe(false);
    h = pushHistory(h, b);
    expect(pushHistory(h, b)).toBe(h);
    expect(pushHistory(h, new Uint8Array(b))).toBe(h); // içerik aynı
    h = replacePresent(h, c); // aynı vuruş
    expect(h.past).toHaveLength(1);
    expect(h.present).toBe(c);
    h = undoHistory(h);
    expect(h.present).toBe(a);
    expect(canUndo(h)).toBe(false);
    expect(undoHistory(h)).toBe(h);
  });

  it("sınırı aşınca en eski adım düşer ve eski durumlar bozulmaz", () => {
    let h = createHistory(emptyGrid());
    const first = h.present;
    for (let i = 0; i < 10; i++) h = pushHistory(h, setCell(h.present, i, 0, 2), 5);
    expect(h.past).toHaveLength(5);
    expect(h.past.includes(first)).toBe(false);
    expect(getCell(h.past[0], 5, 0)).toBe(0);
    expect(getCell(h.present, 9, 0)).toBe(2);
  });
});
