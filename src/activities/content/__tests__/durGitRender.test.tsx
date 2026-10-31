import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DurGit } from "@/activities/games/DurGit";

describe("DurGit bileşeni", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("başlar, 45 sn sonra sonuç ekranını gösterir ve yerinde yeniden başlar", () => {
    render(<DurGit />);
    fireEvent.click(screen.getByRole("button", { name: /Başla/ }));
    expect(screen.getByRole("group", { name: "Göl" })).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(46_000);
    });
    const again = screen.getByRole("button", { name: /Bir daha/ });
    fireEvent.click(again);
    expect(screen.getByRole("group", { name: "Göl" })).toBeTruthy();
  });
});
