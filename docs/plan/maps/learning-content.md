# Learning-content map — "Doğukan'ın Yeri"

Reader #3 of 5. Scope: the educational content layer and its fit for a Turkish 6-year-old (anaokulu / 1. sınıf, emerging reader). Repo root: `/home/user/dogukan`. All paths below are relative to `src/` unless stated.

---

## 0. TL;DR for the implementer

- **39 of 69 activities are driven by 7 tiny shared components** (`activities/shared/*.tsx`, 613 lines total) fed by one static data file (`activities/data/quizData.ts`, 258 lines). 32 of those 39 are the same `QuizGame` multiple-choice screen with a different question array. The remaining 30 are canvas/arcade games (`activities/games/*.tsx`), outside this reader's scope except where they carry curriculum content (BalloonPop, ColorRace, LetterTrace, MemoryGame, TreasureMap).
- **Nothing in the activity layer is voiced.** `window.speechSynthesis` is used in exactly one place: `components/encyclopedia/EncyclopediaTools.tsx:45-74` ("Bana oku" button on encyclopedia topic pages). Every quiz prompt, option, hint and feedback paragraph must be *read*. For a child who cannot yet read, `QuizGame` is unusable without an adult.
- **Content difficulty is wildly inconsistent**: half the questions are okul öncesi (count 3 apples), the other half are 4.–9. sınıf ("eksen eğikliği", "stoma", "eylemsizlik", "yüklem"). The pattern suggests a past "scientific accuracy" pass that rewrote prompts into textbook register without re-checking the reader's age.
- **No difficulty adaptation, no mastery tracking, no shuffling.** Questions are served in fixed array order, distractors are chosen by a deterministic hash (`QuizGame.tsx:33-38`), quiz results are never persisted (QuizGame does not call `useGameScore`), four shared components restart via `window.location.reload()`.
- **Three shared components are not real exercises**: `TangramLite` accepts any tap as correct, `SymmetryGame` tests "same emoji" not symmetry and has two correct buttons, `ShapeDraw` is free-draw with no target or recognition.
- **The surrounding frame is adult-facing**: `IntroModal` is a text wall with keyboard controls; `ActivityKnowledgePanel` renders ~5 paragraphs of 9th-grade physics/biology under every game, in the child's first-person voice ("Bu oyunda hangi fikri keşfediyorum?").
- **Good news**: the data model is already flat and string-based; `toplama`/`cikarma` are already formula-generated (`quizData.ts:94-118`). Converting the layer to per-session generators with audio prompts and a mastery store is a contained refactor, not a rewrite.

---

## 1. Architecture of the content layer (data flow)

```
lib/menu.ts            MENU[7 categories] → {slug,label,emoji}  (69 items; TOTAL_ACTIVITIES; findActivity())
        │
        ├── app/aktivite/[slug]/page.tsx   generateStaticParams() from MENU; calls getActivityLearning(slug)  [server]
        │        │
        │        └── lib/activityLearning.ts  ("server-only")  ACTIVITY_KNOWLEDGE[slug] + getGuide(slug) + getTopic(relatedTopicSlug)
        │                 ├── lib/guides.ts        GUIDES[slug] = {type,intro,controls[],learn}   → IntroModal
        │                 └── lib/encyclopedia.ts  TOPICS (14) → relatedTopic {slug,title,emoji,summary} → ActivityKnowledgePanel link
        │
        └── app/aktivite/[slug]/ActivityClient.tsx  [client]  logDogukanVisit(slug,title) → Firebase (if configured)
                 │
                 └── components/ActivityShell.tsx
                          ├── IntroModal (shown until localStorage "dogukan-guide:v2:<slug>"==="1")
                          ├── <GameSessionProvider active={showHelp===false}> {Activity()} </...>
                          └── ActivityKnowledgePanel (always rendered below the game)
                                   where Activity = activities/registry.tsx ACTIVITY_MAP[slug]
                                            ├── <QuizGame questions={Q.xxx}/>  ×32   ← activities/data/quizData.ts
                                            ├── <CountGame/> ×1, <OrderGame items={[3,7,1,9,5]}/> ×1
                                            ├── <ExplorePanel items={GEZEGENLER|HAYVANLAR}/> ×2  (data inline in registry.tsx:49-65)
                                            ├── <ShapeDraw/>, <SymmetryGame/>, <TangramLite/> ×1 each
                                            └── dynamic(() => import("./games/X"), {ssr:false}) ×30
```

Key invariants enforced at build time:
- `activityLearning.ts:598-607` throws if `ACTIVITY_KNOWLEDGE` keys ≠ `MENU` slugs (both directions). Adding/removing a menu item **requires** a matching knowledge entry and a `GUIDES` entry (`guides.ts:458-462` throws on missing guide).
- `encyclopedia.ts:2209-2250` throws if a topic lacks classification or has <2 or >3 sources.
- Static export (`output: "export"`): there is **no server at runtime**. Anything "per-session" must be computed in the browser. `activityLearning.ts` runs at build time only and ships one record per page as props.

Client bundle note: `registry.tsx` is `"use client"` and statically imports `* as Q from "./data/quizData"` and all 7 shared components, so every quiz pool ships on every activity page. Only the 30 canvas games are code-split.

---

## 2. Activity inventory (69) by category, with component and pool size

Legend for **Fit**: ✅ age-appropriate as-is · ⚠️ right skill, wrong presentation/level · ❌ not suitable for a 6-year-old non-reader · 🪦 not a real exercise / dead content

