import { assetPath } from "./asset";

const FILES = {
  hit: "hit.m4a",
  explode: "explode.m4a",
  laser: "laser.m4a",
  thrust: "thrust.m4a",
} as const;

type SoundName = keyof typeof FILES;

const cache: Partial<Record<SoundName, HTMLAudioElement>> = {};
const thrustLoop: { el: HTMLAudioElement | null } = { el: null };

function base(name: SoundName): HTMLAudioElement {
  if (!cache[name]) {
    const a = new Audio(assetPath(`/sounds/${FILES[name]}`));
    a.volume = name === "thrust" ? 0.35 : 0.55;
    cache[name] = a;
  }
  return cache[name]!;
}

function play(name: SoundName) {
  if (typeof window === "undefined") return;
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
    if (typeof window === "undefined") return;
    if (!thrustLoop.el) {
      thrustLoop.el = base("thrust");
      thrustLoop.el.loop = true;
    }
    void thrustLoop.el.play().catch(() => {});
  },
  thrustStop() {
    if (thrustLoop.el) {
      thrustLoop.el.pause();
      thrustLoop.el.currentTime = 0;
    }
  },
};
