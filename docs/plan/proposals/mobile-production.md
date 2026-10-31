# Mobile production plan — "Doğukan'ın Yeri" as an installable kids' PWA

Author role: principal frontend engineer (kids' PWAs, Next.js).
Repo: `/home/user/dogukan` — Next 16.2.6, App Router, `output: "export"`, `basePath` `/dogukan`, GitHub Pages.
All Next facts below were checked against `node_modules/next/dist/docs/` (paths inline). Line numbers refer to HEAD `85134cd`.

This document is the **technical** track: how the app becomes a real phone app (installable, offline, fast, touch-perfect, crash-safe, tested, gated in CI) and which module architecture lets the content team rebuild the home and the learning layer **without touching the 32 game components**. Pedagogy is referenced only where it constrains architecture.

---

## 1. Vision

**First 5 minutes.** Serkan opens `https://<user>.github.io/dogukan/` on his phone once, taps the parent-only "Telefona ekle" button, and a bear icon lands on the home screen. Doğukan taps it: the app opens full-screen in portrait with a splash — no browser bar, no blank white page; the server-rendered shell paints a sky gradient and the islands in under a second. One screen asks "Kim oynuyor?" with his own photo. He taps himself; a Turkish voice says "Hoş geldin Doğukan!" (that tap also unlocks audio for the whole session). He lands on a scrollable island map, not a list: 7 big islands, each ≥ 96 px, each with a picture and one spoken word, plus a giant "Devam et" tile showing the game he played last and his stars. He taps Süper Ayı. The game shows a skeleton while its chunk loads, the canvas is crisp at native DPR, runs at the same speed on a 60 Hz and a 120 Hz phone, controls sit under his thumbs (move left, jump right, ≥ 72 px), the phone buzzes on each coin, and the topbar collapses to a single ⏸ so he cannot fall out of the game by accident. When he dies, a 2-second star card says aloud "2 yıldız! Bir yıldız daha için 10 bal topla" — not three paragraphs about a rival leaderboard.

**Day 7.** The app opens offline on the drive to school. The map shows a streak of 7 suns and three new stickers. Two islands carry a soft lock: "Harf adasında 3 yıldız kazan, Uzay açılır" — progression is the carrot, not screen time. After ~25 minutes the "Mola" screen appears, offers one 30-second voiced science capsule and a "Babanla dene" mission, and the game islands dim until tomorrow (set by the parent in `/bilgi`). Serkan, behind a 4-digit PIN, sees minutes per day, which skills moved (harf K ✓, toplama 10'a kadar 7/8), the crashes the error boundary logged, and a one-tap "Yeni sürüm yükle" when CI shipped an update. Nothing leaves the origin except the optional Firebase sync; no child-reachable page has an external link.

---

## 2. Feature list

Priority: P0 = ship-blocker for "production on a child's phone"; P1 = quality; P2 = later.
Phase: 1 = this session, 2 = next, 3 = later.

### F1. Installable PWA on the static export — P0, Phase 1
- **Why for this child:** a home-screen icon, splash and full-screen are the difference between "a website Dad shows me" and "my game".
- **How it teaches:** indirectly — removes the browser bar and every route out of the app.
- **UX:** standalone portrait, bear icon; first launch → avatar picker; later launches → map directly.
- **Next 16 facts (verified):**
  - `app/manifest.ts` returning `MetadataRoute.Manifest` is a static route handler — `01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md` ("Generate a Manifest file").
  - The injected `<link rel="manifest">` href **is** basePath-prefixed (Next source `build/webpack/loaders/metadata/discover.js:71`); the manifest **body is not** — `start_url`, `scope`, `icons[].src` must carry `/dogukan`.
  - `apple-icon` accepts only `.jpg|.jpeg|.png` — `app-icons.md:26`. The current `src/app/apple-icon.svg` is silently ignored; `out/index.html` has zero `apple-touch-icon` tags.
  - `headers()` is unsupported under export — `01-app/02-guides/static-exports.md` ("Unsupported Features") — so `Cache-Control` for `sw.js` cannot be set; GitHub Pages caches it 10 min → `updateViaCache: "none"`.
  - `01-app/02-guides/progressive-web-apps.md:667` — static export means no Server Actions → no Web Push. We skip push deliberately (it works against the "less screen time" goal).
- **Concrete `src/app/manifest.ts`:**
  ```ts
  import type { MetadataRoute } from "next";
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/dogukan" : "");
  export default function manifest(): MetadataRoute.Manifest {
    return {
      id: `${base}/`, name: "Doğukan'ın Yeri", short_name: "Doğukan", lang: "tr", dir: "ltr",
      start_url: `${base}/`, scope: `${base}/`, display: "standalone", orientation: "portrait",
      background_color: "#74ebd5", theme_color: "#74ebd5", categories: ["education", "kids", "games"],
      icons: [
        { src: `${base}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
        { src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png" },
        { src: `${base}/icons/maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    };
  }
  ```
- **Files:** create `src/app/manifest.ts`, `public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png` (80 % safe zone), `src/app/apple-icon.png` (180×180), `scripts/make-icons.mjs` (dev-only rasteriser from `icon.svg`); delete `src/app/apple-icon.svg`; modify `src/app/layout.tsx` (`appleWebApp.statusBarStyle: "black-translucent"`, keep `viewportFit: "cover"`, add `interactiveWidget: "resizes-content"` — `04-functions/generate-viewport.md:135`).
- **Risks:** wrong maskable padding crops the bear on Android → assert in `verify-out` and eyeball once. iOS ignores `orientation`.

### F2. Hand-written service worker: precache + runtime cache + offline + update flow — P0, Phase 1
- **Why:** the commute and the grandparents' house have no Wi-Fi; a game that fails to load is the moment he opens YouTube instead.
- **UX:** anything opened once works offline; never-opened games show "Bu oyun için bir kez internete bağlan 📶"; after a deploy, a small toast on the map says "Yeni oyunlar hazır — dokun" and reloads.
- **Why hand-written:** Serwist/next-pwa need webpack config; Turbopack is the default build in 16. The export is cache-friendly anyway.
- **Scope and versioning:** `public/sw.js`, `BASE = new URL(self.registration.scope).pathname` so dev (`/`) and prod (`/dogukan/`) share one file; `VERSION = "__BUILD_ID__"` replaced by CI with the short SHA.
- **Strategy table:**

  | Request | Strategy | Cache |
  |---|---|---|
  | `${BASE}_next/static/**`, `*.woff2`, `*.png|jpg|webp|svg`, `sounds/*.m4a` | cache-first (immutable, content-hashed) | `${VERSION}-assets`, LRU cap 80 |
  | `mode === "navigate"` and `__next.*.txt` RSC payloads | network-first → cache → `${BASE}offline/` | `${VERSION}-pages`, LRU cap 60 |
  | cross-origin (Firebase websockets/XHR) | pass-through, never intercepted | — |
  | non-GET | pass-through | — |

- **Precache:** `${BASE}`, `${BASE}offline/`, `${BASE}manifest.webmanifest`, icons, avatar WebP, and the home chunk graph. The graph is produced by `scripts/sw-manifest.mjs` (postbuild) which reads `out/index.html` + `out/_next/static/chunks` and writes `out/sw-precache.json`; `sw.js` fetches it during `install`.
- **Lifecycle:** `install` → `addAll(precache)` (no `skipWaiting` — we want the toast); `activate` → delete caches not starting with `VERSION`, `clients.claim()`; `message {type:"SKIP_WAITING"}` → `skipWaiting()`.
- **Registration (`src/components/pwa/PwaRegister.tsx`, mounted in `layout.tsx`):** only when `process.env.NODE_ENV === "production"`; `navigator.serviceWorker.register(assetPath("/sw.js"), { scope: assetPath("/"), updateViaCache: "none" })`; `updatefound` → `installing.state === "installed"` && `navigator.serviceWorker.controller` → show `UpdateToast`; tap → post `SKIP_WAITING`; `controllerchange` → `location.reload()`.
- **Files:** create `public/sw.js`, `src/app/offline/page.tsx` (server component, Turkish, big emoji, link to `/`), `src/components/pwa/PwaRegister.tsx`, `src/components/pwa/UpdateToast.tsx`, `scripts/sw-manifest.mjs`; modify `package.json` (`"postbuild"`), workflow (sed build id).
- **Risks:** stale HTML pointing at purged chunks → HTML is always network-first and old asset caches survive until the next `activate`; `.txt` payloads must be cached or client-side back-navigation breaks offline. Covered by Playwright `context.setOffline(true)` (F13).

### F3. Install prompt UX — P1, Phase 1
- **Android:** capture `beforeinstallprompt` in `PwaRegister` (`e.preventDefault()`, keep the event), show a **parent-facing** "📲 Telefona ekle" button in the avatar screen's parent corner and in `/bilgi`; `prompt()` on tap; hide on `appinstalled` or `(display-mode: standalone)`.
- **iOS:** no API — a 3-step picture card ("Paylaş ⎋ → Ana Ekrana Ekle ➕ → Ekle") when `navigator.standalone === false` on iPhone/iPad; dismissible, remembered in localStorage.
- **Never** shown to the child mid-play; no dark-pattern nagging.
- **Files:** `src/components/pwa/InstallCard.tsx`, `src/hooks/useDisplayMode.ts` (`useSyncExternalStore` over the media query); modify the avatar screen and `ParentInfoScreen.tsx`.
- **Risks:** `beforeinstallprompt` fires once per page life and only when criteria are met — enhancement only.

### F4. Standalone, safe-area, viewport and orientation layer — P0, Phase 1
- **Why:** Pong 800×400, Breakout/Pinball 900×560 and Asteroids 760×570 shrink to 390 px today; `.shell { max-height:100dvh }` turns the home into an inner scroller that fights iOS.
- **Orientation:** each game declares `orientation: "portrait" | "landscape" | "any"` in `ACTIVITY_META`. Landscape games show a full-screen "Telefonu çevir 🔄" card with an animated phone until `(orientation: landscape)` matches; inside the Başla tap we try `document.documentElement.requestFullscreen()` then `screen.orientation.lock("landscape")` (Android standalone; silently rejected on iOS — the card is the fallback). `GameTouchBar` gets a `layout-landscape` variant (move cluster bottom-left, action cluster bottom-right).
- **Safe area:** the 9 existing `env(safe-area-inset-*)` usages become tokens `--safe-top/--safe-bottom/--safe-x` in `src/styles/tokens.css`; topbar, touch bar, overlays and the map consume them.
- **Viewport:** document scroll on the home (drop `.shell` max-height and `.menu-shell` inner scroller); `overscroll-behavior: none` on game pages; `-webkit-tap-highlight-color: transparent`, `user-select: none`, `-webkit-touch-callout: none` on `.game-panel` and the map; `100dvh` everywhere (`vh` leftovers at `globals.css:1571,1621` removed).
- **Files:** create `src/hooks/useOrientation.ts`, `src/components/game/RotatePrompt.tsx`, `src/styles/tokens.css`; modify `src/activities/registry.tsx` (`ACTIVITY_META`), `GameTouchBar.tsx`, `ActivityShell.tsx`, `globals.css`.
- **Risks:** `orientation.lock` needs fullscreen on some Chromes; both calls stay inside the same gesture and ignore rejections.

### F5. Canvas correctness: DPR, delta-time, fit, pause — P0 (infra + 6 flagship games Phase 1; remaining games Phase 2)
- **Why:** blurry sprites and 2× speed on 120 Hz phones are what reads as "cheap" next to Super Bear Adventure.
- **`useCanvasFit` (modify `src/hooks/useCanvasFit.ts`):** `canvas.closest(".game-panel")` instead of `.acelya-game`; `visualViewport.height` instead of `innerHeight`; subtract the collapsed topbar; backing store `canvas.width = W * dpr`, `dpr = Math.min(devicePixelRatio, 2)`, `ctx.setTransform(dpr,0,0,dpr,0,0)` so drawing code stays in logical pixels; optional `{ dpr: 1 }` opt-out for engines that manage their own transforms.
- **`useGameLoop` (create `src/hooks/useGameLoop.ts`):**
  ```ts
  useGameLoop(running: boolean, step: (dt: number, nowMs: number) => void, opts?: { maxDtMs?: number /* 50 */ })
  // dt is normalised to 60 Hz units (frameMs / 16.667) so existing per-frame velocities become v * dt
  // pauses when !running, document.hidden, pagehide or blur; resumes with a 3-2-1 voiced countdown owned by GameSessionProvider
  ```
- **Pause model:** `GameSessionProvider` gains `paused`, `pause()`, `resume()`; `useGameRunning()` becomes `active && !paused && !isCelebrating`. Timer-driven engines (WhackMole `setInterval`, Asteroids engine, RoyalMatch cascades) subscribe to `useGamePaused()` to freeze their timers.
- **Shared pointer mapping (create `src/hooks/useCanvasPointer.ts`):** returns game-space coordinates from pointer events; replaces `RoyalMatch.cellFromXY`, `WhackMole scaleX`, `ShapeDraw`'s unscaled mapping.
- **Migration table (Phase 1 → Phase 2):**

  | Game | Phase | Notes |
  |---|---|---|
  | SuperBear | 1 | add `acelya-game`/fit, draw spawned particles, `fx.applyTransform` so shake shows, soften level-1 enemies via `ease` |
  | FlappyBird | 1 | dt, DPR, fit (320×480 + HUD + bar overflow 667 px today), full-width tap zone |
  | RunnerDash, LaneRacer | 1 | dt, DPR, `overRef` → state (lint) |
  | Tetris | 1 | DPR, pause, remove double `submitFinal` (`Tetris.tsx:168`) |
  | RoyalMatch | 1 | DPR, pause cascades, cache 147 gradients/frame to offscreen canvases |
  | remaining 24 canvas games | 2 | `dpr:1` flag until migrated; class contract keeps them rendering |

- **Risks:** `setTransform` conflicts with engines calling `resetTransform` (Asteroids, FightingArena) — grep before migrating; `dpr:1` opt-out covers them.

### F6. Touch targets, thumb zones, haptics — P0, Phase 1
- **Why:** a 6-year-old's thumb is imprecise and fast; 26–36 px tabs and a centred 52 px row are adult ergonomics.
- **Rules:** child-facing controls ≥ 56 px; map tiles ≥ 96 px; touch-bar buttons ≥ 72 px; one-button games get a full-width tap zone; `GameTouchBar` splits into `.zone-left` / `.zone-right` with `touch-action: none` and pointer capture per button (multi-touch already works); letter labels (Z X C V B) become SVG icons.
- **Haptics:** `src/lib/haptics.ts` → `haptic("tick"|"hit"|"fail"|"win")` = `navigator.vibrate?.(10 | 25 | [30,30,60] | [20,40,20])`, behind `progress.settings.haptics` and `prefers-reduced-motion`; exposed as `fx.haptic()` in `gameJuice.ts`; edge-triggered only (never per frame). iOS: no-op (unsupported).
- **Files:** create `src/lib/haptics.ts`, `src/styles/controls.css`; modify `src/lib/gameJuice.ts`, `src/components/GameTouchBar.tsx`; unit test asserts every `LAYOUTS` entry has ≤ 2 clusters and declared size ≥ 72.
- **Risks:** none material.

### F7. Audio unlock, master gain, mute, speech provider — P0, Phase 1
- **Why:** iOS drops the first loop- or timer-driven sound (`gameOver` from RAF, WhackMole `win` from `setInterval`, celebration from async `submitFinal`); `acelyaSounds` clones `HTMLAudio` per play (silent on iOS from RAF). And a non-reader needs *every* prompt voiced.
- **`sounds.unlock()` (modify `src/lib/sounds.ts`):** create/resume `AudioContext`, play a 1-sample silent buffer, decode the m4a files into `AudioBuffer`s (replacing `acelyaSounds` cloning); called from the avatar tap and every Başla tap; on `visibilitychange` re-resume if `state` is `"interrupted"`/`"suspended"` at the next gesture. Master `GainNode` with `localStorage["dogukan-sound"]`; chords scheduled on `ac.currentTime` instead of `setTimeout`.
- **`src/lib/speech.ts` (create):** `speak(text, { rate: 0.9, lang: "tr-TR", interrupt: true })`, `cancel()`, `onEnd`; voice cache filled on `voiceschanged` with ranking (prefer `Yelda`, Google Türkçe, any `tr-*`); single-item queue; always started inside the tap that advanced the screen (iOS rule). `SpeechProvider` (in `layout.tsx`) cancels on `usePathname` change and re-primes with an empty utterance after backgrounding. `<SayButton text size=56/>` component. `EncyclopediaTools` consumes the lib instead of its own copy.
- **Files:** modify `src/lib/sounds.ts`, `src/lib/acelyaSounds.ts`, `src/components/IntroModal.tsx`, `src/components/encyclopedia/EncyclopediaTools.tsx`; create `src/lib/speech.ts`, `src/components/SpeechProvider.tsx`, `src/components/SayButton.tsx`.
- **Risks:** iOS Safari TTS reliability — budget pre-recorded m4a for the ~60 most-repeated phrases (`public/voice/*.m4a`, `speech.ts` prefers a clip when one exists). See open question 4.

### F8. Performance budget and code-splitting — P0, Phase 1
- **Budget (enforced by `scripts/verify-out.mjs` on `out/`):**

  | Metric | Today | Budget |
  |---|---|---|
  | JS referenced by `/` | ~820 KB incl. duplicated 155 KB Firebase chunk | ≤ 250 KB |
  | CSS on `/` | 88.5 KB on every route | ≤ 35 KB |
  | First paint | blank until hydration (`HomeClient` returns `null`) | server-rendered islands |
  | rAF loops on non-game routes | 1 (`BubbleBg`) | 0 |
  | `backdrop-filter` over live canvas | 1 (`.activity-topbar`) | 0 |
  | Largest image | 254 KB avatar; 760 KB unreferenced `dogukan.png` | ≤ 40 KB |

- **Firebase lazy:** `leaderboard.ts`, `activityLog.ts`, `progress/sync.ts` call `await import("./firebase")` only when configured and about to write/subscribe — removes Firebase from the login/map route; `firebase/auth` (F12) joins the same lazy chunk.
- **Game chunks:** already `next/dynamic({ ssr:false })` (`01-app/02-guides/lazy-loading.md`); add `loading: () => <GameSkeleton/>`.
- **CSS:** `globals.css` → `src/styles/{tokens,base,shell,controls,games,quiz}.css` imported by `globals.css`; the ~2,400 encyclopedia lines → `src/app/kesfet/encyclopedia.css` imported from a new `src/app/kesfet/layout.tsx` so they ship only under `/kesfet`. Verify in `out/` that `/` does not reference it; fall back to CSS modules per encyclopedia component if Next hoists it.
- **Visuals:** delete `BubbleBg`; static `.sky` gradient + 3 CSS clouds gated by `prefers-reduced-motion`; opaque topbars; `(hover: hover)` guard on the 17 hover transforms; all 11 infinite animations gated.
- **Assets:** `public/avatar/dogukan-192.webp` + `-512.webp` (EXIF stripped); delete `dogukan.png`, starter SVGs; drop Baloo 500 and Nunito 600 (−2 woff2, ~60 KB).
- **Routing:** `export const dynamicParams = false` in `aktivite/[slug]/page.tsx` (`02-route-segment-config/dynamicParams.md`), matching `kesfet/[slug]`.
- **Files:** as listed plus `scripts/verify-out.mjs`.

### F9. Error boundaries, 404, skeletons — P0, Phase 1
- **Why:** a throw inside any of the 32 rAF loops white-screens the app; a white screen is a lost child.
- **Next 16 facts:** `error.tsx` must be a client component and receives `unstable_retry` in 16.2 (`03-file-conventions/error.md:27-30`); it wraps `page.tsx`, not its own layout (`error.md:96`); `global-error.tsx` must render `<html><body>` with inline styles and cannot export metadata (`error.md:163-165`); root `not-found.tsx` becomes `out/404.html` (`not-found.md`). `global-not-found.js` is experimental — skip.
- **UX:** "Oyun biraz yoruldu 😴" card, giant "Tekrar dene 🔁" (→ `unstable_retry()`), "Haritaya dön 🗺️"; spoken once; `sounds.wrong()` once; `error.message` never shown to the child; `{at, slug, message, ua, buildId}` appended to `localStorage["dogukan-errors"]` (ring of 20) and, when configured, Firebase `errors/{player}`; `/bilgi` lists them.
- **Component boundary:** `GameErrorBoundary` (class component, resets on `slug` key) wraps `<Activity/>` so a game crash leaves the topbar alive. Requires turning `ACTIVITY_MAP` values into components and rendering `<Activity/>` instead of calling `{Activity()}` (`ActivityClient.tsx:34`) — hooks inside a called function are a latent rules-of-hooks bug.
- **Files:** create `src/app/error.tsx`, `src/app/aktivite/[slug]/error.tsx`, `src/app/not-found.tsx` (server, storage-free, Turkish), `src/app/global-error.tsx`, `src/components/game/GameErrorBoundary.tsx`, `src/components/game/GameSkeleton.tsx`; modify `ActivityClient.tsx`, `registry.tsx`.
- **Risks:** `unstable_retry` may be renamed — wrap in a one-line `retry()` helper.

### F10. Kid login: avatar tap + parent PIN — P0, Phase 1
- **Why:** he cannot type `ilovemyfather`; `sessionStorage`-only sessions die with the PWA process; "Çıkış yap" sits where he taps.
- **UX:** "Kim oynuyor?" — Doğukan's photo (tap → logged in, persisted in localStorage by default, spoken greeting, audio unlock) and a small "Anne-Baba 🔒" corner (tap → numeric keypad, 4 digits, ≥ 64 px keys, dot feedback, shake on wrong, 3 misses → 30 s lockout "Babanı çağır 🙂"). Optional "Ebeveyn kapısı" ("17 + 26 = ?") before the keypad. Child logout only from `/bilgi`.
- **Verification:** `NEXT_PUBLIC_PARENT_PIN_HASH` = SHA-256(`pin + ":" + NEXT_PUBLIC_PIN_SALT`) computed at runtime with `crypto.subtle.digest`; fixed-length compare; `localStorage["dogukan-pin-lock"]` for lockout.
- **Compatibility:** keep `PlayerId`, `getPlayerId()`, keys `dogukan-logged-in` / `dogukan-player` so `leaderboard.ts`, `activityLog.ts`, `useGameScore.ts`, `ParentInfoScreen.tsx` are untouched. Add `useSession()` (`useSyncExternalStore`) which also removes the `set-state-in-effect` error at `bilgi/page.tsx:22` and the eslint-disable at `HomeClient.tsx:21`.
- **Files:** replace `src/components/LoginScreen.tsx` with `src/components/auth/WhoIsPlaying.tsx` + `PinPad.tsx`; modify `src/lib/auth.ts` (drop plaintext passwords; add `verifyParentPin`, `useSession`), `src/app/bilgi/page.tsx`, `src/components/HomeClient.tsx`; add `.env.example` (2 PIN vars + 7 Firebase vars); CI secret `NEXT_PUBLIC_PARENT_PIN_HASH`.
- **Risks:** the hash is public; a 4-digit PIN + lockout is a child gate, not security — README says so. `crypto.subtle` needs HTTPS/localhost (both true).

### F11. State persistence: local-first store + optional Firebase sync — P0 core Phase 1; sync Phase 2
- **Store (`src/lib/progress/store.ts`), key `dogukan-progress-v1:{player}`:**
  ```ts
  type Progress = {
    v: 1; player: PlayerId; updatedAt: number;
    activities: Record<string, { plays: number; best: number; stars: 0|1|2|3; lastAt: number; seconds: number }>;
    skills: Record<string, { xp: number; level: 1|2|3; streak: number; attempts: number; correct: number; lastAt: number }>;
    topics: Record<string, { seen: string[]; complete: boolean; favorite: boolean; lastAt: number }>;
    rewards: { stickers: Record<string, number>; streakDays: number; lastDay: string };
    days: Record<string, { seconds: number; opens: number }>;          // "YYYY-MM-DD"
    settings: { voiceOn: boolean; haptics: boolean; dailyMinutes: number; bedtime?: string };
  };
  ```
- **Access:** `useProgress(selector)` via `useSyncExternalStore` over an in-memory copy; persisted with a 300 ms debounce; `storage` event syncs tabs; SSR-safe (returns a default snapshot on the server).
- **Writes are events, reducers are pure (`src/lib/progress/reducers.ts`):** `open`, `run_start`, `run_end {slug, score, seconds}`, `level_complete`, `quiz_item {skill, correct}`, `quiz_end`, `capsule_seen`, `setting`. Star thresholds per slug in `starRules.ts`.
- **Hook points (exact, existing):** `ActivityClient.tsx:16` → `open`; `useGameScore.ts:64 resetMilestones` → `run_start` (records `startedAt`); `useGameScore.ts:37 submitFinal` → `run_end` with duration; new `scoreGame.levelComplete(level)` called at `SuperBear.tsx:362-393` and `Tetris.tsx:146`; `QuizGame.tsx:125` → `quiz_end` once `QuizGame` receives a `slug` prop from the registry.
- **Sync (`src/lib/progress/sync.ts`, lazy, Phase 2):** outbox of events in `localStorage["dogukan-outbox"]`, flushed on `online` and at start; remote `users/{player}/progress`. **Conflict strategy:** field-wise last-writer-wins by `updatedAt` for settings/favorites; **monotonic fields (`best`, `stars`, `xp`, `plays`, `seconds`) merge with `max` / replayed event sums** — the same idea `leaderboard.ts:106` already uses; a merge is commutative and idempotent (unit-tested), so no device ever loses stars.
- **Compatibility:** `leaderboard/{slug}/{player}` and `activity/dogukan/*` keep writing as today; `encyclopediaProgress.ts` becomes an adapter over `topics` and still fires `dogukan-encyclopedia-progress`.
- **Files:** create `src/lib/progress/{store,reducers,events,stars,starRules,sync,outbox}.ts`, `src/hooks/useProgress.ts`; modify `useGameScore.ts`, `activityLog.ts` (`logGameResult`), `encyclopediaProgress.ts`, `ParentInfoScreen.tsx`.
- **Risks:** Safari may evict storage after 7 days of non-use for browser tabs (not installed PWAs) — sync is the safety net; documented.

### F12. Firebase hardening — P0 (rules + lazy load Phase 1; anonymous auth when the console toggle is done)
- `signInAnonymously` once before the first write (lazy `firebase/auth`); `database.rules.json` with `.validate` shape rules for `leaderboard`, `activity`, `users/{player}`, `errors`; `firebase.json`, `.firebaserc.example`, `ROLLOUT.md` checklist (enable Anonymous Auth, paste rules, restrict API key to the Pages origin).
- Writes keep failing silently (`try/catch` + `console.warn`) so a half-done rollout never breaks play.
- **Files:** create `database.rules.json`, `firebase.json`, `.firebaserc.example`, `docs/ROLLOUT.md`; modify `src/lib/firebase.ts`.

### F13. Tests — P0, Phase 1
- **Vitest** per `01-app/02-guides/testing/vitest.md`: `vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths`; `vitest.config.mts` with `tsconfigPaths()` + `react()`, `environment: "jsdom"`, `setupFiles` stubbing `AudioContext`, `speechSynthesis`, `navigator.vibrate`, `HTMLCanvasElement.getContext`.
- **Data-integrity suite (`src/__tests__/integrity/`):**
  - every `MENU` slug ∈ `ACTIVITY_MAP` ∩ `ACTIVITY_KNOWLEDGE` ∩ `GUIDES` and vice versa (`vi.mock("server-only", () => ({}))`); slugs and emoji unique;
  - every `quizData` answer ∈ options, no duplicate options, numeric operands ≤ 20;
  - every `TOPICS` entry: 3 quiz items with valid `answer` index, 2–3 https sources, `relatedActivities` resolve via `findActivity`, `reviewedAt` parses; every `relatedTopicSlug` ∈ `TOPICS`;
  - `manifest()` yields basePath-prefixed `start_url/scope/icons` for both env values; `assetPath` matrix;
  - `public/sw.js` parses (`new Function`) and its strategy table covers `_next/static`, `.txt`, `navigate`.
- **Logic suite:** `progress/reducers` (stars, streak, merge commutativity/idempotence), `verifyParentPin` + lockout (fake timers), `superBearLevelGen` determinism, `fighting/engine`, `useGameLoop` dt clamp (fake rAF), `leaderboard.recordScore` with Firebase unconfigured, `speech.ts` voice ranking with a stubbed voice list.
- **RTL:** `WhoIsPlaying` (tap → `getPlayerId() === "dogukan"`), `PinPad` (wrong ×3 → locked), `QuizGame` retry path with mocked `sounds`/`speech`.
- **Playwright** per `01-app/02-guides/testing/playwright.md` (use `webServer`): `playwright.config.ts` → `use.baseURL: "http://localhost:4173/dogukan/"`, `webServer.command: "node scripts/serve-out.mjs"` (20-line static server mapping `/dogukan/*` → `out/*`, serving `404.html`), project `Mobile Chrome` (Pixel 7 descriptor, `hasTouch`, `deviceScaleFactor: 2`), `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` so the preinstalled `chromium-1194` is used with no download.
  1. `/` renders the avatar screen before JS (block `**/*.js` via `page.route`, assert "Kim oynuyor?"), unblock → tap Doğukan → map visible → tap Süper Ayı → `canvas` visible → tap Başla → `canvas.width ≥ clientWidth * 1.5`.
  2. `<link rel="manifest">` and `apple-touch-icon` in head; `navigator.serviceWorker.ready` resolves; `context.setOffline(true)` → reload `/` → islands still render; open a never-visited game → offline card.
  3. `/bilgi` without PIN redirects to `/`; with PIN `1234` (CI hash) shows the dashboard.
- **Files:** `vitest.config.mts`, `vitest.setup.ts`, `src/__tests__/**`, `playwright.config.ts`, `e2e/smoke.spec.ts`, `scripts/serve-out.mjs`; `package.json` scripts `test`, `test:watch`, `typecheck`, `e2e`, `verify-out`.
- **Risks:** CI needs Playwright system deps → run the `check` job in `mcr.microsoft.com/playwright:v<matching>-jammy` or `npx playwright install-deps chromium`.

### F14. CI gates — P0, Phase 1
- Replace the single job in `.github/workflows/deploy-pages.yml`:
  ```yaml
  on: { push: { branches: [main, master] }, pull_request: {}, workflow_dispatch: {} }
  jobs:
    check:   # lint --max-warnings 0 → typecheck → vitest run → build (NEXT_PUBLIC_BASE_PATH=/dogukan) → verify-out → playwright e2e; caches .next/cache; uploads out/
    deploy:  # needs: check; if: github.event_name != 'pull_request'; rebuild with Firebase + PIN secrets; sed __BUILD_ID__ → ${GITHUB_SHA::7} in out/sw.js; peaceiris/actions-gh-pages@v4
  ```
- `permissions: contents: write` only on `deploy`; `concurrency` per ref; `.next/cache` per `01-app/02-guides/ci-build-caching.md`; `engines.node >= 20.9`, `.nvmrc` = 22.
- `next build` no longer lints in 16 (`01-app/02-guides/upgrading/version-16.md`, "next lint Command") — the explicit eslint step is the gate.
- **Risks:** `--max-warnings 0` requires the 33 unused-vars deletions (F15) in the same PR.

### F15. Fix the 14 React-Compiler lint errors structurally — P0 Phase 1; `reactCompiler: true` — P2 Phase 2
- No rule is disabled. Fixes:
  - `react-hooks/refs` ×6 — `Asteroids.tsx:64,65,81`: move `runningRef.current = running` and the `hooksRef` bridge into `useEffect`; `FightingArena.tsx:1069`, `LaneRacer.tsx:274`, `RunnerDash.tsx:260`: mirror `announceRef`/`overRef` into `useState<"crash"|"time"|null>` set where the ref is set.
  - `react-hooks/purity` ×2 — `Pong.tsx:55-56`: `reset` → `useCallback` invoked only from `useGameBoot`/handlers; ball randomisation moves into `serveBall()` called from the loop.
  - `react-hooks/set-state-in-effect` ×2 — `FlappyBird.tsx:75`: delete `best` state, render `Math.max(scoreGame.selfHigh, score)`; `bilgi/page.tsx:22`: `useSession()` (F10).
  - `react-hooks/preserve-manual-memoization` ×4 — `useGameScore.ts:38,46,50,61`: `const [player] = useState(() => getPlayerId())` (also stops reading storage during render), memoise `CelebrationProvider`'s context value with `useMemo`, drop the manual `useCallback`s.
  - Warnings: delete 33 unused vars (SuperBear/Flappy's unused `drawParticles` are drawn instead of deleted); the 11 `exhaustive-deps` move sim closures to `useEffectEvent` (React 19.2, `version-16.md:403`).
- **Phase 2:** `npm i -D babel-plugin-react-compiler`, `reactCompiler: true` (`05-config/01-next-config-js/reactCompiler.md:16-23`); if the Babel pass hurts build time use `compilationMode: "annotation"` with `"use memo"` on the shell components.
- **Files:** the 7 game/hook files above, `CelebrationProvider.tsx`; `eslint.config.mjs` unchanged.

### F16. World-map home + progression architecture — P0 shell Phase 1; content Phase 1–2
- **Goal:** the content team builds islands, stars, stickers and quests while the 32 game components stay untouched. Everything hangs off two existing seams: `MENU` (`src/lib/menu.ts`) and `useGameScore`.
- **Modules:**
  ```
  src/lib/worlds.ts                      // World[] derived from MENU: id, name, illustration, accent, slugs[], unlock rule, map position
  src/lib/progress/*                     // F11 store, reducers, starRules
  src/lib/quests.ts                      // daily quest templates ("3 oyun oyna", "bir kapsül dinle"); pure; date-seeded
  src/lib/rewards.ts                     // sticker catalogue (id, art, how to earn); pure
  src/components/map/WorldMap.tsx        // server-renderable skeleton (islands + labels in HTML) + client overlay for stars/locks
  src/components/map/IslandTile.tsx      // ≥96px, picture, one word, SayButton, star row, lock badge
  src/components/map/ContinueTile.tsx    // last slug by progress.activities[*].lastAt
  src/components/map/{QuestBar,StickerAlbum,StreakSun}.tsx
  src/components/game/GameFrame.tsx      // collapsed topbar (⏸ 🔊), pause overlay, RotatePrompt, GameErrorBoundary, RunEndCard
  src/components/game/RunEndCard.tsx     // voiced "2 yıldız! Bir yıldız daha için …"; replaces ScoreHud rival text
  src/activities/registry.tsx            // ACTIVITY_MAP values become components; ACTIVITY_META[slug] = { orientation, kind: "canvas"|"quiz"|"explore", parentOnly? }
  ```
- **Home flow:** `page.tsx` (server) renders the island skeleton from `MENU` so first paint is not blank; `HomeClient` shows `<WhoIsPlaying/>` or hydrates the `<WorldMap/>` overlay. The map is a normal scrolling document (7 islands ≈ 2.5 screens, `scroll-snap` per island); no search, no tabs. Parent entry: long-press the sun in the corner.
- **Celebration:** `show(message, { mode: "toast" | "full" })` — toasts for mid-run milestones (non-blocking), full for run end; canvas sized to viewport with DPR, random burst origins. `useCelebration().show(message)` keeps working for the 23 callers.
- **Files:** as above; modify `HomeClient.tsx`, `ActivityShell.tsx` (composes `GameFrame`), `ScoreHud.tsx` (icon-only), `CelebrationProvider.tsx`; delete `MenuScreen.tsx`.
- **Risks:** island art is the largest visual lift — Phase 1 ships 7 SVG islands; a sprite/illustration pass is Phase 2. Unlock rules must never lock the Devam tile or the "Ebeveynle" world for the father.

### F17. Time budget and "Mola" — P1, Phase 2
- `progress.settings.dailyMinutes` (default 30) and optional `bedtime`, parent-editable in `/bilgi`; `GameFrame` accrues `days[today].seconds` while running; at the limit a voiced Mola screen offers one capsule and a mission, and game islands dim until the next day; map and capsules stay available. Soft by design.
- **Files:** `src/lib/progress/timeBudget.ts`, `src/components/MolaScreen.tsx`, `ParentInfoScreen.tsx`.

### F18. Icon set and illustration pipeline — P1 minimal Phase 1, full Phase 2
- Inline SVG `Icon.tsx` (~20 icons, `currentColor`) replaces ▶ ℹ️ 💡 🔍 ← so iOS and Android match; emoji remain content only. Phase 2: sprite atlas for SuperBear/Flappy characters (`public/sprites/*.png`, pre-rendered to offscreen canvases).

---

## 3. Phase 1 scope — ~8 engineers, one session

Session goal: the app is **installable, offline-capable, crash-safe, tested, gated in CI, and the child can log in, navigate and play six flagship games with a controller-grade feel** — while the content team starts replacing learning content on the new seams.

| # | Stream | Deliverables | Done when |
|---|---|---|---|
| 1 | **PWA core** (F1, F2, F3) | `app/manifest.ts`, icons, `apple-icon.png`, `public/sw.js`, `offline/page.tsx`, `PwaRegister`, `UpdateToast`, `InstallCard`, `scripts/sw-manifest.mjs`, layout metadata | `out/manifest.webmanifest` basePath-correct; Lighthouse "installable" passes against `scripts/serve-out.mjs`; offline reload of `/` and one visited game passes in Playwright |
| 2 | **Shell & map** (F16 shell, F4 home, F18 minimal) | `worlds.ts`, `WorldMap`, `IslandTile`, `ContinueTile`, `StreakSun`, `Icon.tsx`, server-rendered skeleton in `page.tsx`; delete `MenuScreen`/`BubbleBg`/portal banner; document scroll | `/` paints islands without JS; every tile ≥ 96 px with `SayButton`; map ≤ 3 screens at 390×844; zero rAF on `/` |
| 3 | **Login & session** (F10) | `WhoIsPlaying`, `PinPad`, `auth.ts` (`verifyParentPin`, `useSession`), `bilgi/page.tsx`, `.env.example`, PIN secret in CI | one-tap child login survives process kill; PIN lockout works; both `set-state-in-effect` errors gone |
| 4 | **Game frame & input** (F4 game part, F6, F7 audio) | `GameFrame`, collapsed topbar, pause overlay + countdown, `RotatePrompt`, `useOrientation`, thumb-zone `GameTouchBar`, `haptics.ts`, `sounds.unlock()`/master gain, `acelyaSounds` → AudioBuffer, `CelebrationProvider` toast + DPR canvas, `RunEndCard`, icon-only `ScoreHud` | no accidental exit during play; targets ≥ 72 px; first sound on iOS plays after Başla; celebration no longer freezes action games |
| 5 | **Canvas infra & flagship migration** (F5) | `useCanvasFit` DPR/visualViewport, `useGameLoop`, `useCanvasPointer`, `gameSession` pause; migrate SuperBear, FlappyBird, RunnerDash, LaneRacer, Tetris, RoyalMatch; fix SuperBear class, shake transform, undrawn particles | six games crisp at DPR 2–3; identical speed at 60/120 Hz (fake-rAF unit test on `useGameLoop`); pause on `visibilitychange` |
| 6 | **Progress store & score seam** (F11) | `progress/{store,reducers,events,stars,starRules,outbox}`, `useProgress`, `quests.ts`, `rewards.ts`, hooks in `useGameScore`, `QuizGame` `slug` prop, `activityLog.logGameResult`, `encyclopediaProgress` adapter, Tetris double-submit fix | reducers 100 % unit-tested incl. merge laws; stars appear on the map after a run; `/bilgi` shows minutes/day and skills |
| 7 | **Quality gates** (F9, F13, F14, F15, F8 budget) | `error.tsx` ×2, `not-found.tsx`, `global-error.tsx`, `GameErrorBoundary`, `GameSkeleton`, `<Activity/>` fix, Vitest config + suites, Playwright config + 3 smokes on `/opt/pw-browsers`, `verify-out.mjs`, `serve-out.mjs`, two-job workflow, 14 lint fixes, 33 unused vars, `dynamicParams=false`, `.nvmrc`, `engines` | `lint --max-warnings 0`, `tsc`, `vitest`, build, verify-out, e2e all green in `check` on a PR |
| 8 | **Speech & perf plumbing** (F7 speech, F8, F12) | `speech.ts`, `SpeechProvider`, `SayButton`, `EncyclopediaTools` on the shared lib; lazy `firebase.ts` + anonymous auth + rules; `globals.css` → `styles/*` + `kesfet/encyclopedia.css` via `kesfet/layout.tsx`; WebP avatar; delete `dogukan.png`/starter SVGs; drop two font weights; reduced-motion + `(hover:hover)` sweep; encyclopedia sources as text for the child | `/` JS ≤ 250 KB and CSS ≤ 35 KB in `verify-out`; `speak()` works on first tap on iOS Safari and Chrome Android (manual); zero child-reachable `<a href="http` |

**Contracts frozen in hour 1 (`docs/CONTRACTS.md`):**
1. `ACTIVITY_META[slug]` shape and component-valued `ACTIVITY_MAP` (streams 2, 4, 5, 7).
2. `progress` event union and `useProgress` selector API (streams 2, 4, 6, 8).
3. `speech.speak/cancel`, `SayButton` props, `sounds.unlock()` (streams 2, 3, 4, 8).
4. `GameFrame` props and the preserved CSS class contract — `.game-panel`, `.canvas-game`, `.fullscreen-game`, `.acelya-game`, `.game-canvas`, `.game-touch-bar[.layout-*]`, `.score-hud*`, `.game-over`, `.btn-primary` — so the 24 non-migrated games still render.
5. Storage keys: `dogukan-progress-v1:{player}`, `dogukan-outbox`, `dogukan-sound`, `dogukan-pin-lock`, `dogukan-errors`; existing keys untouched.

**Integration order:** streams 3 and 7 land first (they touch `auth.ts`, `ActivityClient.tsx` and the workflow everyone needs) → 5 and 6 (hooks) → 2, 4, 8 → stream 1 last because `sw-manifest.mjs` reads the final `out/`. Stream 7's engineer owns the merge queue and runs the full gate after each merge.

**Explicitly not in Phase 1:** `reactCompiler: true`; migrating the other 24 canvas games to `useGameLoop`; illustration/sprite atlas; Firebase flush of the progress outbox (written, flush stubbed); Mola/time budget; iOS splash images; Web Push (never).

---

## 4. What to remove or demote

| Item | Action | Why |
|---|---|---|
| `src/components/LoginScreen.tsx`, `checkCredentials`, plaintext passwords `auth.ts:1-4` | **Remove** | Untypeable by the child; parent password in the public bundle. Replaced by avatar + hashed PIN. |
| `src/components/MenuScreen.tsx` (search, 8 tabs, 69 text cards, portal banner, header `Çıkış yap`) | **Remove** | 11–12 screens of 10–14 px text; search/tabs are adult navigation; logout where the child taps. Replaced by `WorldMap`. |
| `src/components/BubbleBg.tsx` on every route | **Remove** | Unconditional rAF under every game and celebration, no DPR, re-seeds on keyboard open. Static gradient + reduced-motion CSS clouds. |
| `backdrop-filter` on `.activity-topbar`, 7× `.section-head`, `.encyclopedia-topbar` | **Remove** | Continuous re-blur over 60 fps canvases on mid-range Android. Opaque bars. |
| `.shell { max-height:100dvh }` + `.menu-shell` inner scroller; `body { background-attachment: fixed }` | **Remove** | Fights iOS URL-bar collapse; costs paint on Android. |
| `ScoreHud` rival paragraph | **Demote** to icon-only stars/numeral; rival shown in `/bilgi` and as a trophy on the run-end card | Three lines of text a non-reader cannot use; duplicates the in-canvas score. `leaderboard.ts` data stays. |
| `ActivityKnowledgePanel` under every game | **Demote** behind parent mode (long-press 💡) and `/bilgi`; child hears only the one-line `talkQuestion` | 120–180 words of 9th-grade Turkish on the child's screen. `activityLearning.ts` data stays. |
| `IntroModal` text wall on 69 first visits | **Demote** to one picture + one voiced sentence + giant Başla (keep focus-trap); auto-skip for `kind: "quiz"` | A reading gate in front of every game; also the natural `sounds.unlock()` point. |
| Blocking 3.2 s `CelebrationProvider` modal mid-run | **Demote** to toast; full overlay only at run end | Freezes SuperBear/Flappy mid-run. |
| Duplicate items `hizli-matematik`, `kelime-avcisi`, `hedef-vur`; unused pools `Q.gezegenler`, `Q.hayvanlar` | **Remove** (content team confirms; integrity test enforces no orphans) | Inflate "69 aktivite" without variety; also drops 3 `ACTIVITY_KNOWLEDGE`/`GUIDES` entries. |
| `src/app/apple-icon.svg`, `public/{file,globe,next,vercel,window}.svg`, root `dogukan.png` (760 KB), EXIF-bearing `public/dogukan.jpg` | **Remove / replace** | Ignored by Next, unreferenced, or 25× too large for a 96 px slot; the PNG is ~60 % of the git pack. |
| Clickable source links `kesfet/[slug]/page.tsx:218-225` | **Demote** to plain text for the child; links only in parent mode | One tap leaves the standalone app for nasa.gov in Safari. |
| Firebase SDK on the home route | **Demote** to lazy import inside write paths | 155 KB (duplicated) on the login screen even when unconfigured. |
| Baloo 500 + Nunito 600 | **Remove** | Two of nine woff2 (~60 KB) for weights the new UI will not use. |
| `window.location.reload()` restarts in `CountGame`, `OrderGame`, `SymmetryGame`, `TangramLite` | **Remove** (reset state in place) | Full navigation on Pages, re-shows IntroModal, re-logs a Firebase visit each time. |
| `{Activity()}` call in `ActivityClient.tsx:34` | **Replace** with `<Activity/>` | Hooks invoked inside a plain call; blocks the per-game error boundary. |

---

## 5. Open questions for the father

1. **Parent PIN delivery:** only a hash ships in the build. Is a 4-digit PIN set once as a GitHub secret acceptable, or should it be changeable inside `/bilgi` (then it must live in Firebase `settings/serkan.pinHash`, which needs the anonymous-auth step)?
2. **Firebase console access during this session:** can you (a) enable Anonymous Authentication and (b) paste `database.rules.json` into the Realtime Database rules? If not, rules ship in-repo and today's unauthenticated writes continue until you do; nothing breaks either way.
3. **Phone targets:** Android or iPhone, which model? It decides whether `screen.orientation.lock` and `navigator.vibrate` work (Android only) and whether pre-recorded voice is needed instead of TTS (iOS Safari's Turkish TTS is less reliable after backgrounding).
4. **Voice:** would you record ~60 short phrases in your own voice (island names, "Aferin", "Bir daha dene")? The pipeline supports m4a with TTS fallback; a familiar voice is the strongest engagement lever we cannot code.
5. **Daily time budget:** 30 minutes of game time per day with capsules unlimited — confirm or set, and whether a bedtime window should dim the games.
