# Game infrastructure map — "Doğukan'ın Yeri"

Reader #2 of 5. Area: game-infra. All paths relative to `/home/user/dogukan`.
Written for an engineer who has not read the code. Turkish strings are quoted as-is.

---

## 0. One-paragraph summary

Every canvas game is a single `"use client"` React component (e.g. `src/activities/games/SuperBear.tsx`) that owns a `<canvas>` with a fixed logical size, keeps all simulation state in `useRef`s, mirrors a few values (`score`, `over`, `level`) into `useState` for the DOM HUD, and runs a `requestAnimationFrame` loop inside a `useEffect` keyed on `running`. Shared infra is thin: a session context that gates "running" on the intro modal (`src/lib/gameSession.tsx`), a celebration overlay that also pauses games (`src/components/CelebrationProvider.tsx`), a score hook that persists per-game high scores to localStorage + optional Firebase and fires celebrations (`src/hooks/useGameScore.ts` + `src/lib/leaderboard.ts`), a keyboard-event-synthesizing touch bar (`src/components/GameTouchBar.tsx` + `src/lib/gameKeys.ts`), two tiny sound libs (`src/lib/sounds.ts` WebAudio beeps, `src/lib/acelyaSounds.ts` m4a samples), and two particle/juice helpers (`src/lib/gameJuice.ts`, `src/lib/particles.ts`). There is **no** progression/XP layer, **no** haptics, **no** delta-time, **no** DPR scaling, **no** pause-on-background, **no** audio unlock on a gesture, and **no** shared "level complete" event. Those gaps are listed with exact hook points in §6–§8.

---

## 1. Page shell and lifecycle (boot → loop → pause → game over)

### 1.1 Route and wrappers

| Layer | File | What it does |
|---|---|---|
| Server page | `src/app/aktivite/[slug]/page.tsx` | `generateStaticParams()` from `MENU` (`src/lib/menu.ts`); resolves `findActivity(slug)`, `getActivityLearning(slug)`; renders `<ActivityClient>`. |
| Client page | `src/app/aktivite/[slug]/ActivityClient.tsx` | `useEffect(() => logDogukanVisit(slug, title))` (line 16–18) — **the existing "activity opened" event**. Looks up component factory `getActivity(slug)` from `src/activities/registry.tsx` (`ACTIVITY_MAP: Record<string, () => React.ReactNode>`, line 67). Renders `<ActivityShell key={slug}>{Activity()}</ActivityShell>`. |
| Shell | `src/components/ActivityShell.tsx` | Top bar (`.activity-topbar`, sticky, `← Ana sayfa` back link, `💡` jump to knowledge card, `ℹ️` help button), `<main className="activity-main">` wrapping `<CelebrationProvider><GameSessionProvider active={showHelp === false}>{children}</GameSessionProvider></CelebrationProvider>` (line 162–164), then `<ActivityKnowledgePanel>` and the `<IntroModal>` when `showHelp`. |
| Intro modal | `src/components/IntroModal.tsx` | Shows `guide.intro`, `guide.controls[]`, `guide.learn` (type `Guide` in `src/lib/guides.ts`). Buttons: `Başla! 🚀` (`.btn-primary`, calls `onStart`) and `Bir daha gösterme` (`.btn-ghost`, persists `localStorage["dogukan-guide:v2:<slug>"]="1"`). Esc also starts. |

All canvas games are loaded via `next/dynamic(..., { ssr: false })` in `registry.tsx` lines 13–47, so they never render on the server. Quiz-style activities (`QuizGame`, `CountGame`, `OrderGame`, …) are statically imported.

### 1.2 Session gating: `src/lib/gameSession.tsx`

```ts
GameSessionProvider({ active, children })      // line 12 — active = intro dismissed
useGameActive(): boolean                        // line 24
useGameBoot(onBoot: () => void)                 // line 29 — runs onBoot ONCE, the first time active becomes true
```

`useGameBoot` uses a `booted` ref so a game's `reset()` is called exactly once after the "Başla!" click (or immediately if the guide was suppressed). Later restarts go through the game's own "Tekrar oyna" button → `reset()` directly.

### 1.3 Running flag: `src/hooks/useGameRunning.ts`

```ts
export function useGameRunning() { return useGameActive() && !useCelebration().isCelebrating; }
```

`running` is the single boolean every loop checks. It becomes `false` for 3.2 s whenever a celebration overlay shows (see §2.3). Because games put `running` in the deps of the loop `useEffect`, a celebration **unmounts and remounts the RAF loop and keyboard listeners** (state survives in refs). Example: `SuperBear.tsx:170–545` (`useEffect(..., [running, over, campaignDone, jump, punch, scoreGame, applyLevelData])`).

### 1.4 Canonical component skeleton (as in SuperBear / FlappyBird / RoyalMatch / WhackMole / Tetris)

