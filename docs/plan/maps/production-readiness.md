# Production-readiness map — "Doğukan'ın Yeri" (reader #5 of 5)

Scope: build/deploy pipeline, Next.js 16 constraints, PWA/offline, error boundaries, lint/type/test gates, CI, security (login + Firebase), Firebase data model, performance, privacy. All paths are relative to `/home/user/dogukan` unless absolute.

Verified in this session: `npx tsc --noEmit` exits 0; `npx eslint` reports **14 errors / 44 warnings** (full list in §6); `out/` from the last `next build` contains 89 HTML files, 1.43 MB of JS, 88.5 KB CSS, 9 woff2 fonts, no manifest, no service worker, no `apple-touch-icon`.

---

## 1. Verdict in one paragraph

The app is a correctly configured Next.js 16 static export (`output: "export"`, `basePath: "/dogukan"`, `trailingSlash: true`, `images.unoptimized`) deployed to GitHub Pages by a single workflow. It builds and type-checks clean. It is **not** production-grade for a 6-year-old's phone yet because: (a) it is not installable (no `app/manifest.ts`, no PNG icons, no service worker, so no home-screen icon, no splash, no offline), (b) there is no error boundary anywhere, so a thrown canvas-game error white-screens the whole page, (c) there are 0 tests and CI has no lint/typecheck gate, (d) login is a typed username + plaintext password that an emerging reader cannot use, and the same plaintext credentials guard the parent panel, (e) Firebase is written to from the client with no auth and no rules file in the repo, (f) a 760 KB `dogukan.png` sits unused at repo root and the child's photo is served as a 254 KB 1200×1600 JPEG into a 96×96 slot, (g) the encyclopedia renders external `<a href>` links that are reachable by the child.

---

## 2. Current pipeline — facts

| Concern | Where | Detail |
|---|---|---|
| Framework | `package.json:14-16` | `next 16.2.6`, `react 19.2.4`, `react-dom 19.2.4`, `firebase ^12.13.0` (only runtime deps) |
| Scripts | `package.json:5-11` | `dev`, `build`, `build:pages` (`NEXT_PUBLIC_BASE_PATH=/dogukan next build`), `start`, `lint` (`eslint`). **No `test`, no `typecheck`.** |
| Next config | `next.config.ts:3-12` | `isProd = NODE_ENV==="production"`; `basePath = NEXT_PUBLIC_BASE_PATH ?? (isProd ? "/dogukan" : "")`; `output: "export"`, `assetPrefix: basePath || undefined`, `trailingSlash: true`, `images: { unoptimized: true }`. No `reactCompiler`, no `experimental`. |
| Base-path helper | `src/lib/asset.ts:2-8` | `assetPath(path)` duplicates the same env logic for `public/` files (needed because `basePath` does not prefix `public/` URLs — see `01-app/03-api-reference/05-config/01-next-config-js/assetPrefix.md` "does not influence … Files in the public folder"). Used by `MenuScreen.tsx:55`, `CelebrationProvider.tsx:112`, `acelyaSounds.ts:17`, `acelyaAsteroidsMusic.ts:7-8`. |
| TS | `tsconfig.json` | `strict: true`, `target: ES2017`, `moduleResolution: bundler`, `paths: {"@/*": ["./src/*"]}`, includes `.next/types/**/*.ts` and `.next/dev/types/**/*.ts` (Next 16 typegen output). |
| ESLint | `eslint.config.mjs:1-18` | Flat config, `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`, ignores `.next/**`, `out/**`, `build/**`, `next-env.d.ts`. Installed `eslint-plugin-react-hooks 7.1.1` → this is where the React-Compiler rules (`react-hooks/refs`, `purity`, `set-state-in-effect`, `preserve-manual-memoization`) come from. The compiler itself is **not** enabled. |
| PostCSS/Tailwind | `postcss.config.mjs` | `@tailwindcss/postcss` only. `src/app/globals.css` is 89.5 KB / 4,867 lines of hand-written CSS (Tailwind utilities are barely used). |
| Deploy | `.github/workflows/deploy-pages.yml` | On push to `main`/`master`: Node 22, `npm ci`, `npm run build` with `NEXT_PUBLIC_BASE_PATH=/dogukan` + 7 `NEXT_PUBLIC_FIREBASE_*` secrets (lines 29-37), then `peaceiris/actions-gh-pages@v4` publishes `./out` to `gh-pages` with `force_orphan: true`. `permissions: contents: write`. **No lint, no typecheck, no tests, no PR trigger, no build-cache for `.next/cache`.** |
| Jekyll | `public/.nojekyll` (0 bytes) | Present and copied to `out/.nojekyll` — required so GitHub Pages serves `_next/`. Keep it. |
| 404 | `out/404.html`, `out/404/index.html` | Default Next "404: This page could not be found." (English). GitHub Pages serves root `404.html` for unmatched URLs. |
| Env | `.gitignore` ignores `.env*`; there is **no `.env.example`** | Firebase config is read in `src/lib/firebase.ts:4-12` from `NEXT_PUBLIC_FIREBASE_*`; `isFirebaseConfigured()` (line 14) = `apiKey && databaseURL`. |
| Routes | `src/app/page.tsx`, `src/app/aktivite/[slug]/page.tsx`, `src/app/kesfet/page.tsx`, `src/app/kesfet/[slug]/page.tsx`, `src/app/bilgi/page.tsx` | Both dynamic routes implement `generateStaticParams()`; only `kesfet/[slug]/page.tsx:12` sets `export const dynamicParams = false`. `aktivite/[slug]/page.tsx` relies on `notFound()` (line 16) but has no `dynamicParams = false`. |
| Server/client split | `src/app/page.tsx:5` → `HomeClient`; `aktivite/[slug]/page.tsx:18-23` → `ActivityClient`; `kesfet/*` pages are server components with client islands (`EncyclopediaHub`, `EncyclopediaTools`, `InteractiveLab`, `KnowledgeCheck`) | 58 files carry `"use client"`; only `src/components/ActivityKnowledgePanel.tsx` is a server-renderable component under `components/`. `src/lib/activityLearning.ts:1` has `import "server-only"` and is intentionally kept out of the client bundle. |
| Code-splitting | `src/activities/registry.tsx:3,13-50` | All 32 canvas games are `next/dynamic(() => import(...), { ssr: false })` inside a `"use client"` module — correct per `01-app/02-guides/lazy-loading.md` ("`ssr: false` … move it into Client Components"). Quiz/shared games are statically imported. `ACTIVITY_MAP` (line 69) is `Record<string, () => React.ReactNode>`; `ActivityClient.tsx:34` calls `{Activity()}` (a function call, not `<Activity/>`). |

