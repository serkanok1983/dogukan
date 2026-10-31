import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("@/lib/speech", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/speech")>();
  return { ...actual, speak: vi.fn(), unlockAudio: vi.fn() };
});

import { generateStaticParams } from "@/app/ada/[world]/page";
import { IslandScreen } from "@/components/home/IslandScreen";
import { islandProgress, mostRecentSlug } from "@/components/home/mapData";
import { NameTheBear } from "@/components/home/NameTheBear";
import { WorldMap } from "@/components/home/WorldMap";
import { loginAs, logout } from "@/lib/auth";
import { _resetProgressForTests } from "@/lib/progress/store";
import { emptyProgress } from "@/lib/progress/time";
import type { ActivityStats } from "@/lib/progress/types";
import { DEFAULT_SETTINGS, getSettings, updateSettings } from "@/lib/settings";
import { speak } from "@/lib/speech";
import { activitiesInWorld, WORLDS } from "@/lib/worlds";

function stats(partial: Partial<ActivityStats>): ActivityStats {
  return {
    plays: 1,
    best: 0,
    bestLevel: 0,
    stars: 0,
    ease: 0.7,
    consecutiveLow: 0,
    seconds: 0,
    lastAt: 0,
    ...partial,
  };
}

function islandsNav() {
  return within(screen.getByRole("navigation", { name: "Adalar" }));
}

beforeEach(() => {
  logout();
  _resetProgressForTests();
  loginAs("dogukan");
  updateSettings({ ...DEFAULT_SETTINGS });
  push.mockClear();
  replace.mockClear();
  vi.mocked(speak).mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("WorldMap", () => {
  it("altı adayı gösterir; Baba ile kapalıyken gizlidir", () => {
    render(<WorldMap />);
    const nav = islandsNav();
    expect(nav.getAllByRole("listitem")).toHaveLength(6);
    for (const name of [
      "Macera Adası",
      "Harf Ormanı",
      "Sayı Dağı",
      "Şekil Köyü",
      "Merak Gölü",
      "Blok Dünyası",
    ]) {
      expect(nav.getByText(name)).toBeTruthy();
    }
    expect(nav.queryByText("Baba ile")).toBeNull();
  });

  it("babaIleEnabled açıkken Baba ile görünür ve aritmetik kapı açar", () => {
    updateSettings({ babaIleEnabled: true });
    render(<WorldMap />);
    const nav = islandsNav();
    expect(nav.getAllByRole("listitem")).toHaveLength(7);
    fireEvent.click(nav.getByText("Baba ile"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it("arama, sekme veya çıkış düğmesi yoktur", () => {
    render(<WorldMap />);
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.queryByText(/Çıkış/i)).toBeNull();
  });

  it("kutucuğa dokunmak etiketi söyler ve en geç 600 ms sonra gider", () => {
    vi.useFakeTimers();
    render(<WorldMap />);
    fireEvent.click(islandsNav().getByText("Harf Ormanı"));
    expect(vi.mocked(speak).mock.calls.at(-1)?.[0]).toBe("Harf Ormanı");
    expect(push).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(push).toHaveBeenCalledWith("/ada/harf/");
  });

  it("Devam kutucuğu varsayılan olarak Süper Ayı'ya gider", () => {
    render(<WorldMap />);
    const hero = within(screen.getByRole("region", { name: "Bugün" }));
    const link = hero.getByText(/Devam et/).closest("a");
    // next/link sondaki eğik çizgiyi build ayarına (trailingSlash) göre yazar; testte ayar yok.
    expect(link?.getAttribute("href")).toMatch(/^\/aktivite\/super-ayi\/?$/);
    expect(link?.textContent).toMatch(/Süper Ayı/);
  });
});

describe("harita verisi", () => {
  it("ada doluluğu = yıldız / (3 × görünür slug)", () => {
    const slugs = activitiesInWorld("sayi");
    const res = islandProgress(
      { [slugs[0]]: stats({ stars: 3 }), [slugs[1]]: stats({ stars: 1 }) },
      "sayi",
    );
    expect(res.stars).toBe(4);
    expect(res.fill).toBeCloseTo(4 / (3 * slugs.length));
  });

  it("Devam: görünür slug'lar arasında en son lastAt; gizli ve Baba ile hariç", () => {
    expect(mostRecentSlug({})).toBe("super-ayi");
    expect(
      mostRecentSlug({
        "sayma-oyunu": stats({ lastAt: 100 }),
        "cift-tek": stats({ lastAt: 500 }), // gizli
        asteroids: stats({ lastAt: 900 }), // baba
        tetris: stats({ lastAt: 200 }),
      }),
    ).toBe("tetris");
  });

  it("ada rotaları WORLDS'ten üretilir", () => {
    expect(generateStaticParams()).toEqual(WORLDS.map((w) => ({ world: w.id })));
  });
});

describe("IslandScreen", () => {
  it("adanın görünür etkinliklerini yıldızlarıyla listeler (sayfa başına ≤ 12)", () => {
    const p = emptyProgress("dogukan", Date.now());
    p.activities["sayma-oyunu"] = stats({ stars: 2 });
    _resetProgressForTests(p);
    render(<IslandScreen worldId="macera" />);
    const lists = screen.getAllByRole("list");
    const total = lists.reduce(
      (n, l) => n + within(l).getAllByRole("listitem").length,
      0,
    );
    expect(total).toBe(activitiesInWorld("macera").length);
    for (const l of lists)
      expect(within(l).getAllByRole("listitem").length).toBeLessThanOrEqual(12);
    cleanup();

    render(<IslandScreen worldId="sayi" />);
    expect(screen.getAllByLabelText("2 yıldız")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Harita/ }).getAttribute("href")).toBe(
      "/",
    );
  });

  it("Baba ile adası birlikte oyun olmadan kapıyla korunur", () => {
    updateSettings({ babaIleEnabled: true });
    render(<IslandScreen worldId="baba" />);
    expect(screen.queryByRole("list")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Babanı çağır/ }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});

describe("NameTheBear", () => {
  it("çip seçimi adı yazar, ilk açılışı bitirir ve tanışma günlerini ayarlar", () => {
    render(<NameTheBear />);
    expect(
      screen.getAllByRole("button", { name: /^(Bal|Pati|Fıstık|Kaptan)$/ }),
    ).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Kaptan" }));
    const s = getSettings();
    expect(s.companionName).toBe("Kaptan");
    expect(s.firstLaunchDone).toBe(true);
    expect(s.graceUntil).not.toBe("");
    expect(vi.mocked(speak).mock.calls[0]?.[0]).toBe("{ayı}! Ne güzel isim.");
  });

  it("Baban yazsın aritmetik kapının arkasındadır", () => {
    render(<NameTheBear />);
    fireEvent.click(screen.getByRole("button", { name: /Baban yazsın/ }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByLabelText("Ayının adı")).toBeNull();
  });
});