```
const active = useGameActive(); const running = useGameRunning();
const canvasRef = useRef<HTMLCanvasElement>(null);
const [score, setScore] = useState(0); const [over, setOver] = useState(false);   // DOM mirror
const scoreGame = useGameScore(GAME_SLUG);                                         // §2
const submitted = useRef(false);
…many useRef()s for sim state (px, vy, scoreRef, overRef, frame, particles, juiceRef = useRef(createGameJuice()))
useCanvasFit(canvasRef, W, H, { hudRef })        // only fullscreen games, §3.3
const reset = useCallback(() => { …zero refs…; setScore(0); setOver(false); submitted.current = false; scoreGame.resetMilestones(); }, [scoreGame]);
useGameBoot(reset);                              // BOOT
useEffect(() => { if (over && !submitted.current) { submitted.current = true; void scoreGame.submitFinal(score); } }, [over, score, scoreGame]);   // GAME OVER → score
useEffect(() => {                                // LOOP
  if (!running || !canvas || over) return;
  attach keydown/keyup (matchGameKey) and/or canvas pointer/touch listeners
  const loop = () => { if (!running || overRef.current) return; frame.current++; …sim…; …draw…; fx.update(); fx.draw(); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); remove listeners; };
}, [running, over, …callbacks]);
return (
  <div className="game-panel canvas-game [acelya-game fullscreen-game] <game>-game">
    <ScoreHud score selfHigh rivalHigh rivalName playerName />      // §2.4
    <p className="round-label">…controls hint…</p>
    {!active && <p className="game-waiting">ℹ️ Başla'ya basınca …</p>}
    <canvas ref width={W} height={H} className="game-canvas touch-canvas <game>-canvas" />
    <GameTouchBar gameId="…" />                                      // §3.1, only keyboard-driven games
    {over && <div className="game-over"><p>… Skor: {score}</p><button className="btn-primary" onClick={reset}>Tekrar oyna</button></div>}
  </div>
);
```

Per-game lifecycle specifics:

- **SuperBear** (`src/activities/games/SuperBear.tsx`, 595 lines; constants in `superBearConstants.ts` `VIEW_H=520`, `GROUND_Y=448`; level gen in `superBearLevelGen.ts` `buildProceduralLevel(level)` seeded with `mulberry32(level*9773+42)`, `MAX_LEVELS=100`, `VIEW_W=360`). States: `over`, `campaignDone`, `level`, `lives`. Inter-level pause is a frame counter `interLevelRef.current = 85` (line 390) then `levelRef.current += 1; applyLevelData(...)` (line 214–216). Final victory `victoryAnimRef = 140` frames (line 387) then `setCampaignDone(true)` → `.super-bear-victory` fixed overlay (line 571–584) with `Baştan oyna`. Game over when `livesRef.current <= 0` (lines 264–267, 335–338) → `sounds.gameOver()`; `.game-over` DOM block with `Tekrar dene` (line 585–591).
- **FlappyBird** (`FlappyBird.tsx`, 313 lines): `W=320,H=480`; `ready` state (bird bobbing, text `Dokun veya Space — uç! 🐤` drawn on canvas line 258) → first flap starts physics. Game over drawn on canvas (line 261–269) **and** as `.game-over` DOM (line 303–310). Loop keeps running after death (ground keeps scrolling) because the guard is `if (!running) return` only.
- **RoyalMatch** (`RoyalMatch.tsx`, 549 lines): turn-based, `MOVE_LIMIT=30`, `done` instead of `over`; cascade/fall animation is a nested RAF `animate()` inside `removeAndCollapse()` (line 160–203) plus `setTimeout(…, 200)` chains — independent of the main loop and **not paused by `running`**.
- **WhackMole** (`WhackMole.tsx`): `DURATION` seconds via `setInterval(…, 1000)` (line 100–111) → `setDone(true); sounds.win()`. Loop effect runs even when `!running` (draws idle board), only sim is gated.
- **Tetris** (`Tetris.tsx`): time-based drop (`performance.now()`, `dropMsRef` 600→80 ms, line 146–147), level = `1 + floor(lines/10)`. Game over inside `spawn()` on collision (line 160–170) calls `submitFinal` directly **and** again via the `over` effect (guarded by `submitted` only in the effect — the direct call at line 168 is unguarded, so Tetris may submit twice; harmless because `recordScore` is idempotent for non-records).
- **Asteroids** (`Asteroids.tsx` + `asteroids/mountClassicAsteroids.ts`): the exception — an imperative engine mounted once with a hooks object (`AsteroidsHooks { onScore, onGameOver, onNewGame, getHighScore, setHighScore }`), uses `setInterval(update, 1000/FPS)` not RAF, and `document` key listeners. Shows the "engine + hooks" alternative pattern that a progression system could also target.

### 1.5 Pause semantics (what exists, what does not)

- Pause sources: intro modal (`active=false`) and celebration (`isCelebrating`). Both flow through `useGameRunning()`.
- There is **no** `visibilitychange`/`pagehide`/`blur` handling anywhere in `src` (grep confirmed). RAF stops in background tabs by browser policy, but `setInterval` timers (WhackMole countdown, Asteroids engine, RoyalMatch cascades) keep ticking → a 30 s round can expire while the phone is locked.
- No explicit pause button; no "resume countdown" after a pause.