---

## 3. Next.js 16 constraints that affect this codebase (doc paths used)

All paths below are under `node_modules/next/dist/docs/`.

1. **`01-app/02-guides/static-exports.md`** — Unsupported with `output: "export"`: dynamic routes without `generateStaticParams`, `dynamicParams: true` fallbacks, Route Handlers that read the request, `cookies`, `headers`, rewrites/redirects, `headers()` config, Proxy (middleware), ISR, default image loader, Server Actions. Consequences here:
   - You **cannot** add `headers()` for CSP / `Cache-Control` on `sw.js` (the PWA guide §8 suggests it; it is a no-op under export). GitHub Pages sets its own `Cache-Control: max-age=600`.
   - No Server Actions → any server logic (push notifications, parent auth) must be a third party (Firebase).
   - Route Handlers **are** allowed if they are static `GET` (`app/data.json/route.ts` pattern) — usable for emitting a static JSON of the menu if ever needed.
   - Client components are **prerendered to HTML**; `window`/`localStorage` must be read in effects (the repo already does this: `HomeClient.tsx:18-24`, `ActivityShell.tsx:58-61`, `auth.ts:18,34`).
2. **`01-app/03-api-reference/05-config/01-next-config-js/basePath.md`** — `basePath` is inlined at build time; `next/link` auto-prefixes; `next/image` `src` must be manually prefixed (done via `assetPath`). **`01-app/03-api-reference/05-config/01-next-config-js/trailingSlash.md`** — with export, `/about` emits `/about/index.html`; URLs with file extensions (`sw.js`, `manifest.webmanifest`, `.png`) are **not** slash-appended.
3. **`01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md`** + **`01-app/02-guides/progressive-web-apps.md`** — `app/manifest.ts` returning `MetadataRoute.Manifest` is a static Route Handler, emitted at build. Verified in Next source `node_modules/next/dist/build/webpack/loaders/metadata/discover.js:71`: `staticImagesMetadata.manifest = JSON.stringify(\`${basePath}/${name}.${extension}\`)` → the `<link rel="manifest">` href **is** basePath-prefixed automatically (`/dogukan/manifest.webmanifest`). The manifest **body** (`start_url`, `scope`, `icons[].src`) is **not** prefixed — you must write `/dogukan/...` yourself (see §4).
4. **`01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md`** — `apple-icon` supports **`.jpg|.jpeg|.png` only**. The repo has `src/app/apple-icon.svg`, which is **silently ignored**: `out/index.html` contains zero `apple-touch-icon` tags (verified). `icon.svg` works (`<link rel="icon" href="/dogukan/icon.svg?icon.0t-...svg" sizes="any">`). In 16, `params` for generated `icon.tsx`/`apple-icon.tsx` is a Promise (`version-16.md` "Async parameters for icon").
5. **`01-app/02-guides/upgrading/version-16.md`** — relevant breaking items: Node ≥ 20.9 (CI uses 22, fine); browsers Chrome/Edge/Firefox 111+, **Safari 16.4+** (iOS 16.4 = oldest supported iPhone target; matches Web Push minimum); Turbopack default for `dev` and `build` (no `--turbopack` flag needed, no webpack config present); `params`/`searchParams` async only (repo already `await params` in both `[slug]` pages); `next lint` removed and `next build` **no longer lints** → CI must run `eslint` explicitly; `next build` no longer prints "First Load JS" sizes → measure from `out/` (as done here); `images.localPatterns.search` needed for `?v=` query strings on local `next/image` src; `scroll-behavior: smooth` no longer overridden on navigation (add `data-scroll-behavior="smooth"` on `<html>` if globals.css sets smooth scrolling); React 19.2 canary features (`ViewTransition`, `useEffectEvent`, `Activity`) available.
6. **`01-app/03-api-reference/05-config/01-next-config-js/reactCompiler.md`** + `version-16.md` "React Compiler Support" — `reactCompiler: true` is stable, **opt-in**, needs `npm i -D babel-plugin-react-compiler`, slows builds (Babel). The lint rules already enforce compiler-compatibility; enabling the compiler would memoize the 58 client components automatically but the 14 current errors mark components the compiler will **skip** ("Compilation Skipped"). Fix the errors first (§6), then enabling is low-risk. `compilationMode: 'annotation'` + `"use memo"` is the gradual path.
7. **`01-app/03-api-reference/03-file-conventions/error.md`** (v16.2 adds `unstable_retry`), **`not-found.md`**, **`01-app/01-getting-started/10-error-handling.md`** — `error.tsx` must be `"use client"`, wraps `page.tsx` + nested layouts but not the same-level `layout.tsx`; `global-error.tsx` must render its own `<html><body>` and cannot export `metadata`; root `app/not-found.tsx` also handles **all unmatched URLs** (this is what becomes `out/404.html`). `global-not-found.js` is experimental (flag `experimental.globalNotFound`) — not needed.
8. **`01-app/02-guides/lazy-loading.md`** — `next/dynamic` = `React.lazy` + Suspense; supports `loading:` option (registry currently passes none → games pop in with no skeleton).
9. **`01-app/01-getting-started/13-fonts.md`** / **`01-app/03-api-reference/02-components/font.md`** — `next/font/google` self-hosts: zero requests to Google at runtime (good for privacy). Repo loads `Baloo_2` (500/600/700) + `Nunito` (400/600/700), subsets `latin` + `latin-ext` (`latin-ext` is what carries Turkish ğ ş ı İ ç ö ü). Output: 9 woff2 files, 4 preloaded in `<head>` (`out/index.html`).
10. **`01-app/01-getting-started/12-images.md`** / **`01-app/03-api-reference/02-components/image.md`** — with export the default loader is unsupported; `images.unoptimized: true` makes `<Image>` a plain `<img>` with no resizing/format conversion. So the **source file size is what ships** (→ §11).
11. **`01-app/03-api-reference/04-functions/generate-static-params.md`** + **`.../02-route-segment-config/dynamicParams.md`** — `dynamicParams=false` makes unknown slugs 404 instead of attempting runtime generation; harmless under export but makes intent explicit. Add it to `aktivite/[slug]/page.tsx`.
12. **`01-app/01-getting-started/08-caching.md`**, **`01-app/02-guides/caching-without-cache-components.md`** — Cache Components / `use cache` / ISR are irrelevant under `output: "export"` (everything is build-time static). Do not add `revalidate` or `"use cache"`. Browser-level caching is the only cache you control (service worker, §4).
13. **`01-app/02-guides/testing/vitest.md`**, **`testing/index.md`** — official Vitest recipe (§7). Async server components are not unit-testable; use the pure data modules instead.
14. **`01-app/03-api-reference/05-config/03-eslint.md`** — confirms `eslint-config-next` bundles `react-hooks`; rules can be tuned under `rules` in `eslint.config.mjs`.
15. **`01-app/03-api-reference/05-config/02-typescript.md`** — `next typegen` generates `PageProps<'/aktivite/[slug]'>` helpers; `next build` fails on TS errors (good: it is already an implicit typecheck gate, but only post-build).
16. **`01-app/03-api-reference/01-directives/use-client.md`**, **`01-app/01-getting-started/05-server-and-client-components.md`** — props across the boundary must be serializable. `ActivityClient` receives `learning: ActivityLearning` (plain data) — fine. `HomeClient` receives `learningPreviews` — fine.
17. **`01-app/02-guides/single-page-applications.md`** — background for the "client-side auth gate" pattern used by `HomeClient` and `BilgiPage`.

