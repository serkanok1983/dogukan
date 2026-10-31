import { describe, expect, it } from "vitest";
import { MAX_CLIMB, bearPoseAt, canStep, nextStep, standRow } from "../bear";
import { GRID_H, GRID_W, paintLine, starterGrid } from "../engine";

describe("yürüyen ayı", () => {
  it("yüzeyin bir üstünde durur", () => {
    const g = starterGrid();
    expect(standRow(g, 0)).toBe(GRID_H - 3);
    const tower = paintLine(g, 4, 0, 4, GRID_H - 1, 3);
    expect(standRow(tower, 4)).toBe(0);
  });

  it("kenarda döner, tavana kadar dolu sütuna ve çok yüksek duvara geçmez", () => {
    const g = starterGrid();
    expect(nextStep(g, GRID_W - 1, 1)).toEqual({ col: GRID_W - 2, dir: -1 });
    expect(nextStep(g, 0, -1)).toEqual({ col: 1, dir: 1 });

    const fullColumn = paintLine(g, 5, 0, 5, GRID_H - 1, 3);
    expect(canStep(fullColumn, 4, 5)).toBe(false);

    const top = GRID_H - 3; // yüzeyin üstü
    const okWall = paintLine(g, 6, top, 6, top - MAX_CLIMB + 1, 4);
    expect(canStep(okWall, 5, 6)).toBe(true);
    const highWall = paintLine(g, 6, top, 6, top - MAX_CLIMB, 4);
    expect(canStep(highWall, 5, 6)).toBe(false);
    expect(canStep(highWall, 6, 5)).toBe(true); // aşağı atlamak serbest
  });

  it("iki yanı kapalıysa durur", () => {
    let g = starterGrid();
    g = paintLine(g, 3, 0, 3, GRID_H - 1, 3);
    g = paintLine(g, 5, 0, 5, GRID_H - 1, 3);
    expect(nextStep(g, 4, 1)).toBeNull();
  });

  it("adım pozu uçlarda hücrelere oturur", () => {
    const g = starterGrid();
    expect(bearPoseAt(g, 2, 3, 0)).toEqual({ x: 2, y: GRID_H - 3 });
    const end = bearPoseAt(g, 2, 3, 1);
    expect(end.x).toBe(3);
    expect(end.y).toBeCloseTo(GRID_H - 3);
    expect(bearPoseAt(g, 2, 3, 0.5).y).toBeLessThan(GRID_H - 3); // sıçrama
  });
});
