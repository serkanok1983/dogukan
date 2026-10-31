/**
 * Hata güvenliği (S8, CONTRACT §13 S8 kabul 2): oyun içi çökme
 * "Oyun biraz yoruldu" kartını gösterir, kabuk ayakta kalır; hata halkası 20 kayıt tutar.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameErrorBoundary } from "@/components/game/GameErrorBoundary";
import { readErrors, recordError } from "@/lib/errors";
import { KEYS, writeJSON } from "@/lib/storage";

let shouldThrow = true;
function Boom(): React.ReactNode {
  if (shouldThrow) throw new Error("tuval patladı");
  return <p>oyun çalışıyor</p>;
}

vi.mock("@/activities/registry", () => ({
  ACTIVITY_MAP: { boom: Boom },
  getActivity: (slug: string) => (slug === "boom" ? Boom : null),
}));
vi.mock(import("@/lib/activityLog"), async (importOriginal) => ({
  ...(await importOriginal()),
  logDogukanVisit: vi.fn(),
}));
vi.mock("next/navigation", () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  };
  return {
    useRouter: () => router,
    usePathname: () => "/aktivite/boom/",
    useParams: () => ({ slug: "boom" }),
    useSearchParams: () => new URLSearchParams(),
  };
});

beforeEach(() => {
  shouldThrow = true;
  // React sınırın yakaladığı hatayı konsola yazar; test çıktısını kirletmesin.
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(cleanup);

describe("GameErrorBoundary", () => {
  it("çocuk çökünce kartı gösterir, hatayı halkaya yazar; Tekrar dene yeniden bağlar", () => {
    render(
      <GameErrorBoundary slug="boom">
        <Boom />
      </GameErrorBoundary>,
    );
    expect(screen.getByRole("alert").textContent).toContain("Oyun biraz yoruldu");
    expect(screen.getByRole("button", { name: /Tekrar dene/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Haritaya dön/ })).toBeTruthy();
    expect(screen.queryByText(/tuval patladı/)).toBeNull(); // mesaj çocuğa gösterilmez

    const [entry] = readErrors();
    expect(entry.slug).toBe("boom");
    expect(entry.message).toContain("tuval patladı");

    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: /Tekrar dene/ }));
    expect(screen.getByText("oyun çalışıyor")).toBeTruthy();
  });

  it("slug değişince kendiliğinden sıfırlanır", () => {
    const { rerender } = render(
      <GameErrorBoundary slug="boom">
        <Boom />
      </GameErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    shouldThrow = false;
    rerender(
      <GameErrorBoundary slug="baska">
        <Boom />
      </GameErrorBoundary>,
    );
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("oyun çalışıyor")).toBeTruthy();
  });
});

describe("ActivityClient", () => {
  it("oyun çökünce etkinlik sayfası (üst çubuk) ayakta kalır", async () => {
    const { ActivityClient } = await import("@/app/aktivite/[slug]/ActivityClient");
    const { getActivityLearning } = await import("@/lib/activityLearning");
    const learning = getActivityLearning("super-ayi");
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <ActivityClient slug="boom" title="Patlayan" learning={learning} />,
      ));
    });
    expect(container.querySelector(".activity-page")).not.toBeNull();
    expect(screen.getAllByText(/Oyun biraz yoruldu/).length).toBeGreaterThan(0);
    // Haritaya dönüş yolu (kart ya da kabuk) her zaman var.
    expect(container.querySelectorAll('a[href="/"]').length).toBeGreaterThan(0);
  });
});

describe("hata halkası", () => {
  it("en fazla 20 kayıt tutar, en yenisi sonda", () => {
    for (let i = 0; i < 25; i += 1) recordError(`s${i}`, new Error(`e${i}`));
    const list = readErrors();
    expect(list).toHaveLength(20);
    expect(list[0].slug).toBe("s5");
    expect(list[19].message).toBe("e24");
    expect(list[19]).toMatchObject({
      buildId: expect.any(String),
      ua: expect.any(String),
      at: expect.any(Number),
    });
  });

  it("uzun mesajı kırpar, hata olmayan değerleri de yazar", () => {
    recordError(null, "x".repeat(1000));
    recordError(null, { kod: 42 });
    const [a, b] = readErrors();
    expect(a.message.length).toBeLessThanOrEqual(300);
    expect(b.message).toContain("42");
  });

  it("bozuk depo değerinde boş liste döner", () => {
    writeJSON(KEYS.errors, { bozuk: true });
    expect(readErrors()).toEqual([]);
    writeJSON(KEYS.errors, [
      { at: 1, message: "ok", slug: null, ua: "", buildId: "dev" },
      5,
      null,
    ]);
    expect(readErrors()).toHaveLength(1);
  });
});
