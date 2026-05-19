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

function chord(notes: number[], gap = 70, dur = 0.1) {
  notes.forEach((f, i) => setTimeout(() => tone(f, dur), i * gap));
}

export const sounds = {
  tap: () => tone(520, 0.08),
  success: () => chord([523, 659, 784], 80, 0.12),
  wrong: () => tone(180, 0.25, "sawtooth", 0.08),
  pop: () => tone(880, 0.06, "triangle", 0.1),
  win: () => chord([523, 659, 784, 1047], 100, 0.16),
  star: () => {
    tone(988, 0.07);
    setTimeout(() => tone(1319, 0.12), 60);
  },
  coin: () => {
    tone(1047, 0.05, "sine", 0.1);
    setTimeout(() => tone(1319, 0.08, "sine", 0.09), 40);
  },
  shoot: () => tone(720, 0.06, "square", 0.08),
  jump: () => {
    tone(400, 0.06, "triangle", 0.1);
    setTimeout(() => tone(600, 0.08, "triangle", 0.1), 50);
  },
  spring: () => {
    tone(500, 0.05, "triangle", 0.12);
    setTimeout(() => tone(900, 0.1, "triangle", 0.1), 40);
    setTimeout(() => tone(1200, 0.08, "triangle", 0.08), 90);
  },
  explode: () => {
    tone(120, 0.2, "sawtooth", 0.1);
    setTimeout(() => tone(80, 0.25, "square", 0.08), 60);
  },
  boost: () => chord([440, 554, 659], 50, 0.07),
  gameOver: () => {
    tone(392, 0.15);
    setTimeout(() => tone(349, 0.2), 120);
    setTimeout(() => tone(294, 0.3, "sawtooth", 0.09), 260);
  },
  combo: (n: number) => {
    const base = 440 + Math.min(n, 8) * 40;
    tone(base, 0.08, "triangle", 0.1);
  },
  levelUp: () => chord([523, 659, 784, 988], 90, 0.14),
};
