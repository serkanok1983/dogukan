import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameSessionProvider } from "@/lib/gameSession";

const speech = vi.hoisted(() => ({ speak: vi.fn() }));
vi.mock("@/lib/speech", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/speech")>()),
  speak: speech.speak,
}));

import { DurGitGame } from "@/activities/shared/DurGitGame";

function Shell({ active }: { active: boolean }) {
  return (
    <GameSessionProvider active={active}>
      <DurGitGame />
    </GameSessionProvider>
  );
}

describe("Dur-Git: kabuğun tek Başla dokunuşuyla başlar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    speech.speak.mockClear();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("StartCard'ın altında ikinci bir Başla düğmesi yok; oturum aktif olunca oyun başlar", () => {
    const { rerender } = render(<Shell active={false} />);
    expect(screen.queryByRole("button", { name: /Başla/ })).toBeNull();
    expect(screen.queryByRole("group", { name: "Göl" })).toBeNull();

    rerender(<Shell active />);
    expect(screen.getByRole("group", { name: "Göl" })).toBeTruthy();
    expect(speech.speak).toHaveBeenCalledWith("Balıklara dokun. Köpekbalığına dokunma!");
  });

  it("bitiş ekranı ve 'Bir daha' yerinde yeniden başlatma korunur", () => {
    render(<Shell active />);
    act(() => {
      vi.advanceTimersByTime(46_000);
    });
    fireEvent.click(screen.getByRole("button", { name: /Bir daha/ }));
    expect(screen.getByRole("group", { name: "Göl" })).toBeTruthy();
  });

  it("duraklatılınca (aktif değil) süre işlemez", () => {
    const { rerender } = render(<Shell active />);
    rerender(<Shell active={false} />);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.queryByRole("button", { name: /Bir daha/ })).toBeNull();
    expect(screen.getByRole("group", { name: "Göl" })).toBeTruthy();
  });
});
