# Map 1/5 — App shell, navigation and visual system (mobile-first)

Repo: `/home/user/dogukan` · Next 16.2.6 App Router, static export (`output: "export"`, `trailingSlash: true`, `basePath` = `/dogukan` in prod) · React 19 · Tailwind 4 imported but unused as utilities · single 4,867-line `src/app/globals.css`.
Audience of this map: the engineers who will replace the home screen with a kid-first "world map" and harden the activity shell for a 6-year-old on a phone. Line numbers are from the current HEAD (`85134cd`).

---

## 0. TL;DR (what an implementer must know in 60 seconds)

1. **The home page is a text catalogue, not a kid UI.** `MenuScreen.tsx` renders all 69 activities as 7 sections of text cards (label + 10.7px concept line + 10.5px "ansiklopedi" link), a search box, 8 filter tabs and a 2-paragraph portal banner. On a ≤480px phone `.card-grid` collapses to one column, so the list is roughly **8,500–9,000px tall ≈ 11–12 phone screens of scrolling** with ~350 words of Turkish text, none of it voiced. An emerging reader cannot use it alone.
2. **Login is a typed username + 12-char password** (`LoginScreen.tsx`, `auth.ts`: `dogukan` / `ilovemyfather`). "Oturumu açık tut" is unchecked by default so sessions die with the tab/PWA process; the child sees a password form on every launch unless the father logs him in. `Çıkış yap` sits in the header where a child will tap it.
3. **Shell is blank until JS runs.** `HomeClient` returns `null` before its effect; the pre-rendered `out/index.html` body is empty. Home loads ~820KB uncompressed JS (including the 155KB Firebase chunk) + 88.5KB CSS before anything paints. No splash, no manifest, no installable icon on iOS (`apple-icon.svg` is an unsupported format and is silently dropped).
4. **Mobile plumbing exists but is thin.** `viewport-fit=cover` + `env(safe-area-inset-*)` are applied in 9 places (`.shell`, `.activity-topbar`, `.game-touch-bar`, …), `100dvh` is used, `touch-action` is set on canvases and touch buttons. But: **zero orientation handling**, **zero `devicePixelRatio` handling** (every canvas is blurry on 2–3× phones), `backdrop-filter: blur()` on sticky bars over live canvases, and a permanently running bubble canvas (`BubbleBg`) under every page.
5. **Reusable:** fonts, `assetPath`, `sounds`, `GameSessionProvider`/`useGameRunning`, `CelebrationProvider` (needs fixes), `GameTouchBar` + `gameKeys`, `useCanvasFit` (needs generalising), the `MENU` data model, static-params routing, focus/ARIA mechanics in `IntroModal`, the `speechSynthesis` pattern in `EncyclopediaTools`. **Replace:** `LoginScreen`, `MenuScreen` layout, `.shell` fixed-height inner scroller, `BubbleBg`, the text-heavy `ActivityKnowledgePanel` placement, the `ScoreHud` rival paragraph, and the CSS monolith's size/animation discipline.

---

## 1. Runtime & deployment facts that constrain the shell

