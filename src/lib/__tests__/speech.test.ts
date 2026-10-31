import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateSettings } from "@/lib/settings";
import { cancelSpeech, isSpeaking, speak, splitForSpeech } from "@/lib/speech";

class FakeUtterance {
  text: string;
  lang = "";
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

function fakeSynth() {
  const queue: FakeUtterance[] = [];
  return {
    queue,
    speaking: false,
    paused: false,
    speak: vi.fn((u: FakeUtterance) => queue.push(u)),
    cancel: vi.fn(() => {
      // Gerçek tarayıcılar gibi: iptal edilen sözcelere hata olayı gönder.
      const all = queue.splice(0);
      for (const u of all) u.onerror?.();
    }),
    resume: vi.fn(),
    getVoices: () => [{ name: "Yelda", lang: "tr-TR" }],
    addEventListener: vi.fn(),
  };
}

let synth: ReturnType<typeof fakeSynth>;

beforeEach(() => {
  vi.useFakeTimers();
  synth = fakeSynth();
  vi.stubGlobal("speechSynthesis", synth);
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })),
  );
  updateSettings({ voiceOn: true });
});

afterEach(() => {
  cancelSpeech();
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("speak", () => {
  it("ses kapalıyken konuşmaz ama onEnd'i (eşzamansız) bir kez çağırır", () => {
    updateSettings({ voiceOn: false });
    const onEnd = vi.fn();
    speak("Merhaba", { onEnd });
    expect(onEnd).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it("doğal bitişte onEnd tam bir kez; geç gelen hata olayı tekrar çağırmaz", () => {
    const onEnd = vi.fn();
    speak("Kaç elma var?", { onEnd });
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(isSpeaking()).toBe(true);
    const u = synth.queue[0] as FakeUtterance;
    expect(u.lang).toBe("tr-TR");
    u.onend?.();
    u.onerror?.();
    vi.runAllTimers();
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(isSpeaking()).toBe(false);
  });

  it("kesen yeni speak öncekinin onEnd'ini bir kez çağırır", () => {
    const first = vi.fn();
    const second = vi.fn();
    speak("Bir", { onEnd: first });
    speak("İki", { onEnd: second });
    vi.advanceTimersByTime(1);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
    cancelSpeech();
    vi.runAllTimers();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("tarayıcı olay atmazsa bekçi zamanlayıcısı onEnd'i çağırır", () => {
    const onEnd = vi.fn();
    speak("Tarayıcı bu konuşmayı unutacak.", { onEnd });
    vi.advanceTimersByTime(60_000);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("konuşurken düzenli resume() çağrılır (Chrome 15 sn hatası)", () => {
    speak(
      "Bu uzun bir konuşma, çocuğa küçük bir hikâye anlatılıyor ve ses biraz sürüyor, sonra bitiyor.",
    );
    vi.advanceTimersByTime(11_000);
    expect(synth.resume.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("{ayı} şablonu doldurulur; uzun metin parçalara bölünür", () => {
    updateSettings({ companionName: "Pati" });
    speak("{ayı} seni bekliyor.");
    expect((synth.queue[0] as FakeUtterance).text).toBe("Pati seni bekliyor.");
    cancelSpeech();
    const long = Array.from(
      { length: 8 },
      (_, i) => `Bu ${i + 1}. cümle biraz uzunca olsun.`,
    ).join(" ");
    speak(long);
    expect(synth.queue.length).toBeGreaterThan(1);
    expect(synth.queue.every((u) => u.text.length <= 120)).toBe(true);
  });

  it("speechSynthesis yoksa onEnd yine çağrılır", () => {
    vi.stubGlobal("speechSynthesis", undefined);
    // `in window` denetimi için özelliği tamamen kaldır.
    delete (window as unknown as Record<string, unknown>).speechSynthesis;
    const onEnd = vi.fn();
    speak("Merhaba", { onEnd });
    vi.runAllTimers();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});

describe("splitForSpeech", () => {
  it("cümle sınırından böler, kısa metni tek parça bırakır", () => {
    expect(splitForSpeech("Kısa bir metin.")).toEqual(["Kısa bir metin."]);
    expect(splitForSpeech("Bir. İki. Üç.", 6)).toEqual(["Bir.", "İki.", "Üç."]);
    const parts = splitForSpeech("a ".repeat(200), 50);
    expect(parts.every((p) => p.length <= 50)).toBe(true);
  });
});
