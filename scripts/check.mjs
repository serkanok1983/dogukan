#!/usr/bin/env node
/**
 * Yerel kalite kapısı (S8, MASTER_PLAN §4.8). CI yok; tek kapı budur.
 *   lint (0 uyarı) → tsc → vitest → build:pages → sw-manifest → verify-out
 * İlk hatada durur ve hangi adımın patladığını yazar.
 *
 * Kullanım:
 *   npm run check            tam kapı
 *   npm run check -- --quick yalnızca lint + tsc + vitest (derlemesiz)
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const quick = process.argv.includes("--quick");
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const STEPS = [
  { name: "lint", cmd: npx, args: ["eslint", "--max-warnings", "0"] },
  { name: "typecheck", cmd: npx, args: ["tsc", "--noEmit"] },
  { name: "test", cmd: npx, args: ["vitest", "run"] },
  { name: "build:pages", cmd: npm, args: ["run", "build:pages"], build: true },
  { name: "sw-manifest", cmd: process.execPath, args: ["scripts/sw-manifest.mjs"], build: true },
  { name: "verify-out", cmd: process.execPath, args: ["scripts/verify-out.mjs"], build: true },
];

const started = Date.now();
for (const step of STEPS) {
  if (quick && step.build) continue;
  const t0 = Date.now();
  console.log(`\n▶ ${step.name}`);
  const result = spawnSync(step.cmd, step.args, { cwd: root, stdio: "inherit", env: process.env });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (result.status !== 0) {
    const why = result.error ? ` (${result.error.message})` : result.signal ? ` (sinyal ${result.signal})` : "";
    console.error(`\n✖ check başarısız: "${step.name}" adımı ${secs} sn sonra patladı${why}.`);
    process.exit(result.status || 1);
  }
  console.log(`✓ ${step.name} (${secs} sn)`);
}
console.log(`\n✓ check ${quick ? "(hızlı) " : ""}yeşil — ${((Date.now() - started) / 1000).toFixed(0)} sn.`);
