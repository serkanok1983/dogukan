import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppOverlays } from "@/components/wellbeing/AppOverlays";
import { HoneyJar } from "@/components/wellbeing/HoneyJar";
import { loginAs, logout } from "@/lib/auth";
import { _resetProgressForTests, getProgress } from "@/lib/progress/store";
import { emptyDay, emptyProgress } from "@/lib/progress/time";
import type { DayUsage } from "@/lib/progress/types";
import { _resetClockForTests, setClockContext } from "@/lib/sessionClock";
import { DEFAULT_SETTINGS, updateSettings, type Settings } from "@/lib/settings";
import { speak } from "@/lib/speech";
import { WB_LINES } from "@/content/voice";

vi.mock("@/lib/speech", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/speech")>();
  return { ...actual, speak: vi.fn() };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const MON = "2026-11-02";
const at = (hhmm: string) => new Date(`${MON}T${hhmm}:00+03:00`).getTime();

function setup(time: number, today: Partial<DayUsage> = {}, settings: Partial<Settings> = {}) {
  vi.useFakeTimers({ shouldAdvanceTime: false });
  vi.setSystemTime(time);
  logout();
  _resetProgressForTests();
  loginAs("dogukan");
  const p = emptyProgress("dogukan", at("09:00"));
  p.days[MON] = { ...emptyDay(), ...today };
  _resetProgressForTests(p);
  _resetClockForTests();
  updateSettings({ ...DEFAULT_SETTINGS, graceUntil: "", firstBreakDone: true, ...settings });
}

afterEach(() => {
  cleanup();
  _resetClockForTests();
  vi.useRealTimers();
});

describe("AppOverlays", () => {
  it("gündüz, sınır uzakken hiçbir şey göstermez", () => {
    setup(at("10:00"));
    render(<AppOverlays />);
    act(() => setClockContext({ slug: null, kind: "map", running: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("gece: İyi geceler ekranı, yalnızca ebeveyn çarkı", () => {
    setup(at("21:00"));
    render(<AppOverlays />);
    act(() => setClockContext({ slug: null, kind: "map", running: true }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("İyi geceler Doğukan. Yarın görüşürüz.")).toBeTruthy();
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(["Ebeveyn"]);
    expect(getProgress().days[MON]?.bedtimeBlocks).toBe(1);
  });

  it("mola: halka breakSeconds kadar sürer, sonra Devam ▶ çıkar", () => {
    setup(at("10:00"), { sinceBreakSec: 25 * 60 }, { breakSeconds: 30, firstBreakDone: false });
    render(<AppOverlays />);
    act(() => setClockContext({ slug: null, kind: "map", running: true }));
    expect(screen.getByText(/Babanla birlikte!/)).toBeTruthy();
    expect(screen.queryByText("Devam ▶")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(29_000);
    });
    expect(screen.queryByText("Devam ▶")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    fireEvent.click(screen.getByText("Devam ▶"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(getProgress().days[MON]?.breaksTaken).toBe(1);
  });

  it("sınır: uyuyan ayı ekranı ve +10 dk yalnızca ebeveyn çarkının arkasında", () => {
    setup(at("10:00"), { totalSec: 30 * 60 });
    render(<AppOverlays />);
    act(() => setClockContext({ slug: null, kind: "map", running: true }));
    expect(screen.getByText("Bugünlük bu kadar! Bugün çok şey yaptın.")).toBeTruthy();
    expect(screen.queryByText("+10 dk")).toBeNull();
    expect(screen.getByText("📒 Çıkartmalarım")).toBeTruthy();
    expect(screen.getByLabelText("Babanı çağır")).toBeTruthy();
  });

  it("geri sayım rozeti −5 dk'da görünür", () => {
    setup(at("10:00"), { totalSec: 26 * 60 });
    render(<AppOverlays />);
    act(() => setClockContext({ slug: null, kind: "map", running: true }));
    expect(screen.getByLabelText("Beş dakika kaldı. Son oyununu seç.")).toBeTruthy();
  });
});

describe("HoneyJar", () => {
  it("kapasite kadar hücre çizer; 2 hücre kalınca sallanır", () => {
    setup(at("10:00"), { arcadeSec: 16 * 60 - 240 });
    const { container } = render(<HoneyJar />);
    expect(container.querySelectorAll(".wb-cell")).toHaveLength(13);
    expect(container.querySelectorAll(".wb-cell.is-full")).toHaveLength(2);
    expect(container.querySelector(".wb-jar-wobble")).not.toBeNull();
    expect(screen.getByLabelText("2 bal kaldı")).toBeTruthy();
  });

  it("tanışma gününde sallanmaz", () => {
    setup(at("10:00"), { arcadeSec: 16 * 60 - 240 }, { graceUntil: MON });
    const { container } = render(<HoneyJar size="sm" />);
    expect(container.querySelector(".wb-jar-wobble")).toBeNull();
    expect(container.querySelector(".wb-jar-sm")).not.toBeNull();
  });

  it("tanışma gününde −5 dk fazında da sallanmaz ve 'Bal azalıyor' denmez", () => {
    setup(
      at("10:00"),
      { arcadeSec: 16 * 60 - 240, totalSec: 26 * 60 },
      { graceUntil: MON },
    );
    const { container } = render(
      <>
        <HoneyJar />
        <AppOverlays />
      </>,
    );
    act(() => setClockContext({ slug: null, kind: "map", running: true }));
    expect(container.querySelector(".wb-jar-wobble")).toBeNull();
    expect(vi.mocked(speak).mock.calls.map((c) => c[0])).not.toContain(
      WB_LINES.honeyLow.say,
    );
  });
});
