import { afterEach, vi } from "vitest";

// jsdom'da olmayan tarayıcı API'leri: sessiz taklitler.
class FakeAudioContext {
  state = "running";
  currentTime = 0;
  destination = {};
  resume() {
    return Promise.resolve();
  }
  createOscillator() {
    return {
      connect() {},
      start() {},
      stop() {},
      type: "sine",
      frequency: { value: 0 },
    };
  }
  createGain() {
    return {
      connect() {},
      gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    };
  }
}
vi.stubGlobal("AudioContext", FakeAudioContext);

if (!("matchMedia" in window)) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
