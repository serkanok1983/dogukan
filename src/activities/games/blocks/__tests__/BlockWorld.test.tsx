import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BlockWorld } from "../BlockWorld";
import { GRID_H, decodeGrid, getCell } from "../engine";
import { listSaves, listSharedBuilds } from "../storage";

function canvasEl(): HTMLCanvasElement {
  const c = document.querySelector("canvas.blk-canvas");
  if (!(c instanceof HTMLCanvasElement)) throw new Error("tuval yok");
  return c;
}

function stubRect(el: Element) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 360,
    bottom: 540,
    width: 360,
    height: 540,
    toJSON: () => ({}),
  } as DOMRect);
}

describe("BlockWorld", () => {
  beforeEach(() => {
    // jsdom'da 2d bağlamı yok; gerçek tarayıcıdaki "desteklenmiyor" yolunu taklit et.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    localStorage.setItem("dogukan-logged-in", "true");
    localStorage.setItem("dogukan-player", "dogukan");
  });
  afterEach(() => cleanup());

  it("dokun = koy, geri al, kaydet ve babaya göster", () => {
    render(<BlockWorld />);
    const canvas = canvasEl();
    stubRect(canvas);
    const undo = screen.getByRole("button", { name: "Geri al" });
    expect(undo).toHaveProperty("disabled", true);

    fireEvent.click(screen.getByRole("button", { name: "Bal" }));
    expect(
      screen.getByRole("button", { name: "Bal" }).getAttribute("aria-pressed"),
    ).toBe("true");

    // 360×540 tuvalde hücre 30 px: (15,15) → (0,0)
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 15, clientY: 15 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 105, clientY: 15 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 105, clientY: 15 });
    expect(undo).toHaveProperty("disabled", false);

    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
    let saves = listSaves("dogukan");
    expect(saves).toHaveLength(1);
    expect(saves[0].name).toBe("Dünyam 1");
    const grid = decodeGrid(saves[0].cells)!;
    expect([0, 1, 2, 3, 4].map((x) => getCell(grid, x, 0))).toEqual([8, 8, 8, 8, 0]);
    expect(getCell(grid, 0, GRID_H - 1)).toBe(2); // başlangıç zemini

    // Tek adımda geri alınır (sürükleme tek adım).
    fireEvent.click(undo);
    expect(undo).toHaveProperty("disabled", true);

    fireEvent.click(screen.getByRole("button", { name: /Babaya göster/ }));
    saves = listSaves("dogukan");
    expect(saves).toHaveLength(1);
    expect(listSharedBuilds("dogukan")).toHaveLength(1);
    expect(getCell(decodeGrid(saves[0].cells)!, 0, 0)).toBe(0);
  });

  it("çekmece: yeni dünya, yuvaya kaydet ve geri yükle", () => {
    render(<BlockWorld />);
    const canvas = canvasEl();
    stubRect(canvas);
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 45, clientY: 45 }); // (1,1)
    fireEvent.pointerUp(canvas, { pointerId: 1 });

    fireEvent.click(screen.getByRole("button", { name: "Dünyalarım" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Dünyam 3 yuvasına kaydet" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(listSaves("dogukan").map((s) => s.index)).toEqual([2]);

    fireEvent.click(screen.getByRole("button", { name: "Dünyalarım" }));
    fireEvent.click(screen.getByRole("button", { name: /Yeni dünya/ }));

    fireEvent.click(screen.getByRole("button", { name: "Dünyalarım" }));
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Dünyam 3 aç" }));
    });
    // Yüklenen dünyayı aynı yuvaya kaydedince içerik korunur.
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
    const saved = listSaves("dogukan");
    expect(saved).toHaveLength(1);
    expect(getCell(decodeGrid(saved[0].cells)!, 1, 1)).toBe(1);
  });
});