---

## 4. PWA plan (static export + basePath + GitHub Pages)

### 4.1 Manifest — `src/app/manifest.ts` (new)

```ts
import type { MetadataRoute } from "next";
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/dogukan" : "");
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: `${base}/`,
    name: "Doğukan'ın Yeri",
    short_name: "Doğukan",
    description: "Oyunla öğren, keşfet, merak et.",
    lang: "tr",
    dir: "ltr",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    orientation: "any",            // games use both; Super Bear wants landscape, quizzes portrait
    background_color: "#74ebd5",   // matches viewport.themeColor in layout.tsx:38
    theme_color: "#74ebd5",
    categories: ["education", "kids", "games"],
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png" },
      { src: `${base}/icons/maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```
- Next emits `out/manifest.webmanifest` and injects `<link rel="manifest" href="/dogukan/manifest.webmanifest">` (prefix is automatic per `discover.js:71`; the body paths are not — hence `${base}`).
- `trailingSlash: true` does not touch `manifest.webmanifest` (has an extension).
- Remove the hard-coded `appleWebApp: { capable: true, title }` from `layout.tsx:31` only if you move it; it is still needed for iOS (`apple-mobile-web-app-capable`). Add `statusBarStyle: "black-translucent"` so the game canvas can draw under the notch together with `viewportFit: "cover"` (`layout.tsx:37`).

### 4.2 Icons
- Create raster icons from `src/app/icon.svg` (rocket/robot gradient): `public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png` (safe zone 80%), and **`src/app/apple-icon.png` (180×180)** to replace the ignored `apple-icon.svg`. Delete `src/app/apple-icon.svg`.
- `favicon.ico` (25.9 KB, 16+32 px) stays; it is emitted as `out/favicon.ico`.
- Optional: `public/icons/splash-*.png` + `appleWebApp.startupImage` (`generate-metadata.md` §appleWebApp) for an iOS splash; Android generates the splash from `background_color` + 512 icon.

### 4.3 Service worker — `public/sw.js` (hand-written, no Serwist/next-pwa; both require webpack config, see PWA guide "Offline Support" note; Turbopack is the default in 16)

Constraints: static export, `basePath=/dogukan`, GitHub Pages (no custom headers, `Cache-Control: max-age=600`, HTTPS, `.nojekyll`).

```js
// public/sw.js  — served at https://<user>.github.io/dogukan/sw.js, scope /dogukan/
const BASE = new URL(self.registration.scope).pathname;          // "/dogukan/" or "/"
const VERSION = "v1";                                              // bump on every deploy (CI can sed in the git sha)
const SHELL = `${VERSION}-shell`, RUNTIME = `${VERSION}-runtime`;
const PRECACHE = [`${BASE}`, `${BASE}404.html`, `${BASE}offline/`, `${BASE}manifest.webmanifest`,
                  `${BASE}icons/icon-192.png`, `${BASE}icons/icon-512.png`, `${BASE}dogukan.jpg`];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;   // never touch Firebase websockets/XHR
  if (url.pathname.startsWith(`${BASE}_next/static/`) || /\.(png|jpg|svg|woff2|m4a)$/.test(url.pathname)) {
    e.respondWith(cacheFirst(e.request, RUNTIME));                 // hashed assets are immutable
  } else if (e.request.mode === "navigate" || url.pathname.endsWith(".txt")) {
    e.respondWith(networkFirst(e.request, RUNTIME, `${BASE}offline/`)); // HTML + RSC .txt payloads
  }
});
```
- `_next/static/*` chunks are content-hashed → cache-first forever. HTML + the `__next.*.txt` RSC payloads under each route dir (Next 16 emits these for client navigation; see `out/__next._full.txt` etc.) → network-first with offline fallback.
- Sounds (`public/sounds/*.m4a`, 20–63 KB each) can be precached; the Web-Audio tones in `src/lib/sounds.ts` need no network.
- Add `src/app/offline/page.tsx` (server component, Turkish, big emoji, "İnternet yok, oyunlar yine de açılır" + link to `/`).
- Registration — `src/components/PwaRegister.tsx` (`"use client"`), mounted once in `layout.tsx` body:
  ```ts
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register(assetPath("/sw.js"), { scope: assetPath("/"), updateViaCache: "none" })
      .then((reg) => reg.addEventListener("updatefound", () => {/* show "Yeni sürüm hazır" toast → reg.waiting?.postMessage("SKIP_WAITING") */}))
      .catch(() => {});
  }, []);
  ```
  `updateViaCache: "none"` matters because GitHub Pages caches `sw.js` for 10 min and you cannot send `Cache-Control: no-cache`.
- Dev: service workers only register on `localhost`/HTTPS; `next dev --experimental-https` if you want to test install (PWA guide §7).
- Bump `VERSION` per deploy in CI: `sed -i "s/v1/${GITHUB_SHA::7}/" out/sw.js` after build, or read `process.env.NEXT_PUBLIC_BUILD_ID` injected into a tiny `public/sw-version.json`.

### 4.4 Install prompt
- **Android/Chrome**: `beforeinstallprompt` fires when manifest + SW + HTTPS criteria are met. Capture it in `PwaRegister`, `e.preventDefault()`, keep the event in state, and show a **parent-facing** "Telefona ekle 📲" button on the login/parent screen (not to the child — avoid dark-pattern prompts). Call `deferred.prompt()` on tap. The PWA guide warns it is not cross-browser; use it as enhancement only.
- **iOS/Safari**: no API. Show an instruction card when `/iPad|iPhone|iPod/.test(navigator.userAgent)` and `!window.matchMedia("(display-mode: standalone)").matches` (PWA guide `InstallPrompt` component): "Paylaş ⎋ → Ana Ekrana Ekle ➕". Hide it once standalone.
- After install, `display-mode: standalone` → hide the browser-oriented login copy, enable full-screen canvas sizing (`useCanvasFit`).
- **Session persistence inside the installed app**: iOS standalone has its own storage partition; `localStorage` "remember me" (`auth.ts:44-47`) works, but `sessionStorage` is cleared between launches — that is why `isLoggedIn()` checks both (`auth.ts:35-38`). Keep the dual read.

### 4.5 Web Push — **skip**. Requires Server Actions/VAPID server (PWA guide §3-5) → not available under static export, and push notifications would work against the "less screen time" goal. If parent notifications are ever wanted, use Firebase Cloud Messaging triggered by RTDB writes (needs Firebase Functions, paid plan).

---

## 5. Error boundaries (none exist today)

`find src/app -name error.tsx -o -name not-found.tsx -o -name global-error.tsx -o -name loading.tsx` → empty. `grep -rn "Suspense\|ErrorBoundary" src` → empty. A `requestAnimationFrame` loop throwing inside e.g. `FightingArena.tsx` (1,069+ lines) kills the entire React tree with a blank screen and the default Next overlay text in English.

Add:
1. `src/app/error.tsx` (`"use client"`; props `{ error, unstable_retry }` per `error.md` v16.2) — big friendly card: "Oyun biraz yoruldu 😴", a huge "Tekrar dene 🔁" button calling `unstable_retry()`, and a `<Link href="/">Ana sayfa</Link>`. Call `sounds.wrong()` once. Log `error.message` to `console.error` and, if Firebase is configured, `push(ref(db, "errors/dogukan"), { at, slug, message })` so the parent panel can show crashes.
2. `src/app/aktivite/[slug]/error.tsx` — same card but keeps the `activity-topbar` so the child can go back without losing orientation; this boundary only wraps the game, not the shell.
3. `src/app/not-found.tsx` (server component) — Turkish, replaces the English `out/404.html`. Must stay dependency-free of client storage (it is prerendered). Because `kesfet/[slug]` has `dynamicParams=false` and `aktivite/[slug]` calls `notFound()`, both funnel here.
4. `src/app/global-error.tsx` (`"use client"`, own `<html lang="tr"><body>`, inline styles only — cannot rely on `globals.css`/fonts) for root-layout failures.
5. Optional `src/app/aktivite/[slug]/loading.tsx` or pass `loading: () => <GameSkeleton/>` in `registry.tsx` dynamic calls so the ~150–227 KB game chunks show a skeleton on 3G.
6. Component-level: wrap `{Activity()}` in `ActivityClient.tsx:34` with a class `ErrorBoundary` (React 19 still has no hook) that resets on `slug` change (`key={slug}` already exists on `ActivityShell`). Also change `{Activity()}` to a proper element: `const Activity = ACTIVITY_MAP[slug]; <Activity/>` after making `ACTIVITY_MAP` values components, otherwise hooks inside those render functions are called as plain functions (works today only because each wrapper is a trivial JSX factory).

---

## 6. Lint & type status — exact list

`npx tsc --noEmit` → clean. `npx eslint` → 14 errors, 44 warnings:

**Errors (React Compiler compatibility rules from `eslint-plugin-react-hooks@7.1.1`):**
| File:line | Rule | Fix |
|---|---|---|
| `src/activities/games/Asteroids.tsx:64,65,81` | `react-hooks/refs` | Reading/writing `ref.current` during render → move into `useEffect`/event handlers. |
| `src/activities/games/FightingArena.tsx:1069` | `react-hooks/refs` | same |
| `src/activities/games/LaneRacer.tsx:274` | `react-hooks/refs` | same |
| `src/activities/games/RunnerDash.tsx:260` | `react-hooks/refs` | same |
| `src/activities/games/Pong.tsx:55,56` | `react-hooks/purity` | `Math.random()`/`Date.now()` in render → `useState(() => ...)` initializer or `useRef`. |
| `src/activities/games/FlappyBird.tsx:75` | `react-hooks/set-state-in-effect` | Derive state or use `useSyncExternalStore`. |
| `src/app/bilgi/page.tsx:22` | `react-hooks/set-state-in-effect` | Replace the `ready` flag with a `useSyncExternalStore`-based `useSession()` hook shared with `HomeClient.tsx:21` (which currently suppresses the same rule with `eslint-disable-next-line`). |
| `src/hooks/useGameScore.ts:38,46,50,61` | `react-hooks/preserve-manual-memoization` | `show` from `useCelebration()` is not stable (context value object recreated at `CelebrationProvider.tsx:99`). Memoize the context value with `useMemo`/`useCallback` or drop the manual `useCallback`s (the compiler would memoize). |

**Warnings:** 33× `@typescript-eslint/no-unused-vars` (dead imports/vars across 20 game files), 11× `react-hooks/exhaustive-deps` (`AlienInvasion:317`, `BalloonPop:25`, `ColorWorkshop:67`, `FightingArena:1028`, `LaneRacer:249`, `RoyalMatch:266`, `Tetris:187,205,274,315`, `CountGame:20`).

Gate proposal: `eslint --max-warnings 0` in CI once the 33 unused-vars are deleted; for the 11 `exhaustive-deps`, prefer `useEffectEvent` (React 19.2, listed in `version-16.md`) over disabling the rule.

---

## 7. Test strategy (0 tests today)

**Tooling (per `01-app/02-guides/testing/vitest.md`):** `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event vite-tsconfig-paths`. `vitest.config.mts` with `plugins: [tsconfigPaths(), react()]`, `test: { environment: "jsdom", include: ["src/**/*.test.{ts,tsx}"], setupFiles: ["./vitest.setup.ts"] }`. Add scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"typecheck": "tsc --noEmit"`. `node:test` would also work for the pure modules but gives no DOM/RTL; Vitest is the official recipe and understands `@/` paths via `vite-tsconfig-paths`.

