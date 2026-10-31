#!/usr/bin/env node
/**
 * out/ denetimi (S8, MASTER_PLAN §4.8). `npm run check` derlemeden sonra çalıştırır.
 *
 * Sert hatalar (çıkış kodu 1):
 *   - manifest.webmanifest yok, bozuk ya da yolları basePath'siz; ikon dosyası eksik
 *   - ana sayfada <link rel="manifest"> veya apple-touch-icon yok
 *   - sw.js, offline/ ya da 404.html yok
 *   - 73'ten az /aktivite/<slug>/ sayfası
 *   - out/bilgi/ dışındaki herhangi bir HTML'de href="http…", href="//…" ya da target=
 * Uyarılar (şimdilik engellemez; paketler tamamlanınca sertleşir):
 *   - bütçeler: / için JS ≤ 250 KB, CSS ≤ 25 KB (gzip; aşılırsa hata)
 *   - ansiklopedi CSS'i / sayfasına sızmış
 *   - Firebase SDK, yapılandırılmamışken / başlangıç parçalarında
 *
 * Kullanım: node scripts/verify-out.mjs [--out out] [--base /dogukan]
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const outDir = path.resolve(root, arg("out", "out"));
const base = arg("base", process.env.NEXT_PUBLIC_BASE_PATH ?? "/dogukan").replace(
  /\/$/,
  "",
);
// Gzip boyutu: ham boyutun ~500 KB'ı React + Next istemcisidir ve küçültülemez;
// bütçe uygulama kodundaki büyümeyi yakalamak içindir (MASTER_PLAN §4.8).
const BUDGET_JS = 250 * 1024;
const BUDGET_CSS = 25 * 1024;
const MIN_ACTIVITIES = 73;

const errors = [];
const warnings = [];
const rel = (p) => path.relative(root, p).split(path.sep).join("/");
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

if (!fs.existsSync(outDir)) {
  console.error(`✖ ${rel(outDir)}/ yok — önce derleyin (npm run build:pages).`);
  process.exit(1);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** "/dogukan/_next/x.js?v" → out/_next/x.js (yoksa null). */
