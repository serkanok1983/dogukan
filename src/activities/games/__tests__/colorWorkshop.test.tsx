import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameSessionProvider } from "@/lib/gameSession";

const speech = vi.hoisted(() => ({ speak: vi.fn() }));
vi.mock("@/lib/speech", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/speech")>()),
  speak: speech.speak,
}));

import { ColorWorkshop } from "../ColorWorkshop";

const ANSWERS = [
  "Yeşil",
  "Turuncu",
  "Mor",
  "Pembe",
  "Turkuaz",
  "Gri",
  "Kahverengi",
  "Altın Sarısı",
];

describe("Renk Atölyesi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    speech.speak.mockClear();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("ilk soruyu Başla'dan sonra sesli sorar; renk kutusuna dokununca rengin adını söyler", () => {
    render(
      <GameSessionProvider active>
        <ColorWorkshop />
      </GameSessionProvider>,
    );
    expect(speech.speak).toHaveBeenCalledWith(
      "Mavi ile sarı karışınca hangi renk olur?",
    );
    const swatch = screen
      .getAllByRole("button", { name: "Mavi" })
      .find((b) => b.className.includes("color-mix-swatch"));
    expect(swatch).toBeTruthy();
    if (!swatch) return;
    fireEvent.click(swatch);
    expect(speech.speak).toHaveBeenLastCalledWith("Mavi");
  });

  it("bitiş ekranı kişiyi övmez ('Ustası' yok)", () => {
    render(
      <GameSessionProvider active>
        <ColorWorkshop />
      </GameSessionProvider>,
    );
    for (const answer of ANSWERS) {
      const option = screen
        .getAllByRole("button", { name: answer })
        .find((b) => b.className.includes("color-mix-option"));
      expect(option).toBeTruthy();
      if (option) fireEvent.click(option);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }
    expect(screen.getByRole("button", { name: /Tekrar Oyna/ })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Ustası/);
  });
});