**Pure, directly testable modules (verified: no React/`window`/storage imports):**
- `src/lib/menu.ts` (`MENU`, `TOTAL_ACTIVITIES`, `findActivity`) — assert every `MENU` slug exists in `ACTIVITY_MAP` (`registry.tsx`) **and** in `ACTIVITY_KNOWLEDGE` (`activityLearning.ts`) and `getGuide` (`guides.ts`); slugs unique; emoji non-empty. This catches the exact class of bug where a menu item points to a game that "Bu aktivite bulunamadı" (`ActivityClient.tsx:26`).
- `src/lib/encyclopedia.ts` (2,268 lines; `TOPICS`, `CATEGORIES`, `getTopic`) — every topic has ≥1 quiz question with exactly one correct answer, `relatedActivities[].slug` resolve via `findActivity`, `sources[].url` are https, `reviewedAt` parses.
- `src/activities/data/quizData.ts` — each question's `answer` ∈ `options`, no duplicate options, age-appropriate numeric ranges (sums ≤ 20 for 1st grade).
- `src/lib/activityLearning.ts` (`server-only`; mock the import in vitest via `vi.mock("server-only", () => ({}))`) — `getActivityLearning(slug)` defined for all 69 slugs.
- `src/lib/utils.ts` (`shuffle`, `pickRandom`, `randInt`, `normalizeSearch`) — `normalizeSearch("Şİ")` behaviour with Turkish dotted/dotless i.
- `src/activities/games/superBearLevelGen.ts` (129 lines) and `src/activities/games/fighting/engine.ts` (241 lines) — deterministic level/physics logic; seed `Math.random` with `vi.spyOn`.
- `src/lib/leaderboard.ts` `buildCelebrateMessage`/`recordScore`/`checkLiveMilestone` — currently module-private + coupled to `localStorage`; export the pure `buildCelebrateMessage` and test it; test `recordScore` under jsdom with Firebase unconfigured (`isFirebaseConfigured()` false → local path only).
- `src/lib/auth.ts` `checkCredentials` — trivially testable now; becomes the PIN verifier after §8.
- `src/lib/asset.ts` `assetPath` — `NEXT_PUBLIC_BASE_PATH` matrix.

