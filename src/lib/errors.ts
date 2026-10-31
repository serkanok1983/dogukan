// STUB (C0) — owner: S8. Replace body, keep signature (docs/plan/CONTRACT.md §10.9).

export type ErrorEntry = { at: number; slug: string | null; message: string; ua: string; buildId: string };

export function recordError(slug: string | null, error: unknown): void {
  console.warn("[oyun hatası]", slug, error);
}

export function readErrors(): ErrorEntry[] {
  return [];
}
