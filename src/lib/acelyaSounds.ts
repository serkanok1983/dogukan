/**
 * Örnek sesler (`public/sounds/*.m4a`). Sahibi S4.
 *
 * Ses kilidi açılınca (sounds.unlock / dogukan:audio-unlock) dosyalar bir kez
 * AudioBuffer'a çözülür ve oyun döngüsünden bile güvenle çalınır (iOS her
 * HTMLAudio kopyasını reddediyordu). Çözme bitene kadar ya da WebAudio yoksa
 * eski HTMLAudio yoluna düşülür. Dışa açık API değişmedi.
 */
import { assetPath } from "./asset";
import { getMasterOutput, isSoundOn, onAudioUnlocked } from "./sounds";

const FILES = {
  hit: "hit.m4a",
  explode: "explode.m4a",
  laser: "laser.m4a",
  thrust: "thrust.m4a",
} as const;

type SoundName = keyof typeof FILES;

const VOLUME: Record<SoundName, number> = {
  hit: 0.55,
  explode: 0.55,
  laser: 0.55,
  thrust: 0.35,
};

const buffers: Partial<Record<SoundName, AudioBuffer>> = {};
let loading = false;

const cache: Partial<Record<SoundName, HTMLAudioElement>> = {};
const thrustLoop: {
  el: HTMLAudioElement | null;
  src: AudioBufferSourceNode | null;
} = { el: null, src: null };

function decode(ac: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    // Eski Safari yalnızca geri çağırmalı imzayı destekler.
    const p = ac.decodeAudioData(data, resolve, reject) as
      Promise<AudioBuffer> | undefined;
    p?.then(resolve, reject);
  });
}

function load(ac: AudioContext) {
  if (
    loading ||
    typeof fetch === "undefined" ||
    typeof ac.decodeAudioData !== "function"
  )
    return;
  loading = true;
  for (const name of Object.keys(FILES) as SoundName[]) {
    fetch(assetPath(`/sounds/${FILES[name]}`))
      .then((r) =>
        r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status))),
      )
      .then((data) => decode(ac, data))
      .then((buf) => {
        buffers[name] = buf;
      })
      .catch(() => {
        /* HTMLAudio yedeği kullanılmaya devam eder */
      });
  }
}

if (typeof window !== "undefined") {
  onAudioUnlocked(load);
}

function playBuffer(name: SoundName, loop = false): AudioBufferSourceNode | null {
  const buf = buffers[name];
  if (!buf) return null;
  const mo = getMasterOutput();
  if (!mo || mo.ac.state !== "running") return null;
  try {
    const src = mo.ac.createBufferSource();
    const g = mo.ac.createGain();
    src.buffer = buf;
    src.loop = loop;
    g.gain.value = VOLUME[name];
    src.connect(g);
    g.connect(mo.out);
    src.start();
    return src;
  } catch {
    return null;
  }
}

function base(name: SoundName): HTMLAudioElement {
  if (!cache[name]) {
    const a = new Audio(assetPath(`/sounds/${FILES[name]}`));
    a.volume = VOLUME[name];
    cache[name] = a;
  }
  return cache[name]!;
}

function play(name: SoundName) {
  if (typeof window === "undefined" || !isSoundOn()) return;
  if (playBuffer(name)) return;
  const s = base(name);
  const c = s.cloneNode() as HTMLAudioElement;
  c.volume = s.volume;
  void c.play().catch(() => {});
}

export const acelyaSounds = {
  play,
  hit: () => play("hit"),
  explode: () => play("explode"),
  laser: () => play("laser"),
  thrustStart() {
    if (typeof window === "undefined" || !isSoundOn()) return;
    if (thrustLoop.src || (thrustLoop.el && !thrustLoop.el.paused)) return;
    const src = playBuffer("thrust", true);
    if (src) {
      thrustLoop.src = src;
      return;
    }
    if (!thrustLoop.el) {
      thrustLoop.el = base("thrust");
      thrustLoop.el.loop = true;
    }
    void thrustLoop.el.play().catch(() => {});
  },
  thrustStop() {
    if (thrustLoop.src) {
      try {
        thrustLoop.src.stop();
      } catch {
        /* zaten durmuş */
      }
      thrustLoop.src = null;
    }
    if (thrustLoop.el) {
      thrustLoop.el.pause();
      thrustLoop.el.currentTime = 0;
    }
  },
};
