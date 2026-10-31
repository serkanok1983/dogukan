/**
 * "Babaya göster" için isteğe bağlı Firebase yazımı (CONTRACT §0.9, §10.6).
 * Tembel içe aktarım, sessiz hata; çocuk akışı bunu asla beklemez.
 */
import type { PlayerId } from "@/lib/auth";
import type { BlockSave } from "./storage";

export async function sendToGallery(player: PlayerId, save: BlockSave): Promise<void> {
  try {
    const fb = await import("@/lib/firebase");
    if (!fb.isFirebaseConfigured()) return;
    const db = fb.getFirebaseDb();
    if (!db) return;
    const { ref, set } = await import("firebase/database");
    const payload: Record<string, string | number> = {
      index: save.index,
      name: save.name,
      cells: save.cells,
      thumb: save.thumb,
      savedAt: save.savedAt,
    };
    if (typeof save.sharedAt === "number") payload.sharedAt = save.sharedAt;
    await set(ref(db, `users/${player}/gallery/${save.index}`), payload);
  } catch {
    /* çevrimdışı, kurallar reddetti ya da yapılandırma yok: yerel galeri yeterli */
  }
}
