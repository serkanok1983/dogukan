let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.12) {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ac.destination);
  const t = ac.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration);
}

export const sounds = {
  tap: () => tone(520, 0.08),
  success: () => {
    tone(523, 0.1);
    setTimeout(() => tone(659, 0.1), 80);
    setTimeout(() => tone(784, 0.15), 160);
  },
  wrong: () => tone(180, 0.25, "sawtooth", 0.08),
  pop: () => tone(880, 0.06, "triangle", 0.1),
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18), i * 100));
  },
  star: () => {
    tone(988, 0.07);
    setTimeout(() => tone(1319, 0.12), 60);
  },
};
