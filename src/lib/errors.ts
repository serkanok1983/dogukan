/**
 * Hata halkası (CONTRACT §10.9). Son 20 hata `dogukan-errors` anahtarında
 * tutulur ve `/bilgi` Sağlık kartında gösterilir. Firebase yapılandırılmışsa
 * kayıt tembel olarak `errors/{player}` altına da yazılır; başarısızlık sessizdir.
 * Sahibi S8.
 */
import { getPlayerId } from "@/lib/auth";
import { isFirebaseConfigured } from "@/lib/firebaseConfig";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";

export type ErrorEntry = {
  at: number;
  slug: string | null;
  message: string;
  ua: string;
  buildId: string;
};

const MAX_ENTRIES = 20;
const MAX_MESSAGE = 300;
const MAX_UA = 160;

/** `npm run deploy` derlemeye kısa commit SHA'sını verir; yerelde "dev". */
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || "dev";

function describe(error: unknown): string {
  let text: string;
  if (error instanceof Error)
    text =
      error.name && error.name !== "Error"
        ? `${error.name}: ${error.message}`
        : error.message;
  else if (typeof error === "string") text = error;
  else {
    try {
      text = JSON.stringify(error) ?? String(error);
    } catch {
      text = String(error);
    }
  }
  return (text || "Bilinmeyen hata").slice(0, MAX_MESSAGE);
}

function isEntry(value: unknown): value is ErrorEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.at === "number" && typeof v.message === "string";
}

export function readErrors(): ErrorEntry[] {
  const list = readJSON<unknown>(KEYS.errors, []);
  return Array.isArray(list) ? list.filter(isEntry) : [];
}

async function sendRemote(entry: ErrorEntry): Promise<void> {
  try {
    const player = getPlayerId();
    if (!player || !isFirebaseConfigured()) return;
    const fb = await import("@/lib/firebase");
    await fb.pushValue(`errors/${player}`, entry);
  } catch {
    /* Hata kaydı asla ikinci bir hata üretmemeli. */
  }
}

export function recordError(slug: string | null, error: unknown): void {
  if (typeof window === "undefined") return;
  try {
    const entry: ErrorEntry = {
      at: Date.now(),
      slug,
      message: describe(error),
      ua: (typeof navigator !== "undefined" ? navigator.userAgent : "").slice(
        0,
        MAX_UA,
      ),
      buildId: BUILD_ID,
    };
    console.warn("[oyun hatası]", slug, error);
    writeJSON(KEYS.errors, [...readErrors(), entry].slice(-MAX_ENTRIES));
    void sendRemote(entry);
  } catch {
    /* yok say */
  }
}

/** Ebeveyn panelinden halkayı temizlemek için (S6 isteğe bağlı kullanır). */
export function clearErrors(): void {
  writeJSON(KEYS.errors, []);
}
