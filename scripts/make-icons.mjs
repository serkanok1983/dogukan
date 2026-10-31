#!/usr/bin/env node
/**
 * src/app/icon.svg → PNG ikonlar (yalnızca geliştirici; çıktılar depoya girer).
 *   public/icons/icon-192.png, icon-512.png   (purpose "any", köşeler saydam)
 *   public/icons/maskable-512.png             (tam dolu zemin, şekiller %80 güvenli alanda)
 *   src/app/apple-icon.png                    (180×180, tam dolu zemin; iOS köşeyi kendisi yuvarlar)
 * Kullanım: npm run icons
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svg = fs.readFileSync(path.join(root, "src/app/icon.svg"), "utf8");

const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
if (!viewBox) throw new Error("icon.svg: viewBox bulunamadı");
const [, , vbW, vbH] = viewBox.split(/\s+/).map(Number);

// Yuvarlatılmış zemin dikdörtgeni (ilk <rect ... fill="url(#bg)"/>) ayrılır; geri kalanı ön plan.
const bgRect = svg.match(/<rect[^>]*fill="url\(#bg\)"[^>]*\/>/)?.[0];
if (!bgRect) throw new Error("icon.svg: zemin dikdörtgeni bulunamadı");
const defs = svg.match(/<defs>[\s\S]*?<\/defs>/)?.[0] ?? "";
const foreground = svg
  .replace(/^[\s\S]*?<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "")
  .replace(defs, "")
  .replace(bgRect, "")
  .trim();

/** Tam dolu kare zemin + ön planı `scale` oranında ortalar. */
function fullBleed(scale) {
  const tx = (vbW * (1 - scale)) / 2;
  const ty = (vbH * (1 - scale)) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}">${defs}<rect width="${vbW}" height="${vbH}" fill="url(#bg)"/><g transform="translate(${tx} ${ty}) scale(${scale})">${foreground}</g></svg>`;
}

async function render(source, size, out) {
  const density = Math.ceil((72 * size) / Math.min(vbW, vbH));
  const file = path.join(root, out);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(source), { density }).resize(size, size).png({ compressionLevel: 9 }).toFile(file);
  console.log(`✓ ${out} (${size}×${size}, ${fs.statSync(file).size} B)`);
}

await render(svg, 192, "public/icons/icon-192.png");
await render(svg, 512, "public/icons/icon-512.png");
// Maskable: Android en fazla %80 çaplı daireyi gösterir; ön plan %70'e küçültülür.
await render(fullBleed(0.7), 512, "public/icons/maskable-512.png");
await render(fullBleed(0.86), 180, "src/app/apple-icon.png");
