import { describe, expect, it } from "vitest";
import { blocksKey, readJSON, writeJSON } from "@/lib/storage";
import { encodeGrid, starterGrid } from "../engine";
import {
  SLOT_COUNT,
  THUMB_MAX_BYTES,
  defaultWorldName,
  deleteWorld,
  firstFreeSlot,
  getSave,
  listSaves,
  listSharedBuilds,
  saveWorld,
  type BlockSave,
} from "../storage";

const CELLS = encodeGrid(starterGrid());
const THUMB = "data:image/png;base64,iVBORw0KGgo=";

function make(index: number, extra: Partial<BlockSave> = {}): BlockSave {
  return {
    index,
    name: defaultWorldName(index),
    cells: CELLS,
    thumb: THUMB,
    savedAt: 1000 + index,
    ...extra,
  };
}

describe("blok kayıtları", () => {
  it("anahtar sözleşmedeki gibi ve oyuncuya özel", () => {
    saveWorld("dogukan", make(0));
    expect(readJSON<BlockSave[]>(blocksKey("dogukan"), [])).toHaveLength(1);
    expect(localStorage.getItem("dogukan-blocks-v1:dogukan")).not.toBeNull();
    expect(listSaves("serkan")).toEqual([]);
  });

  it("varsayılan adlar Dünyam 1..5", () => {
    expect(Array.from({ length: SLOT_COUNT }, (_, i) => defaultWorldName(i))).toEqual([
      "Dünyam 1",
      "Dünyam 2",
      "Dünyam 3",
      "Dünyam 4",
      "Dünyam 5",
    ]);
  });

  it("en fazla 5 yuva; aynı yuvaya yazmak üzerine yazar", () => {
    for (let i = 0; i < 8; i++) saveWorld("dogukan", make(i));
    let list = listSaves("dogukan");
    expect(list.map((s) => s.index)).toEqual([0, 1, 2, 3, 4]);
    expect(firstFreeSlot("dogukan")).toBeNull();

    list = saveWorld("dogukan", make(2, { name: "Kale", savedAt: 9999 }));
    expect(list).toHaveLength(5);
    expect(getSave("dogukan", 2)?.name).toBe("Kale");
  });

  it("geçersiz index yazılmaz; bozuk depo temizlenerek okunur", () => {
    expect(saveWorld("dogukan", make(7))).toEqual([]);
    expect(saveWorld("dogukan", make(-1))).toEqual([]);
    writeJSON(blocksKey("dogukan"), [
      make(0),
      null,
      { index: 1 },
      make(3, { name: "" }),
      make(3, { savedAt: 1 }),
      make(9),
      ...Array.from({ length: 12 }, () => make(4)),
    ]);
    const list = listSaves("dogukan");
    expect(list.map((s) => s.index)).toEqual([0, 3, 4]);
    expect(list[1].name).toBe("Dünyam 4");
    writeJSON(blocksKey("dogukan"), { not: "an array" });
    expect(listSaves("dogukan")).toEqual([]);
  });

  it("20 KB'tan büyük ya da görsel olmayan küçük resim atılır", () => {
    saveWorld("dogukan", make(0, { thumb: "data:image/png;base64," + "A".repeat(THUMB_MAX_BYTES) }));
    expect(getSave("dogukan", 0)?.thumb).toBe("");
    saveWorld("dogukan", make(1, { thumb: "javascript:alert(1)" }));
    expect(getSave("dogukan", 1)?.thumb).toBe("");
    saveWorld("dogukan", make(2));
    expect(getSave("dogukan", 2)?.thumb).toBe(THUMB);
  });

  it("listSharedBuilds yalnızca paylaşılanları, en yeni önce döndürür", () => {
    saveWorld("dogukan", make(0, { sharedAt: 2000 }));
    saveWorld("dogukan", make(1));
    saveWorld("dogukan", make(2, { sharedAt: 5000 }));
    saveWorld("dogukan", make(3, { sharedAt: 3000 }));
    expect(listSharedBuilds("dogukan").map((s) => s.index)).toEqual([2, 3, 0]);
    expect(listSharedBuilds("serkan")).toEqual([]);
  });

  it("deleteWorld yuvayı boşaltır", () => {
    saveWorld("dogukan", make(0));
    saveWorld("dogukan", make(1));
    expect(deleteWorld("dogukan", 0).map((s) => s.index)).toEqual([1]);
    expect(firstFreeSlot("dogukan")).toBe(0);
  });
});