---

## 2. Scores: recording, persistence, celebration

### 2.1 `src/hooks/useGameScore.ts` — the per-game API (what every game imports)

```ts
const scoreGame = useGameScore(gameSlug);
scoreGame.player         // PlayerId | null ("dogukan" | "serkan"), read from sessionStorage/localStorage via getPlayerId() during render
scoreGame.playerName, rivalName
scoreGame.selfHigh, rivalHigh          // live, via fetchGameScores + subscribeGameScores (Firebase onValue) on mount
scoreGame.submitFinal(score): Promise<ScoreResult | undefined>   // line 37 — THE game-over hook
scoreGame.checkMilestone(currentScore): Promise<void>            // line 49 — mid-game, throttled to once per 12 s (lastCheckAt)
scoreGame.resetMilestones()                                      // line 64 — call in reset()
```

Used by 23 of the 30 canvas games (`grep -l useGameScore src/activities/games`), **not** by any quiz/shared activity (`src/activities/shared/QuizGame.tsx` only plays `sounds.success/wrong/win` and keeps a local `score` state; see line 110–128).

### 2.2 `src/lib/leaderboard.ts` — persistence + rivalry logic

- Local: `localStorage["dogukan-scores-<player>"]` = `{ [gameSlug]: high }` (`PREFIX="dogukan-scores"`, line 8). `getScores`, `getHighScore`, `setLocalScore`.
- Remote (optional): Firebase RTDB `leaderboard/<gameSlug>/<player>` (`leaderboardRef` in `src/lib/firebase.ts:256`). Disabled when `NEXT_PUBLIC_FIREBASE_API_KEY`/`DATABASE_URL` missing (`isFirebaseConfigured()`); all reads wrapped in try/catch → `console.warn("Firebase skor okunamadı:")`.
- `recordScore(gameSlug, player, score): ScoreResult` (line 152): fetches both players' highs, computes `isNewRecord`, `beatRival` (`score > rivalScore && rivalScore > 0`), writes local + remote only if new record, returns `{ score, isNewRecord, beatRival, celebrate, message }`. Messages (line 124–150): `Harika ${name}! Yeni rekor ve ${rival}'ı geçtin! 🏆`, `Aferin ${name}! Yeni rekor: ${score}! 🎉`, `Süpersin ${name}! ${rival}'ı yakaladın! 🔥`.
- `checkLiveMilestone(...)` (line 183): celebrates passing own record (`Eski rekorunu geçiyorsun! 🚀`), passing rival (`${rival}'ı geçtin! 🏆`), or fixed marks `[500, 1000, 2500, 5000, 10000]` (`${m} puan! ⭐`). Note the marks are tuned for high-scoring games; Flappy (score = pipes) never hits them.
- `subscribeAllLeaderboards`, `getAllLeaderboards` feed the parent panel (`/bilgi`).

### 2.3 Celebration: `src/components/CelebrationProvider.tsx`

- `useCelebration(): { show(message), isCelebrating }`. `show()` spawns confetti (`spawnBurst` ×8), plays `sounds.win()`, sets state for `DURATION_MS = 3200`, adds `body.game-celebrating` (`overflow:hidden`), renders `.celebration-overlay` (fixed, `z-index:200`) with `.celebration-canvas` (400×300 confetti), `.celebration-card`, `.celebration-photo` (background `assetPath("/dogukan.jpg")`, `photoPulse` animation) and `.celebration-msg`.
- It is **modal and blocking** (`pointer-events: all`, `aria-modal`), cannot be dismissed early, and pauses the game loop via `useGameRunning`. In action games (SuperBear, Flappy) a mid-run milestone therefore freezes the game for 3.2 s and then resumes abruptly.
- Provider scope: one per activity page (`ActivityShell.tsx:162`). The home/menu screens have no provider → `show` is a no-op there (default context).

### 2.4 `src/components/ScoreHud.tsx`

DOM HUD above the canvas: `.score-hud` (flex, white 92% card) → `.score-hud-now` (`Puan: <strong>`), `.score-hud-best` (`Rekor:`), and `.score-hud-rival` dark card (`🏆 Rekorlar`, `${rivalName}: ${rivalHigh} · ${playerName}: ${selfHigh}`, `Bu oyunda lider: Berabere | X önde`). It is text-heavy (three lines, 0.85 rem) — for an emerging reader this is noise; most games also redraw score inside the canvas (SuperBear line 489–496, Flappy line 247–253, RoyalMatch line 484–500), so the HUD is partly redundant and costs vertical space on phones.

### 2.5 Activity log: `src/lib/activityLog.ts`

