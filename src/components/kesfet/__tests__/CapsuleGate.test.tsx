import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CapsuleGate } from "@/components/kesfet/CapsuleGate";
import { loginAs, logout } from "@/lib/auth";
import { getEpisode, type CapsuleEpisode } from "@/lib/capsules";
import { trackEvent } from "@/lib/progress/events";
import { _resetProgressForTests, getProgress } from "@/lib/progress/store";
import { dayKey } from "@/lib/progress/time";

vi.mock("@/lib/speech", () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
  unlockAudio: vi.fn(),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const episode = getEpisode("kalbim-ve-nefesim") as CapsuleEpisode;

beforeEach(() => {
  // Reset first: logout() persists the in-memory state of the previous test.
  _resetProgressForTests();
  logout();
  localStorage.clear();
});

afterEach(cleanup);

describe("CapsuleGate", () => {
  it("shows the feed while episodes remain today", () => {
    loginAs("dogukan");
    const { getByRole, queryByText } = render(<CapsuleGate episode={episode} />);
    expect(getByRole("button", { name: /Başla/ })).toBeTruthy();
    expect(queryByText("Yarın yeni bölüm")).toBeNull();
  });

  it("shows 'Yarın yeni bölüm' with the preview for a third episode the same day", () => {
    loginAs("dogukan");
    trackEvent({ type: "capsule_end", topic: "isik-ve-golge" });
    trackEvent({ type: "capsule_end", topic: "kalbim-ve-nefesim" });
    expect(getProgress().days[dayKey()]?.episodesDone).toBe(2);

    const { getByText, queryByRole, container } = render(
      <CapsuleGate episode={episode} />,
    );
    expect(getByText("Yarın yeni bölüm")).toBeTruthy();
    expect(container.textContent).toContain(episode.previewEmoji);
    expect(queryByRole("button", { name: /Başla/ })).toBeNull();
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/");
  });

  it("keeps a started episode on screen when the cap is reached mid-way", () => {
    loginAs("dogukan");
    trackEvent({ type: "capsule_end", topic: "isik-ve-golge" });
    const { getByRole, queryByText } = render(<CapsuleGate episode={episode} />);
    fireEvent.click(getByRole("button", { name: /Başla/ }));
    act(() => {
      trackEvent({ type: "capsule_end", topic: "kalbim-ve-nefesim" });
    });
    expect(queryByText("Yarın yeni bölüm")).toBeNull();
  });

  it("sends a logged-out visitor to the map", () => {
    const { getByText, queryByRole } = render(<CapsuleGate episode={episode} />);
    expect(getByText("Haritaya git")).toBeTruthy();
    expect(queryByRole("button", { name: /Başla/ })).toBeNull();
  });
});
