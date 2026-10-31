import { describe, expect, it, vi } from "vitest";
import { starterGrid } from "../engine";
import { THUMB_SCALES, makeThumbnail, pickThumbnail } from "../render";
import { THUMB_MAX_BYTES } from "../storage";

describe("küçük resim bütçesi", () => {
  it("bütçeye sığan ilk (en büyük) boyu seçer", () => {
    const sizes: number[] = [];
    const url = pickThumbnail((s) => {
      sizes.push(s);
      // Hücre başına piksel büyüdükçe dosya büyür.
      return "data:image/png;base64," + "A".repeat(s * 4000);
    });
    expect(url.length).toBeLessThanOrEqual(THUMB_MAX_BYTES);
    expect(sizes[0]).toBe(THUMB_SCALES[0]);
    // 8 → 32 000, 6 → 24 000 bütçeyi aşar; 5 → 20 022 ≤ 20 480 sığar.
    expect(sizes).toEqual([8, 6, 5]);
    expect(url).toHaveLength("data:image/png;base64,".length + 5 * 4000);
  });

  it("hiçbiri sığmazsa ya da tuval yoksa boş dize", () => {
    expect(
      pickThumbnail(() => "data:image/png;base64," + "A".repeat(THUMB_MAX_BYTES)),
    ).toBe("");
    expect(pickThumbnail(() => null)).toBe("");
    expect(pickThumbnail(() => "data:,")).toBe("");
  });

  it("jsdom'da (2d bağlamı yok) çökmeden boş döner", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(makeThumbnail(starterGrid())).toBe("");
  });
});