### 🎮 Oyunlar (24) — `menu.ts:10-41`
| slug | component | learning content | fit |
|---|---|---|---|
| super-ayi … kaydir-puzzle (21 arcade) | games/* | motor/reflex; see other readers | — |
| hafiza-kartlari | games/MemoryGame | 3 manual levels (6/10/14 pairs) `MemoryGame.tsx:9-18` | ✅ |
| balon-patlat | games/BalloonPop | a,b ∈ 1..5, a+b, 6 rounds `BalloonPop.tsx:18-24` | ✅ (needs visuals) |
| renk-yaris | games/ColorRace | 6 colour names, 40 s `ColorRace.tsx:13-22`; prompt is text + swatch + emoji, **no audio** despite guide saying "dinle" | ⚠️ |
| hizli-matematik | QuizGame `Q.hizliMatematik` | `[...toplama,...cikarma].slice(0,10)` → **duplicate** of toplama-oyunu | 🪦 dup |
| kelime-avcisi | QuizGame `Q.kelimeAvcisi` | `= kelimeOkuma` → **exact duplicate** of kelime-okuma | 🪦 dup |
| hedef-vur | QuizGame `Q.hedefVur` | `toplama.slice(0,6)` → **duplicate** | 🪦 dup |

### 🧭 Serbest Oyunlar · Ebeveynle (5) — `menu.ts:42-54`
dovus-arenasi, tank-savasi, uzayli-istilasi, meyve-bicagi, kostebek-vur — arcade, no curriculum content. Note the "Ebeveynle" label is the only parental-gating signal; nothing enforces it.

### 📖 Okuma & Yazma (9) — `menu.ts:55-71`
| slug | component | pool | fit | notes |
|---|---|---|---|---|
| harf-tanima | QuizGame `harfTania` | 29 | ❌ | Prompt `“Arı” kelimesi hangi harfle başlar?` (`quizData.ts:19-21`) — **circular for a non-reader**: you must read "Arı" to answer "A". Guide promises audio ("Söylenen harfi bul", "Sesi dinle" `guides.ts:186-187`) that does not exist. Served A→Z in fixed order. |
| harf-yazma | games/LetterTrace | 8 letters A E B S T O K M, uppercase only, dot-to-dot `LetterTrace.tsx:6-44` | ⚠️ | Good mechanic; too few letters, no lowercase, no stroke animation, order doesn't match MEB ses grupları. |
| hece-birlestir | QuizGame `heceBirlestir` | **4** | ⚠️ | `el + ma = ?` requires reading syllables; fine for 2nd half of 1. sınıf. Pool exhausted in one session. |
| kelime-okuma | QuizGame `kelimeOkuma` | 10 | ✅ | Picture → word (🐱 → KEDİ). Best-designed quiz. All-caps; schools read lowercase first. |
| sesli-harf | QuizGame `sesliHarf` | 10 | ⚠️ | Binary Evet/Hayır (50 % guess). "Sesli/sessiz" is the colloquial term; MEB uses ünlü/ünsüz. |
| cumle-kur | QuizGame `cumleKur` | 6 | ❌ | `“Kim? → Nereye? → Ne yapıyor?” sırasını seç.` + hint `Kurallı cümlede yüklem genellikle sondadır.` (`quizData.ts:62`) — grammar metalanguage, 4.–5. sınıf. |
| alfabe-sirasi | QuizGame `alfabeSirasi` | **3** | ⚠️ | Alphabet order is not a 1. sınıf outcome (MEB teaches letters by ses grupları, alphabet order comes 2. sınıf). |
| benzer-kelime | QuizGame `benzerKelime` | 6 | ⚠️ | Q1–4 fine (categories). Q6 `'sevinçli' sözcüğüne anlamca en yakındır` (`:82`) is 3. sınıf eş anlam. |
| bosluk-doldur | QuizGame `boslukDoldur` | 6 | ⚠️ | Full-sentence reading. Q3 `Kuşlar yuvalarını dallara ___ → kurabilir` (`:88`) — morphology too advanced. |

### 🔢 Sayılar (9) — `menu.ts:72-88`
| slug | component | pool | fit | notes |
|---|---|---|---|---|
| sayma-oyunu | CountGame | random 1–9, 8 rounds | ✅ | Only shared component with real randomness. Caps at 9; MEB 1. sınıf goes to 20. |
| toplama-oyunu | QuizGame `toplama` | 12 (generated) | ⚠️ | Sums ≤ 8 — good range. But prompt is bare `3 + 2 = ?`; no objects/ten-frame. Guide claims "Görseller sana yardım eder" (`guides.ts:242`) — false. |
| cikarma-oyunu | QuizGame `cikarma` | 12 (generated) | ⚠️ | 5..9 − 1..4. Same: no visuals. |
| sayi-sirasi | OrderGame `[3,7,1,9,5]` | **1 fixed set** | ⚠️ | Always the same five numbers (`registry.tsx:104`). |
| cift-tek | QuizGame `ciftTek` | 4 | ⚠️ | Binary; concept is 2. sınıf in MEB. |
| onluk-birlik | QuizGame `onlukBirlik` | 3 | ❌ | `23 sayısının onluk basamağındaki rakam nedir?` — numbers > 20, adult phrasing. |
| saat-ogren | QuizGame `saatOgren` | 3 | ❌ bug | `Saat 3:00` shows emoji 🕐 (**one o'clock**) `quizData.ts:134`. Only "akrep nerede" text, no clock face. |
| para-say | QuizGame `paraSay` | 6 | ❌ | `para üstü` (`:142`) is 2. sınıf; 12 − 5 word problems; no coin images. |
| karsilastir | QuizGame `karsilastir` | 3 | ⚠️ | Q3 uses `>` `<` symbols (`:151`), 2. sınıf. |

### 🔷 Şekiller & Renkler (7) — `menu.ts:89-103`
| slug | component | fit | notes |
|---|---|---|---|
| renk-atolyesi | games/ColorWorkshop | — | out of scope (canvas) |
| sekil-tani | QuizGame `sekilTani` (3) | ❌ bug | Shape is inside the prompt text (`🔺 Bu şekil?`) while the big `q-emoji` is `⬛` for all three (`quizData.ts:155-157`) — child sees a huge black square and is asked about a triangle. |
| sekil-ciz | ShapeDraw | 🪦 | Free-draw; "Şekil çiz: ⭕" only changes stroke colour (`ShapeDraw.tsx:33`). |
| simetri | SymmetryGame (3) | 🪦 | Buttons 1 and 3 both call `pick(true)` (`SymmetryGame.tsx:152-159`); the "wrong" one is a different emoji. Tests "which is the same", not symmetry. |
| desen-tamamla | QuizGame `desenTamamla` (3) | ✅ (tiny) | Good ABAB / AABAA / 1-2-3 patterns; only 3. |
| sekil-say | QuizGame `sekilSay` (6) | ⚠️ | Q4–6 escalate to "kareler üçgenlerden kaç tane fazladır" (`:172`) — compare-difference, 2. sınıf. |
| tangram | TangramLite | 🪦 | `place()` accepts any piece in any order (`TangramLite.tsx:177-182`); 5 taps → "Harika! 🏠". `▱` is a text-presentation glyph, inconsistent on phones. |

### 🔬 Bilim & Doğa (9) — `menu.ts:104-120`
| slug | component | fit | notes |
|---|---|---|---|
| dinozor-kazi | games/DinoDig | ✅ | 3 dinosaurs, scratch-to-reveal bones; good curiosity hook. |
| hava-durumu | QuizGame `havaDurumu` (3) | ⚠️ | Q1 options are 5-word phrases (`İnce kıyafet ve güneşten korunma` `:176`). |
| gezegenler | ExplorePanel `GEZEGENLER` | ❌ | Facts: `Kalın karbondioksit atmosferinin oluşturduğu güçlü sera etkisi…` (`registry.tsx:51`). Lise level. `Q.gezegenler` quiz pool (`quizData.ts:181-185`) exists but is **unused**. |
| vucudumuz | QuizGame `vucudumuz` (3) | ❌ | `Havayla kan arasında oksijen ve karbondioksit alışverişi hangi organda…` (`:189`). |
| besin-gruplari | QuizGame `besinGruplari` (3) | ✅ | 🥛 → Süt ürünleri. Short, visual. |
| bitki-buyume | QuizGame `bitkiBuyume` (5) | ❌ | `Çimlenme/Tozlaşma/Buharlaşma/Solunum`, `Stoma`, `kontrollü karşılaştırma` (`:200-204`) — 4.–7. sınıf Fen. |
| hayvanlar | ExplorePanel `HAYVANLAR` (4) | ⚠️ | 4 animals; aslan fact is adult register (`registry.tsx:61`). `Q.hayvanlar` pool unused. |
| mevsimler | QuizGame `mevsimler` (6) | ❌ | `Dünya'nın eksen eğikliği ve Güneş çevresindeki dolanımı` (`:217`), Güney Yarımküre (`:218`). Lise coğrafya. |
| su-dongu | QuizGame `suDongu` (3) | ⚠️ | Options are sentences (`Su buharına dönüşebilir`); hints name buharlaşma/yoğunlaşma. |

### 🧠 Mantık (6) — `menu.ts:121-134`
| slug | component | pool | fit |
|---|---|---|---|
| hazine-haritasi | games/TreasureMap | 8 fixed levels | ⚠️ — instructions are text (`"2 sağ → 2 aşağı"` `TreasureMap.tsx:14-23`), arrows on buttons help. Good concept. |
| sira-bul | QuizGame `siraBul` | 3 | ✅ tiny |
| boyut-sirala | QuizGame `boyutSirala` | **2** | ⚠️ text animal names, no pictures |
| mantik-eslestir | QuizGame `mantikEslestir` | **2** | ⚠️ analogy in text form |
| fark-bul | QuizGame `farkBul` | **2** | ✅ emoji odd-one-out (works via the duplicate-option path in `makeOptions`) |
| grupla | QuizGame `grupla` | **2** | ⚠️ text words |

**Pool-size summary**: 11 pools have ≤3 questions; 6 have exactly 2. With `MAX_QUESTIONS_PER_SESSION = 10`, a "session" of fark-bul is 2 taps then a result screen.

---

## 3. Shared components — deep dive and engagement rating (1–5 for a 6-year-old)

### 3.1 `QuizGame` — `activities/shared/QuizGame.tsx` (199 lines) — **2/5**
- Type: `QuizQuestion = { prompt; emoji?; answer; options: string[]; hint?; explanation? }` (`:6-13`). Exported and reused by `quizData.ts`.
- Session: `getSession()` slices `questions[start, start+10)` (`:40-42`); on finish `getNextSessionStart()` advances or wraps (`:44-46`). **No shuffle** — question order is array order every time.
- Options: `makeOptions()` filters out the answer, rotates by `stableHash(prompt|answer)`, takes 3, rotates again (`:33-38`). Deterministic → the same 3 distractors in the same positions forever. For 29-letter pools this yields three alphabet-adjacent distractors.
- Feedback: on pick, `sounds.success()`/`sounds.wrong()` (WebAudio tones, `lib/sounds.ts:38-40`), CSS `pulse`/`shake` on `.question-card` (`globals.css:801-807`), then a **text paragraph** `.hint-text`: wrong → `Henüz değil. Sen “X” seçtin; doğru yanıt “Y”. {explanation}` (`:161-165`). Answer is revealed immediately; **no second try**. Buttons disabled until "Sonraki →".
- Result: `.result-panel` with 🏆/⭐/💪 by percentage and `Tebrikler!` (`:74-104`). Replay keeps state (no reload) — the only shared component that does this right.
- Accessibility is decent (`role="progressbar"`, `aria-live`), but accessibility ≠ child usability: nothing is spoken.
- Typography (`globals.css`): prompt `.question-card h2` 1.25 rem (`:821-826`), options `.option-btn` 1.1 rem in a 2-col `.options-grid` (`:848-871`), hints `.hint-text` 0.85 rem (`:836`), round label 0.82 rem (`:787`). Too small for a child; `q-emoji` at 3 rem (`:815`) is the only big element.
- Why 2/5: a reader-dependent, static, text-feedback multiple-choice form. Emoji + progress bar + sounds are the only juice. Ten questions is long for this age.

### 3.2 `CountGame` — `CountGame.tsx` (87 lines) — **3/5**
- `useMemo` on `round` → `count = randInt(1, 9)`, random emoji from 8, 3 random wrong numbers, shuffled (`:13-19`). Real variety.
- Visual: `.count-grid` of `.count-item` 2 rem emoji with staggered `pop-in` (`:60-65`; CSS `globals.css:923-935`). `.num-grid` 4-column buttons (`:66-78`).
- Weaknesses: 8 rounds then `window.location.reload()` (`:46`); range stops at 9; no grouping cue for >5 (ten-frame / rows of 5 would help subitising); "Kaç tane var?" is short but still text; no audio; score not persisted.

### 3.3 `OrderGame` — `OrderGame.tsx` (66 lines) — **2/5**
- Props `items`, `label = "Küçükten büyüğe sırala"`. Sorted target computed with `(a < b ? -1 : 1)` (`:12`). Tap in correct order → chip moves to `.order-slot`; wrong → only `sounds.wrong()`, no visual (`:17-31`).
- Only caller passes `[3, 7, 1, 9, 5]` (`registry.tsx:104`). Restart = `window.location.reload()` (`:38`). No rounds, no score, no variety. Mechanic (tap-in-order) is fine; content is one puzzle.

### 3.4 `ExplorePanel` — `ExplorePanel.tsx` (45 lines) — **1/5**
- `ExploreItem = { id; emoji; title; fact }`. Big emoji + `<h3>` + one `<p>` of text (`:21-26`), emoji tabs `.explore-tab` 48 px (`globals.css:1333-1347`).
- Pure reading; facts are adult register; no interaction beyond switching tab; no quiz, no audio, no animation. For a non-reader it is 8 emoji buttons that change a paragraph he cannot read.

### 3.5 `ShapeDraw` — `ShapeDraw.tsx` (97 lines) — **2/5**
- Fixed `<canvas width=300 height=220>` with mouse+touch handlers (`:79-91`); `touch-action:none` on `.draw-canvas` (`globals.css:1372-1379`). Picking a shape in `.shape-picker` only changes `strokeStyle` (`:33`).
- No target outline, no recognition, no reward, no undo, single brush width. Fun for 30 s. Coordinate mapping uses `getBoundingClientRect()` without scaling by `canvas.width/rect.width`, so when `max-width:100%` shrinks the canvas on narrow phones the stroke is offset from the finger.

### 3.6 `SymmetryGame` — `SymmetryGame.tsx` (68 lines) — **1/5**
- 3 `LEVELS` `{left, right, wrong}` (`:6-10`); renders three `.sym-option` buttons; left and right both `pick(true)` (`:152-159`). Prompt "Hangisi aynı (simetrik)?" conflates "same" with "symmetric". Wrong answer: sound only. Restart via reload.

### 3.7 `TangramLite` — `TangramLite.tsx` (51 lines) — **1/5**
- `PIECES = ["🔺","🔷","⬜","🔺","▱"]`; `place()` appends any tapped piece (`:12-17`); done after 5 taps. No board, no target silhouette, no rotation, no validation. Misleads the parent (menu says "Tangram").

### Ratings of curriculum-bearing canvas games (for completeness)
- `MemoryGame` 4/5 (levels, flip animation, moves counter).
- `BalloonPop` 3/5 (floating balloons, but bare `a + b` text and 6 rounds).
- `ColorRace` 3/5 (colour swatch + emoji + name; would be 4 with spoken colour name).
- `LetterTrace` 3/5 (dot-to-dot, 8 letters).
- `TreasureMap` 3/5 (grid + arrow buttons; text instructions).
- `DinoDig` 4/5.

---

## 4. Readability / voicing audit

**Is question text readable by a non-reader?** No. Every `QuizGame` prompt is a sentence. Even the visual ones carry a sentence (`Bu kelime ne?`, `Kaç tane var?`). Options are words/sentences in 27 of 32 quizzes; only `desenTamamla`, `farkBul`, `siraBul` (partly) and numeric quizzes have symbol options.

**Is anything voiced?**
- `lib/sounds.ts`: synthesised tones only (`tap, success, wrong, pop, win, star, coin, …`). No speech.
- `lib/acelyaSounds.ts`, `lib/acelyaAsteroidsMusic.ts`: `.m4a` files under `public/sounds/` for Asteroids only.
- `components/encyclopedia/EncyclopediaTools.tsx:16-19` `findTurkishVoice()` picks a `tr` voice; `:56-59` sets `lang="tr-TR"`, `rate=0.9`, `pitch=1.04`. This is a ready-made pattern to lift into `lib/speech.ts`. Caveats for implementers: iOS Safari requires a user gesture before the first `speak()`, voices load asynchronously (`voiceschanged` event not handled here), and `speechSynthesis.cancel()` must be called on route change (done at `:41`).
- Guides promise audio that does not exist: `guides.ts:149` ("Renk adını oku veya dinle"), `:186-187` ("Söylenen harfi bul", "Sesi dinle").

**Visual scaffolding gap**: toplama/cikarma/para/saat have no manipulatives, coins or clock face; guide text claims they do (`guides.ts:242, 273, 279`).

---

## 5. Difficulty adaptation, variety, persistence, feedback

| aspect | state | where |
|---|---|---|
| Adaptive difficulty | none in shared components | — |
| Manual levels | MemoryGame (3), SuperBear campaign (100, `games/superBearLevelGen.ts`) | canvas only |
| Question order | fixed array order | `QuizGame.tsx:40-42` |
| Distractor variety | deterministic hash | `QuizGame.tsx:33-38` |
| Per-round randomness | CountGame, BalloonPop, ColorRace, MemoryGame only | — |
| Quiz result persistence | **none** — QuizGame/CountGame/OrderGame/Symmetry/Tangram never record scores | `useGameScore` imported by 23 canvas games, 0 shared components |
| High scores | `localStorage "dogukan-scores-<player>"` + Firebase `leaderboard/` | `lib/leaderboard.ts:9-30`, `hooks/useGameScore.ts` |
| Parent visibility | `/bilgi` sees logins + last 80 visits (slug, title, time) + leaderboard. **No skill/mastery data exists to show.** | `lib/activityLog.ts:40-52, 85-87` |
| Visit inflation | `logDogukanVisit` fires in `ActivityClient` `useEffect` (`ActivityClient.tsx:16-18`); every `window.location.reload()` restart logs a new visit | CountGame:46, OrderGame:38, SymmetryGame:47, TangramLite:44 |
| Encyclopedia progress | `localStorage "dogukan-merak-ansiklopedisi-v1"` {favorite, complete, lastVisited} | `lib/encyclopediaProgress.ts` |
| Celebrations | `CelebrationProvider` toast via `useGameScore.submitFinal/checkMilestone` — never triggered by quizzes | `components/CelebrationProvider.tsx` |
| Particles / juice | `lib/particles.ts`, `lib/gameJuice.ts` exist for canvas games; quizzes use none | — |

Feedback quality verdict: correct = pleasant chord + green button + text; wrong = sawtooth buzz + red button + reveal + explanatory paragraph. For a 6-year-old: the buzz is fine, the reveal-without-retry removes the learning moment, and the paragraph is invisible to him. No character, no streak visual, no stars-per-question, no end-of-session reward beyond an emoji.

---

## 6. The frame around every activity

### 6.1 `IntroModal` — `components/IntroModal.tsx`
- Renders `guide.type` badge, `title`, `Ne yapacaksın? {guide.intro}`, `Nasıl oynanır?` list of `guide.controls`, `Öğrenme notu: {guide.learn}`, buttons `Başla! 🚀` / `Bir daha gösterme` (`:91-121`). Focus trap + Escape (`:57-79`). `.intro-card` max-height 85dvh with scroll (`globals.css:720-729`).
- Shown on every activity open until the child taps "Bir daha gösterme" (`ActivityShell.tsx:26-51`, key `dogukan-guide:v2:<slug>`). While shown, `GameSessionProvider active=false` pauses canvas games (`ActivityShell.tsx:101`) — good for games, irrelevant for quizzes.
- Content is desktop-centric: `"← → — koş"`, `"Shift — engeli uzaklaştır"`, `"Z/X/C/V — farklı yakın hamleler"` (`guides.ts:44-48, 27-30`). `type` values are inconsistent (`"Oyun"`, `"Klasik Beceri Oyunu"`, `"Sanal Spor Karşılaşması"`, `"Okuma"`, `"Sayılar"`).
- For the target user it is a reading gate in front of every game. It should become a 3-second animated/spoken demo or disappear.

### 6.2 `ActivityKnowledgePanel` — `components/ActivityKnowledgePanel.tsx`
- Always rendered under the game (`ActivityShell.tsx:104`), reachable via 💡 `.knowledge-jump-btn` (`:79-86`). Sections: ribbon `OYUN → MERAK → BİLGİ`, `Bu oyunda hangi fikri keşfediyorum?` + `learning.idea`, three `<article>`s (`Temel kavram`, `Gerçek hayatta nerede?`, `Birlikte konuşalım` with `<small>Tek bir doğru cümle aramayın…</small>`), and a link card to `/kesfet/<topic>/`.
- Source text `lib/activityLearning.ts` `ACTIVITY_KNOWLEDGE` (69 entries, `knowledge(relatedTopicSlug, term, idea, definition, realLife, talkQuestion)`). Register samples: asteroids → `Eylemsizlik, bir cismin duruyorsa durmayı…` (`:88-94`); tetris → `Bir şekil döndürülünce büyüklüğü ve kenarları değişmez` (`:66`); hece-birlestir → `Hece, ağzın tek hareketiyle söylenen ve içinde en az bir ünlü bulunan ses grubudur` (`:316`). This is well-written **parent** material mislabelled as the child's voice. The `talkQuestion` field is genuinely valuable for the father ("Birlikte konuşalım").
- Recommendation: keep the data, move the panel behind a parent-mode toggle or collapse it to the single `talkQuestion` with a 🔊 button; rename the heading to the parent.

### 6.3 `guides.ts`
Text-only; `learn` strings range from child-friendly (`"Toplama = bir araya getirmek. 3 + 2 = 5."` `:244`) to lise (`"Gemiye etki eden net kuvvet yoksa hareketini aynı hız ve yönde sürdürür"` `:68`). Several `intro`s describe UI that does not exist (see §4).

### 6.4 Menu (`components/MenuScreen.tsx`) from a content angle
- 69 text-labelled cards, a search box with text placeholder, 8 text tabs. Emoji is the only non-text cue and is heavily duplicated: 🧱 ×4 (tetris, tugla-kir, tank-savasi, hece-birlestir), 🧩 ×2, 🎨 ×2, 🔤 ×2, ✏️ ×2 (`menu.ts`). A non-reader cannot tell "Hece Birleştir" from "Tetris" by icon.
- Header stat `69 aktivite · 7 kategori` and "Merak Ansiklopedisi" portal copy (`MenuScreen.tsx:150-166`) are adult-facing.

### 6.5 Encyclopedia (`lib/encyclopedia.ts`, 14 topics) — brief, for cross-reference
- Rich schema (`RawTopic` `:9-48`): sections, facts, glossary, observation (materials/steps/safety), parentNote, 3-question quiz, lab mode, 2–3 cited sources, `reviewedAt`.
- Register is 3.–5. sınıf (sample `bes-duyum` `:177-298`: "elektriksel sinyaller", "duyu yanılsaması"). It has the only TTS. `KnowledgeCheck.tsx` is a second, independent quiz renderer (A/B/C lettered buttons, all questions on one page, explanation on answer) — i.e. **two quiz engines** exist (`QuizGame` for activities, `KnowledgeCheck` for topics) with different data types (`QuizQuestion` vs `EncyclopediaQuiz {question, options, answer:number, explanation}`).
- `relatedActivitiesByTopic` (`:2040-2207`) links topics back to 20 activity slugs; `ACTIVITY_KNOWLEDGE.relatedTopicSlug` links the other way. 7 of 14 topics are the hub for almost everything: `bes-duyum` (12 activities), `sekiller-oruntuler-ve-simetri` (14), `itme-cekme-ve-yuvarlanma` (15), `sayilar-sifir-ve-sayi-dogrusu` (12).

---

## 7. MEB coverage matrix (okul öncesi + 1. sınıf)

✅ covered acceptably · 🟡 present but weak/wrong level/too few items · ❌ missing

### Türkçe — İlk okuma yazma (1. sınıf) & okuma-yazmaya hazırlık (okul öncesi)
| outcome | status | evidence / gap |
|---|---|---|
| Ses farkındalığı: duyduğu sesi harfle eşleştirme | ❌ | harf-tanima is text→letter (circular). Needs audio prompt (`/a/` → pick **A**) |
| Harfleri MEB ses grupları sırasıyla öğrenme (e,l,a,k,i,n / o,m,u,t,ü,y / ö,r,ı,d,s,b / z,ç,g,ş,c,p / h,v,ğ,f,j) | ❌ | App uses alphabetical order everywhere (`quizData.ts:3`, `LETTERS` in LetterTrace) |
| Büyük + küçük harf tanıma | 🟡 | uppercase only in LetterTrace, kelime-okuma (KEDİ), harf-tanima |
| Harf yazma (çizgi yönü) | 🟡 | LetterTrace 8 letters, dots not strokes |
| Çizgi çalışmaları (düz, eğik, zikzak, spiral) — okul öncesi | ❌ | ShapeDraw is free-draw |
| Hece okuma / hece oluşturma (açık/kapalı hece: el, le, al, la) | 🟡 | hece-birlestir, 4 items |
| Heceleri birleştirip kelime okuma | 🟡 | same 4 items |
| Kelime–resim eşleştirme | ✅ | kelime-okuma (10) |
| Basit cümle okuma ("Ela ata bak.") | ❌ | cumle-kur is grammar-level, not reading-level |
| Dinlediğini anlama (sesli hikâye + soru) | ❌ | no audio stories anywhere; encyclopedia TTS reads 3rd-grade text |
| Görsel okuma / sıralama (olay sırası kartları) | ❌ | — |
| Sözcük dağarcığı (zıt anlam, kategori) | 🟡 | benzer-kelime (6), grupla (2) |
| Noktalama / soru işareti | 🟡 | cumleKur Q6 — too early |

### Matematik (1. sınıf; okul öncesi sayı/geometri kazanımları)
| outcome | status | evidence / gap |
|---|---|---|
| 1–20 nesne sayma, rakam tanıma | 🟡 | CountGame 1–9 only |
| Ritmik sayma (1'er, 2'şer, 5'er, 10'ar ileri/geri) | ❌ | siraBul has one `2,4,6` item |
| Sayı yazma (rakam çizme) | ❌ | — |
| Sayıları karşılaştırma / sıralama (20'ye kadar) | 🟡 | sayi-sirasi (1 fixed set), karsilastir (3) |
| Sıra bildiren sayılar (birinci, ikinci…) | ❌ | — |
| Toplama 20'ye kadar, somut modellerle | 🟡 | toplama ≤8, no visuals; balon-patlat ≤10 |
| Çıkarma 20'ye kadar, somut modellerle | 🟡 | cikarma ≤9, no visuals |
| Toplama–çıkarma ilişkisi, eksik terim (3 + □ = 5) | ❌ | — |
| Zihinden toplama (10'a tamamlama) | 🟡 | hizli-matematik duplicate |
| Onluk–birlik (20'ye kadar) | 🟡 | onluk-birlik uses 23/45/30 |
| Çift–tek | 🟡 | 2. sınıf outcome; 4 items |
| Örüntü (nesne/şekil örüntüsü, kuralı bulma, devam ettirme) | 🟡 | desen-tamamla (3), sira-bul (3), royal-match |
| Geometrik şekiller (kare, üçgen, daire, dikdörtgen) tanıma | 🟡 | sekil-tani broken emoji; sekil-say |
| Geometrik cisimler (küp, silindir, küre, prizma) | ❌ | — |
| Uzamsal ilişkiler (sağ/sol, üst/alt, ön/arka, iç/dış) | 🟡 | hazine-haritasi only |
| Simetri (eşleşen yarım) | ❌ | SymmetryGame is not symmetry |
| Uzunluk ölçme (uzun/kısa, standart olmayan birim) | 🟡 | boyut-sirala (2 text items) |
| Tartma (ağır/hafif) | ❌ | — |
| Sıvı ölçme (az/çok, dolu/boş) | ❌ | — |
| Zaman: tam ve yarım saat | 🟡 | saat-ogren 3 items, wrong emoji, no clock face |
| Zaman: gün/hafta/ay/mevsim sırası, sabah/öğle/akşam | ❌ | — |
| Paralarımız (madeni/kâğıt tanıma) | 🟡 | para-say is arithmetic, no coin images |
| Veri: nesne grafiği okuma | ❌ | — |

### Hayat Bilgisi (1. sınıf) / Fen hazırlığı
| unit | status | evidence |
|---|---|---|
| Okulumuzda hayat (kurallar, arkadaşlık, duygular) | ❌ | no social-emotional content |
| Evimizde hayat (aile, görevler, kaynakları tasarruflu kullanma) | ❌ | — |
| Sağlıklı hayat (besinler, hijyen, vücut) | 🟡 | besin-gruplari ✅; vucudumuz too advanced; no hijyen/diş |
| Güvenli hayat (trafik, acil numaralar 112, yabancılar, ev kazaları) | ❌ | — (directly relevant to "zararlı içerikten korunma") |
| Ülkemizde hayat (bayrak, Atatürk, İstiklal Marşı, bayramlar) | ❌ | — |
| Doğada hayat (bitki/hayvan bakımı, mevsimler, hava, geri dönüşüm) | 🟡 | mevsimler/bitki too advanced; hava-durumu OK-ish; dinozor-kazi ✅; no geri dönüşüm |
| Gözlem yapma, tahmin etme (bilimsel süreç) | 🟡 | encyclopedia `observation` missions are good but parent-led and 3rd-grade text |

### Bilişsel beceriler
| skill | status | evidence |
|---|---|---|
| Seçici dikkat | ✅ | kostebek-vur, baloncuk-patlat, fark-bul (2) |
| Görsel hafıza | ✅ | hafiza-kartlari |
| İşitsel/sıralı hafıza (Simon-style) | ❌ | — |
| Planlama / problem çözme | ✅ | labirent, kaydir-puzzle, yilan, tetris, hazine-haritasi |
| Sınıflama / eşleştirme (sürükle-bırak) | 🟡 | grupla/mantik-eslestir text MCQ |
| Uzamsal döndürme / parça-bütün | 🟡 | tangram fake; tetris real |
| Öz-düzenleme / bekleme / sıra alma | ❌ | — |

---

## 8. Content structure — can it be generated per session?

**Current shape**: `QuizQuestion[]` module constants. Already-generated pools prove the path: `toplama` (`quizData.ts:94-106`) and `cikarma` (`:108-118`) are `Array.from({length:12}, (_, i) => …)` with `a = (i % 5) + 1` — deterministic, but one `Math.random`/seed swap away from a generator. `harfTania` and `sesliHarf` are `.map()` over letter tables (`:18-39`).

**Blockers to generation today**:
1. `QuizGame` receives a finished array and slices it; it has no notion of a generator, level or seed.
2. `makeOptions` hash-shuffles; a generator would need an injected RNG (`lib/utils.ts` already has `shuffle`, `randInt`, `pickRandom`).
3. No place to store mastery → nothing to adapt *on*. `localStorage` is the only durable store at runtime (static export); Firebase RTDB is optional and already used for scores/visits.
4. Options are `string[]`; there is no slot for an image, a spoken form, or a "visual prompt" (objects to count, clock face, coins).

**Proposed unit** (one file per skill under `activities/content/`):
```ts
type Exercise = {
  skill: SkillId;                 // e.g. "tr.ses-harf", "mat.sayma-20", "mat.toplama-10"
  level: 1 | 2 | 3;
  prompt: { speech: string; text?: string; visual?: Visual };   // speech is mandatory
  choices: { id: string; label?: string; emoji?: string; speech?: string }[];
  answerId: string;
  allowRetry: boolean;            // default true for age 6
};
type Generator = (rng: Rng, level: number) => Exercise;
```
with `lib/mastery.ts` (localStorage `dogukan-mastery-v1`: `{ [skill]: { level, streak, attempts, correct, lastAt } }`, mirrored to Firebase under `activity/dogukan/mastery` for the parent panel) and `lib/speech.ts` lifted from `EncyclopediaTools.tsx:16-19, 56-59`.

Both existing quiz renderers (`QuizGame`, `KnowledgeCheck`) could consume `Exercise`; the encyclopedia's `EncyclopediaQuiz` is a trivial adapter.

Reuse inventory for the refactor:
- `LETTER_CLUES` (`quizData.ts:7-16`) is a decent letter→word table (fix "Ğ" row and replace "Jilet" with a child word such as "Jeton"/"Jöle").
- `kelimeOkuma` items (`:41-52`) are good picture-word pairs; extend with lowercase.
- `EMOJIS` in `CountGame.tsx:6`; `COLORS` in `ColorRace.tsx:13-20`; `LETTERS` point paths in `LetterTrace.tsx:6-44`.
- Sound palette `lib/sounds.ts` and `CelebrationProvider` for rewards.
- `relatedActivitiesByTopic` + `ACTIVITY_KNOWLEDGE.relatedTopicSlug` as a skill↔topic graph.

---

## 9. Content bugs & dead code (fix regardless of redesign)

1. `quizData.ts:134` — `Saat 3:00` uses 🕐 (1 o'clock); should be 🕒. Lines 135–136 are correct.
2. `quizData.ts:155-157` — `sekilTani` big emoji is `⬛` for every question while the shape sits in the prompt; swap `emoji` to the shape and remove it from `prompt`.
3. `quizData.ts:181-185, 207-211` — `gezegenler`, `hayvanlar` pools are exported but never used (`registry.tsx` uses `ExplorePanel`). Delete or wire.
4. `quizData.ts:254-258` — `hizliMatematik`, `kelimeAvcisi`, `hedefVur` are duplicates of other activities under different menu names (`menu.ts:37-39`).
5. `SymmetryGame.tsx:152-159` — two "correct" buttons; concept mismatch.
6. `TangramLite.tsx:12-17` — no validation; any order wins.
7. `CountGame.tsx:46`, `OrderGame.tsx:38`, `SymmetryGame.tsx:47`, `TangramLite.tsx:44` — `window.location.reload()` restarts (re-runs IntroModal check, re-logs a Firebase visit via `ActivityClient.tsx:16-18`, full navigation on GitHub Pages).
8. `guides.ts:149, 186-187, 242, 273, 279` — describe audio/visuals that do not exist.
9. `quizData.ts:10` — `["Ğ", "Dağ kelimesinin sonu"]` produces prompt `“Dağ kelimesinin sonu” ipucunda hangi harf anlatılıyor?` — unreadable for the age group.
10. `ShapeDraw.tsx:28-31` — pointer→canvas mapping ignores CSS scaling.
11. `registry.tsx:104` — `OrderGame` always `[3, 7, 1, 9, 5]`.

---

## 10. Prioritised recommendations (content layer only)

**P0 — make it usable by a non-reader**
1. `lib/speech.ts`: `speak(text, {rate:0.9, lang:"tr-TR"})`, voice caching with `voiceschanged`, gesture-unlock on first tap, `cancel()` on route change. Auto-speak every prompt on mount/change; 🔊 button ≥ 56 px on the prompt card; long-press on an option speaks it.
2. Replace text prompts with **visual + speech** prompts: objects to count (rows of 5), ten-frames for ±, clock face SVG, coin images, letter cards. `text` becomes optional caption.
3. Enable retry on wrong (shake + "bir daha dene" voice), reveal only after 2nd miss.
4. Shorten sessions to 5–6 items; star per item; animated end screen; call `CelebrationProvider`.
5. Kill or shrink `IntroModal` for shared components; move `ActivityKnowledgePanel` behind parent mode (keep the `talkQuestion` as the one line the child hears).

**P1 — align with school**
6. Letter curriculum by MEB ses grupları with audio phoneme → letter, letter → picture, lowercase+uppercase, tracing with stroke animation (extend `LetterTrace` point paths to all 29 letters).
7. Syllable builder (open/closed syllables), then 2-syllable words, then 3-word picture sentences.
8. Numbers to 20: counting with grouping, number-line hops for ± (the encyclopedia topic `sayilar-sifir-ve-sayi-dogrusu` already motivates this), ritmik sayma, missing addend.
9. Measurement/time/money as **comparison** tasks (uzun/kısa, ağır/hafif, tam/yarım saat, coin recognition) — not arithmetic.
10. Real symmetry (complete the mirrored half on a grid), real tangram (drag pieces onto a silhouette with snap), 3D cisim tanıma.
11. Rewrite Bilim & Doğa to Hayat Bilgisi level (sort "yaz/kış" clothes, order seed→sprout→flower cards, drag food to groups) and add Güvenli hayat (trafik ışığı, 112, "yabancıdan şeker alma") — this is the "zararlı içerikten koruma" curriculum hook.

**P2 — structure**
12. Per-skill generators + `lib/mastery.ts` (level up after 3 streak, down after 2 misses); mirror to Firebase so `/bilgi` can show "Doğukan bugün: harf K ✅, toplama 10'a kadar 7/8".
13. Consolidate `QuizGame`/`KnowledgeCheck` on one `Exercise` type.
14. Icon audit in `menu.ts` — unique emoji per activity; consider picture tiles instead of text labels.

---

## Appendix A — CSS class index (globals.css) for the shared components
`.intro-overlay` 708 · `.intro-card` 720 · `.intro-badge` 731 · `.intro-actions` 752 · `.game-panel` 764 · `.progress-bar`/`.progress-fill` 772-785 · `.round-label` 787 · `.question-card` 795 (`.correct` pulse 801, `.wrong` shake 805) · `.q-emoji` 815 · `.question-card h2` 821 · `.count-prompt` 828 · `.hint-text` 836 (`.success` 843) · `.options-grid` 848 · `.num-grid` 854 · `.option-btn` 858 (`.correct` 877, `.wrong` 882, `:disabled` 888) · `.next-btn` 893 · `.result-panel` 898 · `.result-emoji`/`.result-score`/`.result-msg` 902-915 · `.quiz-feedback:empty` 918 · `.count-grid` 923 · `.count-item` 932 · `.order-slot` 1277 · `.order-chip` 1289 · `.order-hint` 1297 · `.explore-panel` 1303 · `.explore-stage` 1313 · `.explore-big` 1320 · `.explore-tabs`/`.explore-tab` 1326-1347 · `.shape-picker`/`.shape-btn` 1350-1370 · `.draw-canvas` 1372 · `.clear-btn` 1381 · `.symmetry-options`/`.sym-option` 1387-1403 · `.tangram-board`/`.tangram-house`/`.tangram-pool`/`.tangram-piece` 1405-1430 · `.knowledge-jump-btn` 686 · `.activity-knowledge` 4547 (and `.activity-knowledge-*` sub-classes following it).

## Appendix B — Exported symbols implementers will touch
- `lib/menu.ts`: `MenuCategory`, `MENU`, `TOTAL_ACTIVITIES`, `findActivity(slug)`
- `activities/registry.tsx`: `ACTIVITY_MAP`, `getActivity(slug)`, inline `GEZEGENLER`, `HAYVANLAR`
- `activities/shared/QuizGame.tsx`: `QuizQuestion`, `QuizGame`, internal `MAX_QUESTIONS_PER_SESSION`, `stableHash`, `rotate`, `makeOptions`, `getSession`, `getNextSessionStart`
- `activities/shared/CountGame.tsx`: `CountGame`, `EMOJIS`
- `activities/shared/OrderGame.tsx`: `OrderGame({items,label})`
- `activities/shared/ExplorePanel.tsx`: `ExploreItem`, `ExplorePanel({items,title})`
- `activities/shared/ShapeDraw.tsx`: `ShapeDraw`, `SHAPES`
- `activities/shared/SymmetryGame.tsx`: `SymmetryGame`, `LEVELS`
- `activities/shared/TangramLite.tsx`: `TangramLite`, `PIECES`
- `activities/data/quizData.ts`: `LETTERS`, `VOWELS`, `LETTER_CLUES`, and 32 exported `QuizQuestion[]` pools (names listed in §2 tables)
- `lib/guides.ts`: `Guide`, `GUIDES`, `getGuide(slug)` (throws)
- `lib/activityLearning.ts` (server-only): `getActivityLearning(slug)`, `getActivityLearningPreviews()`; types in `lib/activityLearning.types.ts`: `ActivityKnowledge`, `ActivityLearning`, `ActivityLearningPreview(s)`
- `components/ActivityShell.tsx`: `GUIDE_PREFERENCE_VERSION = "v2"`, `guidePreferenceKey`, `shouldShowGuide`, `rememberGuidePreference`
- `components/IntroModal.tsx`: `IntroModal({title,emoji,guide,onStart,onNever})`
- `components/ActivityKnowledgePanel.tsx`: `ActivityKnowledgePanel({title,learning})`, section `id="oyunun-fikri"`
- `components/encyclopedia/EncyclopediaTools.tsx`: `findTurkishVoice()` (TTS pattern to extract)
- `lib/sounds.ts`: `sounds.{tap,success,wrong,pop,win,star,coin,shoot,jump,spring,explode,boost,gameOver,combo,levelUp}`
- `lib/utils.ts`: `shuffle`, `pickRandom`, `randInt`, `normalizeSearch`
- `hooks/useGameScore.ts`: `useGameScore(slug) → {selfHigh, rivalHigh, submitFinal, checkMilestone, resetMilestones}`
- `lib/activityLog.ts`: `logDogukanVisit`, `fetchDogukanActivity`, `subscribeDogukanActivity`
