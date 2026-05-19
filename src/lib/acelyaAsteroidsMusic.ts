import { assetPath } from "./asset";

const MUSIC_ON = true;

/** Açelya asteroids.html — Music() sınıfı */
export function createAsteroidsMusic(fps: number) {
  const soundLow = new Audio(assetPath("/sounds/music-low.m4a"));
  const soundHigh = new Audio(assetPath("/sounds/music-high.m4a"));
  soundLow.volume = 0.45;
  soundHigh.volume = 0.45;

  let low = true;
  let tempo = 1.0;
  let beatTime = 0;

  const play = () => {
    if (!MUSIC_ON) return;
    const track = low ? soundLow : soundHigh;
    track.currentTime = 0;
    void track.play().catch(() => {});
    low = !low;
  };

  return {
    setAsteroidRatio(ratio: number) {
      tempo = 1.0 - 0.75 * (1.0 - ratio);
    },
    tick() {
      if (beatTime === 0) {
        play();
        beatTime = Math.ceil(tempo * fps);
      } else {
        beatTime--;
      }
    },
    stop() {
      soundLow.pause();
      soundHigh.pause();
      soundLow.currentTime = 0;
      soundHigh.currentTime = 0;
    },
  };
}