**Component tests (RTL + jsdom):** `LoginScreen` (wrong PIN → `role="alert"` text + `shake` class), `QuizGame` (tap correct option → `sounds.success` spy, progression), `MenuScreen` (`bilgi` link hidden when `getPlayerId() !== "serkan"`), `ActivityShell` guide-preference key migration (`dogukan-guide-${slug}` → `dogukan-guide:v2:${slug}`, `ActivityShell.tsx:22-50`). Mock `src/lib/sounds.ts` (`AudioContext` absent in jsdom) and `speechSynthesis`.

**Build-output test (cheap E2E substitute):** a `node:test`/vitest script that runs after `next build` and asserts `out/manifest.webmanifest`, `out/sw.js`, `out/404.html`, `out/aktivite/<every slug>/index.html`, `out/kesfet/<every topic>/index.html` exist and that `out/index.html` contains `rel="manifest"` and `apple-touch-icon`. Catches basePath/asset regressions before deploy.

**E2E:** Playwright (`01-app/02-guides/testing/playwright.md`) against `npx serve out -l 3000` with `--base /dogukan` is optional; one mobile-viewport smoke test (login → open `super-ayi` → canvas visible → back) is enough.

---

## 8. CI changes

Replace the single job with two jobs in `.github/workflows/deploy-pages.yml` (or add `ci.yml`):

