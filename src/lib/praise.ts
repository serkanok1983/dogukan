// STUB (C0) — owner: S6. Replace body, keep signature (docs/plan/CONTRACT.md §10.2).
// Lines come from proposals/parent-wellbeing.md F8 (process praise, ≤ 7 words).

export type PraiseContext =
  | "correct_first"
  | "correct_retry"
  | "wrong_try_again"
  | "wrong_reveal"
  | "set_done_high"
  | "set_done_low"
  | "run_end"
  | "new_star"
  | "persisted"
  | "chose_hard"
  | "break_done"
  | "day_done";

const LINES: Record<PraiseContext, string> = {
  correct_first: "Dikkatle baktın!",
  correct_retry: "Bir daha denedin ve buldun!",
  wrong_try_again: "Henüz değil. Bir daha dinle.",
  wrong_reveal: "İşte bu. Şimdi biliyorsun.",
  set_done_high: "Altı soru, hepsi senin.",
  set_done_low: "Yanlışlar öğretir. Yarın yine.",
  run_end: "İyi oynadın. Ne öğrendin?",
  new_star: "Yeni yıldız! Sabrın kazandı.",
  persisted: "Üç kere denedin. Bu cesaret.",
  chose_hard: "Zor olanı seçtin. Süper.",
  break_done: "Gözlerin dinlendi. Hadi.",
  day_done: "Bugün çok şey yaptın. Yarın görüşürüz.",
};

export function praise(ctx: PraiseContext, opts?: { name?: string }): string {
  void opts;
  return LINES[ctx];
}
