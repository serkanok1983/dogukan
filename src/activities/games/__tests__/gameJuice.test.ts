import { afterEach, describe, expect, it } from "vitest";
import { createGameJuice, POP_FONT } from "@/lib/gameJuice";
import { fakeContext2d } from "./canvasStub";

describe("gameJuice skor baloncukları", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("--font-nunito");
  });

  it("ctx.font'a çözülmemiş CSS değişkeni yazmaz (canvasFont)", () => {
    expect(POP_FONT).toContain("var(--font-nunito)");
    const { ctx, fonts } = fakeContext2d();
    const fx = createGameJuice();
    fx.popScore(10, 10, "+10");
    fx.draw(ctx, 100, 100);
    expect(fonts.length).toBeGreaterThan(0);
    for (const f of fonts) {
      expect(f).not.toContain("var(");
      expect(f.startsWith("bold 18px ")).toBe(true);
    }
  });
});
