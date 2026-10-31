import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
}));

vi.mock("@/lib/speech", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/speech")>();
  return { ...actual, speak: vi.fn(), unlockAudio: vi.fn() };
});

import { ArithmeticGate, ParentGate } from "@/components/auth/ParentGate";
import { WhoIsPlaying } from "@/components/auth/WhoIsPlaying";
import { isParentMode, logout } from "@/lib/auth";
import { speak, unlockAudio } from "@/lib/speech";

afterEach(() => {
  cleanup();
  vi.mocked(speak).mockClear();
  vi.mocked(unlockAudio).mockClear();
});

function typeDigits(digits: string) {
  for (const d of digits) fireEvent.click(screen.getByRole("button", { name: d }));
}

describe("ArithmeticGate", () => {
  beforeEach(() => {
    // a = b = 11 → 22
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  it("toplananlar 11..49 aralığında", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    render(<ArithmeticGate onPass={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/49 \+ 49 =/)).toBeTruthy();
  });

  it("yanlış cevap geçirmez, yeni soru sorar", () => {
    const onPass = vi.fn();
    render(<ArithmeticGate onPass={onPass} onCancel={vi.fn()} />);
    expect(screen.getByText(/11 \+ 11 =/)).toBeTruthy();
    typeDigits("21");
    fireEvent.click(screen.getByRole("button", { name: "Tamam" }));
    expect(onPass).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/Olmadı/);
    expect(screen.getByLabelText("Cevap").textContent).toBe("?");
  });

  it("doğru cevap geçirir", () => {
    const onPass = vi.fn();
    render(<ArithmeticGate onPass={onPass} onCancel={vi.fn()} />);
    typeDigits("23");
    fireEvent.click(screen.getByRole("button", { name: "Sil" }));
    typeDigits("2");
    fireEvent.click(screen.getByRole("button", { name: "Tamam" }));
    expect(onPass).toHaveBeenCalledTimes(1);
  });

  it("Vazgeç ve Escape iptal eder", () => {
    const onCancel = vi.fn();
    render(<ArithmeticGate onPass={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Vazgeç" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});

describe("ParentGate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("PIN ayarlı değilse aritmetikten sonra geçer ve ebeveyn moduna girer", () => {
    vi.stubEnv("NEXT_PUBLIC_PARENT_PIN_HASH", "");
    vi.spyOn(Math, "random").mockReturnValue(0);
    const onPass = vi.fn();
    render(<ParentGate onPass={onPass} onCancel={vi.fn()} />);
    typeDigits("22");
    fireEvent.click(screen.getByRole("button", { name: "Tamam" }));
    expect(onPass).toHaveBeenCalledTimes(1);
    expect(isParentMode()).toBe(true);
  });

  it("PIN ayarlıysa aritmetikten sonra PIN ister", () => {
    vi.stubEnv("NEXT_PUBLIC_PARENT_PIN_HASH", "a".repeat(64));
    vi.spyOn(Math, "random").mockReturnValue(0);
    const onPass = vi.fn();
    render(<ParentGate onPass={onPass} onCancel={vi.fn()} />);
    typeDigits("22");
    fireEvent.click(screen.getByRole("button", { name: "Tamam" }));
    expect(onPass).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Ebeveyn PIN'i" })).toBeTruthy();
  });
});

describe("WhoIsPlaying", () => {
  beforeEach(() => {
    logout();
  });

  it("fotoğrafa dokunmak Doğukan olarak kalıcı oturum açar ve sesi açar", () => {
    render(<WhoIsPlaying />);
    expect(screen.getByRole("heading", { name: "Kim oynuyor?" })).toBeTruthy();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Doğukan" }));
    });
    expect(localStorage.getItem("dogukan-logged-in")).toBe("true");
    expect(localStorage.getItem("dogukan-player")).toBe("dogukan");
    expect(sessionStorage.getItem("dogukan-player")).toBe("dogukan");
    expect(unlockAudio).toHaveBeenCalled();
    expect(vi.mocked(speak).mock.calls[0]?.[0]).toMatch(/^Hoş geldin \{ad\}!/);
  });

  it("Anne-Baba köşesi ebeveyn kapısını açar", () => {
    render(<WhoIsPlaying />);
    fireEvent.click(screen.getByRole("button", { name: /Anne-Baba/ }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(localStorage.getItem("dogukan-player")).toBeNull();
  });
});
