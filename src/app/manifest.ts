import type { MetadataRoute } from "next";

// `output: "export"` metadata rotalarının statik üretilmesini ister.
export const dynamic = "force-static";

/**
 * Web uygulama bildirimi → out/manifest.webmanifest (S8). Next <link> etiketine
 * basePath'i kendisi ekler ama gövdeye eklemez; bu yüzden yollar burada
 * öneklenir. Hesap next.config.ts ile aynıdır.
 */
function manifestBasePath(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_PATH ??
    (process.env.NODE_ENV === "production" ? "/dogukan" : "")
  );
}

export default function manifest(): MetadataRoute.Manifest {
  const base = manifestBasePath();
  return {
    id: `${base}/`,
    name: "Doğukan'ın Yeri",
    short_name: "Doğukan",
    description: "Okumayı, sayıları ve merakı oyunla büyüten çocuk uygulaması.",
    lang: "tr",
    dir: "ltr",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#74ebd5",
    theme_color: "#74ebd5",
    categories: ["education", "kids", "games"],
    icons: [
      {
        src: `${base}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${base}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${base}/icons/maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