```yaml
on:
  push: { branches: [main, master] }
  pull_request:
  workflow_dispatch:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint -- --max-warnings 0
      - run: npm run typecheck
      - run: npm test
      - uses: actions/cache@v4            # per 01-app/02-guides/ci-build-caching.md
        with: { path: .next/cache, key: nextjs-${{ hashFiles('package-lock.json') }}-${{ hashFiles('src/**') }} }
      - run: npm run build
        env: { NEXT_PUBLIC_BASE_PATH: /dogukan }   # Firebase secrets not needed to verify the build
      - run: node scripts/verify-out.mjs           # the build-output test from §7
      - uses: actions/upload-artifact@v4
        with: { name: out, path: out }
  deploy:
    needs: check
    if: github.event_name != 'pull_request'
    permissions: { contents: write }
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build                          # rebuild WITH Firebase secrets (inlined NEXT_PUBLIC_*)
        env: { NEXT_PUBLIC_BASE_PATH: /dogukan, NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}, ... }
      - run: sed -i "s/__BUILD_ID__/${GITHUB_SHA::7}/" out/sw.js
      - uses: peaceiris/actions-gh-pages@v4
        with: { github_token: ${{ secrets.GITHUB_TOKEN }}, publish_dir: ./out, force_orphan: true }
```
Also: add `"engines": { "node": ">=20.9" }` and an `.nvmrc` (`22`); add `.env.example` listing the 7 `NEXT_PUBLIC_FIREBASE_*` keys; consider `concurrency` per-ref for PRs. Keep `permissions: contents: write` only on `deploy`.

---

## 9. Security

### 9.1 Login today
- `src/lib/auth.ts:1-4`: `PLAYERS = { dogukan: { password: "ilovemyfather" }, serkan: { password: "ilovemyson" } }` — plaintext, shipped in the client bundle, checked by `checkCredentials` (`auth.ts:11-15`) with plain `===`.
- Session = `localStorage`/`sessionStorage` flags `dogukan-logged-in` + `dogukan-player` (`auth.ts:8-9`). Parent panel `/bilgi` is gated client-side only (`bilgi/page.tsx:13-23` redirects unless `getPlayerId() === "serkan"`; link hidden in `MenuScreen.tsx:79`).
- **Is this acceptable for a family app?** For *the child's* login: yes in principle — there is nothing to protect on the device except the parent's view. But a 6-year-old cannot type `ilovemyfather`, and the father's password sits in the same bundle, so anyone (including the child) who opens DevTools or reads `auth.ts` on GitHub has it. Since the data behind it is only an activity log, the realistic risk is the child flipping into "serkan" mode and seeing/clearing his own log, plus writing scores as the rival. Low stakes, but it undermines the parent panel's purpose.

### 9.2 Proposal — kid-friendly avatar + PIN
- **Child**: no password. Login screen shows two big avatar cards (🐻 Doğukan photo, 👨 Baba). Tapping Doğukan logs in immediately (`setLoggedIn("dogukan", true)`), with a short spoken greeting via `speechSynthesis` ("Hoş geldin Doğukan!") — reuse `findTurkishVoice()` from `EncyclopediaTools.tsx:16-19` by moving it to `src/lib/speech.ts`.
- **Parent**: 4-digit PIN keypad (numbers only, large buttons, `inputMode="numeric"`). Store **only a hash** in the bundle: `NEXT_PUBLIC_PARENT_PIN_HASH` = SHA-256 of `pin + salt` computed with `crypto.subtle.digest` at runtime; compare constant-time-ish. Rate-limit locally (3 wrong → 30 s lock stored in `sessionStorage`) and show "Babanı çağır 🙂". The hash is still public, but a 4-digit PIN behind a hash + lockout is a reasonable bar for "keep the child out of the parent panel".
- Optional "Ebeveyn kapısı" math gate (e.g. "17 + 26 = ?") in front of the PIN — common in kids' apps and cheap to implement.
- Keep `PlayerId` type and `getPlayerId()` API so `leaderboard.ts`, `activityLog.ts`, `useGameScore.ts` stay unchanged. `checkCredentials` becomes `async verifyParentPin(pin): Promise<boolean>`.
- Autoplay/sound: iOS requires a user gesture before `AudioContext` resumes (`sounds.ts:18` handles `suspended`) — the avatar tap doubles as that gesture.