Firebase-only (no local fallback). `logDogukanLogin()` (once per sessionStorage session, key `dogukan-activity-login`, called from `src/components/HomeClient.tsx:23,28`) and `logDogukanVisit(slug, title)` (every activity mount) push to `activity/dogukan/{logins|visits}`. `fetchDogukanActivity`/`subscribeDogukanActivity` (last 80 visits) back the parent panel. Only `MONITORED = "dogukan"` is logged. This is the natural place to add `logGameResult(slug, score, durationMs)` for the parent dashboard.

---

## 3. Touch input scheme and mobile ergonomics

### 3.1 `src/components/GameTouchBar.tsx` + `src/lib/gameKeys.ts` (keyboard emulation)

- `GameTouchBar({ gameId })` renders `<div className="game-touch-bar [layout-*] is-visible" aria-label="Dokunmatik kontroller">` with one `<button>` per entry of `LAYOUTS[gameId]`. Layouts exist for: `super-ayi` (◀ ↑ ▶ 👊), `flappy-bird` (`🐤 UÇ!`, `span: 4`), `dovus-arenasi` (9 buttons, `layout-fighting`), `tetris` (5, `layout-tetris` 4-col grid), `asteroids`, `pong`, `breakout`, `snake` (`layout-snake` d-pad grid), `pinball`.
- Each button: `onPointerDown` → `e.preventDefault(); setPointerCapture; dispatchGameKey(code,"keydown")`; `onPointerUp/Cancel/Leave` → `dispatchGameKey(code,"keyup")`. `fire: true` adds class `.touch-fire` (red gradient).
- `dispatchGameKey(code, type)` (`gameKeys.ts:25`) dispatches a synthetic `KeyboardEvent` on `document` with `code`, `key` (`keyFromCode`), legacy `keyCode/which` (`KEY_CODE_NUM`), `bubbles: true`. Games listen on `window` or `document` and use `matchGameKey(e, "ArrowLeft")` (`gameKeys.ts:40`, matches `e.code === code || e.key === keyFromCode(code)`).
- Consequence: the touch bar works only for games that are keyboard-driven. Tap/swipe games (WhackMole `pointerdown`, RoyalMatch `mousedown/touchstart` + swipe in `handleUp`, Flappy `canvas.touchstart`, Tetris swipe-to-move/tap-to-rotate on canvas) attach their own canvas listeners; there is no shared gesture helper. Coordinate mapping is re-implemented per game (`RoyalMatch.cellFromXY` line 269, WhackMole `scaleX = W / rect.width` line 126).

### 3.2 Button sizes / thumb reach (from `src/app/globals.css`)

- `.game-touch-bar` (line 1653): `display:none` by default, `.is-visible` → `display:flex; gap:8px; padding: 8px 12px max(12px, env(safe-area-inset-bottom)); flex-wrap: wrap; touch-action: manipulation`. The `@media (pointer: coarse), (max-width: 768px)` rule (line 1668) is redundant because `is-visible` is always applied → the bar also shows on desktop.
- `.game-touch-bar button` (line 1707): `min-width:52px; min-height:52px; padding:10px 14px; font-size:1.25rem; border-radius:12px; background:rgba(255,255,255,.95); color:#1e40af; border:2px solid #e2e8f0; user-select:none; touch-action:manipulation`. `:active` → `background:#dbeafe; transform:scale(.94)`. `.touch-fire` → `min-width:64px`, red gradient.
- 52 px meets the 44–48 px accessibility minimum but is small for a 6-year-old's thumb in a fast platformer; buttons are centered in one row, not split left/right to the thumb zones. Flappy's `span: 4` sets `gridColumn` on a flex child (bar is flex, not grid, for that game — `.flappy-game .game-touch-bar { grid-template-columns: 1fr }` at line 1890 has no effect) so `🐤 UÇ!` is a content-width button rather than a full-width tap zone; however the canvas itself also accepts `touchstart`, so tapping anywhere on the bird works.
- Other per-game controls exist outside the bar: `.dpad button` 52×52 (line 1013), `.lane-btn`, `.tank-btn min-height:52px`, SpaceDefense/LaneRacer inline buttons — three different button systems for the same job.
- `.btn-primary` (line 208) is `width:100%; padding:.95rem 1.25rem; font-size:1.05rem` → good thumb target for `Tekrar oyna` / `Başla!`.

### 3.3 Canvas sizing: `src/hooks/useCanvasFit.ts`

```ts
useCanvasFit(canvasRef, gameW, gameH, { hudRef?, minWidth=220, padX=16, padY=12 })
```
Computes `availW = innerWidth - 2*padX`, `availH = innerHeight - max(hudBottom, panelTop) - touchBarHeight - 2*padY`, `scale = min(availW/gameW, availH/gameH) * 0.98`, sets `canvas.style.width/height` (CSS only — the backing store stays `gameW×gameH`, i.e. **no devicePixelRatio scaling anywhere in the repo**, so every game is upscaled and soft on 2–3× phones). Listens to `resize` and `visualViewport.resize`. It finds the panel via `canvas.closest(".acelya-game")` and the bar via `panel.querySelector(".game-touch-bar")`.

