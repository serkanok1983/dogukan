/**
 * Canvas `ctx.font` CSS değişkenlerini (`var(--font-nunito)`) çözemez; geçersiz
 * dize sessizce yok sayılır ve önceki yazı tipi kalır. Bu yardımcı, next/font'un
 * kök öğeye koyduğu değişkenleri gerçek aile adlarıyla değiştirir.
 */
const cache = new Map<string, string>();

function resolveVar(name: string): string {
  if (typeof document === "undefined") return "sans-serif";
  const hit = cache.get(name);
  if (hit) return hit;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (value) cache.set(name, value);
  return value || "sans-serif";
}

export function canvasFont(font: string): string {
  return font.replace(/var\((--[\w-]+)\)/g, (_, name: string) => resolveVar(name));
}