| Fact | Where | Consequence for redesign |
|---|---|---|
| `output: "export"`, `trailingSlash: true`, `images.unoptimized: true`, `basePath`/`assetPrefix` = `NEXT_PUBLIC_BASE_PATH ?? (prod ? "/dogukan" : "")` | `next.config.ts:3-12` | Every route must be enumerable by `generateStaticParams`; no server actions, no route handlers at request time, no image optimisation. All `public/` URLs must go through `assetPath()` (`src/lib/asset.ts:2-8`). Internal `<Link href>` already gets basePath automatically. |
| Deploy: GitHub Actions → `peaceiris/actions-gh-pages@v4`, `publish_dir: ./out`, `force_orphan: true`, Node 22, Firebase env from secrets | `.github/workflows/deploy-pages.yml` | Static hosting only; a service worker / manifest must be static files in `public/` or `app/manifest.ts` (Next doc: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md`). |
| Fonts: `Baloo_2` (500/600/700) as `--font-baloo` and `Nunito` (400/600/700) as `--font-nunito`, subsets `latin` + `latin-ext` | `src/app/layout.tsx:5-15` | Self-hosted by `next/font`, Turkish glyphs (ğ ş ı İ ö ü ç) covered. Keep. |
| `metadata.appleWebApp.capable = true`, `viewport = { width: device-width, initialScale: 1, viewportFit: "cover", themeColor: "#74ebd5" }` | `layout.tsx:17-39` | Emits `mobile-web-app-capable`, `apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style: default`. **No `manifest`**, **no `apple-touch-icon` link** (verified in `out/index.html` head). `src/app/apple-icon.svg` is ignored: Next only accepts `.jpg/.jpeg/.png` for `apple-icon` (`app-icons.md:26`). Only `icon.svg` is linked. |
| `<html lang="tr">`, body is bare `{children}` — no providers, no theme, no splash | `layout.tsx:46-50` | Good place to add a global `SpeechProvider`, orientation guard, install banner, and a CSS-only splash. |
| `HomePage` is a server component passing `getActivityLearningPreviews()` (69 previews) to `HomeClient` | `src/app/page.tsx:4-6` | The preview object is serialised into the RSC payload of `/`; fine, but it grows the home payload for text the child cannot read. |
| Lint: 14 React-Compiler errors / 44 warnings; none in shell components. Errors: `useGameScore.ts` (4), `Asteroids.tsx` (3), `Pong.tsx` (2), `FightingArena/FlappyBird/LaneRacer/RunnerDash.tsx` (1 each), `app/bilgi/page.tsx` (1 `set-state-in-effect`). Rules: `react-hooks/refs` 6, `preserve-manual-memoization` 4, `set-state-in-effect` 2, `purity` 2; 33× `no-unused-vars`, 11× `exhaustive-deps`. | `npx eslint src` | `HomeClient.tsx:21` and `ActivityShell.tsx:60` suppress `set-state-in-effect` with eslint-disable comments (hydration-safe storage read). |
| `tsconfig` strict, `@/* → ./src/*`; eslint = `eslint-config-next` core-web-vitals + typescript (`eslint.config.mjs`). | | |

### Public assets (`public/`)
`dogukan.jpg` (254KB, 1200×1600 iPhone photo, EXIF intact — used as the 88px/64px hero avatar and the celebration photo), `sounds/{explode,hit,laser,music-high,music-low,thrust}.m4a` (Asteroids only), `.nojekyll`, and the Next starter leftovers `file.svg globe.svg next.svg vercel.svg window.svg` (unused). Repo root `dogukan.png` (760KB, 4148×4080) is **unreferenced**. Icons live in `src/app/`: `favicon.ico`, `icon.svg` (32×32 rocket/dice mark), `apple-icon.svg` (ignored, see above).

---

## 2. Component tree by route

```
app/layout.tsx  (<html lang="tr"> + font vars + globals.css)
│
├── "/"  app/page.tsx (server) ──► HomeClient (client)            src/components/HomeClient.tsx
│     ├── <BubbleBg/>                 fixed canvas, z 0            src/components/BubbleBg.tsx
│     ├── <div class="sky-gradient"/> fixed radial gradients, z 0
│     └── <div class="shell [shell-menu]">                        min/max-height 100dvh, flex centre
│           ├── !authed → <LoginScreen onSuccess/>                 .login-card
│           └──  authed → <MenuScreen learningPreviews onLogout/>  .menu-shell (inner scroller)
│                 ├── <header class="menu-header">
│                 │     ├── .menu-header-top → .menu-hero (next/image dogukan.jpg, h1, .tagline, .stats) + .menu-header-actions (📊 Bilgi for serkan, "Çıkış yap")
│                 │     ├── .search-wrap (sr-only label + 🔍 + <input type=search>)
│                 │     └── .category-tabs (role=group; "Tümü" + 7 .tab buttons, aria-pressed)
│                 └── <main id="activity-menu-results" class="menu-body" role="region">
│                       ├── <p class="sr-only" role="status" aria-live="polite"> "N etkinlik gösteriliyor."
│                       ├── <Link href="/kesfet/" class="merak-portal">  (banner, 3 lines of copy)
│                       └── 7× <MenuSection> → section.menu-section > .section-head (sticky) + .card-grid
│                             └── per activity: article.menu-card-wrap[style=--card-accent]
│                                   ├── <Link class="menu-card"> .card-emoji + .card-copy(.card-label, .card-concept) + .card-play "▶"
│                                   └── <Link class="menu-knowledge-link" prefetch=false> emoji + topic title + "→"
│
├── "/aktivite/[slug]"  app/aktivite/[slug]/page.tsx (server; generateStaticParams from MENU; notFound on unknown)
│     └── ActivityClient (client; logs visit; getActivity(slug) from registry)
│           └── <ActivityShell key=slug slug title learning>        src/components/ActivityShell.tsx
│                 ├── <BubbleBg/> + .sky-gradient
│                 ├── <header class="activity-topbar">  (sticky, z 100, blur 12px)
│                 │     ├── <Link href="/" class="back-btn"> "← Ana sayfa"
│                 │     ├── <span class="activity-title">{title}
│                 │     └── .activity-topbar-actions → <a href="#oyunun-fikri" class="knowledge-jump-btn">💡  +  <button class="help-btn">ℹ️
│                 ├── <main class="activity-main">  (max-width 520px)
│                 │     └── <CelebrationProvider> → <GameSessionProvider active={showHelp===false}> → {Activity()}
│                 ├── <ActivityKnowledgePanel/>  section#oyunun-fikri.activity-knowledge  (parent-facing text block)
│                 └── showHelp && <IntroModal/>  .intro-overlay (z 500, role=dialog, focus trap)
│
├── "/kesfet" and "/kesfet/[slug]"  (server pages; own shell: .encyclopedia-page / .encyclopedia-topbar / .encyclopedia-skip; BubbleBg again)
│     └── EncyclopediaHub (client), EncyclopediaTools (client: 🔊 Bana oku / ☆ favori / ○ tamamla), InteractiveLab, KnowledgeCheck
│
└── "/bilgi"  app/bilgi/page.tsx (client; redirects unless player === "serkan") → .shell.shell-info > ParentInfoScreen (.info-page)
```

Key shell helper modules:
- `src/lib/auth.ts` — `PLAYERS`, `PlayerId`, `checkCredentials`, `getPlayerId`, `getPlayerDisplayName`, `getRivalId`, `isLoggedIn`, `setLoggedIn(playerId, remember)`, `logout`. Storage keys: `dogukan-logged-in`, `dogukan-player` (sessionStorage always, localStorage if remember), `dogukan-activity-login` (sessionStorage, set by `activityLog.ts`).
- `src/lib/menu.ts` — `MENU: MenuCategory[]` (`id, icon, title, accent, items[{slug,label,emoji}]`), `TOTAL_ACTIVITIES` (=69), `findActivity(slug)`. Consumed by `LoginScreen`, `MenuScreen`, `ActivityShell`, `aktivite/[slug]/page.tsx`, `ParentInfoScreen`.
- `src/lib/gameSession.tsx` — `GameSessionProvider({active})`, `useGameActive()`, `useGameBoot(onBoot)`.
- `src/hooks/useGameRunning.ts` — `useGameActive() && !isCelebrating`.
- `src/components/CelebrationProvider.tsx` — `useCelebration().show(message)`; 3.2s full-screen overlay with particle canvas + pulsing photo; toggles `body.game-celebrating`.
- `src/components/GameTouchBar.tsx` + `src/lib/gameKeys.ts` — on-screen buttons that synthesise `KeyboardEvent`s on `document` (`dispatchGameKey(code, "keydown"|"keyup")`, `matchGameKey(e, code)`); 9 layouts keyed by game id.
- `src/hooks/useCanvasFit.ts` — scales a canvas to the free viewport below the HUD, minus `.game-touch-bar` height; requires the canvas to be inside `.acelya-game` (used by 6 games).
- `src/lib/sounds.ts` — WebAudio synth (`sounds.tap/success/wrong/pop/win/star/coin/shoot/jump/spring/explode/boost/gameOver/combo/levelUp`), lazy `AudioContext`, resumes when suspended. No audio files.
- `src/lib/utils.ts` — `shuffle`, `pickRandom`, `randInt`, `normalizeSearch` (NFD, strips diacritics for search).
- `src/components/encyclopedia/EncyclopediaTools.tsx:16-74` — the **only** `speechSynthesis` usage in the app (`findTurkishVoice()`, `utterance.lang = "tr-TR"`, `rate 0.9`, `pitch 1.04`). Nothing in the menu, quizzes or games is voiced.

---

## 3. Session & login flow — friction for a 6-year-old

Flow (`HomeClient.tsx:16-34`): effect reads `isLoggedIn()` → `setSession({ready:true, authed})`; until then **renders `null`** (blank page, confirmed in `out/index.html`). Then `LoginScreen` or `MenuScreen`.

`LoginScreen.tsx`:
- Two text fields (`Kullanıcı adı`, `Şifre`), `remember` checkbox default `false` (line 13), `Giriş yap 🎉` button, error `Hatalı kullanıcı adı veya şifre.` with `sounds.wrong()` + `.shake`.
- `checkCredentials` lowercases/trims the username but compares the password exactly: `ilovemyfather` (child) / `ilovemyson` (father) — hardcoded in the client bundle (`auth.ts:1-4`); this is a gate, not security.
- `setLoggedIn` writes sessionStorage always and localStorage only if `remember`. In an iOS Home-Screen web app or after the tab is killed, sessionStorage is gone → login screen again. There is no avatar, PIN pad or "who is playing?" picker.
- No `autoCapitalize="none"`/`inputMode` hints on the username input (`LoginScreen.tsx:47-54`); `autoComplete` is set.
- Header copy the child must read before playing: "Doğukan'ın Yeri", "Okuma · Sayılar · Şekiller · Bilim · Oyunlar", "69 eğlenceli aktivite seni bekliyor!".

`MenuScreen.tsx:84-86`: `Çıkış yap` is a plain `.btn-ghost` in the header, no confirmation — one stray tap drops the child into the password form. `handleLogout` calls `logout()` and then `onLogout()` which calls `logout()` again (harmless duplicate).

`/bilgi` (`app/bilgi/page.tsx:13-23`) does its own guard via `router.replace("/")` when not `serkan` — the parent surface and the child surface share one login.

---

## 4. Home / menu anatomy on a phone (reading load, tap targets, scroll depth)

Layout chain: `.shell` (`globals.css:63-73`, `min-height: 100dvh; max-height: 100dvh; display:flex; padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))`) → `.shell-menu` (`75-79`, `overflow: hidden`) → `.menu-shell` (`254-265`, `overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; animation: popIn`). **The document never scrolls on the home page; the menu is an inner scroller clamped to the viewport.** This defeats iOS URL-bar collapse, and because `BubbleBg` re-seeds on `resize` (`BubbleBg.tsx:61-64`) the background jumps every time the on-screen keyboard opens for the search field.

Header (`.menu-header`, `267-331`, small-screen overrides `539-617`): 64px photo, `h1` 1.15rem, `.tagline` 0.78rem ("Hoş geldin Doğukan! Eğlenceli oyunlar seni bekliyor."), `.stats` 0.72rem ("69 aktivite · 7 kategori"), search input 0.9rem, 8 `.tab`s in a horizontally scrolling strip (`583-602`: `flex-wrap: nowrap; overflow-x: auto`, padding `0.35rem 0.7rem`, font `0.72rem` → **≈26px tall tap targets**). Header ≈ 250–300px before the first activity.

Portal banner `.merak-portal` (`2171-2300`, mobile `4389-4417`): 158px tall, grid `116px | 1fr`, 4 lines of copy (eyebrow 0.72rem uppercase, title clamp 1.35–2rem, body 0.75rem, CTA pill 0.76rem). Animated `portalQuestion` 4s infinite.

Sections: 7× `.section-head` (`387-415`, `position: sticky; top: 0; backdrop-filter: blur(8px)`; `h2` 0.78rem uppercase + `.count` 0.7rem). Order and sizes (from `menu.ts`): Oyunlar 24 · Serbest Oyunlar · Ebeveynle 5 · Okuma & Yazma 9 · Sayılar 9 · Şekiller & Renkler 7 · Bilim & Doğa 9 · Mantık 6.

Cards: `.card-grid` `repeat(auto-fill, minmax(160px,1fr))` → `minmax(140px,1fr)` ≤520px → **`1fr` single column ≤480px** (`2116-2119`). Each `.menu-card-wrap` = `.menu-card` (`min-height: 76px`, emoji 1.5rem, `.card-label` 0.85rem/13.6px, `.card-concept` **0.67rem/10.7px nowrap ellipsis**, `.card-play` "▶" 0.72rem) + `.menu-knowledge-link` (`min-height: 32px`, **0.66rem/10.5px**, 9-column grid). Visual accent: 4px left bar via `--card-accent` (`447-454`). Hover-only lift (`456-459`) does nothing on touch.

Scroll depth estimate at 390×844 (iPhone 13/14): header ~280 + portal ~175 + 7 heads ~280 + 69 × (76 + 32 + 7 gap ≈ 115) ≈ 7,935 → **≈ 8,700px ≈ 11–12 screens**. Nothing is grouped by difficulty or progress; all 69 cards look identical except emoji and colour bar. Each card is a `next/link` with default prefetch → up to 69 RSC prefetch requests as the child scrolls (only `.menu-knowledge-link` sets `prefetch={false}`).

Reading load: ~69 labels + 69 concept phrases + ~69 topic titles + 7 headers + 8 tabs + banner copy ≈ 350+ words, 10–14px, uppercase tracking on headers. Zero audio cues except `sounds.tap()`/`sounds.star()` on click. No images other than the father-supplied photo; everything else is platform emoji (inconsistent glyphs between iOS and Android, no control over style).

Search (`MenuScreen.tsx:23-42`) matches `label`, category title, `learning.concept`, `relatedTopicTitle` through `normalizeSearch` — useful to the father, useless to a non-typing child. Empty state: `.empty-search` "Sonuç bulunamadı. Başka bir kelime dene!".

---

## 5. Activity shell anatomy

`ActivityShell.tsx` structure and behaviour:
- `showHelp: boolean | null` starts `null`; effect sets `shouldShowGuide(slug)` (localStorage `dogukan-guide:v2:<slug>`, migrates legacy `dogukan-guide-<slug>`; `lines 20-51`). While `null` or `true`, `GameSessionProvider active={false}` → games stay paused (`useGameActive`/`useGameRunning`). Games show their own `.game-waiting` "ℹ️ Başla'ya basınca oyun başlar" banner.
- `IntroModal` (`IntroModal.tsx`): `role=dialog aria-modal aria-labelledby aria-describedby`, autofocus on `Başla! 🚀`, Tab-cycle trap, `Escape` = start, restores focus on unmount. Content: badge `{emoji} {guide.type}`, `Ne yapacaksın?` paragraph, `Nasıl oynanır?` bullet list (`guide.controls`), `Öğrenme notu:` paragraph, buttons `Başla! 🚀` / `Bir daha gösterme`. **Text-only, no voice, no pictures; appears on first visit of each of 69 slugs.** `.intro-card` `max-height: 85dvh; overflow-y: auto` (`720-729`).
- Topbar (`.activity-topbar`, `637-648`): sticky, `z-index 100`, `padding: max(8px, env(safe-area-inset-top)) 12px 8px`, `backdrop-filter: blur(12px)`. Children: `.back-btn` ("← Ana sayfa", 0.82rem, ~30px tall), `.activity-title` (0.8rem, `max-width 45%`, ellipsis), `.knowledge-jump-btn` 💡 and `.help-btn` ℹ️ both **36×36px** (`670-697`). No home icon, no sound toggle, no exit confirmation.
- `.activity-main` (`699-705`): `max-width: 520px; margin: 0 auto; padding: 12px 12px 24px; z-index 2`. Exception: `.activity-main:has(.asteroids-game)` goes full-bleed (`2036-2041`; `:has()` needs Safari ≥15.4 / Chrome ≥105).
- `.activity-main .fullscreen-game { min-height: min(72dvh, calc(100dvh - 120px)) }` (`1881-1883`).
- Below the game, always rendered: `ActivityKnowledgePanel` (`section#oyunun-fikri.activity-knowledge`, CSS `4547-4853`): ribbon "OYUN → MERAK → BİLGİ", eyebrow, h2 "Bu oyunda hangi fikri keşfediyorum?", lead, 3 note cards (Temel kavram / Gerçek hayatta nerede? / Birlikte konuşalım + "Tek bir doğru cümle aramayın…"), and a teal CTA to `/kesfet/<topic>/`. ~120–180 words of adult-register Turkish on every game page, 0.63–0.93rem. Clearly parent-facing but presented to the child in the same scroll.
- `CelebrationProvider`: `show(message)` → `sounds.win()`, spawns 8 bursts at **hard-coded 160–360 × 200–350 coordinates** on a `<canvas width=400 height=300>` stretched to the full viewport via CSS (`1552-1558`) → blurry, off-centre particles on phones; `.celebration-overlay` (`z 200`, `pointer-events: all`, `role=dialog aria-modal aria-live=assertive`, no focusable content, auto-dismiss 3.2s); `.celebration-photo` `min(280px,80vw) × min(280px,50vh)` with `photoPulse` infinite; `body.game-celebrating { overflow: hidden }`.
- `ScoreHud` (`ScoreHud.tsx`, CSS `1443-1479`): "Puan: N", "Rekor: N", then a dark `.score-hud-rival` block with "🏆 Rekorlar", "Serkan: N · Doğukan: N", "Bu oyunda lider: …" — three lines of text per game, 0.85rem.

### CSS class contract games rely on (the shell ↔ game boundary)
Root panel combos actually used (from `grep className="game-panel` in `src/activities/games`):
- `game-panel` (quiz-like DOM games), `game-panel result-panel` (end screens)
- `game-panel canvas-game` (most canvas games; fixed `width/height` attributes, `max-width:100%` CSS only)
- `game-panel canvas-game fullscreen-game` (SuperBear — **missing `acelya-game`**, so `useCanvasFit`'s `canvas.closest(".acelya-game")` returns `null` and the panel-top fallback is 0)
- `game-panel canvas-game acelya-game fullscreen-game` (Breakout, Tetris, SnakeGame, PinballCadet; Pong adds `pong-game`)
- game-specific skins: `flappy-game`, `fighting-game`, `tank-game`, `super-bear-game`, `asteroids-game`
Child classes: `.game-canvas` (`992-998`: radius, 3px white border, `touch-action: none`), `.touch-canvas`, `.acelya-hud`/`.super-bear-hud`, `.acelya-game-stage`, `.round-label`, `.game-waiting`, `.game-over`, `.btn-primary`, `.btn-ghost`, `.progress-bar/.progress-fill`, `.question-card[.correct|.wrong]`, `.q-emoji`, `.options-grid[.num-grid]`, `.option-btn[.correct|.wrong]`, `.next-btn`, `.hint-text[.success]`, `.quiz-feedback`, `.count-grid/.count-item`, `.memory-grid/.memory-card/.card-front/.card-back`, `.dpad/.dpad-mid`, `.lane-controls/.lane-btn[-accent]`, `.tank-mobile-pad/.tank-btn[.tank-fire]`, `.game-touch-bar[.layout-tetris|.layout-snake|.layout-fighting][.is-visible] > button[.touch-fire]`, `.score-hud*`, `.super-bear-victory*`, `.asteroids-*`, `.pong-stars`.
Any shell replacement must keep these selectors working or migrate the 32 game files.

### Touch bar
`GameTouchBar.tsx` layouts: `super-ayi` (◀ ↑ ▶ 👊), `flappy-bird` (single "🐤 UÇ!" spanning 4), `dovus-arenasi` (9 buttons incl. letter labels **Z X C V B**), `tetris`, `asteroids`, `pong`, `breakout`, `snake`, `pinball` ("LAUNCH"). Buttons: `min 52×52px`, `touch-action: manipulation; user-select: none` (`1707-1720`), pointer capture + `preventDefault` on pointerdown (`GameTouchBar.tsx:102-118`). `.is-visible` is always applied, so the bar also shows on desktop; the `@media (pointer: coarse), (max-width: 768px)` block at `1668-1672` is redundant. The DOM d-pad classes `.dpad`, `.lane-controls`, `.tank-mobile-pad` are three more parallel control systems.

---

## 6. CSS architecture

Single file `src/app/globals.css` (4,867 lines, 88.5KB built). `@import "tailwindcss"` at line 1 pulls Tailwind 4 preflight + theme, but **no Tailwind utility class is used anywhere in `src/`** (grep found none); all styling is hand-written BEM-ish classes. Tailwind currently only contributes a reset.

Tokens (`:root`, lines 3-22): `--bg-sky`, `--bg-sky-2`, `--bg-deep`, `--bg-card` (rgba white .92), `--border`, `--text` #1e293b, `--text-muted` #64748b, `--accent` #ff6b9d, `--accent-2` #4ecdc4, `--accent-3` #ffd93d, `--accent-4` #a78bfa, `--danger`, `--success`, `--radius` 18px, `--radius-sm` 12px, `--shadow`, `--font`, `--font-display`. Tokens are under-used: dozens of literal hexes (#2563eb, #1e40af, #64748b, #0f766e, #173f5f …). Encyclopedia pages define their own scope tokens (`--paper --ink --soft-ink --line`, `2312-2316`) and `--topic-color` per topic; cards use `--card-accent` inline. No dark mode (`prefers-color-scheme` absent).

Section order (comment headers): Login 85 · Menu 253 · Menu small-screen 538 · Activity page 631 · Intro modal 707 · Game panels 763 · Count 922 · Memory 937 · Canvas games 987 · Maze 1080 · Balloons 1110 · Puzzle 1150 · Color race 1224 · Order 1276 · Explore 1302 · Shape draw 1349 · Symmetry 1386 · Tangram 1404 · Score HUD 1442 · Celebration 1535 · Tank 1619 · Touch controls 1652 · (info page, flappy, fighting, super bear, tetris 1786-2034) · Asteroids 2035 · Merak Ansiklopedisi 2128-4542 (≈2,400 lines, half the file) · Activity knowledge card 4543-4867.

Breakpoints (there is no scale; each block picks its own):
- `@media (max-width: 520px), (max-height: 680px)` — menu compaction (`539`)
- `@media (pointer: coarse), (max-width: 768px)` — touch bar (`1668`, redundant)
- `@media (max-width: 480px)` — `.card-grid` 1 col, `.num-grid` 2 cols (`2116`)
- `@media (max-width: 900px)` and `(max-width: 620px)` — encyclopedia + portal (`4361`, `4389`)
- `@media (max-width: 620px)` — knowledge panel (`4805`)
- `@media (prefers-reduced-motion: reduce)` — **only** encyclopedia, portal, menu-card hover and knowledge link (`4523`, `4855`). Login mascot bounce, `popIn`, celebration `photoPulse`, SuperBear victory bounce, balloons `floatUp`, puzzle pulse and the `BubbleBg` canvas ignore it.
- **No `(orientation: …)` query anywhere; no `screen.orientation` / `requestFullscreen` in `src/`.**

Z-index ladder: `.bubble-canvas`/`.sky-gradient` 0 → `.shell` 1 → `.section-head` 2, `.activity-main` 2 → `.activity-knowledge` 3 → `.encyclopedia-topbar` 20 → `.super-bear-victory` 40 → `.activity-topbar` 100 → `.celebration-overlay` 200 → `.intro-overlay` 500 → `.encyclopedia-skip` 1000.

Safe area / viewport units: `env(safe-area-inset-*)` at lines 71, 380, 644, 1657, 1964, 2055, 2385 (left/right too), 2435, 4551. `100dvh` at 34, 66-67, 633, 1801, 1882, 2046, 2319; `85dvh` 722; legacy `vh` at 1571 (`50vh` celebration photo) and 1621 (`52vh` tank canvas). `body { background-attachment: fixed }` (`41`) — ignored by iOS Safari, expensive on Android.

Touch: `touch-action: none` on `.game-canvas` 997, `.draw-canvas` 1377, `.asteroids-game` 2050, `.asteroids-canvas` 2103; `manipulation` on `.lane-btn`, `.tank-btn`, `.game-touch-bar(+button)`; `user-select: none` only on `.tank-btn` and touch-bar buttons (long-press on `.option-btn`, `.menu-card`, emoji etc. will trigger iOS text-selection/callout). No `-webkit-tap-highlight-color` reset. `overscroll-behavior: contain` only on `.menu-shell`.

Hover: 17 `:hover` rules with transforms/lifts; no `@media (hover: hover)` guard, so touch devices get sticky hover states after tap.

Typography: 54 declarations under 14px; headers rely on `text-transform: uppercase; letter-spacing` at 0.63–0.78rem; body copy mostly 0.84–0.93rem. Display font Baloo 2 is used for h1/h2/buttons via `var(--font-display)`.

Focus/a11y CSS: global `:where(a, button, input, select, textarea):focus-visible { outline: 4px solid #f97316; outline-offset: 3px }` (`2144-2147`); `.sr-only` (`2132-2142`); skip link `.encyclopedia-skip` only on `/kesfet*`.

---

## 7. Orientation handling

None. Phones are used in portrait by default; the canvases are mostly portrait-logical (`320×480`, `360×520`, `340×500`, `400×720`) but four games are wide (`Pong 800×400`, `Breakout 900×560`, `PinballCadet 900×560`, `Asteroids 760×570`) and simply shrink to the 390px width (`useCanvasFit` uses `Math.min(availW/gameW, availH/gameH) * 0.98`, `useCanvasFit.ts:34-41`), making paddles and text tiny. In landscape, `.activity-main`'s 520px cap and the 100dvh-based minimums produce a cramped canvas with the topbar + touch bar eating most of the ~360px height. There is no "turn your phone" prompt, no lock attempt, no layout switch for the touch bar (side-by-side thumbs). `useCanvasFit` listens to `visualViewport.resize` but reads `window.innerHeight` (not `visualViewport.height`) for the available height.

---

## 8. Animation and performance risks (ranked)

1. **`BubbleBg` runs an unconditional `requestAnimationFrame` loop on every route** (`BubbleBg.tsx:39-56`), up to 40 stroked arcs/frame on a full-window canvas sized without DPR. Under a canvas game this is a second rAF loop; under `CelebrationProvider` a third. Not paused on `visibilitychange`, not disabled for `prefers-reduced-motion`, re-seeded on every `resize` (keyboard open/URL-bar collapse).
2. **`backdrop-filter: blur()` on sticky bars over moving content**: `.activity-topbar` 12px (`646`) sits above a 60fps canvas → continuous re-blur; 7× `.section-head` 8px (`397`) over the scrolling menu; `.encyclopedia-topbar` 18px (`2389`); `.intro-overlay` and `.super-bear-victory` 4px. On mid-range Android this is the single biggest frame-drop source.
3. **No `devicePixelRatio` scaling in any canvas** (0 hits in `src/`): bubbles, celebration particles and all 32 games render at CSS-pixel resolution and are upscaled 2–3× → blurry text/sprites, which reads as "cheap" next to Super Bear Adventure.
4. **Celebration canvas is 400×300 attributes stretched to viewport** (`CelebrationProvider.tsx:108`, CSS `1552-1558`) with hard-coded burst coordinates.
5. **Home payload**: ~820KB uncompressed JS incl. Firebase (`0xw.6_vym_akx.js` 155KB) loaded on `/` even when Firebase is unconfigured, + 88.5KB CSS, + 254KB hero JPEG for a 64px avatar; blank body until hydration (no CSS splash). `images.unoptimized` means no responsive variants.
6. **11 infinite CSS animations** (lines 131, 1127, 1176, 1578, 1998, 2228, 2521, 2994, 3434, 3443, 3602), several on `transform` of large elements (`.merak-portal-visual > span` 88px blob, `.encyclopedia-orbit-visual`), none gated by reduced-motion except the encyclopedia set.
7. `background-attachment: fixed` on `body` (`41`) + three fixed full-viewport layers (`.bubble-canvas`, `.sky-gradient`, optional `.pong-stars`).
8. `.menu-shell` `popIn` animates `transform` on the scroll container (`263`) — causes a compositor layer promote/demote each mount; minor.
9. 69 `next/link` prefetches on the menu (minor network churn on GitHub Pages).

---

## 9. Accessibility (strengths and gaps)

Strengths: `lang="tr"`; icon buttons have `aria-label`/`title` (`ActivityShell.tsx:79-96`); `IntroModal` is a proper dialog with focus trap and Escape; menu uses `role=region`, `aria-live` result count, `aria-pressed` tabs, `aria-controls`, `aria-labelledby` per section, `sr-only` search label; `QuizGame` has `role=progressbar`, `aria-live` feedback, text (not colour-only) for correct/wrong; global 4px `:focus-visible` ring; `prefers-reduced-motion` honoured on encyclopedia pages; skip link on encyclopedia pages.

Gaps that matter for a 6-year-old on a phone:
- **No speech anywhere except `/kesfet/[slug]` "Bana oku".** Menu labels, intro text, quiz prompts and feedback are read-only text.
- **Small targets**: `.tab` ≈26px tall, `.help-btn`/`.knowledge-jump-btn` 36px, `.menu-knowledge-link` 32px, `.back-btn` ≈30px, `.btn-ghost` ≈30px on mobile. Only `.menu-card` (76px), touch-bar buttons (52px), `.option-btn` (~50px), `.tank-btn` (52px), `.order-slot` (56px) and a few encyclopedia controls (44/48px) meet 44–48px.
- **Tiny type**: 10.5–13.6px in the places a child must read (card concept, knowledge link, section heads, stats, tabs, topbar title).
- **Emoji as the only iconography** (▶ ℹ️ 💡 🔍 ←): platform-dependent glyphs, uncontrollable size/colour, and `aria-hidden` in some places but not others (`ℹ️` and `💡` are the visible button content).
- Hover-only affordances (`.menu-card-wrap:hover`, `.merak-portal:hover`, `.activity-knowledge-link:hover`).
- `celebration-overlay` is `role=dialog aria-modal` with no focusable child and auto-dismiss; `aria-live=assertive` on the wrapper — screen readers get the message but focus is not managed.
- No skip link on `/` or `/aktivite/*`.
- No `user-select: none`/`-webkit-touch-callout` on tappable game DOM, so long presses open the iOS selection UI mid-game.

---

## 10. Reusable vs. replace for a kid-first world-map home

| Keep / reuse (with notes) | Replace |
|---|---|
| `layout.tsx` font setup (`Baloo_2`, `Nunito`, latin-ext), `lang="tr"`, `viewport` export (add `interactiveWidget`/consider `maximumScale` per Next `generate-viewport.md`) | `LoginScreen` → avatar tap + optional 4-digit picture PIN; default to persistent session for the child profile; move parent entry behind a long-press/gear |
| `assetPath()` — mandatory for GitHub Pages | `MenuScreen` list/search/tabs → pannable world map or 5–7 large illustrated "islands"; one giant "Devam et" tile; progress stars; no search for the child |
| `MENU` data model (`id, icon, title, accent, items`) and `findActivity`/`TOTAL_ACTIVITIES` — re-skin categories as worlds; `generateStaticParams` already derives from it | `.shell { max-height: 100dvh } + .shell-menu { overflow: hidden } + .menu-shell` inner scroller → let the document scroll or make the map a dedicated pan/zoom surface |
| `GameSessionProvider` / `useGameActive` / `useGameBoot` / `useGameRunning` pause model | `BubbleBg` → static gradient or a cheap, DPR-aware, `visibilitychange`-paused, reduced-motion-aware background; never under a running game |
| `CelebrationProvider` API (`useCelebration().show`) — fix canvas size/DPR, random burst positions, add sticker/star reward instead of photo pulse | `ActivityKnowledgePanel` placement → collapse behind an "Anne-baba" toggle or move to `/bilgi`; keep `ActivityLearning` data and the `/kesfet` CTA |
| `GameTouchBar` + `gameKeys.dispatchGameKey/matchGameKey` — swap letter labels for icons, add `layout-landscape` variants, hide on `(pointer: fine)` | `ScoreHud` rival paragraph → star/trophy icons + numbers only |
| `useCanvasFit` — generalise: drop `.acelya-game` requirement, add DPR backing-store scaling, use `visualViewport.height`, account for topbar | `.activity-topbar` text controls → ≥48px icon buttons (home, sound, help) with voice; exit confirmation for the child |
| `IntroModal` focus/keyboard mechanics — replace copy with 1 picture + 1 voiced sentence + big "Başla" | `IntroModal` content & per-slug gating (69 first-run text walls) |
| `sounds` synth library (works with iOS autoplay because calls happen inside tap handlers) | `globals.css` monolith → split (tokens / shell / games / encyclopedia), gate every infinite animation and transform hover behind `prefers-reduced-motion` and `(hover: hover)`, replace `backdrop-filter` on live-game bars with opaque backgrounds, remove Tailwind import or actually use it |
| `EncyclopediaTools.toggleSpeech` pattern (`tr-TR`, `findTurkishVoice`) → lift into a shared `useSpeak()`/`SpeechProvider` and voice menu tiles, intro, quiz prompts | Emoji-only iconography → an SVG icon set + a small set of own illustrations/sprites (at least for worlds, avatar, stars) |
| Safe-area padding patterns (`max(Xpx, env(safe-area-inset-*))`), `100dvh`, `:focus-visible` ring, `.sr-only`, `encyclopedia-skip` idea | `apple-icon.svg` → `apple-icon.png` (180×180) + `app/manifest.ts` (`display: standalone`, `orientation`, icons, `start_url: "/dogukan/"`), theme colour per world |
| `auth.ts` `PlayerId` type and storage key names (other modules — `activityLog`, `leaderboard`, `useGameScore`, `ParentInfoScreen` — depend on `getPlayerId()` returning `"dogukan" \| "serkan"`) | Hard-coded hover lifts, 10–13px type scale, 26–36px controls |
| Static route layout `/aktivite/[slug]/` and `ActivityClient` → `getActivity(slug)` registry hand-off | `HomeClient` null-until-ready → render a CSS-only splash/skeleton server-side; defer Firebase import until a game needs it |

### Concrete engineering notes for the new home
- Keep `/` as the child's map. Put the parent entry (`/bilgi`) behind an explicit adult gesture, not a header button.
- A world-map home will want: `position: relative` scroll/pan container with `touch-action: pan-x pan-y`, `overscroll-behavior: none`, tiles ≥ 96px with a single word label **and** a 🔊 tap-to-hear, progress stars read from localStorage (an `encyclopediaProgress.ts`-style module; game scores already live in `leaderboard.ts`/Firebase), and a "Devam et" hero tile for the last played slug (log it in `ActivityClient`'s effect alongside `logDogukanVisit`).
- When replacing `BubbleBg`, remove it from `HomeClient`, `ActivityShell`, both `kesfet` pages and `bilgi/page.tsx`.
- Preserve the game class contract in §5 or budget time to touch 32 game files.
- Next docs to read before touching Next-specific code (per `AGENTS.md`): `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/{manifest.md,app-icons.md}`, `01-app/03-api-reference/04-functions/generate-viewport.md`, `01-app/02-guides/static-exports.md` (dynamic routes need `generateStaticParams`; `dynamicParams: true` unsupported), `01-app/02-guides/progressive-web-apps.md` (static-export caveats at line 667).

---

## 11. Quick reference — storage keys and events touched by the shell
- `sessionStorage`/`localStorage`: `dogukan-logged-in`, `dogukan-player` (`auth.ts`), `dogukan-activity-login` (`activityLog.ts`), `dogukan-guide:v2:<slug>` + legacy `dogukan-guide-<slug>` (`ActivityShell.tsx`), encyclopedia progress in `src/lib/encyclopediaProgress.ts` (fires window event `dogukan-encyclopedia-progress`).
- `document.body.classList` toggles: `game-celebrating`.
- Synthetic `KeyboardEvent`s on `document` from `GameTouchBar` (`gameKeys.ts:25-37`).