Used by 6 games (Breakout, PinballCadet, Pong, SnakeGame, SuperBear, Tetris). **Bug:** `SuperBear.tsx:548` uses `className="game-panel canvas-game super-bear-game fullscreen-game"` — it lacks `acelya-game`, so `panel` is `null`, `touchH = 0`, and the `.fullscreen-game.acelya-game` flex-column CSS (line 1733) does not apply; on a short phone the canvas can push the touch bar below the fold. The other 24 games rely on `.game-canvas { max-width:100% }` only — portrait canvases like Flappy (320×480) plus `ScoreHud` + `round-label` + touch bar exceed a 667 px-tall viewport and force scrolling mid-game.

### 3.4 Landscape, viewport, PWA

- `src/app/layout.tsx`: `viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#74ebd5" }`, `appleWebApp: { capable: true }`. No `manifest` entry and no `public/manifest.json`/service worker → cannot be installed as a home-screen PWA with icon/splash; opens in browser chrome with address bar.
- No orientation handling (`grep orientation|landscape` → nothing). All games are portrait-ish fixed aspect (SuperBear 360×520, Flappy 320×480, RoyalMatch 336×396, Tetris, …) except Asteroids 760×570 and FightingArena; in landscape they letterbox to a small square.
- `.activity-main { max-width: 520px; padding: 12px 12px 24px }` (line 700) caps games to 520 px wide even on tablets.
- `.game-canvas { touch-action: none }` (line 997) stops scroll/zoom on the canvas; `.activity-topbar` is sticky and ~52 px tall, always visible — in-game it eats vertical space and the `← Ana sayfa` link is an accidental-exit risk for a child.
- `html,body { min-height: 100dvh }`, safe-area paddings via `env(safe-area-inset-*)` on topbar, touch bar, overlays — good.

---

## 4. Audio

### 4.1 `src/lib/sounds.ts` (WebAudio synth, used by ~all games + CelebrationProvider + QuizGame)

