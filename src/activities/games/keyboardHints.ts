/**
 * Klavye ipuçları ("Z/X saldır", "Boşluk fırlat") yalnız fare + klavyeli
 * cihazlarda anlamlıdır; dokunmatik telefonda gösterilmez. Render içinde değil,
 * efekt / döngü kurulurken çağrılır.
 */
export function prefersKeyboardHints(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}
