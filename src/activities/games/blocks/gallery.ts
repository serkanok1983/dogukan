/**
 * "Babaya göster" için isteğe bağlı Firebase yazımı (CONTRACT §0.9, §10.6).
 * Tembel içe aktarım, sessiz hata; çocuk akışı bunu asla beklemez.
 */
import type { PlayerId } from "@/lib/auth";
import { isFirebaseConfigured } from "@/lib/firebaseConfig";
import type { BlockSave } from "./storage";

export async function sendToGallery(
  player: PlayerId,
  save: BlockSave,
): Promise<void> {
  try {
    if (!isFirebaseConfigured()) return;
    const fb = await import("@/lib/firebase");
    // Kurallar `auth != null` ister: anonim oturum açılmadan yazılmaz.
    const db = await fb.getAuthedDb();
    if (!db) return;
    const payload: Record<string, string | number> = {
      index: save.index,
      name: save.name.slice(0, 40),
      cells: save.cells,
      thumb: save.thumb,
      savedAt: save.savedAt,
    };
    if (typeof save.sharedAt === "number") payload.sharedAt = save.sharedAt;
    await fb.set(fb.ref(db, `users/${player}/gallery/${save.index}`), payload);
  } catch {
    /* çevrimdışı, kurallar reddetti ya da yapılandırma yok: yerel galeri yeterli */
  }
}
