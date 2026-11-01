import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CapsuleFeed } from "@/components/kesfet/CapsuleFeed";
import { getEpisode, type CapsuleCard, type CapsuleEpisode } from "@/lib/capsules";

const mocks = vi.hoisted(() => ({
  speak: vi.fn((_text: string, opts?: { onEnd?: () => void }) => opts?.onEnd?.()),
  trackEvent: vi.fn(),
  notifyNaturalPause: vi.fn(),
  setClockContext: vi.fn(),
  requestCoplay: vi.fn(),
  blocking: false,
}));

vi.mock("@/lib/speech", () => ({
  speak: mocks.speak,
  cancelSpeech: vi.fn(),
  unlockAudio: vi.fn(),
}));
vi.mock("@/lib/progress/events", () => ({ trackEvent: mocks.trackEvent }));
vi.mock("@/hooks/useWellbeing", () => ({
  useWellbeing: () => ({ blocking: mocks.blocking }),
}));
vi.mock("@/lib/sessionClock", () => ({
  notifyNaturalPause: mocks.notifyNaturalPause,
  setClockContext: mocks.setClockContext,
  requestCoplay: mocks.requestCoplay,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const episode = getEpisode("isik-ve-golge") as CapsuleEpisode;

function cards(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>("section.cap-card"));
}

function nextButton(card: HTMLElement) {
  return within(card).queryByRole("button", { name: "Sonraki kart" });
}

/** Answers a card: the correct choice for `choose`, the first one otherwise. */
function answer(section: HTMLElement, card: CapsuleCard) {
  const view = within(section);
  if (card.tap.type === "listen") {
    fireEvent.click(view.getByRole("button", { name: /Söyledim/ }));
    return;
  }
  const choice =
    card.tap.choices?.find((c) => c.id === card.tap.answerId) ??
    card.tap.choices?.[0];
  fireEvent.click(
    view.getByRole("button", { name: new RegExp(choice?.label ?? "") }),
  );
}

beforeEach(() => {
  mocks.speak.mockClear();
  mocks.trackEvent.mockClear();
  mocks.notifyNaturalPause.mockClear();
  mocks.setClockContext.mockClear();
  mocks.requestCoplay.mockClear();
  mocks.blocking = false;
});

afterEach(cleanup);

describe("CapsuleFeed", () => {
  it("starts with one card, a 12-dot rail and a Başla tap; nothing speaks before it", () => {
    const { container } = render(<CapsuleFeed episode={episode} />);
    expect(cards(container)).toHaveLength(1);
    expect(container.querySelectorAll(".cap-rail li")).toHaveLength(12);
    expect(mocks.speak).not.toHaveBeenCalled();
    expect(mocks.setClockContext).toHaveBeenCalledWith({
      slug: null,
      kind: "capsule",
      running: true,
    });
    expect(nextButton(cards(container)[0] as HTMLElement)).toBeNull();
  });

  it("speaks on the Başla gesture and only reveals the next card after a tap", () => {
    const onStart = vi.fn();
    const { container, getByRole } = render(
      <CapsuleFeed episode={episode} onStart={onStart} />,
    );
    fireEvent.click(getByRole("button", { name: /Başla/ }));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(mocks.speak).toHaveBeenCalledWith(
      episode.cards[0]?.say,
      expect.anything(),
    );

    const first = cards(container)[0] as HTMLElement;
    expect(nextButton(first)).toBeNull();
    expect(cards(container)).toHaveLength(1);

    answer(first, episode.cards[0] as CapsuleCard);
    expect(cards(container)).toHaveLength(2);
    const next = nextButton(first);
    expect(next).not.toBeNull();

    fireEvent.click(next as HTMLElement);
    expect(mocks.notifyNaturalPause).toHaveBeenCalledWith("card_end");
    expect(mocks.speak).toHaveBeenCalledWith(
      episode.cards[1]?.say,
      expect.anything(),
    );
  });

  it("reads the prompt and the choice labels in order with a highlight; a tap skips", () => {
    const pending: (() => void)[] = [];
    mocks.speak.mockImplementation((_t: string, opts?: { onEnd?: () => void }) => {
      if (opts?.onEnd) pending.push(opts.onEnd);
    });
    try {
      const card = episode.cards[0] as CapsuleCard;
      const { container, getByRole } = render(<CapsuleFeed episode={episode} />);
      fireEvent.click(getByRole("button", { name: /Başla/ }));
      act(() => pending.shift()?.()); // card line ends → prompt
      expect(mocks.speak).toHaveBeenLastCalledWith(card.tap.prompt, expect.anything());
      act(() => pending.shift()?.()); // prompt ends → first label
      const first = card.tap.choices?.[0];
      expect(mocks.speak).toHaveBeenLastCalledWith(first?.label, expect.anything());
      expect(container.querySelector(".cap-choice.is-reading")?.textContent).toContain(
        first?.label,
      );
      act(() => pending.shift()?.());
      expect(mocks.speak).toHaveBeenLastCalledWith(
        card.tap.choices?.[1]?.label,
        expect.anything(),
      );

      const calls = mocks.speak.mock.calls.length;
      fireEvent.pointerDown(container.querySelector(".cap-say") as HTMLElement);
      expect(container.querySelector(".cap-choice.is-reading")).toBeNull();
      act(() => pending.shift()?.());
      expect(mocks.speak.mock.calls.length).toBe(calls);
    } finally {
      mocks.speak.mockImplementation((_t: string, opts?: { onEnd?: () => void }) =>
        opts?.onEnd?.(),
      );
    }
  });

  it("never reveals or speaks behind a wellbeing overlay; re-speaks the card once after", () => {
    const pending: (() => void)[] = [];
    mocks.speak.mockImplementation((_t: string, opts?: { onEnd?: () => void }) => {
      if (opts?.onEnd) pending.push(opts.onEnd);
    });
    try {
      const card = episode.cards[0] as CapsuleCard;
      const { container, getByRole, rerender } = render(<CapsuleFeed episode={episode} />);
      fireEvent.click(getByRole("button", { name: /Başla/ }));
      expect(mocks.speak).toHaveBeenCalledTimes(1);

      // The break overlay opens; the overlay's own voice cancels ours (onend fires).
      mocks.blocking = true;
      rerender(<CapsuleFeed episode={episode} />);
      act(() => pending.splice(0).forEach((f) => f()));
      expect(mocks.speak).toHaveBeenCalledTimes(1);
      expect(container.querySelector(".cap-choice")).toBeNull();

      // Overlay closes: the card's line is spoken once more, then the question.
      mocks.blocking = false;
      rerender(<CapsuleFeed episode={episode} />);
      expect(mocks.speak).toHaveBeenCalledTimes(2);
      expect(mocks.speak).toHaveBeenLastCalledWith(card.say, expect.anything());
      rerender(<CapsuleFeed episode={episode} />);
      expect(mocks.speak).toHaveBeenCalledTimes(2);
      act(() => pending.shift()?.());
      expect(container.querySelector(".cap-choice")).not.toBeNull();
    } finally {
      mocks.speak.mockImplementation((_t: string, opts?: { onEnd?: () => void }) =>
        opts?.onEnd?.(),
      );
    }
  });

  it("never advances by time alone", () => {
    vi.useFakeTimers();
    try {
      mocks.speak.mockImplementation(() => {}); // a TTS that never fires onend
      const { container, getByRole } = render(<CapsuleFeed episode={episode} />);
      fireEvent.click(getByRole("button", { name: /Başla/ }));
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      // The question appears (fallback), but nothing moves on without a tap.
      expect(
        within(cards(container)[0] as HTMLElement).getAllByRole("button", {
          pressed: false,
        }).length,
      ).toBeGreaterThan(0);
      expect(cards(container)).toHaveLength(1);
      expect(mocks.notifyNaturalPause).not.toHaveBeenCalled();
    } finally {
      mocks.speak.mockImplementation((_t: string, opts?: { onEnd?: () => void }) =>
        opts?.onEnd?.(),
      );
      vi.useRealTimers();
    }
  });

  it("says 'Birlikte bakalım' on a wrong pick and reveals the answer", () => {
    const { container, getByRole } = render(<CapsuleFeed episode={episode} />);
    fireEvent.click(getByRole("button", { name: /Başla/ }));
    // walk to the first `choose` card
    let index = 0;
    while (episode.cards[index]?.tap.type !== "choose") {
      const section = cards(container)[index] as HTMLElement;
      answer(section, episode.cards[index] as CapsuleCard);
      fireEvent.click(nextButton(section) as HTMLElement);
      index++;
    }
    const card = episode.cards[index] as CapsuleCard;
    const wrong = card.tap.choices?.find((c) => c.id !== card.tap.answerId);
    const section = cards(container)[index] as HTMLElement;
    fireEvent.click(
      within(section).getByRole("button", { name: new RegExp(wrong?.label ?? "") }),
    );

    expect(within(section).getByRole("status").textContent).toContain(
      "Birlikte bakalım",
    );
    expect(mocks.speak).toHaveBeenLastCalledWith(
      expect.stringContaining("Birlikte bakalım"),
    );
    expect(section.querySelector(".cap-choice.is-answer")?.textContent).toContain(
      card.tap.choices?.find((c) => c.id === card.tap.answerId)?.label,
    );
  });

  it("runs 12 cards, emits capsule_end on Bitti, and offers no next episode", () => {
    const { container, getByRole, queryByRole } = render(
      <CapsuleFeed episode={episode} />,
    );
    fireEvent.click(getByRole("button", { name: /Başla/ }));

    episode.cards.slice(0, 11).forEach((card, i) => {
      const section = cards(container)[i] as HTMLElement;
      answer(section, card);
      fireEvent.click(nextButton(section) as HTMLElement);
    });
    expect(cards(container)).toHaveLength(12);
    const mission = cards(container)[11] as HTMLElement;
    expect(nextButton(mission)).toBeNull();

    fireEvent.click(within(mission).getByRole("button", { name: /Babanı çağır/ }));
    expect(mocks.requestCoplay).toHaveBeenCalledTimes(1);
    expect(mocks.trackEvent).not.toHaveBeenCalled();

    fireEvent.click(within(mission).getByRole("button", { name: /Bitti/ }));
    expect(mocks.trackEvent).toHaveBeenCalledTimes(1);
    expect(mocks.trackEvent).toHaveBeenCalledWith({
      type: "capsule_end",
      topic: "isik-ve-golge",
    });
    expect(
      mocks.notifyNaturalPause.mock.calls.filter(([r]) => r === "card_end"),
    ).toHaveLength(11);
    expect(mocks.notifyNaturalPause).toHaveBeenCalledWith("episode_end");

    // End screen: only the map link, no 13th card, no next-episode control.
    expect(cards(container)).toHaveLength(0);
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute("href")).toBe("/");
    expect(links[0]?.textContent).toContain("Harita");
    expect(
      queryByRole("button", { name: /sonraki|devam|yeni bölüm|başla/i }),
    ).toBeNull();
  });
});
