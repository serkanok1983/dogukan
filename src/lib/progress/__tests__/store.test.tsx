import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProgress } from "@/hooks/useProgress";
import { loginAs, logout } from "@/lib/auth";
import { onEvent, trackEvent } from "../events";
import { _readStoredForTests, _resetProgressForTests, flushProgress, getProgress, readProgressSnapshot } from "../store";
import type { Progress } from "../types";

beforeEach(() => {
  logout();
  _resetProgressForTests();
});

describe("store ve olay veriyolu", () => {
  it("oturum yokken trackEvent hiçbir şey yazmaz", () => {
    const cb = vi.fn();
    const off = onEvent("*", cb);
    trackEvent({ type: "app_open" });
    expect(cb).not.toHaveBeenCalled();
    expect(_readStoredForTests("dogukan")).toBeNull();
    off();
  });

  it("giriş sonrası olay uygulanır, dinleyiciye gider ve kalıcılaşır", () => {
    loginAs("dogukan");
    const cb = vi.fn();
    const off = onEvent("run_end", cb);
    const progressEvents = vi.fn();
    window.addEventListener("dogukan:progress", progressEvents);
    trackEvent({ type: "run_end", slug: "super-ayi", score: 60, durationMs: 1000 });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(progressEvents).toHaveBeenCalledTimes(1);
    expect(getProgress().activities["super-ayi"]?.stars).toBe(2);
    flushProgress();
    const stored = JSON.parse(_readStoredForTests("dogukan") ?? "null") as Progress;
    expect(stored.activities["super-ayi"]?.best).toBe(60);
    off();
    window.removeEventListener("dogukan:progress", progressEvents);
  });

  it("oyuncu değişince doğru veri yüklenir", () => {
    loginAs("dogukan");
    trackEvent({ type: "run_end", slug: "tetris", score: 5, durationMs: 1 });
    loginAs("serkan");
    expect(getProgress().player).toBe("serkan");
    expect(getProgress().activities.tetris).toBeUndefined();
    expect(readProgressSnapshot("dogukan").activities.tetris?.best).toBe(5);
  });

  it("eski ansiklopedi ilerlemesi konulara taşınır", () => {
    localStorage.setItem(
      "dogukan-merak-ansiklopedisi-v1",
      JSON.stringify({ miknatislar: { favorite: true, complete: true, lastVisited: "2026-09-01T10:00:00.000Z" } }),
    );
    loginAs("dogukan");
    expect(getProgress().topics.miknatislar).toMatchObject({ favorite: true, complete: true, capsuleDone: false });
  });

  it("bozuk depolama verisi depoyu çökertmez", () => {
    localStorage.setItem("dogukan-progress-v1:dogukan", "{bozuk");
    loginAs("dogukan");
    expect(getProgress().v).toBe(1);
  });
});

describe("useProgress", () => {
  it("yalnızca seçilen değer değişince yeniden çizer", () => {
    loginAs("dogukan");
    let renders = 0;
    const selectTetris = (p: Progress) => p.activities.tetris?.best ?? 0;
    function Probe() {
      renders += 1;
      const best = useProgress(selectTetris);
      return <span data-testid="best">{best}</span>;
    }
    const { getByTestId } = render(<Probe />);
    const initial = renders;
    act(() => {
      trackEvent({ type: "run_end", slug: "super-ayi", score: 10, durationMs: 1 });
    });
    expect(renders).toBe(initial);
    act(() => {
      trackEvent({ type: "run_end", slug: "tetris", score: 7, durationMs: 1 });
    });
    expect(getByTestId("best").textContent).toBe("7");
    expect(renders).toBe(initial + 1);
  });
});
