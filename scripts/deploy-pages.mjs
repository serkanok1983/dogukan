#!/usr/bin/env node
/**
 * Elle yayın (S8, MASTER_PLAN §4.8, K30). GitHub Actions yok; Pages zaten
 * `gh-pages` dalından yayınlıyor. Bu betik o dalı yerelden iter.
 *
 *   1. Çalışma ağacı temiz değilse ya da dal `main` değilse durur (--allow-branch ile aşılır).
 *   2. `npm run check` (lint → tsc → vitest → build:pages → sw-manifest → verify-out). Geçmezse yayın yok.
 *   3. Gizli değerler .env.local'dan (Next kendisi yükler); eksikler uyarıdır.
 *   4. out/sw.js içindeki __BUILD_ID__ → kısa SHA; out/.nojekyll; sw-precache.json yenilenir.
 *   5. out/ geçici bir git worktree'de yetim commit "deploy: <tam SHA>" olarak `gh-pages`'e yazılır;
 *      `git push --force origin gh-pages`. Worktree her durumda silinir.
 *   6. `gh` varsa Pages derleme durumunu izler.
 *   --dry-run: 1–4'ü yapar, yayınlanacak dosyaları listeler, itmez.
 *
 * Kullanım: npm run deploy [-- --dry-run] [-- --allow-branch]
 * (npm'in kendi `--dry-run` bayrağı da tanınır: `npm run deploy --dry-run`.)
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "out");
const REPO = "serkanok1983/dogukan";
const LIVE_URL = "https://serkanok1983.github.io/dogukan/";
const BRANCH = "gh-pages";

const flag = (name) =>
  process.argv.includes(`--${name}`) ||
  process.env[`npm_config_${name.replace(/-/g, "_")}`] === "true";
const dryRun = flag("dry-run");
const allowBranch = flag("allow-branch");

const REQUIRED_ENV = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_PARENT_PIN_HASH",
  "NEXT_PUBLIC_PIN_SALT",
];

function die(message) {
  console.error(`\n✖ deploy: ${message}`);
  process.exit(1);
}

function git(args, opts = {}) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  }).trim();
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", ...opts });
  return r.status === 0;
}

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return env;
}

function listFiles(dir, prefix = "") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory())
      out.push(...listFiles(path.join(dir, entry.name), relPath));
    else out.push(relPath);
  }
  return out;
}

// ---- 1. Ön koşullar ----
try {
  git(["rev-parse", "--is-inside-work-tree"]);
} catch {
  die("bir git deposu değil.");
}
const dirty = git(["status", "--porcelain"]);
if (dirty) die(`çalışma ağacı temiz değil; önce commit'leyin:\n${dirty}`);
const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
if (branch !== "main" && !allowBranch)
  die(
    `dal "${branch}"; yayın yalnızca "main"den yapılır (bilerek: --allow-branch).`,
  );
const sha = git(["rev-parse", "HEAD"]);
const shortSha = sha.slice(0, 7);
console.log(`▶ deploy ${dryRun ? "(deneme) " : ""}— ${branch} @ ${shortSha}`);

// ---- 3. Gizli değerler (uyarı) ----
const fileEnv = {
  ...readEnvFile(path.join(root, ".env")),
  ...readEnvFile(path.join(root, ".env.local")),
};
if (!fs.existsSync(path.join(root, ".env.local")))
  console.warn("⚠ .env.local yok (.env.example'a bakın).");
const missing = REQUIRED_ENV.filter((k) => !process.env[k] && !fileEnv[k]);
for (const k of missing)
  console.warn(`⚠ ${k} tanımlı değil — uygulama onsuz da çalışır.`);

// ---- 2. Kapı ----
const env = { ...process.env, NEXT_PUBLIC_BUILD_ID: shortSha };
if (!run(process.execPath, ["scripts/check.mjs"], { env }))
  die("`npm run check` geçmedi; yayınlanmadı.");

// ---- 4. out/ son dokunuşlar ----
const swFile = path.join(outDir, "sw.js");
if (!fs.existsSync(swFile)) die("out/sw.js yok.");
const sw = fs.readFileSync(swFile, "utf8");
if (sw.includes("__BUILD_ID__")) {
  fs.writeFileSync(swFile, sw.replaceAll("__BUILD_ID__", shortSha));
  console.log(`✓ out/sw.js VERSION = ${shortSha}`);
} else {
  console.warn("⚠ out/sw.js içinde __BUILD_ID__ yok; sürüm değişmedi.");
}
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
if (!run(process.execPath, ["scripts/sw-manifest.mjs"], { env }))
  die("sw-manifest başarısız.");

const files = listFiles(outDir);
const bytes = files.reduce(
  (sum, f) => sum + fs.statSync(path.join(outDir, f)).size,
  0,
);

if (dryRun) {
  console.log(
    `\nYayınlanacak ${files.length} dosya (${(bytes / 1024 / 1024).toFixed(2)} MB):`,
  );
  for (const f of files.sort()) console.log(`  ${f}`);
  console.log(
    `\n✓ deneme bitti; hiçbir şey itilmedi. Commit mesajı olacaktı: "deploy: ${sha}"`,
  );
  process.exit(0);
}

// ---- 5. Yetim commit + push ----
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dogukan-gh-pages-"));
const tempBranch = `deploy-tmp-${shortSha}-${Date.now()}`;
let worktreeAdded = false;
let pushed = false;
try {
  git(["worktree", "add", "--detach", "--no-checkout", tmp, "HEAD"]);
  worktreeAdded = true;
  const inTmp = { cwd: tmp };
  // `switch --orphan` boş dizin ve boş ağaçla başlar (`checkout --orphan` kaynak dosyaları geri getirirdi).
  git(["switch", "-q", "--orphan", tempBranch], inTmp);
  for (const entry of fs.readdirSync(tmp)) {
    if (entry !== ".git")
      fs.rmSync(path.join(tmp, entry), { recursive: true, force: true });
  }
  for (const entry of fs.readdirSync(outDir)) {
    fs.cpSync(path.join(outDir, entry), path.join(tmp, entry), { recursive: true });
  }
  git(["add", "-A", "-f", "."], inTmp);
  git(["commit", "-q", "--no-verify", "-m", `deploy: ${sha}`], inTmp);
  const commit = git(["rev-parse", "HEAD"], inTmp);
  const published = git(["ls-tree", "-r", "--name-only", commit])
    .split("\n")
    .filter(Boolean);
  if (published.length !== files.length) {
    throw new Error(
      `commit ${published.length} dosya içeriyor, out/ ${files.length}; itilmedi`,
    );
  }
  git(["branch", "-f", BRANCH, commit]);
  console.log(
    `✓ ${BRANCH} ← ${commit.slice(0, 7)} ("deploy: ${sha}", ${files.length} dosya)`,
  );
  if (!run("git", ["push", "--force", "origin", BRANCH]))
    throw new Error("git push başarısız");
  pushed = true;
} catch (e) {
  console.error(`✖ ${e.message}`);
} finally {
  if (worktreeAdded) {
    try {
      git(["worktree", "remove", "--force", tmp]);
    } catch {
      fs.rmSync(tmp, { recursive: true, force: true });
      try {
        git(["worktree", "prune"]);
      } catch {
        /* yok say */
      }
    }
  } else {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  try {
    git(["branch", "-D", tempBranch]);
  } catch {
    /* dal hiç oluşmadıysa */
  }
}
if (!pushed) die("yayın itilemedi.");

// ---- 6. Pages durumu ----
const hasGh = spawnSync("gh", ["--version"], { stdio: "ignore" }).status === 0;
if (hasGh) {
  console.log("Pages derlemesi izleniyor…");
  let status = "";
  for (let i = 0; i < 24; i += 1) {
    const r = spawnSync(
      "gh",
      ["api", `repos/${REPO}/pages/builds/latest`, "--jq", ".status"],
      { encoding: "utf8" },
    );
    status = (r.stdout ?? "").trim();
    if (status === "built" || status === "errored") break;
    spawnSync("sleep", ["5"]);
  }
  console.log(`Pages: ${status || "bilinmiyor"}`);
  if (status === "errored")
    die("GitHub Pages derlemesi hata verdi (gh api … /pages/builds/latest).");
} else {
  console.log("(gh yok; Pages durumu için depo ayarlarına bakın.)");
}
console.log(
  `\n✓ yayınlandı: ${LIVE_URL}\n  Sonraki adım: docs/RELEASE.md kontrol listesi.`,
);
