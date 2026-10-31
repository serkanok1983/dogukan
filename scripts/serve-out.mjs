#!/usr/bin/env node
/**
 * out/ için küçük statik sunucu (S8): GitHub Pages gibi `/dogukan/*` → `out/*`.
 * Playwright (`npm run e2e`) ve telefonda yerel deneme için.
 * Kullanım: node scripts/serve-out.mjs [--port 4173] [--base /dogukan]
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const outDir = path.join(root, "out");
const port = Number(arg("port", process.env.PORT ?? 4173));
const base = arg("base", process.env.NEXT_PUBLIC_BASE_PATH ?? "/dogukan").replace(
  /\/$/,
  "",
);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
};

function send(res, status, file, extraHeaders = {}) {
  res.writeHead(status, {
    "Content-Type":
      TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": file.endsWith("sw.js") ? "no-cache" : "max-age=600",
    ...extraHeaders,
  });
  fs.createReadStream(file).pipe(res);
}

if (!fs.existsSync(outDir)) {
  console.error("✖ out/ yok — önce `npm run build:pages`.");
  process.exit(1);
}

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (base && !url.pathname.startsWith(`${base}/`)) {
      if (url.pathname === base || url.pathname === "/")
        res.writeHead(302, { Location: `${base}/` }).end();
      else res.writeHead(404).end("404");
      return;
    }
    const relPath = decodeURIComponent(
      base ? url.pathname.slice(base.length) : url.pathname,
    );
    const file = path.normalize(path.join(outDir, relPath));
    if (!file.startsWith(outDir)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!url.pathname.endsWith("/")) {
        res.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
        return;
      }
      const index = path.join(file, "index.html");
      if (fs.existsSync(index)) return send(res, 200, index);
    } else if (fs.existsSync(file)) {
      return send(res, 200, file);
    }
    const notFound = path.join(outDir, "404.html");
    if (fs.existsSync(notFound)) return send(res, 404, notFound);
    res.writeHead(404).end("404");
  })
  .listen(port, () => {
    console.log(`out/ sunuluyor: http://localhost:${port}${base}/`);
  });
