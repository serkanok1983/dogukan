/**
 * WebAudio ses paleti (CONTRACT §8.2). Sahibi S4.
 *
 * - Tek AudioContext + ana GainNode (`setMasterGain`, akşam modu 0.5).
 * - `unlock()` bir dokunuşun içinde çağrılır (Başla, avatar): bağlamı oluşturur /
 *   sürdürür ve 1 örneklik sessiz bir tampon çalar (iOS kilidi). `dogukan:audio-unlock`
 *   olayına da bağlıdır. Arka plandan dönünce bir sonraki dokunuşta yeniden açılır.
 * - Akorlar `setTimeout` yerine `currentTime` üzerinden zamanlanır.
 * - Tüm sesler `settings.soundOn`'a uyar.
 */
import { getSettings } from "@/lib/settings";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let masterValue = 1;
let unlocked = false;
const unlockListeners = new Set<(ac: AudioContext) => void>();

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** Paylaşılan ana çıkış (acelyaSounds da buna bağlanır). */
export function getMasterOutput(): { ac: AudioContext; out: AudioNode } | null {
  const ac = getCtx();
  if (!ac) return null;
  if (!master) {
    try {
      master = ac.createGain();
      master.gain.value = masterValue;
      master.connect(ac.destination);
    } catch {
      master = null;
      return { ac, out: ac.destination };
    }
  }
  return { ac, out: master };
}

export function isSoundOn(): boolean {
  return getSettings().soundOn !== false;
}

function resumeIfNeeded(ac: AudioContext) {
  if (ac.state !== "running") {
    try {
      void ac.resume().catch(() => {});
    } catch {
      /* yok say */
    }
  }
}

/** Kilit açıldığında (ya da zaten açıksa hemen) çağrılır. */
export function onAudioUnlocked(cb: (ac: AudioContext) => void): () => void {
  unlockListeners.add(cb);
  if (unlocked && ctx) cb(ctx);
  return () => {
    unlockListeners.delete(cb);
  };
}

function unlock() {
  const mo = getMasterOutput();
  if (!mo) return;
  const { ac } = mo;
  resumeIfNeeded(ac);
  try {
    const buffer = ac.createBuffer(1, 1, 22050);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.connect(ac.destination);
    src.start(0);
  } catch {
    /* eski tarayıcı: resume yeterli */
  }
  const first = !unlocked;
  unlocked = true;
  if (first) {
    for (const cb of unlockListeners) {
      try {
        cb(ac);
      } catch {
        /* yok say */
      }
    }
  }
}

function setMasterGain(v: number) {
  masterValue = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 1));
  if (master && ctx) {
    try {
      master.gain.setValueAtTime(masterValue, ctx.currentTime);
    } catch {
      master.gain.value = masterValue;
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("dogukan:audio-unlock", unlock);
  // iOS arka plandan dönünce bağlamı "interrupted"/"suspended" bırakır;
  // yalnızca bir kullanıcı hareketi yeniden açabilir.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || !ctx || ctx.state === "running")
      return;
    const again = () => unlock();
    window.addEventListener("pointerdown", again, { once: true, capture: true });
  });
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.12,
  delay = 0,
) {
  if (!isSoundOn()) return;
  const mo = getMasterOutput();
  if (!mo) return;
  const { ac, out } = mo;
  resumeIfNeeded(ac);
  try {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(out);
    const t = ac.currentTime + delay;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration);
  } catch {
    /* ses çalınamadı: oyun etkilenmez */
  }
}

function chord(notes: number[], gap = 70, dur = 0.1) {
  notes.forEach((f, i) => tone(f, dur, "sine", 0.12, (i * gap) / 1000));
}

export const sounds = {
  tap: () => tone(520, 0.08),
  success: () => chord([523, 659, 784], 80, 0.12),
  wrong: () => tone(180, 0.25, "sawtooth", 0.08),
  pop: () => tone(880, 0.06, "triangle", 0.1),
  win: () => chord([523, 659, 784, 1047], 100, 0.16),
  star: () => {
    tone(988, 0.07);
    tone(1319, 0.12, "sine", 0.12, 0.06);
  },
  coin: () => {
    tone(1047, 0.05, "sine", 0.1);
    tone(1319, 0.08, "sine", 0.09, 0.04);
  },
  shoot: () => tone(720, 0.06, "square", 0.08),
  jump: () => {
    tone(400, 0.06, "triangle", 0.1);
    tone(600, 0.08, "triangle", 0.1, 0.05);
  },
  spring: () => {
    tone(500, 0.05, "triangle", 0.12);
    tone(900, 0.1, "triangle", 0.1, 0.04);
    tone(1200, 0.08, "triangle", 0.08, 0.09);
  },
  explode: () => {
    tone(120, 0.2, "sawtooth", 0.1);
    tone(80, 0.25, "square", 0.08, 0.06);
  },
  boost: () => chord([440, 554, 659], 50, 0.07),
  gameOver: () => {
    tone(392, 0.15);
    tone(349, 0.2, "sine", 0.12, 0.12);
    tone(294, 0.3, "sawtooth", 0.09, 0.26);
  },
  combo: (n: number) => {
    const base = 440 + Math.min(n, 8) * 40;
    tone(base, 0.08, "triangle", 0.1);
  },
  levelUp: () => chord([523, 659, 784, 988], 90, 0.14),
  /** Bir dokunuşun içinde çağrılır; AudioContext'i oluşturur/sürdürür ve kilidi açar. */
  unlock,
  /** 0–1. Akşam modu 0.5 kullanır. */
  setMasterGain,
  honey: () => {
    tone(330, 0.09, "sine", 0.12);
    tone(440, 0.12, "sine", 0.1, 0.08);
  },
  sticker: () => chord([659, 784, 988, 1319], 70, 0.1),
  countdown: () => tone(660, 0.12, "triangle", 0.12),
  /** Öğrenme yüzeylerinde yanlış cevap: yumuşak, vızıltısız. */
  softWrong: () => tone(220, 0.18, "triangle", 0.08),
};