- Module-level `let ctx: AudioContext | null`; `getCtx()` creates it **lazily on the first `tone()` call**, wherever that happens (line 3–13). `tone()` calls `if (ac.state === "suspended") void ac.resume()` each time (line 18) — fire-and-forget, not awaited, not tied to a gesture.
- Palette: `tap, success (C-E-G chord), wrong (sawtooth 180 Hz), pop, win (4-note), star, coin, shoot, jump, spring, explode, boost, gameOver (descending), combo(n), levelUp`. Chords are sequenced with `setTimeout`, not `AudioContext` time → jittery under load.
- iOS/Android reality: on iOS Safari and Chrome Android an `AudioContext` created outside a user gesture starts `suspended`; `resume()` only succeeds inside a gesture. Most first sounds come from gesture handlers (`jump()`, `flap()`, `pick()`), so it usually unlocks on the first tap — but when the first sound is loop- or timer-driven (`sounds.gameOver()` in RAF, `sounds.win()` from WhackMole's `setInterval`, `CelebrationProvider.show()` from an async `submitFinal`), that sound is lost. There is no explicit unlock in `IntroModal`'s `Başla! 🚀` handler, no handling of iOS's `"interrupted"` state after backgrounding, no mute toggle, no volume preference, no `prefers-reduced-motion`/"sessiz mod" for games.

### 4.2 `src/lib/acelyaSounds.ts` (HTMLAudio samples: `public/sounds/{hit,explode,laser,thrust}.m4a`)

- `play(name)` does `base(name).cloneNode()` then `.play().catch(()=>{})` (line 100–106). Each play creates a new, never-unlocked `HTMLAudioElement`; on iOS, `play()` on a fresh element outside a gesture is rejected → Breakout/Pong/Tetris hit/explode sounds are likely silent on iPhone when triggered from the RAF loop. `thrustStart/Stop` loops one shared element. Used only by Breakout, Pong, Tetris.
- `src/lib/acelyaAsteroidsMusic.ts`: two-note alternating "heartbeat" (`music-low/high.m4a`) ticked from the Asteroids engine — the only background music in the app.

### 4.3 Speech

`window.speechSynthesis` with `lang="tr-TR"`, `rate 0.9`, `findTurkishVoice()` exists only in `src/components/encyclopedia/EncyclopediaTools.tsx:16–74`. Nothing in games or `IntroModal` is voiced; all instructions (`guide.intro`, `round-label`, `game-over` text, celebration messages) are text-only — a blocker for a 6-year-old emerging reader.

---

## 5. Juice / particles

- `src/lib/gameJuice.ts` `createGameJuice()` → `{ burst(x,y,color,count,speed), popScore(x,y,text,color), shakeScreen(amount≤18), flashScreen(alpha), update(), applyTransform(ctx), draw(ctx,w,h), wrapDraw(ctx,w,h,fn) }`. Shake decays ×0.86/frame, flash ×0.88. Floating text uses `bold 18px var(--font-nunito)`. Most games call `fx.update(); fx.draw()` manually and **never call `applyTransform`/`wrapDraw`**, so `shakeScreen()` has no visible effect in SuperBear/Flappy/RoyalMatch (they call it at e.g. `SuperBear.tsx:261`, `FlappyBird.tsx:151`, `RoyalMatch.tsx:188` but draw without the translate).
- `src/lib/particles.ts`: `spawnBurst(list,x,y,count,colors,speed)`, `updateParticles(list,dt=1)`, `drawParticles(ctx,list)` — a second, parallel particle system kept per game (`particles = useRef<Particle[]>([])`). SuperBear/Flappy spawn into it but **never draw it** (`drawParticles` imported and unused → lint warning), so those bursts are invisible.
- Sprites are emoji drawn with `ctx.fillText("🐻")`, `"🐺"`, `"🐝"`, `"🐤"` in `serif` font — rendering differs per OS (Apple vs Noto emoji), no animation frames, no sprite sheets, no image assets in `public/` besides `dogukan.jpg`.
- No haptics: `navigator.vibrate` appears nowhere.
- Frame timing: 25 of 30 games advance by a fixed per-frame step inside RAF (no `dt`); only Tetris (`performance.now()`) and Asteroids (`setInterval(1000/FPS)`) are time-based. On 90/120 Hz phones (most mid/high Androids, iPhone Pro) SuperBear/Flappy/RunnerDash run 1.5–2× faster.

---

## 6. Exact hook points for a progression / XP / quest system

| Event | Where it already happens | Recommended single hook |
|---|---|---|
| Activity opened | `ActivityClient.tsx:16–18` `logDogukanVisit(slug,title)` | Extend `activityLog.ts` with a local (localStorage) mirror; emit `progress.emit("open", {slug})`. |
| Game start (after intro) | `useGameBoot(reset)` fires once (`gameSession.tsx:29–37`); `GameSessionProvider active` flips in `ActivityShell.tsx:163` | Add `onStart` callback inside `useGameBoot` or a `useEffect` in `GameSessionProvider` when `active` becomes true → `progress.emit("start",{slug})`. Restart = each game's `reset()`; all reset functions already call `scoreGame.resetMilestones()` (`useGameScore.ts:64`) → emit "run_start" from there. |
| Score tick | `setScore(scoreRef.current)` in each loop; `scoreGame.checkMilestone(score)` (`useGameScore.ts:49`, throttled 12 s) | Emit from `checkMilestone` (already a throttle) — or add `scoreGame.report(score)` unthrottled for XP accrual. |
| Game over / run end | **`scoreGame.submitFinal(score)`** (`useGameScore.ts:37–47`), called once per run by 23 games via the `submitted` ref pattern; Asteroids via `hooks.onGameOver` (`Asteroids.tsx:88–95`) | Best single hook: inside `submitFinal` after `recordScore` → `progress.emit("run_end", { slug, score, isNewRecord, beatRival, durationMs })`. Needs a `startedAt` ref set in `resetMilestones()` to compute duration. |
| Level complete | SuperBear only: `goalConsumed` block `SuperBear.tsx:362–393` (`interLevelRef.current = 85`, `SEVİYE ${level} ✓`), level increments at line 214–216; Tetris level at `Tetris.tsx:146` | Add `scoreGame.levelComplete(level, bonus)` to `useGameScore` and call it at those two sites; new games adopt it. |
| Quiz finished | `QuizGame.tsx:125–128` `next()` → `setDone(true); sounds.win()`; same pattern in `CountGame`, `OrderGame`, etc. (they do **not** use `useGameScore`) | Give `QuizGame` a `slug` prop (registry already knows it) and call `useGameScore(slug).submitFinal(correct)`; or emit `progress.emit("quiz_end",{slug, correct, total})`. |
| Celebration UI | `CelebrationProvider.show(message)` (`CelebrationProvider.tsx:41`) | Reuse for "XP kazandın / yeni rozet"; add a non-blocking toast variant so action games are not frozen. |
| Persistence | `leaderboard.ts` localStorage + Firebase `leaderboard/<slug>/<player>`; `encyclopediaProgress.ts` for the encyclopedia | Mirror pattern: `progress/<player>` node + `localStorage["dogukan-progress-<player>"]`; keep Firebase optional with try/catch like `recordScore`. |

Where **not** to hook: inside individual RAF loops (30 copies), or on `setScore` (fires every frame in some games).

---

## 7. Lint errors (14) categorized by fix strategy

Command used: `cd /home/user/dogukan && npm run lint 2>&1 | grep -E "error" -B2` (plus `eslint -f json` for exact rule ids). Config: `eslint.config.mjs` = `eslint-config-next/core-web-vitals` + `/typescript` (React Compiler rules on). Totals: **14 errors, 44 warnings** (33 `@typescript-eslint/no-unused-vars`, 11 `react-hooks/exhaustive-deps`).

**A. `react-hooks/refs` — "Cannot access refs during render" (6 errors). Fix: never read/write `.current` in the render body; move to effect/handler or mirror into state.**
- `src/activities/games/Asteroids.tsx:64:3`, `65:3` — `runningRef.current = running; activeRef.current = active;` in render → wrap in `useEffect`, or drop the refs and pass `running`/`active` through `useLatest`-style effect.
- `src/activities/games/Asteroids.tsx:81:3` — `hooksRef.current = {...}` in render → assign in `useEffect(() => { hooksRef.current = … })` (no deps) or build the bridge with `useCallback`s.
- `src/activities/games/FightingArena.tsx:1069:18` — `{announceRef.current}` read in JSX → mirror to `useState` when it changes (or set at the same time `setOver(true)` is called).
- `src/activities/games/LaneRacer.tsx:274:14`, `src/activities/games/RunnerDash.tsx:260:15` — `overRef.current ? "💥 …" : "🏆 …"` in JSX → add `const [endReason, setEndReason] = useState<"crash"|"time">()` set where `overRef` is set.

**B. `react-hooks/set-state-in-effect` (2 errors). Fix: derive instead of syncing, or compute in an event/callback.**
- `src/activities/games/FlappyBird.tsx:75:5` — `setBest(scoreGame.selfHigh)` inside an effect → delete `best` state entirely and render `Math.max(scoreGame.selfHigh, score)`; keep only `bestRef` sync (which itself can live in the loop).
- `src/app/bilgi/page.tsx:22:5` — `setReady(true)` after auth checks in effect → use `useSyncExternalStore`/lazy initial state, or render a client-only gate component (acceptable to keep with an `// eslint-disable-next-line react-hooks/set-state-in-effect` + comment, as `ActivityShell.tsx:122` already does for the same SSR-storage reason).

**C. `react-hooks/purity` — "Cannot call impure function during render" (2 errors).**
- `src/activities/games/Pong.tsx:55:21`, `56:21` — `Math.random()` inside `reset()` which is a plain function defined in render (not `useCallback`) and apparently reachable from render. Fix: wrap `reset` in `useCallback` and ensure it is only invoked from `useGameBoot`/click handlers, or move the randomization into `resetBall()` called from the loop/effect.

**D. `react-hooks/preserve-manual-memoization` (4 errors, all in `src/hooks/useGameScore.ts:38, 46, 50, 61`).** The compiler cannot preserve `useCallback(..., [gameSlug, player, show])` because `player` comes from `getPlayerId()` (reads storage during render; "may be mutated later") and the callbacks are async. Fix options: (1) remove the manual `useCallback`s and let the compiler memoize (simplest; the deps arrays are what trip it); (2) read `player` once into `useState(() => getPlayerId())` or a `useRef`, so it is a stable value; (3) move `submitFinal`/`checkMilestone` into a stable object created with `useMemo` keyed on `gameSlug`. Doing (1)+(2) also fixes the SSR-impure read.

Warnings worth fixing in the same pass (they reveal real dead paths): `drawParticles` imported but unused in `SuperBear.tsx:5`, `FlappyBird.tsx` (bursts never drawn); `lives`/`timeLeft`/`ready` state mirrors unused in SuperBear, TankBattle, WhackMole, LaneRacer, FlappyBird (HUD never shows lives/time in DOM); 11 `exhaustive-deps` in Tetris/FightingArena/RoyalMatch/AlienInvasion/LaneRacer because sim helpers are plain closures recreated each render — the structural fix is moving sim logic into a non-React engine object (the Asteroids pattern) so React only owns `score/over`.

---

## 8. Checklist: making a game feel "AAA mobile" in this codebase

Ordered by impact for a 6-year-old on a phone; each item names the file to change.

**Frame & render correctness**
1. Delta-time: compute `dt = min(50, now - last) / 16.667` in every RAF loop and multiply velocities/timers (`SuperBear.tsx:199`, `FlappyBird.tsx:119`, …). Better: a shared `useGameLoop(update, draw)` in `src/hooks/` that handles `dt`, pause (`running`), and `visibilitychange`.
2. DPR: in `useCanvasFit.ts`, set `canvas.width = gameW * dpr; canvas.height = gameH * dpr; ctx.setTransform(dpr,0,0,dpr,0,0)` (cap dpr at 2–3). Apply it to all games, not 6.
3. Fix `SuperBear` panel class (add `acelya-game`) and migrate Flappy/RunnerDash/etc. to `useCanvasFit` so canvas + controls always fit `100dvh` without scrolling; hide/shrink `.activity-topbar` while a game is running (or collapse to a small ⏸/🏠 button with a confirm step so a child doesn't exit by accident).
4. Replace emoji glyph sprites with a small sprite atlas (PNG in `public/`) or at least pre-rendered emoji to offscreen canvases; animate 2–4 frames (walk, jump, hit). Load fonts/images before first frame.
5. Actually apply `fx.applyTransform(ctx)` / `wrapDraw` so screen shake shows; draw the `particles` arrays that are spawned (SuperBear, Flappy).

**Input**
6. Thumb-zone layout: split controls to bottom-left (move) and bottom-right (action) with ≥72 px targets, opaque hit areas, and `touch-action: none` on the whole stage; support multi-touch (move + jump simultaneously — pointer capture per button already allows this). Add swipe/tap-anywhere alternatives (Flappy already has tap on canvas).
7. A shared `useCanvasPointer(canvasRef, W, H)` helper returning game-space coordinates (replace `cellFromXY`, `scaleX` copies).
8. Haptics: `navigator.vibrate?.(10)` on hit/collect, `[30,30,60]` on game over — behind a user preference; add to `gameJuice` as `fx.haptic()`.

**Audio**
9. Unlock on the `Başla! 🚀` tap in `IntroModal.onStart`: create/resume the `AudioContext`, play a silent buffer, and pre-touch `acelyaSounds` elements; handle `ctx.state === "interrupted"` on `visibilitychange`. Expose `sounds.unlock()` from `sounds.ts`.
10. Schedule chords with `ac.currentTime + offset` instead of `setTimeout`; add a master `GainNode` with a persisted mute (`localStorage["dogukan-sound"]`) and a visible 🔊/🔇 toggle in the topbar.
11. Voice: Turkish TTS (reuse `EncyclopediaTools` helper) for intro, "Hazır? Başla!", game-over, and celebration messages; short pre-recorded clips are better than TTS on iOS where `speechSynthesis` is unreliable in Safari after backgrounding.
12. Looping background music per game with ducking on events (only Asteroids has any music).

**Session design & difficulty**
13. Short sessions: 60–120 s rounds or 3-lives runs (already the case for WhackMole/RunnerDash/Flappy); end every run with a "next goal" card (e.g. "1 yıldız daha!") instead of only `Tekrar oyna`.
14. Difficulty curve: start slower than today (Flappy `PIPE_GAP=128`, `PIPE_SPD=2.4` is adult-tuned; SuperBear level 1 already has 2 wolves + 1 bee). Use a per-player adaptive scalar stored with progress; `superBearLevelGen.ts` already parameterizes by `L` — add an `ease` input.
15. Celebration should not freeze action games: add a non-modal toast mode to `CelebrationProvider` and reserve the full-screen photo overlay for run end.
16. Pause/resume: handle `visibilitychange` → set `running=false` and show a big ▶ "Devam" button; add a "3-2-1" countdown on resume.

**Progression (to beat "Süper Ayı/Minecraft" stickiness)**
17. XP + stars per run via the `submitFinal` hook (§6), daily quests ("3 oyun oyna", "bir bilim kartı dinle"), collectible rewards that unlock cosmetics (bear hats, gem skins) — content, not screen time, as the carrot.
18. Parent-side time budget: a soft daily limit surfaced via `activityLog` + `/bilgi`; "mola" screen that offers an encyclopedia card or a mini-experiment instead of a hard wall.

**Platform**
19. Add `public/manifest.json` + icons + `metadata.manifest`, `display: "standalone"`, `orientation: "portrait"`; register a minimal service worker (static export is cache-friendly) for offline play.
20. Performance budget: avoid `createLinearGradient`/`createRadialGradient` per frame per object (RoyalMatch creates 3 gradients per gem per frame — 147/frame); cache to offscreen canvases.

---

## 9. Quick reference: shared class names used by game markup

`.game-panel`, `.canvas-game`, `.acelya-game`, `.fullscreen-game`, `.acelya-hud`, `.acelya-game-stage`, `.game-canvas`, `.touch-canvas`, `.game-touch-bar` (+ `.is-visible`, `.layout-tetris`, `.layout-snake`, `.layout-fighting`, `button.touch-fire`), `.score-hud` (+ `-now`, `-best`, `-rival`, `-rival-title`), `.round-label`, `.game-waiting`, `.game-over`, `.game-message`, `.btn-primary`, `.btn-ghost`, `.celebration-overlay/-canvas/-card/-photo/-msg`, `body.game-celebrating`, `.intro-overlay/.intro-card/.intro-badge/.intro-actions`, `.activity-page/.activity-topbar/.activity-main/.back-btn/.help-btn/.knowledge-jump-btn`, per-game: `.super-bear-game/-hud/-canvas/-victory/-victory-card/-victory-emoji`, `.flappy-game/.flappy-canvas`, `.asteroids-game/-hud/-stage/-canvas`, `.pong-game`, `.fighting-game/.fighting-canvas`, `.dpad`, `.lane-btn`, `.tank-btn`.

Game slugs with a `GAME_SLUG` constant (leaderboard keys): `asteroids, balon-patlat, baloncuk-patlat, dovus-arenasi, flappy-bird, kostebek-vur, kosu-macera, meyve-bicagi, pinball-space-cadet, pong, renk-yaris, royal-match, serit-yarisi, super-ayi, tank-savasi, tetris, top-yakala, tugla-kir, uzay-savunma, uzayli-istilasi, yagmur-damlasi, yilan-oyunu, ziplama-adasi`.
