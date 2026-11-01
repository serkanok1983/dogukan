import { act, cleanup, render } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const speech = vi.hoisted(() => ({ speak: vi.fn(), speaking: false }));
vi.mock("@/lib/speech", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/speech")>()),
  speak: speech.speak,
  isSpeaking: () => speech.speaking,
}));

import {
  CelebrationProvider,
  toastSpeech,
  useCelebration,
} from "@/components/CelebrationProvider";

function setup() {
  const box: { cel?: ReturnType<typeof useCelebration> } = {};
  function Probe() {
    const cel = useCelebration();
    useEffect(() => {
      box.cel = cel;
    });
    return null;
  }
  render(
    <CelebrationProvider>
      <Probe />
    </CelebrationProvider>,
  );
  return box;
}

describe("toast sesli okunur", () => {
  beforeEach(() => {
    speech.speak.mockClear();
    speech.speaking = false;
  });
  afterEach(() => {
    cleanup();
  });

  it("emoji okunmaz, metin konuşulur", () => {
    expect(toastSpeech("🌟 Yeni rekor! ⭐️")).toBe("Yeni rekor!");
    const box = setup();
    act(() => box.cel!.toast("🎉 Süper deneme!"));
    expect(speech.speak).toHaveBeenCalledWith("Süper deneme!");
  });

  it("süren bir konuşmayı (oyun yönergesi) kesmez", () => {
    const box = setup();
    speech.speaking = true;
    act(() => box.cel!.toast("Yeni rekor!"));
    expect(speech.speak).not.toHaveBeenCalled();
  });
});
