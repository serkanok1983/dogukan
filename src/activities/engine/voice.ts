/**
 * Motorun konuşma kuyruğu: birkaç satırı art arda okur. Yeni bir `say` ya da
 * `stop` önceki zinciri geçersiz kılar; geçersiz zincirin kalan satırları ve
 * `onDone`'ı çalışmaz. `speak` her satır için `onEnd`'i tam bir kez çağırır.
 * Bir satırın `onStart`'ı o satır okunmaya başlarken çağrılır (seçenek vurgusu).
 */
import { speak } from "@/lib/speech";

export type Line = {
  text: string;
  rate?: number;
  clip?: string;
  onStart?: () => void;
};
export type LineInput = Line | string | null | undefined | false;

export type VoiceQueue = {
  say(lines: LineInput[], onDone?: () => void): void;
  stop(): void;
};

function normalize(lines: LineInput[]): Line[] {
  const out: Line[] = [];
  for (const l of lines) {
    if (!l) continue;
    const line = typeof l === "string" ? { text: l } : l;
    if (line.text.trim()) out.push(line);
  }
  return out;
}

export function createVoiceQueue(): VoiceQueue {
  let epoch = 0;
  return {
    say(input, onDone) {
      const mine = ++epoch;
      const lines = normalize(input);
      const step = (i: number) => {
        if (mine !== epoch) return;
        const line = lines[i];
        if (!line) {
          onDone?.();
          return;
        }
        line.onStart?.();
        speak(line.text, {
          rate: line.rate,
          clip: line.clip,
          interrupt: i === 0,
          onEnd: () => step(i + 1),
        });
      };
      step(0);
    },
    stop() {
      epoch++;
    },
  };
}
