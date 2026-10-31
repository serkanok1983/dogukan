import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BilgiPage from "@/app/bilgi/page";
import { enterParentMode, exitParentMode, logout } from "@/lib/auth";
import { _resetProgressForTests } from "@/lib/progress/store";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/bilgi/",
  useRouter: () => ({ push: vi.fn(), replace }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/auth/ParentGate", () => ({
  ParentGate: ({ onCancel }: { onPass: () => void; onCancel: () => void }) => (
    <div data-testid="parent-gate">
      <button type="button" onClick={onCancel}>
        Vazgeç
      </button>
    </div>
  ),
  ArithmeticGate: () => null,
  PinGate: () => null,
}));

beforeEach(() => {
  logout();
  exitParentMode();
  _resetProgressForTests();
  replace.mockClear();
});

afterEach(() => {
  cleanup();
  exitParentMode();
});

describe("/bilgi", () => {
  it("ebeveyn modu yokken yalnızca ParentGate gösterir, veri göstermez", () => {
    render(<BilgiPage />);
    expect(screen.getByTestId("parent-gate")).toBeTruthy();
    expect(screen.queryByText("Ebeveyn paneli")).toBeNull();
    act(() => screen.getByText("Vazgeç").click());
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("kapı geçilince kartlar sırasıyla gelir ve her Settings alanı düzenlenebilir", () => {
    enterParentMode();
    const { container } = render(<BilgiPage />);
    expect(screen.queryByTestId("parent-gate")).toBeNull();
    expect(screen.getByText("Ebeveyn paneli")).toBeTruthy();

    const order = [...container.querySelectorAll("section.parent-card")].map((s) => s.id);
    expect(order).toEqual(["bugun", "hafta", "beceriler", "birlikte", "ne-oynadi", "galeri", "ayarlar", "saglik", "tum-etkinlikler"]);

    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      expect(container.querySelector(`[data-field="${key}"]`), key).not.toBeNull();
    }
    expect(screen.getByText(/Öğrenme payı|Bu hafta henüz oynanmadı/)).toBeTruthy();
    expect(screen.getByText("👨 Baba olarak oyna")).toBeTruthy();
    expect(screen.getByText("🚪 Çıkış")).toBeTruthy();
  });

  it("Tüm etkinlikler listesi her slug'ı /aktivite/<slug>/ olarak bağlar", () => {
    enterParentMode();
    const { container } = render(<BilgiPage />);
    const links = [...container.querySelectorAll("#tum-etkinlikler a")].map((a) => a.getAttribute("href"));
    expect(links.length).toBeGreaterThanOrEqual(73);
    expect(new Set(links).size).toBe(links.length);
    for (const href of links) expect(href).toMatch(/^\/aktivite\/[a-z0-9-]+\/$/);
    expect(links).toContain("/aktivite/dur-git/");
  });
});