### 9.3 Firebase exposure
- `NEXT_PUBLIC_FIREBASE_*` are inlined in `out/_next/static/chunks/*.js` (by design; the API key is not a secret). What *is* security-relevant: there is **no `database.rules.json`/`firebase.json`/`.firebaserc`** in the repo and the client never authenticates (no `firebase/auth` import anywhere). If the RTDB is in test mode, anyone with the URL can read/write `leaderboard/*` and `activity/dogukan/*` (child's login timestamps and visited pages = behavioural data about a minor).
- Fix: enable **Anonymous Auth** (`signInAnonymously` on app start; tiny bundle addition) and ship rules in-repo:
  ```json
  { "rules": {
      "leaderboard": { "$slug": { ".read": "auth != null", "$player": { ".write": "auth != null && newData.isNumber() && newData.val() >= 0 && newData.val() < 10000000", ".validate": "$player === 'dogukan' || $player === 'serkan'" } } },
      "activity":    { "dogukan": { ".read": "auth != null", "logins": { "$id": { ".write": "auth != null && !data.exists()", ".validate": "newData.hasChildren(['at','iso']) && newData.child('at').isNumber()" } }, "visits": { "$id": { ".write": "auth != null && !data.exists()", ".validate": "newData.hasChildren(['at','iso','slug','title']) && newData.child('slug').isString() && newData.child('slug').val().length < 64" } } } },
      "progress":    { "$player": { ".read": "auth != null", ".write": "auth != null" } }
  } }
  ```
  Anonymous auth does not prevent a determined stranger, but combined with **App Check** (reCAPTCHA v3 / Play Integrity) and the validate rules it stops casual abuse and blocks garbage writes. Deploy rules with `firebase deploy --only database` from CI (needs `FIREBASE_TOKEN` secret) or paste into the console.
- Rotate nothing (API key is public by design) but **restrict the API key** in Google Cloud Console to the GitHub Pages origin.

### 9.4 Other
- No CSP possible via headers under export; a `<meta http-equiv="Content-Security-Policy">` in `layout.tsx` is possible but Next's inline bootstrap scripts need nonces/hashes — low value here. Skip.
- `globals.css` / components use no `dangerouslySetInnerHTML` (grep clean). Encyclopedia bodies are rendered as text (`kesfet/[slug]/page.tsx:102-104`).

---

## 10. Firebase data model — current vs proposed

**Current RTDB paths (from `src/lib/firebase.ts:30-40`, `activityLog.ts:18-52`, `leaderboard.ts:41,166-172`):**
```
leaderboard/{gameSlug}/{playerId}: number            # set() only when score > remote (recordScore)
activity/dogukan/logins/{pushId}: { at: number, iso: string }           # once per browser session (sessionStorage flag dogukan-activity-login)
activity/dogukan/visits/{pushId}: { at, iso, slug, title }               # every /aktivite/[slug] mount + "ana-sayfa" on login
```
Local mirrors: `localStorage["dogukan-scores-{player}"]` = `Record<slug, number>` (`leaderboard.ts:8-29`), `localStorage["dogukan-merak-ansiklopedisi-v1"]` = `Record<topicSlug, {favorite?, complete?, lastVisited?}>` (`encyclopediaProgress.ts:9`), `localStorage["dogukan-guide:v2:{slug}"]="1"` (`ActivityShell.tsx:20-24`). Encyclopedia progress and guide prefs are **device-only** (README says so) — switching phones loses them. `iso` is a pre-formatted `tr-TR` string stored in the DB (`activityLog.ts:11-16`) — a presentation concern persisted; keep `at` only and format in the UI.

**Proposed model (per-child progress + parent dashboard, multi-device):**
```
users/{playerId}/profile            { displayName, avatar, birthYear, createdAt }
users/{playerId}/progress/activities/{slug}   { best: number, plays: number, lastPlayedAt: number, totalSeconds: number, stars: 0-3 }
users/{playerId}/progress/topics/{topicSlug}  { complete: bool, favorite: bool, quizBest: number, lastVisitedAt }
users/{playerId}/skills/{skillId}   { xp: number, level: number }           # skillId: okuma, sayilar, sekiller, fen, dikkat, refleks
users/{playerId}/rewards            { stickers: {id: unlockedAt}, streakDays, lastDay: "YYYY-MM-DD" }
users/{playerId}/sessions/{YYYY-MM-DD}/{pushId}  { startAt, endAt?, slugs: [..] }   # replaces logins+visits; day-bucketed → parent view = one read per day, no limitToLast(80) truncation (activityLog.ts:86)
leaderboard/{gameSlug}/{playerId}   keep as-is (rival mechanic)
settings/{playerId}                 { dailyMinutes: 30, bedtimeStart: "20:30", allowedCategories: [...], voiceOn: true }   # parent-writable, child-readable → drives a "time's up" screen
errors/{playerId}/{pushId}          { at, slug, message, ua }               # from error.tsx
```
- Write path: keep **local-first** (`localStorage` cache keyed `dogukan-progress-{player}`), then `update()` to RTDB with multi-path updates; `onValue` subscription merges with `Math.max` for `best` as `leaderboard.ts:106` already does. Reuse `subscribeAllLeaderboards` pattern.
- Offline: RTDB SDK queues writes while offline **within a page lifetime** only; for the PWA, persist a small outbox in `localStorage` and flush on `online`.
- Parent dashboard (`/bilgi`) reads `users/dogukan/sessions/{today}`, `progress`, `skills`, `errors` — show minutes/day, top skills, streak, recent crashes. Replace the flat `fetchDogukanActivity()` with `subscribeChild(playerId)`.
- Bundle: `firebase/app` + `firebase/database` currently yields a 155 KB chunk (`out/_next/static/chunks/0mn8srupryrfa.js`, duplicated as `0xw.6_vym_akx.js`), loaded on the home page. Lazy-load it: `const { getFirebaseDb } = await import("@/lib/firebase")` inside `recordScore`/`logDogukanVisit` so the login screen does not pay for it. Adding `firebase/auth` adds ~100 KB → lazy-load too.

---

## 11. Performance

Measured from `out/` (Turbopack production build):
- JS total **1,432,691 B** across chunks; 10 scripts on `/`; largest `10u3y4bw1ayzs.js` 227 KB (React/Next runtime), `082imnxe4~qwo.js` 150 KB, two identical 155 KB Firebase chunks (`0mn8srupryrfa.js`, `0xw.6_vym_akx.js` — same size, both grep "firebase"; one is likely referenced by a different entry; check for duplicate bundling of `firebase/database` after lazy-loading), `03~yq9q893hmn.js` 112 KB, `0d3shmwh5_nmn.js` 54 KB. Each game chunk loads on demand (good).
- CSS: one 88.5 KB file from `globals.css` (4,867 lines), loaded on every route. No purge possible (hand-written). Split: move encyclopedia styles (`.encyclopedia-*`, `.topic-*`, `.fact-*`, `.word-garden`, `.parent-note`) into a CSS module imported by `kesfet/*`, and game-specific styles into the game components; or adopt Tailwind utilities (already installed) for new UI.
- Fonts: 9 woff2 (9.7–115 KB; the 115 KB `3c30d2e0bea83d70` is a Baloo latin-ext face). 4 are `<link rel=preload>`. Two families × 6 weights is heavy for a kids' UI; drop Nunito 600 or Baloo 500 to shed ~60 KB, or load one variable font.
- Images: **`dogukan.png` at repo root — 760,458 B, 4148×4080 RGBA, referenced nowhere** (`grep -rn "dogukan.png"` → 0 hits outside `ls`). Delete it (it inflates every `git clone`; pack is 1.28 MB total, so it is ~60% of the repo). `public/dogukan.jpg` — 254,625 B, 1200×1600, iPhone 13 EXIF with capture date — rendered at 96×96 (`MenuScreen.tsx:54-60`) and as a CSS background (`CelebrationProvider.tsx:112`). Because `images.unoptimized: true`, Next ships it as-is. Pre-generate `public/dogukan-192.webp` (~10 KB) + `dogukan-512.webp`, strip EXIF (privacy: location is absent but device/time metadata is present), and use `<Image unoptimized src sizes>` or `<picture>`.
- Audio: `public/sounds/*.m4a` total ~107 KB, loaded lazily by `acelyaSounds.ts`. Fine; precache in SW.
- `trailingSlash: true` + static dirs: navigation prefetch fetches `__next.*.txt` RSC payloads per route; the SW network-first rule must include `.txt` so offline back-navigation works.
- React Compiler: after fixing §6 errors, `reactCompiler: true` is the cheapest render-perf win for the 32 canvas games' React shells (their hot loops are rAF, unaffected).
- `useCanvasFit` / DPR: not audited here (other reader), but cap `devicePixelRatio` at 2 in canvas games to keep low-end Android phones at 60 fps.

---

## 12. Privacy (child-facing surfaces)

- **External links reachable by the child:** `src/app/kesfet/[slug]/page.tsx:218-225` renders `topic.sources[]` as `<a href={source.url}>` (30 URLs in `encyclopedia.ts`, e.g. nasa.gov, acs.org) inside a `<details>` labelled "Yetişkinler için kaynak ve içerik notu". It is collapsed, has no `target`/`rel`, and is one tap away for the child → the browser leaves the app (and in standalone PWA mode opens Safari/Chrome, breaking the "app" illusion). Fix: render sources as plain text (`{source.title} — {source.organization}`) for the child, and show clickable links only when `getPlayerId() === "serkan"` (needs a small client island) or only in `/bilgi`. Add `rel="noopener noreferrer"` if ever kept.
- `grep -rn "https\?://" src` outside `encyclopedia.ts` → **0 hits**; no analytics, no third-party scripts, no iframes, no `window.open`/`location.assign`. Google Fonts are self-hosted by `next/font` (no runtime request to Google). Firebase RTDB is the only network endpoint.
- `speechSynthesis` is on-device (`EncyclopediaTools.tsx:45-74`). Good for privacy; note iOS needs a user gesture per utterance and voices load async (`getVoices()` may be empty on first call — add `voiceschanged` listener).
- Firebase stores the child's login timestamps and page visits (`activity/dogukan/*`). This is parental monitoring of their own child — legitimate — but protect it with rules + anonymous auth (§9.3) and keep the DB in an EU region if possible (Turkish KVKK alignment; family use, not legally required).
- `public/dogukan.jpg` EXIF: device model + timestamps present (no GPS). Strip when regenerating.
- 404 page and error pages must not expose stack traces: Next already hides server messages in production (`error.md` §error.message); client component messages are shown — the proposed `error.tsx` should not print `error.message` to the child, only log it.
- Parent panel `/bilgi` is statically exported as `out/bilgi/index.html` with `BilgiPage` returning `null` until the client check passes (`bilgi/page.tsx:25`) — the HTML contains no data, so direct URL access by the child shows nothing. Fine.

---

## 13. Prioritised checklist for the implementation phase

**P0 — ship-blockers for "production"**
1. `src/app/error.tsx`, `src/app/aktivite/[slug]/error.tsx`, `src/app/not-found.tsx` (Turkish), `src/app/global-error.tsx`.
2. `src/app/manifest.ts` + PNG icons (`public/icons/*`, `src/app/apple-icon.png`; delete `apple-icon.svg`) + `public/sw.js` + `PwaRegister` + `/offline` page.
3. CI: lint (`--max-warnings 0` after cleanup) + `tsc --noEmit` + `vitest run` + build-output verification before deploy; PR trigger.
4. Fix the 14 lint errors (§6), delete 33 unused vars.
5. Delete `dogukan.png`; replace `public/dogukan.jpg` with EXIF-stripped WebP at 192/512.
6. Avatar tap login for the child; hashed PIN for parent (§9.2).
7. Firebase: anonymous auth + `database.rules.json` in repo + restricted API key; lazy-load the SDK.
8. Encyclopedia sources: text-only for the child (§12).

**P1 — quality**
9. Vitest suite over `menu.ts`/`registry.tsx`/`activityLearning.ts`/`guides.ts` consistency, `quizData.ts`, `encyclopedia.ts` invariants, `utils.ts`, `superBearLevelGen.ts`, `fighting/engine.ts`.
10. Split `globals.css`; trim fonts; `dynamic(..., { loading })` skeletons.
11. `export const dynamicParams = false` in `aktivite/[slug]/page.tsx`; `.env.example`; `engines`/`.nvmrc`.
12. New Firebase data model (§10) with local-first outbox; parent dashboard on day buckets; `settings/{player}.dailyMinutes` → in-app time limit screen.

**P2 — polish**
13. `reactCompiler: true` after §6.
14. iOS splash images; `statusBarStyle: "black-translucent"`.
15. Playwright mobile smoke test.
