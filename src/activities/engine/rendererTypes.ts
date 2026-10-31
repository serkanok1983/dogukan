import type { Exercise } from "./types";

/** Bir maddenin aşaması: soru, ipucuyla tekrar, doğru, cevap gösterildi. */
export type ItemPhase = "ask" | "hint" | "correct" | "reveal";

/** Tüm göstericilerin (ChoiceCard, TapCount, OrderStrip, TraceCanvas) ortak prop'ları. */
export type RendererProps = {
  ex: Exercise;
  phase: ItemPhase;
  /** İpucunda söndürülen çeldirici id'leri. */
  faded: readonly string[];
  /** Bu maddede seçilmiş yanlış id'ler. */
  wrong: readonly string[];
  /** Cevap verilemez (doğru/cevap gösterildi aşaması). */
  disabled: boolean;
  /** Cevabı motora bildirir; motor doğru/yanlış kararını verir. */
  onAnswer: (ids: string[]) => void;
  /** Motorun konuşma kuyruğundan okutur (önceki zinciri keser). */
  say: (text: string, rate?: number) => void;
};
