/** Public dosya yolu (GitHub Pages basePath ile uyumlu). */
export function assetPath(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_BASE_PATH ??
    (process.env.NODE_ENV === "production" ? "/dogukan" : "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