function fileForRef(ref) {
  if (!ref.startsWith(`${base}/`)) return null;
  const pathname = decodeURIComponent(ref.slice(base.length + 1).split(/[?#]/)[0]);
  const file = path.join(outDir, pathname);
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

// ---- 1. Bildirim ve ikonlar ----
const manifestFile = path.join(outDir, "manifest.webmanifest");
if (!fs.existsSync(manifestFile)) {
  errors.push("manifest.webmanifest yok (src/app/manifest.ts derlenmedi mi?).");
} else {
  try {
    const m = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    for (const key of ["start_url", "scope", "id"]) {
      if (m[key] !== `${base}/`)
        errors.push(
          `manifest.${key} = ${JSON.stringify(m[key])}, beklenen "${base}/".`,
        );
    }
    if (!Array.isArray(m.icons) || m.icons.length === 0)
      errors.push("manifest.icons boş.");
    for (const icon of m.icons ?? []) {
      if (!String(icon.src).startsWith(`${base}/`))
        errors.push(`manifest ikon yolu basePath'siz: ${icon.src}`);
      else if (!fileForRef(icon.src))
        errors.push(`manifest ikonu out/ içinde yok: ${icon.src}`);
    }
    if (!(m.icons ?? []).some((i) => String(i.purpose ?? "").includes("maskable"))) {
      errors.push("maskable ikon yok.");
    }
  } catch (e) {
    errors.push(`manifest.webmanifest okunamadı: ${e.message}`);
  }
}

const indexFile = path.join(outDir, "index.html");
const indexHtml = fs.existsSync(indexFile) ? fs.readFileSync(indexFile, "utf8") : "";
if (!indexHtml) errors.push("index.html yok.");
if (indexHtml && !/<link[^>]+rel="manifest"[^>]*>/.test(indexHtml))
  errors.push('index.html: <link rel="manifest"> yok.');
const appleIcon =
  indexHtml.match(/<link[^>]+rel="apple-touch-icon"[^>]*href="([^"]+)"/)?.[1] ??
  indexHtml.match(/<link[^>]+href="([^"]+)"[^>]*rel="apple-touch-icon"/)?.[1];
if (indexHtml && !appleIcon)
  errors.push("index.html: apple-touch-icon yok (src/app/apple-icon.png).");
else if (appleIcon && !fileForRef(appleIcon.replace(/&amp;/g, "&")))
  errors.push(`apple-touch-icon dosyası yok: ${appleIcon}`);

// ---- 2. Service worker, çevrimdışı ve 404 ----
const swFile = path.join(outDir, "sw.js");
if (!fs.existsSync(swFile)) errors.push("sw.js yok (public/sw.js).");
if (!fs.existsSync(path.join(outDir, "offline", "index.html")))
  errors.push("offline/index.html yok (src/app/offline/page.tsx).");
if (!fs.existsSync(path.join(outDir, "404.html")))
  errors.push("404.html yok (src/app/not-found.tsx).");
const precacheFile = path.join(outDir, "sw-precache.json");
if (fs.existsSync(precacheFile)) {
  try {
    const { files } = JSON.parse(fs.readFileSync(precacheFile, "utf8"));
    const missing = files.filter((f) => !fileForRef(`${base}/${f}`));
    if (missing.length)
      errors.push(
        `sw-precache.json'da out/ içinde olmayan dosyalar: ${missing.slice(0, 5).join(", ")}`,
      );
  } catch (e) {
    errors.push(`sw-precache.json okunamadı: ${e.message}`);
  }
} else {
  warnings.push(
    "sw-precache.json yok — `node scripts/sw-manifest.mjs` çalıştırın (check ve deploy bunu yapar).",
  );
}

// ---- 3. Etkinlik sayfaları ----
const activityDir = path.join(outDir, "aktivite");
const activityPages = fs.existsSync(activityDir)
  ? fs
      .readdirSync(activityDir)
      .filter((d) => fs.existsSync(path.join(activityDir, d, "index.html")))
  : [];
if (activityPages.length < MIN_ACTIVITIES) {
  errors.push(
    `yalnızca ${activityPages.length} etkinlik sayfası var; en az ${MIN_ACTIVITIES} bekleniyor (CONTRACT §0.4).`,
  );
}

// ---- 4. Dış bağlantı yok (out/bilgi/ hariç) ----
const htmlFiles = walk(outDir).filter((f) => f.endsWith(".html"));
const bilgiDir = path.join(outDir, "bilgi") + path.sep;
const offenders = [];
for (const file of htmlFiles) {
  if (file.startsWith(bilgiDir)) continue;
  const html = fs.readFileSync(file, "utf8");
  const hits = [
    ...html.matchAll(
      /href=["'](?:https?:)?\/\/[^"']*["']|\btarget=["'][^"']*["']/gi,
    ),
  ].map((m) => m[0]);
  if (hits.length) offenders.push({ file, hits });
}
if (offenders.length) {
  const lines = offenders
    .slice(0, 30)
    .map(
      ({ file, hits }) =>
        `    ${rel(file)}: ${[...new Set(hits)].slice(0, 3).join("  ")}${hits.length > 3 ? ` (+${hits.length - 3})` : ""}`,
    );
  errors.push(
    `${offenders.length} HTML dosyasında dış bağlantı ya da target= var (çocuk yüzeyi, CONTRACT §0.7):\n${lines.join("\n")}` +
      (offenders.length > 30
        ? `\n    … ve ${offenders.length - 30} dosya daha`
        : ""),
  );
}

// ---- 5. Bütçeler (gzip, hata) ----
const refs = [...indexHtml.matchAll(/<(script|link)\b[^>]*>/g)].map((m) => m[0]);
const jsFiles = new Set();
const cssFiles = new Set();
for (const tag of refs) {
  const src = tag.match(/\s(?:src|href)="([^"]+)"/)?.[1];
  if (!src) continue;
  const file = fileForRef(src.replace(/&amp;/g, "&"));
  if (!file) continue;
  if (
    file.endsWith(".js") &&
    (tag.startsWith("<script") || /rel="(?:preload|modulepreload)"/.test(tag))
  )
    jsFiles.add(file);
  if (file.endsWith(".css") && /rel="stylesheet"/.test(tag)) cssFiles.add(file);
}
const size = (set) => [...set].reduce((sum, f) => sum + fs.statSync(f).size, 0);
const gz = (set) =>
  [...set].reduce((sum, f) => sum + zlib.gzipSync(fs.readFileSync(f)).length, 0);
const jsGz = gz(jsFiles);
const cssGz = gz(cssFiles);
console.log(
  `/  JS:  gzip ${kb(jsGz)} (ham ${kb(size(jsFiles))}) — ${jsFiles.size} dosya, bütçe ${kb(BUDGET_JS)} gzip`,
);
console.log(
  `/  CSS: gzip ${kb(cssGz)} (ham ${kb(size(cssFiles))}) — ${cssFiles.size} dosya, bütçe ${kb(BUDGET_CSS)} gzip`,
);
if (jsGz > BUDGET_JS)
  errors.push(`/ JS bütçeyi aşıyor: gzip ${kb(jsGz)} > ${kb(BUDGET_JS)}.`);
if (cssGz > BUDGET_CSS)
  errors.push(`/ CSS bütçeyi aşıyor: gzip ${kb(cssGz)} > ${kb(BUDGET_CSS)}.`);

const homeCss = [...cssFiles].map((f) => fs.readFileSync(f, "utf8")).join("\n");
if (homeCss.includes(".encyclopedia-page")) {
  warnings.push(
    "Ansiklopedi CSS'i / sayfasına sızmış (.encyclopedia-page). src/app/kesfet/layout.tsx dışında içe aktarılmamalı.",
  );
}
const firebaseConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
const homeJs = [...jsFiles].map((f) => fs.readFileSync(f, "utf8")).join("\n");
if (!firebaseConfigured && /@firebase\/(?:database|app)/.test(homeJs)) {
  warnings.push(
    'Firebase SDK / başlangıç parçalarında (yapılandırılmamışken). Firebase\'i `await import("@/lib/firebase")` ile tembel yükleyin.',
  );
}

// ---- Sonuç ----
for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✖ ${e}`);
  console.error(`\nverify-out: ${errors.length} hata, ${warnings.length} uyarı.`);
  process.exit(1);
}
console.log(
  `✓ verify-out: ${htmlFiles.length} HTML, ${activityPages.length} etkinlik sayfası; ${warnings.length} uyarı.`,
);
