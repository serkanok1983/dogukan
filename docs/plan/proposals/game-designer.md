# Game-design proposal — "Doğukan'ın Yeri" → "Bal Adaları" (working title)

Author role: senior mobile game designer. Audience: the ~8 engineers who will build Phase 1 and the father who will approve scope.
Repo facts I rely on come from the five maps plus spot-checks of `src/lib/menu.ts`, `src/hooks/useGameScore.ts`, `src/lib/gameSession.tsx`, `src/components/GameTouchBar.tsx`, `src/activities/games/superBearLevelGen.ts`, `FlappyBird.tsx` constants, `src/lib/sounds.ts`, `src/lib/auth.ts`, `src/lib/activityLog.ts`.

---

## 1. Vision

**First 5 minutes (day 1).** Doğukan taps an icon on the home screen (installed PWA, bear face, splash screen in the island colours, no browser bar). The phone shows two big faces: his photo and "Baba". He taps his face; a bear named **Bal** waves and *says* "Hoş geldin Doğukan! Bugün üç görevin var." No text he must read anywhere on the screen. Below the bear is a pannable map with five big islands and one glowing construction site: 🏝️ Macera Adası, 📖 Harf Ormanı, 🔢 Sayı Dağı, 🔷 Şekil Köyü, 🔬 Merak Gölü, 🧱 Blok Dünyası. He taps Macera Adası because it has the bear from Süper Ayı on it. Süper Ayı opens full-screen in one second, no intro text wall, just the bear saying "Hazır? Üç, iki, bir!" with thumb-zone buttons (move left-bottom, jump/punch right-bottom, 72 px). The game runs at the same speed on his 120 Hz phone as on his dad's; sprites are crisp; the phone buzzes when he lands on a wolf. He dies at level 2; instead of a modal, a small toast says "1 yıldız!" and a star flies to the top bar. After the third run the bear says "Balım bitti, bana bal ver!" — a 25-second **Bal Kapısı** opens: three voiced picture questions ("Hangisi *k* sesiyle başlar?" with 🐱 🍎 🐟). Three taps, confetti, +3 honey, and a sticker peels off into his album. He goes back to Süper Ayı. Total reading required: zero. Total learning: 3 exercises, 1 sticker, 1 quest done.

**Day 7.** He opens the app himself in the morning because the streak sun on the icon badge is at 6 and Bal promised a hat at 7. Bal is wearing the pirate hat Doğukan unlocked by finishing the "e-l-a-k-i-n" letter set. His daily quests are pictures: 🧱 "Blok Dünyası'nda köprü yap (8 blok)", 🔊 "Merak Gölü'nde 1 bölüm izle", 🐻 "Süper Ayı seviye 5". In Blok Dünyası he has three saved worlds; today's challenge asks him to mirror a half-built castle (that is symmetry) and he spends his learned honey-blocks on a new "lava" block type. In Merak Gölü he swipes through a 12-card episode about shadows — every card is one picture, one spoken sentence and one tap — and the last card tells him to go find his own shadow with his father, which ends the episode on purpose. At dinner his father opens /bilgi: 34 minutes today, letters k and i mastered, counting to 15 solid, subtraction wobbly, two Blok Dünyası screenshots waiting in the gallery, and one crash report. Nothing in the app ever linked out, autoplayed, or asked for anything.

---

## 2. Feature list

Priority: P0 = without it the child will not come back; P1 = makes it stick; P2 = polish. Phase: 1 = this session (8 engineers), 2 = next, 3 = later.

### F1. Avatar-tap login + persistent child session — P0, Phase 1
- **Why for this child:** the current 13-character password is the single biggest reason the app has never been opened without the father. Commercial kids' games never ask anything before play.
- **Teaches:** nothing directly; it is the door.
- **UX:** two 160 px cards (child photo, "Baba" icon). Tapping the child = `setLoggedIn("dogukan", true)` immediately, Bal says "Hoş geldin Doğukan!" (this tap also unlocks audio + TTS for iOS). Tapping Baba opens a 4-digit keypad (digits only, 64 px keys) verified against a SHA-256 hash; 3 misses → 30 s lock with Bal saying "Babanı çağır". Logout only inside the parent panel. Also a "Ebeveyn kapısı" math gate in front of the PIN ("17 + 26 = ?") so a curious 6-year-old never gets in by luck.
- **Data:** `NEXT_PUBLIC_PARENT_PIN_HASH` env; keep `PlayerId`, `getPlayerId()`, storage keys `dogukan-player`/`dogukan-logged-in` unchanged.
- **Files:** replace `src/components/LoginScreen.tsx`; `src/lib/auth.ts` (`checkCredentials` → `verifyParentPin`), `src/components/HomeClient.tsx` (render a CSS splash instead of `null`), new `src/components/ParentGate.tsx`.
- **Risks:** PIN hash is public (acceptable for a family app, document it in README).

### F2. World-map home with Bal the companion — P0, Phase 1
- **Why:** Super Bear Adventure is a *place* with a *character*; the current app is a list. A map with six big islands and a bear who talks gives agency, orientation and a reason to return ("what's new on the map?"). Islands visibly fill with stars → progression you can see without reading.
- **Teaches:** category structure (letters/numbers/shapes/science) as geography; voice labels on every tile build vocabulary.
- **UX:** `/` becomes a full-bleed pannable canvas-free DOM map (`touch-action: pan-x pan-y`, `overscroll-behavior: none`, document scroll) with six island tiles ≥ 140 px, each showing its emoji/illustration, its star fill (e.g. 12/30 ⭐ as a ring) and a 🔊 on long-press that speaks the name. Top bar: Bal's face (tap = he speaks today's quests), 🍯 honey count, ⭐ star total, 🔥 streak sun. A "Devam et" tile shows the last slug's icon. Inside an island: a single-screen grid of ≤ 12 tiles (96 px, picture + one word + star row), never a scroller of 69 cards. Items not yet unlocked show a padlock *with a picture of what unlocks them* (not a timer; unlocking is by stars from that island's learning tiles).
- **Island mapping from `MENU` (rename + regroup, keep slugs):**
  - 🏝️ **Macera Adası** (arcade for kids): super-ayi, flappy-bird, kosu-macera, ziplama-adasi, yagmur-damlasi, top-yakala, baloncuk-patlat, balon-patlat, yilan-oyunu, labirent, kaydir-puzzle, hafiza-kartlari, royal-match, tetris, tugla-kir, pong, meyve-bicagi, kostebek-vur, serit-yarisi.
  - 📖 **Harf Ormanı**: harf-tanima (rebuilt), harf-yazma, hece-birlestir, kelime-okuma, sesli-harf, bosluk-doldur, benzer-kelime, + new `ses-avcisi`, `cumle-oku`.
  - 🔢 **Sayı Dağı**: sayma-oyunu, toplama-oyunu, cikarma-oyunu, sayi-sirasi, karsilastir, saat-ogren, para-say, onluk-birlik (→ 20), + new `eksik-sayi`, `ritmik-sayma`.
  - 🔷 **Şekil Köyü**: renk-atolyesi, sekil-tani, sekil-ciz (traced), simetri (real), desen-tamamla, sekil-say, tangram (real), renk-yaris, hazine-haritasi, sira-bul, boyut-sirala, mantik-eslestir, fark-bul, grupla.
  - 🔬 **Merak Gölü**: dinozor-kazi, hava-durumu, gezegenler, vucudumuz, besin-gruplari, bitki-buyume, hayvanlar, mevsimler, su-dongu + `Merak Akışı` episodes (F7) + new `guvenli-hayat`.
  - 🧱 **Blok Dünyası**: new sandbox (F6).
  - 👨‍👦 **Baba ile** (hidden behind parent gate): dovus-arenasi, tank-savasi, uzayli-istilasi, uzay-savunma, asteroids, pinball-space-cadet.
