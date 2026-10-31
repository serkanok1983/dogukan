#!/usr/bin/env node
/**
 * Derlemeden sonra out/sw-precache.json üretir (S8). public/sw.js kurulumda
 * bu listeyi önbelleğe alır. Liste ana sayfanın ve /offline/ sayfasının
 * doğrudan başvurduğu dosyalardır (JS/CSS parçaları, yazı tipleri, RSC .txt
 * yükleri) + bildirim ve ikonlar. Yollar BASE'e görelidir ("_next/...").
 *
 * Kullanım: node scripts/sw-manifest.mjs [--out out] [--base /dogukan]
 * `npm run check` ve `npm run deploy` derlemeden sonra çağırır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const outDir = path.resolve(root, arg("out", "out"));
const base = arg("base", process.env.NEXT_PUBLIC_BASE_PATH ?? "/dogukan").replace(/\/$/, "");

const PRECACHE_EXT = /\.(?:js|css|woff2?|png|jpe?g|webp|svg|ico|webmanifest|txt)$/i;
const PAGES = ["index.html", "offline/index.html"];
const ALWAYS = [
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "apple-icon.png",
];

function fail(message) {
  console.error(`✖ sw-manifest: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(outDir)) fail(`${path.relative(root, outDir)}/ yok — önce derleyin (npm run build:pages).`);

const files = new Set();

function addRef(ref) {
  if (!ref.startsWith(`${base}/`) || ref.startsWith("//")) return;
  const rel = ref.slice(base.length + 1);
  const [pathname] = rel.split(/[?#]/);
  if (!pathname || !PRECACHE_EXT.test(pathname)) return;
  if (!fs.existsSync(path.join(outDir, decodeURIComponent(pathname)))) return;
  files.add(rel);
}

for (const page of PAGES) {
  const file = path.join(outDir, page);
  if (!fs.existsSync(file)) fail(`${page} bulunamadı.`);
  const html = fs.readFileSync(file, "utf8");
  for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) addRef(m[1].replace(/&amp;/g, "&"));

  // Sayfanın RSC yükleri (istemci içi gezinme çevrimdışı da çalışsın).
  const dir = path.dirname(file);
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith(".txt")) files.add(path.relative(outDir, path.join(dir, name)).split(path.sep).join("/"));
  }
}

for (const rel of ALWAYS) {
  if (fs.existsSync(path.join(outDir, rel))) files.add(rel);
}

const avatarDir = path.join(outDir, "avatar");
if (fs.existsSync(avatarDir)) {
  for (const name of fs.readdirSync(avatarDir)) if (/\.webp$/i.test(name)) files.add(`avatar/${name}`);
}

// Kabuk (BASE ve offline/) sw.js içinde ayrıca alınır.
const list = [...files].filter((f) => f !== "index.html" && f !== "offline/index.html").sort();
const bytes = list.reduce((sum, rel) => sum + fs.statSync(path.join(outDir, decodeURIComponent(rel.split(/[?#]/)[0]))).size, 0);

fs.writeFileSync(
  path.join(outDir, "sw-precache.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), base: `${base}/`, files: list }, null, 2)}\n`,
);
console.log(`✓ sw-precache.json: ${list.length} dosya, ${(bytes / 1024).toFixed(1)} KB`);