- **Data:** `MENU` gains `world`, `illustration`, `unlock?: { stars: number }`, `voice: string` per item; new `src/lib/worlds.ts`.
- **Files:** replace `src/components/MenuScreen.tsx` with `src/components/home/WorldMap.tsx`, `IslandScreen.tsx`, `CompanionBar.tsx`; `src/lib/menu.ts`; delete `BubbleBg` from all routes; `src/app/page.tsx`.
- **Risks:** 69 → ~75 slugs means `activityLearning.ts` + `guides.ts` entries for every new slug (build-time invariant). Keep the invariant; it is a feature.

### F3. Speech everywhere (`lib/speech.ts`) — P0, Phase 1
- **Why:** a non-reader cannot use 39 of 69 activities today. Every commercial kids' app voices every prompt.
- **Teaches:** listening comprehension, vocabulary; makes phoneme→letter tasks possible at all.
- **UX:** `speak(text, { rate: 0.9, interrupt: true })`; voices ranked (prefer Google Türkçe / Yelda / any `tr`), `voiceschanged` handled, unlocked on the login tap, cancelled on route change and `visibilitychange`. Every prompt auto-speaks on mount; every prompt card has a ≥ 56 px 🔊; long-press on any choice speaks it. A master mute in the companion bar (persisted `dogukan-sound`).
- **Data:** none; optional `public/voice/*.m4a` for pre-recorded lines (father's voice — see open question).
- **Files:** new `src/lib/speech.ts` (lift from `EncyclopediaTools.tsx:16-74`), `src/components/SpeakButton.tsx`; wire into `QuizGame`, `IntroModal`, world tiles, `CelebrationProvider`, `BalKapisi`.
- **Risks:** iOS Safari TTS can drop after backgrounding → re-prime on `visibilitychange`; Android without a Turkish voice → show the text large and still play the earcon.

### F4. Progression core: stars, XP/levels, honey, streak, quests, stickers — P0, Phase 1
- **Why:** this is the layer that makes Minecraft/Super Bear "mine". Collection + visible growth + a daily reason. Done ethically: all rewards are earned by play or learning, deterministic, finite, no timers you can pay to skip, no randomness that encourages repetition for its own sake.
- **Teaches:** goal-setting, delayed gratification; quests steer him into learning islands.
- **Rules (tune in `src/lib/progress.ts`):**
  - **Stars** ⭐: 0–3 per activity, recomputed from best performance (arcade: score thresholds per game in a table; learning: ≥ 60 % / 80 % / 100 % in a 6-item session). Island fill = stars/possible.
  - **XP → Bal level**: +10 XP per run, +25 per learning session, +5 per capsule, +20 per Blok challenge. Level thresholds 100·n. Each level = a cosmetic for Bal (hat, scarf, colour) shown on the map. 20 cosmetics for Phase 1.
  - **Honey** 🍯 (the learning gate, F5): 6 free at local midnight, max 9. Arcade run = −1. Learning session (any Harf/Sayı/Şekil tile or a Bal Kapısı) = +3. Blok Dünyası and Merak Gölü are free (never gate the creative/curiosity surfaces).
  - **Streak** 🔥: a day counts if ≥ 1 learning session. Sun calendar on Bal's screen; day 3/7/14 give special stickers. A missed day *does not* reset to zero — it drops by one (no punishment loop).
  - **Daily quests**: three picture quests generated at first open from a template list: 1 arcade, 1 learning (weakest skill from mastery store), 1 curiosity/creative. Completing all three = a "Günün kutusu" sticker.
  - **Stickers**: 120-item album in themed pages (hayvanlar, uzay, taşıtlar, dinozorlar, harfler). Awarded on fixed triggers (letter group mastered, quest trio, streak milestones, first 3-star in a game). Reveal animation is a peel/scratch, but the *next* sticker is predetermined — surprise feeling, no gambling.
- **Hook points (exact):** `useGameScore.resetMilestones()` → `progress.runStart(slug)`; `useGameScore.submitFinal()` → `progress.runEnd(slug, score, durationMs)`; `QuizGame`/`ExerciseSession` end → `progress.learningEnd(skill, correct, total)`; SuperBear goal block (`SuperBear.tsx:362-393`) and `Tetris.tsx:146` → `progress.levelComplete(slug, level)`; capsule viewed → `progress.capsule(id)`.
- **Data:** `localStorage["dogukan-progress-v1-<player>"]` `{ stars: Record<slug,0|1|2|3>, xp, level, honey, honeyDay, streak: {count,lastDay}, quests: {day, items[]}, stickers: Record<id,unlockedAt>, cosmetics: {owned[], equipped} }`, mirrored to Firebase `users/<player>/progress` (local-first, outbox on `online`).
- **Files:** new `src/lib/progress.ts`, `src/lib/quests.ts`, `src/lib/stickers.ts`, `src/components/RewardSheet.tsx` (end-of-run card: stars earned, XP bar, sticker peel, "Tekrar" / "Haritaya dön"), `src/hooks/useProgress.ts`; modify `src/hooks/useGameScore.ts`, `src/components/CelebrationProvider.tsx` (add `toast(message)` non-blocking mode, keep `show`).
- **Risks:** star thresholds for 19 arcade games need a table — start from existing `[500..10000]` marks and Flappy pipes; tune after a week of `/bilgi` data.

### F5. Bal Kapısı — the learning gate — P0, Phase 1
- **Why:** the honest version of "watch an ad to continue": the child is already motivated (he wants another run), the gate is 25 seconds, fully voiced, and ends in a reward. It is where the arcade time converts into school time without the child noticing a mode switch.
- **Teaches:** whatever the mastery store says is weakest — it is the adaptive-practice surface.
- **UX:** when honey = 0 and the child taps "Tekrar oyna", a sheet slides up over the game (game stays mounted, paused via `GameSessionProvider active=false`): Bal with an empty jar, "Bana bal ver!" Three `Exercise` items from the weakest two skills at the child's level (F8 engine). Correct → honey drips into the jar + `sounds.coin` + haptic; wrong → "Bir daha dene" and the item is retried once, then revealed. Three items done → jar full, +3 🍯, back to the game's `reset()` automatically. Never more than 3 items, never text-only.
- **Data:** reads `mastery.ts`, writes `progress.honey`.
- **Files:** new `src/components/BalKapisi.tsx`, hook into `ActivityShell.tsx` around the game's `.game-over` → intercept via a `useGameRestart()` context the games call instead of `reset()` directly (one-line change per game: `onClick={restart}`), fallback: wrap `.game-over` button clicks at the shell with event delegation for games not yet migrated.
- **Risks:** if it feels like a wall he leaves for Super Bear. Mitigations: 6 free honey, 3 items only, the reward is immediate and physical (jar fills), and the first two days have double free honey.

### F6. Blok Dünyası — 2D block sandbox with learning challenges — P0, Phase 1
- **Why:** the direct answer to Minecraft. Creation with no fail state, persistence ("my worlds"), a reason to earn blocks, and a canvas we control fully. Everything saved shows up in the father's panel — the child builds *for* someone.
- **Teaches:** counting (build with exactly N), symmetry (mirror the left half), pattern (continue ABAB rows), spatial language (üst/alt/sağ/sol), planning; later: simple physics (sand falls, water flows).
- **UX:** portrait canvas, grid 12 × 18 cells (cell ≈ 30 css px at 390 width), DPR-aware. Bottom palette: 8 block types at start (çim, toprak, taş, tahta, cam, su, çiçek, bal), 56 px chips; unlockable blocks (lava, altın, elmas, kar, kaktüs, meşale, ışıklı blok) bought with honey-blocks earned by learning (1 ⭐ = 5 blok). Place = tap, paint = drag, remove = toggle the ✖ chip or two-finger tap. Undo button (big). Bal walks along the top surface of what you build (uses the same bear sprite as Süper Ayı → brand link). Day/night slider at the top as a toy (ties to `gece-ve-gunduz` topic). Five world slots with thumbnails; "Babaya göster 📸" exports PNG to Firebase `users/dogukan/gallery` (and Web Share on devices that support it).
  - **Challenge mode** (tile inside Blok Dünyası, voiced): `kopyala` (blueprint shown top, build below, 3 sizes), `ayna` (left half given, build right half), `say` ("Tam 8 blokla köprü yap" — validated by count + connectivity), `oruntu` (continue the row), `yukseklik` ("Bal'dan 3 blok yüksek kule"). Each challenge = 1 learning session for the honey economy.
- **Data:** `localStorage["dogukan-blocks-v1"]` worlds as `Uint8Array` base64 (12×18 = 216 bytes each), Firebase mirror; `src/activities/games/blocks/challenges.ts` seeds.
- **Files:** new `src/activities/games/BlockWorld.tsx`, `blocks/engine.ts` (pure grid + validators, testable), `blocks/render.ts` (tile atlas, `OffscreenCanvas` cache), `blocks/challenges.ts`; menu slugs `blok-dunyasi`, `blok-gorevleri`; entries in `activityLearning.ts` (topic `sekiller-oruntuler-ve-simetri`) and `guides.ts`.
- **Risks:** scope creep into physics. Phase 1 is static blocks + 5 challenge types; sand/water automata, creatures and multiplayer-by-Firebase are Phase 2/3.

### F7. Merak Akışı — the healthy "shorts" — P0 (feed), Phase 1 for 4 topics, Phase 2 for all 14
- **Why:** it meets the short-video habit with the same gesture (vertical swipe, one idea per screen, instant audio) but finite, voiced, and ends with a "go do it in the real world" card. It is the father's "temel bilimlere ilgi" lever.
- **Teaches:** Hayat Bilgisi/Fen at age level: senses, body, plants, animals, weather, water, day/night, moon, matter, light/shadow, motion, magnets, numbers, shapes — the 14 existing topics re-cut.
- **UX:** `/merak/[topic]/` full-viewport `scroll-snap` cards; each card: one visual (emoji scene, animated lab stage from `InteractiveLab` driven by a preset, or SVG), one spoken sentence ≤ 8 words shown large, and after `onend` a one-tap question with 2–3 picture answers (no wrong-answer buzz; "Birlikte bakalım" and reveal). Advance = swipe or big ▶. Episode = 12 cards, last card = mission ("Babanla gölgeni ölç"). Episode end screen: "Bugünlük bu kadar!", +1 sticker. Cap: 2 episodes/day (parent setting). No autoplay chain, no infinite scroll.
- **Data:** new `src/lib/capsules.ts` with `Capsule` type (map §11.2 of the encyclopedia map); Phase 1 hand-writes 4 episodes × 12 (isik-ve-golge, miknatislar, tohumdan-bitkiye, gece-ve-gunduz) in child register; progress per capsule in `progress.ts`; `/kesfet/[slug]/` remains as the parent/reference page; sources rendered as plain text for the child.
- **Files:** new `src/app/merak/[topic]/page.tsx` (+ `generateStaticParams` over topics with episodes), `src/components/merak/CapsuleFeed.tsx`, `CapsuleCard.tsx`; refactor `InteractiveLab.tsx` to export `*Stage` components; `src/lib/capsules.ts`.
- **Risks:** TTS quality on Android varies; mitigated by large text + emoji + optional pre-recorded m4a.

### F8. Learning engine v2: voiced, visual, adaptive exercises — P0, Phase 1
- **Why:** 32 QuizGame screens are the "school" half of the app and are currently unusable alone. Rebuilding them as generators gives infinite variety (no 2-question pools), adaptivity, and the content for Bal Kapısı and quests.
- **Teaches:** MEB okul öncesi / 1. sınıf: ses→harf (MEB ses grupları order: e,l,a,k,i,n / o,m,u,t,ü,y / ö,r,ı,d,s,b / z,ç,g,ş,c,p / h,v,ğ,f,j), harf→resim, büyük/küçük harf, hece, kelime–resim, 3-kelimelik cümle okuma; sayma 1–20 with rows of 5, ten-frame ± to 20, eksik terim, ritmik sayma, karşılaştırma, tam/yarım saat on an SVG clock, coins by picture; şekil tanıma incl. cisimler, örüntü, gerçek simetri; Hayat Bilgisi: mevsim/kıyafet eşleştir, besin grupları, tohum→çiçek sırala, **güvenli hayat** (trafik ışığı, 112, "yabancıdan bir şey alma", ekran molası).
- **UX:** `ExerciseSession` component replaces `QuizGame`: 6 items/session, prompt auto-spoken, visual prompt area ≥ 40 % of screen (objects grid, clock, ten-frame, letter card), 2–4 picture/number choices ≥ 88 px, retry once before reveal, star per item flying to a 6-slot rail, end `RewardSheet`. Content register rule: ≤ 7 words, concrete nouns, no metalanguage (no "yüklem", "basamak", "eksen").
- **Data:** `Exercise` type (prompt {speech, text?, visual}, choices {id, emoji|img|text, speech}, answerId); `src/activities/content/<skill>.ts` generators with injected RNG and level; `src/lib/mastery.ts` (`dogukan-mastery-v1-<player>`: `{skill: {level, streak, attempts, correct, lastAt}}`, level up after 3-streak, down after 2 misses), mirrored to Firebase `users/<player>/skills`.
- **Files:** new `src/activities/shared/ExerciseSession.tsx`, `src/activities/content/{letters,syllables,words,sentences,counting,addsub,missing,rhythm,compare,clock,money,shapes,solids,pattern,symmetry,life,safety}.ts`, `src/lib/mastery.ts`, `src/lib/rng.ts`; rewrite `src/activities/data/quizData.ts` into generators; rebuild `SymmetryGame` (grid mirror-completion), `TangramLite` (drag-to-silhouette with snap, 4 figures), `ShapeDraw` (traced outline target, tolerance score), `CountGame` (to 20, rows of 5, no reload), `OrderGame` (random sets, 1–20); fix `saat` 🕐 bug, `sekil-tani` ⬛ bug, `Ğ` clue; delete `Q.gezegenler`/`Q.hayvanlar` dead pools.
- **Risks:** content volume. Phase 1 target: 16 generators with 3 levels each, every one reviewed for register by a Turkish speaker (the father).

### F9. Game-feel pass on the existing 32 games with minimal per-game edits — P0, Phase 1 (top 10 games), Phase 2 (rest)
- **Why:** the first 10 seconds of Süper Ayı decide whether the app is "real". Today: blurry sprites, 2× speed on 120 Hz, no vibration, invisible screen shake, a modal that freezes the game mid-run, buttons in the middle of the screen, a back link a child taps by accident.
- **Teaches:** nothing; it protects everything else.
- **Shared changes (one place, all games):**
  1. `useGameLoop(update, draw)` in `src/hooks/useGameLoop.ts`: `dt` clamped to 50 ms and normalised to 60 Hz units so existing per-frame constants keep working (`vx * dt60`), pauses on `!running` and `visibilitychange`, shows a 3-2-1 resume countdown overlay; games migrate by replacing their RAF effect body.
  2. `useCanvasFit` generalised: drop the `.acelya-game` requirement, DPR backing store capped at 2 with `ctx.setTransform`, use `visualViewport.height`, subtract the collapsed topbar.
  3. `sounds.unlock()` on the login tap and the Başla tap; master `GainNode` + mute; chords scheduled on `ac.currentTime`; `acelyaSounds` pre-touched.
  4. `fx.haptic(pattern)` in `gameJuice` via `navigator.vibrate`; and make `gameJuice.draw` apply the shake transform internally so `shakeScreen()` finally shows; draw the `particles` arrays SuperBear/Flappy already spawn.
  5. `GameTouchBar` → thumb zones: left cluster bottom-left (move), right cluster bottom-right (action), 72 px, opaque, `layout-landscape` variant, icon glyphs instead of "Z X C V B"; Flappy gets a full-width tap zone.
  6. `ActivityShell` in play mode: topbar collapses to a 48 px ⏸ button; exit requires ⏸ → "Haritaya dön?" with Bal asking "Gidiyor muyuz?" (two taps, no accidental exit). `ScoreHud` replaced by icon HUD (⭐ number, ❤️ hearts) — rivalry text moves to `/bilgi`.
  7. `CelebrationProvider.toast()` for mid-run milestones (non-blocking, 1.2 s); full-screen `show()` only from `RewardSheet` at run end.
  8. Kid difficulty: `progress.ease` (0.6–1.0) read by `buildProceduralLevel(level, ease)` (wolves `2 + …` → `Math.round((1 + …) * ease)`, `spdMul * ease`), Flappy `PIPE_GAP 128 → 150`, `PIPE_SPD 2.4 → 1.9` at ease 0.7, rising with 3-star performance.
- **Per-game Phase 1 list (10):** SuperBear (also add `acelya-game`, draw particles, 3-frame bear sprite), FlappyBird, RunnerDash, PlatformJump, RainCatcher, StarCatch, BubbleBurst, WhackMole, MemoryGame, RoyalMatch (cache gradients to offscreen canvases).
- **Files:** `src/hooks/useGameLoop.ts` (new), `useCanvasFit.ts`, `src/lib/sounds.ts`, `src/lib/gameJuice.ts`, `src/components/GameTouchBar.tsx`, `ActivityShell.tsx`, `ScoreHud.tsx` → `GameHud.tsx`, `CelebrationProvider.tsx`, `superBearLevelGen.ts`, the 10 game files; fix the 14 lint errors in the same pass (Asteroids/FightingArena/LaneRacer/RunnerDash refs → state; Pong randomness into effect; Flappy `best` derived; `useGameScore` player via `useState(() => getPlayerId())`, context value memoised).
- **Risks:** `dt` migration can subtly change feel; keep a `dt60` multiplier so constants are unchanged at 60 Hz and verify on a 120 Hz device.

### F10. Bal's room (companion screen) — P1, Phase 2
- **Why:** a character to care for is the Tamagotchi hook; Bal's hats are the Super Bear "costumes".
- **Teaches:** responsibility framing for the streak; vocabulary (Bal names his items).
- **UX:** tap Bal on the map → his room: equip cosmetics, sticker album pages, streak sun calendar, "Bugünün görevleri" pictures. Bal reacts (voiced) to the weakest skill: "Bugün sayı dağına çıkalım mı?"
- **Files:** `src/components/home/BalRoom.tsx`, `StickerAlbum.tsx`, SVG cosmetic layers in `public/bal/`.

### F11. Parent panel v2 + settings + install — P0 (settings/time budget), Phase 1 minimal, Phase 2 full
- **Why:** the father needs to see learning (not visit lists) and to set limits that the app enforces gently.
- **UX:** `/bilgi` behind PIN: today's minutes, streak, per-skill mastery bars, star map, Blok gallery, crash list, "Telefona ekle 📲" (beforeinstallprompt / iOS share-sheet card), settings: `dailyMinutes` (default 40), `bedtime` (default 20:30), `freeHoney` (6), `episodesPerDay` (2), `voiceOn`, `babaIleUnlocked`. When the budget is reached the child sees Bal yawning: "Bal uyuyor. Yarın görüşürüz!" plus one offline mission card. No hard lock the child cannot understand.
- **Data:** Firebase `settings/<player>` + local mirror; `users/dogukan/sessions/<YYYY-MM-DD>` day buckets (replace `visits` + `limitToLast(80)`).
- **Files:** `src/app/bilgi/page.tsx`, `src/components/ParentInfoScreen.tsx` → `parent/Dashboard.tsx`, `parent/Settings.tsx`; `src/lib/activityLog.ts` (`logSession`, `logGameResult`), `src/lib/settings.ts`.

### F12. Production hardening — P0, Phase 1
- **Why:** a white screen or a lost session on day 2 ends the experiment.
- **Scope:** `src/app/manifest.ts` (`start_url`/`scope`/icons under `${base}`), `public/icons/*.png`, `src/app/apple-icon.png` (delete `apple-icon.svg`), hand-written `public/sw.js` (cache-first `_next/static` + media, network-first HTML/`.txt`, `/offline/`), `PwaRegister` with `updateViaCache: "none"`; `error.tsx` (root + `aktivite/[slug]`) with `unstable_retry` and a child card "Oyun biraz yoruldu 😴 — Tekrar dene", Turkish `not-found.tsx`, `global-error.tsx`; class `ErrorBoundary` around the game so a crash shows Bal, not blank; `dynamicParams = false` on `aktivite/[slug]`; Firebase anonymous auth + `database.rules.json` + lazy import; delete `dogukan.png`, EXIF-stripped WebP avatar; CI two-job workflow (lint `--max-warnings 0`, `tsc`, `vitest`, build, verify-out) → deploy; Vitest invariants (MENU ↔ registry ↔ knowledge ↔ guides, generators produce answer ∈ choices, block validators, progress rules, capsules ≤ 8 words); `globals.css` split into `tokens.css`/`shell.css`/`games.css`/`encyclopedia.css`, `prefers-reduced-motion` on every infinite animation, `(hover:hover)` guards, no `backdrop-filter` over canvases.
- **Files:** as listed in the production map §13; plus `scripts/verify-out.mjs`, `vitest.config.mts`, `.env.example`, `.nvmrc`.

### F13. Art and audio identity — P1, Phase 1 (minimum set), Phase 2 (full)
- **Why:** platform emoji drawn with `fillText` read as "web page". A consistent SVG icon set, six island illustrations, a 6-frame Bal sprite (idle, walk×2, jump, punch, hurt) and a 24-sound earcon palette are what make it feel like a game. No external assets needed: hand-drawn SVG, exported to a PNG atlas at build.
- **Files:** `public/art/islands/*.svg`, `public/art/bal/atlas.png` + `atlas.json`, `public/art/icons/*.svg` (home, pause, sound, back, star, honey, lock), `src/lib/sprites.ts` (atlas loader with DPR); `sounds.ts` expanded with `honey`, `sticker`, `unlock`, `countdown`.
- **Risks:** engineer-drawn art quality; keep shapes flat and chunky (Toca Boca style), two-tone per island.

### F14. Landscape + wide games — P2, Phase 2
- Rotate prompt for Pong/Breakout/Pinball/Asteroids; `layout-landscape` touch bar; `(orientation)` queries; these live in "Baba ile" so this can wait.

### F15. Listening stories + Simon-style auditory memory — P1, Phase 2
- 90-second voiced picture stories with 3 questions (dinlediğini anlama is a MEB gap); "Bal'ın şarkısı" sequence memory. Both pure `Exercise`/`Capsule` content once F3/F8 exist.

### F16. Sandbox physics, creatures and sharing — P2, Phase 3
- Falling sand/water automata, animals that need fences (counting), a "Babanın dünyası" slot the father builds from `/bilgi`.

### 2.1 Detailed specs for the core loop (engineers: implement these numbers, then tune from `/bilgi` data)

#### Session shape we are designing for
- Target session: 15–25 minutes, 3–5 times a week, mostly unsupervised, portrait, one thumb.
- Loop: map → tile → 60–120 s run or 6-item exercise → `RewardSheet` (3–4 s, skippable by tap after 1.5 s) → back to the same tile or map.
- Hard rule: no screen on the child path has more than one sentence of text, and every sentence is spoken.
- Hard rule: nothing on the child path navigates outside the PWA scope.

#### Star thresholds (arcade) — `src/lib/starTable.ts`
| slug | 1 ⭐ | 2 ⭐ | 3 ⭐ | measure |
|---|---|---|---|---|
| super-ayi | reach level 2 | level 4 | level 7 | level reached in a run |
| flappy-bird | 3 | 8 | 15 | pipes |
| kosu-macera | 300 | 800 | 1500 | score |
| ziplama-adasi | 200 | 600 | 1200 | score |
| yagmur-damlasi | 10 | 25 | 45 | catches |
| top-yakala | 10 | 25 | 45 | stars |
| baloncuk-patlat | 20 | 50 | 90 | pops |
| hafiza-kartlari | finish 6 pairs | 10 pairs | 14 pairs ≤ 30 moves | level/moves |
| royal-match | 300 | 900 | 1800 | score in 30 moves |
| tetris | 3 lines | 10 lines | 20 lines | lines |
| kostebek-vur | 8 | 16 | 26 | hits in 30 s |
| others | existing milestone marks /10, /4, /2 | | | score |
Stars are the max over all runs; the `RewardSheet` shows "yeni yıldız" with a bigger burst only when the max increases.

#### Honey economy — `src/lib/progress.ts`
| event | 🍯 |
|---|---|
| local midnight (first open of the day) | set to `max(current, freeHoney)` (default 6; 12 for the first 3 days of use) |
| start an arcade run (any Macera Adası tile, "Tekrar oyna" included) | −1 |
| Bal Kapısı completed (3 items) | +3 |
| any Harf/Sayı/Şekil/Bilim exercise session finished (6 items) | +3 (+1 if ≥ 5/6) |
| Blok Dünyası challenge passed | +2 |
| Merak episode finished | +1 |
| Blok Dünyası free build, Merak Gölü, Bal's room | free |
| cap | 9 |
Rules: honey never decays with time; the counter is always visible with a jar icon; when at 1 the jar wobbles and Bal says "Son bal!". When a run would take it to −1, open `BalKapisi` instead of starting the run.

#### Daily quest templates — `src/lib/quests.ts`
Three quests drawn per day without repeats within a week. Each quest has `icon`, `voice`, `check(progressEvent)`.
- Arcade: "Süper Ayı'da 3. seviyeye çık", "Flappy'de 5 boru geç", "Hafıza kartlarını bitir", "Royal Match'te 500 puan".
- Learning (choose the two weakest skills from `mastery`): "Harf Ormanı'nda bir oyun oyna", "Sayı Dağı'nda 6 soru çöz", "Saat oyununda 4 doğru".
- Curiosity/creative: "Blok Dünyası'nda 8 bloklu köprü yap", "Merak Gölü'nde bir bölüm izle", "Bal'a yeni bir şapka tak", "Simetri aynasını tamamla".
All three done → "Günün kutusu" sticker + Bal dances (3-frame loop) + `sounds.levelUp`.

#### Sticker triggers — `src/lib/stickers.ts` (120 ids, 8 pages)
| trigger | page | count |
|---|---|---|
| each letter group mastered (5 groups × level 3) | Harfler | 29 (one per letter, animal/object starting with that letter) |
| counting 1–20 then ± to 10, ± to 20, clock, money, shapes, solids, patterns, symmetry mastered | Sayılar & Şekiller | 15 |
| each Merak episode finished (14) | Bilim | 14 |
| 3-star in an arcade game (19) | Macera | 19 |
| Blok challenge families completed (5) + first 5 saved worlds | Blok | 10 |
| streak days 3/7/14/30 | Güneşler | 4 |
| daily quest trio (first 20) | Günün kutusu | 20 |
| Bal level 2–10 | Bal | 9 |
Reveal: peel animation (CSS `clip-path` with pointer drag or auto after 1 s), `sounds.sticker`, haptic `[20, 40, 20]`, voice "Yeni çıkartma: Kaplumbağa!". The album shows silhouettes for locked stickers so the child knows what exists (collection pull) without knowing the order (surprise).

#### Bal Kapısı flow — `src/components/BalKapisi.tsx`
1. Trigger: `progress.canStartRun()` false → `ActivityShell` sets `GameSessionProvider active=false`, mounts `BalKapisi` as a bottom sheet over the paused canvas.
2. Bal (hungry pose) + jar at 0/3; voice: "Balım bitti! Bana bal ver."
3. `mastery.pickForGate()` → 3 `Exercise`s: two from the weakest skill at its level, one from a mastered skill (confidence item). Each item ≤ 12 s expected.
4. Correct: honey drop animation into the jar, `sounds.coin`, haptic 15 ms. Wrong: choice shakes, voice "Bir daha dene"; second wrong → reveal + voice of the correct answer; item counts as attempted, not correct.
5. Jar full: Bal eats, "Mmm! Teşekkürler!", +3 🍯, sheet slides down, `GameSessionProvider active=true`, the game's `restart()` runs.
6. If the sheet is dismissed (⏸ → Haritaya dön) nothing is lost; mastery still records attempts.

#### Blok Dünyası challenge validators — `src/activities/games/blocks/engine.ts`
- `kopyala(target: Grid, built: Grid)` → exact cell equality on the target bounding box; levels 3×3, 5×4, 7×6.
- `ayna(leftHalf: Grid, built: Grid)` → `built[x] === built[W-1-x]` for all rows across the given axis; the left half is locked (non-erasable) in the UI.
- `say(n, kind)` → `count(built, kind) === n` and the blocks form one 4-connected component touching both banks (for "köprü").
- `oruntu(row: Kind[], built: Grid)` → the next `k` cells continue the period detected from the given prefix (ABAB, AABB, ABC).
- `yukseklik(h)` → tallest column above Bal's standing tile is exactly `h`.
Each challenge has `voice`, `demo` (a 2-second ghost animation of the expected gesture) and `hint` after 60 s idle (ghost blocks blink). Validators are pure functions with unit tests; the renderer never decides correctness.

#### Merak capsule samples — register and shape (episode `isik-ve-golge`, 12 cards)
1. hook · 🔦🌳 · "Gölge nereden gelir?" · tap: "Sence?" (☀️ / 🌙 / 🧸 — no wrong answer, Bal says "Bakalım!")
2. fact · lab stage `light` preset angle 70 · "Işık bir yere çarpınca arkası karanlık kalır."
3. fact · lab stage `light` preset angle 20 · "Güneş alçaktayken gölge uzar." · tap: "Hangi gölge daha uzun?" (two silhouettes)
4. wonder · 🐈‍⬛ · "Kedinin gölgesi de kedi gibi mi?" · tap (🐈 / 🐟)
5. word · 🌑 · "Gölge." (spoken slowly twice, letters shown large)
6. fact · 🧊 vs 🪟 · "Cam ışığı geçirir, gölgesi az olur."
7. lab · interactive stage: drag the sun (3 positions as big buttons ☀️⬅️ ☀️⬆️ ☀️➡️) · "Güneşi oynat, gölgeyi izle."
8. quiz · "Gece lambası kapanınca gölge ne olur?" (🫥 kaybolur / 📏 uzar / 🔴 kızarır)
9. fact · 🌍🌙 · "Ay'ın gölgesi Dünya'ya düşebilir."
10. wonder · 🖐️ · "Elinle tavşan gölgesi yapabilir misin?"
11. quiz · "Gölge için ne lazım?" (💡 ışık / 💧 su / 🎵 ses)
12. mission · 👨‍👦 · "Babanla dışarı çık. Gölgeni ölçün. Akşam tekrar ölçün." · button "Bitti!" ends the episode; no next-episode button.
Rules: ≤ 8 words per `say`, concrete nouns only, every quiz answer is a picture + a one-word label, wrong picks get "Birlikte bakalım" and the explanation spoken in ≤ 8 words.

#### Child-facing copy table (replace adult strings everywhere) — `src/content/voice.ts`
| situation | old | new (spoken + shown) |
|---|---|---|
| start | "Başla! 🚀" + 3 paragraphs | "Hazır? Üç, iki, bir!" (countdown drawn on canvas) |
| game over | "Oyun bitti! Skor: 123" + "Tekrar oyna" | "Harika! 2 yıldız!" · buttons: ▶ Tekrar · 🗺️ Harita |
| wrong answer | "Henüz değil. Sen “X” seçtin; doğru yanıt “Y”…" | "Bir daha dene." → "Bu: Y." |
| milestone | "Eski rekorunu geçiyorsun! 🚀" (modal) | toast "Rekor!" + star burst, no pause |
| exit | "← Ana sayfa" link | ⏸ → "Gidiyor muyuz?" · ✅ Evet · ▶ Devam |
| time budget | — | "Bal uyuyor. Yarın görüşürüz!" + one mission card |
| empty honey | — | "Balım bitti! Bana bal ver." |
| install (parent) | — | "Telefona ekle" · iOS: "Paylaş ⎋ → Ana Ekrana Ekle" |

#### Haptic and audio palette — `src/lib/gameJuice.ts`, `src/lib/sounds.ts`
| event | vibrate | sound |
|---|---|---|
| tap UI | — | `tap` |
| collect / correct | 12 ms | `coin` / `success` |
| jump / flap | 8 ms | `jump` |
| hit / wrong | 35 ms | `wrong` (softened: triangle 220 Hz, 0.18 s) |
| level up / new star | [20, 30, 60] | `levelUp` |
| sticker | [20, 40, 20] | `sticker` (new: ascending 4-note + sparkle noise) |
| honey drop | 10 ms | `honey` (new: low plop) |
| game over | [40, 40, 80] | `gameOver` |
| countdown 3-2-1 | 10 ms each | `countdown` (new) |
All behind `settings.voiceOn`/`hapticsOn`; vibration is a no-op on iOS Safari (no API) — do not design anything that depends on it.

#### Difficulty and "ease" — `superBearLevelGen.ts`, `FlappyBird.tsx`, `progress.ease`
- `ease` starts at 0.7 for a fresh profile, +0.05 after each 3-star run in a game, −0.05 after three consecutive runs under the 1-star mark, clamped 0.6–1.0; stored per game in `progress.stars[slug].ease`.
- SuperBear: `nWolves = max(1, round((2 + L/7 + L/25) * ease))`, `nBees = round((1 + L/12 + L/40) * ease)`, enemy `spdMul *= ease`, level 1–3 gaps use `gapTight = 8` regardless of L; lives 3 → 5 at ease < 0.8; checkpoint flag at mid-level so death does not restart the whole level.
- Flappy: `PIPE_GAP = 128 + 60*(1-ease)`, `PIPE_SPD = 2.4 - 1.2*(1-ease)`, first two pipes extra wide.
- Runner/PlatformJump/RainCatcher: spawn interval × `(2 - ease)`.
- Exercise levels: level 1 = 2 choices, level 2 = 3, level 3 = 4; numeric ranges per level in each generator file.

#### Metrics the father's panel should show (and we tune on)
Minutes per day, runs per session, Bal Kapısı completion rate (target > 85 %), exercises per day (target ≥ 12), weakest skill trend, episodes finished, Blok challenges passed, crashes. If Bal Kapısı completion drops under 70 % the gate is too hard — lower the item count to 2 before touching the economy.

---

## 3. Phase 1 scope — one session, ~8 engineers in parallel

Goal of the session: the child can install the app, log in with one tap, hear everything, play a visibly better Süper Ayı/Flappy, earn stars/honey/stickers, hit a Bal Kapısı, build in Blok Dünyası, swipe one Merak episode, and the father can see skills and set a time budget. All of it production-grade (PWA, error boundaries, CI gate, tests, Firebase rules).

Shared contracts to agree in the first 30 minutes (one engineer writes them, everyone imports):
- `src/lib/progress.ts` API: `runStart/runEnd/learningEnd/levelComplete/capsule/getState/subscribe`.
- `src/lib/speech.ts` API: `speak/cancel/unlock/isSupported`.
- `Exercise`, `Capsule`, `MenuItem` (with `world`, `voice`) types.
- Game class contract preserved (`.game-panel .canvas-game .fullscreen-game .acelya-game .game-canvas .game-touch-bar …`).
- Storage keys suffixed `-<player>` and versioned `-v1`.

| Eng | Owns | Deliverables (Phase 1) |
|---|---|---|
| **E1 Shell & home** | F1, F2, F3 | `speech.ts`; avatar login + PIN gate + CSS splash; `WorldMap` + `IslandScreen` + `CompanionBar`; `MENU` regroup into 6 worlds + hidden "Baba ile"; remove `BubbleBg`, `MenuScreen`, search/tabs; voice labels on every tile |
| **E2 Progression** | F4, F5 | `progress.ts`, `quests.ts`, `stickers.ts` (120 ids, 20 cosmetics), `RewardSheet`, `BalKapisi`, `CelebrationProvider.toast`, hooks in `useGameScore`/`ExerciseSession`; local-first + Firebase mirror; unit tests for all rules |
| **E3 Game infra** | F9 | `useGameLoop`, DPR `useCanvasFit`, `sounds.unlock`/gain/mute, haptics, shake fix, thumb-zone `GameTouchBar`, play-mode topbar with confirm-exit, `GameHud`, `ease` in `superBearLevelGen` + Flappy constants; migrate the 10 listed games; fix all 14 lint errors + 33 unused vars |
| **E4 Blok Dünyası** | F6 | `blocks/engine.ts` (pure, tested), renderer with atlas + DPR, `BlockWorld.tsx` (palette, undo, 5 saves, Bal walking, day/night), 5 challenge validators + 15 seeded challenges, PNG export to Firebase gallery; menu/knowledge/guide entries |
| **E5 Learning engine** | F8 | `Exercise` type, `rng.ts`, `mastery.ts`, `ExerciseSession` (voiced, visual, retry, stars), 16 generators × 3 levels, visual components (`ObjectGrid`, `TenFrame`, `ClockFace`, `CoinRow`, `LetterCard`), rebuild Symmetry/Tangram/ShapeDraw/Count/Order, delete duplicates and dead pools, fix content bugs, map all Harf/Sayı/Şekil/Bilim slugs to generators |
| **E6 Merak Akışı** | F7 | `capsules.ts` type + 4 episodes × 12 (child register, ≤ 8 words, 2–3 picture answers), `CapsuleFeed`/`CapsuleCard` with scroll-snap + voice + tap question + mission end, daily cap, extract `*Stage` components from `InteractiveLab`, child/parent split of `/kesfet/[slug]` (sources as text), `logDogukanVisit` on capsules |
| **E7 Production & parent** | F11, F12 | manifest/icons/sw/offline/PwaRegister, error boundaries + not-found, Firebase anon auth + rules + lazy import, image cleanup, CI two-job workflow, Vitest setup + invariant tests + `verify-out.mjs`, CSS split and motion/hover gating, `/bilgi` v2 (minutes, skills, stars, gallery, crashes) + settings + "Telefona ekle", time-budget "Bal uyuyor" screen |
| **E8 Art, audio & copy** | F13, parts of F2/F9 | SVG icon set, 6 island illustrations, Bal atlas (6 frames + 20 cosmetic overlays), sticker set (120 flat SVGs), `sprites.ts`; `sounds.ts` palette extension; rewrite `guides.ts` intros to one voiced sentence + picture, IntroModal → `StartCard` (picture + 1 sentence + giant Başla, 3 s auto-speak); all child-facing UI copy in ≤ 5-word register; voice script file `src/content/voice.ts` |

Integration order inside the session: hour 0–1 contracts → E1/E2/E3/E5 skeletons land first (others depend on `speech`, `progress`, `Exercise`) → E4/E6/E7/E8 integrate on top → final hour: `npm run lint --max-warnings 0 && tsc && vitest && build && verify-out`, manual pass on a 390×844 viewport in Chrome device mode and on a real iPhone/Android if available.

Definition of done for Phase 1: install prompt works on Android; iOS shows the add-to-home card and a 180 px icon; `/` paints a splash before JS; zero typed text required anywhere on the child path; Süper Ayı runs at identical speed at 60/120 Hz with crisp sprites; game over → RewardSheet → (honey 0) BalKapısı → restart without leaving the page; Blok Dünyası saves and reloads a world; one Merak episode plays end to end with voice; `/bilgi` shows at least minutes-today and a mastery bar; CI green with tests.

---

## 4. What to remove or demote (and why)

**Remove**
- `LoginScreen` typed form, "Oturumu açık tut", header "Çıkış yap" — the child cannot use them and they are how he gets bounced out.
- `MenuScreen` search box, 8 filter tabs, 69 text cards, `.menu-knowledge-link` per card, "69 aktivite · 7 kategori" stats, portal banner copy — a non-reader cannot navigate text; the map replaces all of it.
- `BubbleBg` on every route — a second RAF loop under games for no gameplay value.
- Duplicate activities `hizli-matematik`, `kelime-avcisi`, `hedef-vur` (same pools as toplama/kelime-okuma) and dead pools `Q.gezegenler`, `Q.hayvanlar` — padding that dilutes the map.
- `ExplorePanel` for gezegenler/hayvanlar — a paragraph switcher at lise register; both become Merak episodes with picture questions.
- Fake exercises as they are: `TangramLite` (any tap wins), `SymmetryGame` (two correct buttons, tests sameness), `ShapeDraw` (free draw) — replaced by real versions in F8; a game that cannot be lost teaches that effort does not matter.
- `window.location.reload()` restarts in Count/Order/Symmetry/Tangram — they re-log visits and reload 800 KB.
- `ScoreHud` rival paragraph and `"Bu oyunda lider: …"` — rivalry with Dad is fine as a parent-panel stat, not as three lines of text above every game for a 6-year-old.
- `IntroModal` text walls with keyboard instructions ("Shift — engeli uzaklaştır", "Z/X/C/V") on 69 first visits — replaced by `StartCard`.
- Unreferenced `dogukan.png` (760 KB), starter SVGs in `public/`, `apple-icon.svg` (ignored by Next), hard-coded `1 Ağustos 2026`, dead `RawTopic` fields.
- External `<a href>` source links on `/kesfet/[slug]` for the child — plain text; links only in `/bilgi`.

**Demote (keep, move behind the parent gate as "Baba ile")**
- `dovus-arenasi` (fighting), `tank-savasi`, `uzayli-istilasi`, `uzay-savunma`, `asteroids`, `pinball-space-cadet` — shooting/fighting themes and wide-logical canvases; fine as father–son sessions, not as the child's default diet. This is the concrete form of "zararlı içerikten korunsun".
- `ActivityKnowledgePanel` — excellent parent material in the child's voice; move to `/bilgi` per activity and to a long-press "Anne-baba" sheet; keep only the voiced `talkQuestion` on the child's `RewardSheet` ("Babaya sor: …").
- `/kesfet` hub and long articles — keep as parent/reference pages; the child's entry is Merak Gölü → episodes.
- Encyclopedia `mission`s — keep as the final capsule of each episode and as parent suggestions.
- Leaderboard rivalry (`leaderboard.ts`) — keep the data and `/bilgi` display; stop celebrating "Serkan'ı geçtin!" mid-run to a 6-year-old who cannot read it; stars replace it as the child-facing goal.
- Quiz content at lise register (`eksen eğikliği`, `stoma`, `yüklem`, `sera etkisi`, `para üstü`) — rewrite, never show as-is.

---

## 5. Open questions for the father

1. **Phone and reading level.** iOS or Android (affects Turkish TTS quality and the install flow)? Which ses grubu is Doğukan's class on right now (e-l-a-k-i-n only, or further)? This sets the starting `mastery` levels so day 1 is neither boring nor frustrating.
2. **Your voice.** Would you record ~150 short lines (greetings, 4 Merak episodes, letter sounds) on your phone? Pre-recorded father's voice beats any TTS for a 6-year-old and works offline; we would ship them as `public/voice/*.m4a` with TTS as fallback.
3. **Limits.** Default daily budget 40 minutes and bedtime 20:30, 6 free honey per day, 2 Merak episodes per day — adjust? And should the "Baba ile" shooter/fighting games stay in the app at all?
4. **Rivalry.** Keep the Doğukan-vs-Serkan high-score mechanic visible to him (as stars he can beat) or make it parent-only?
