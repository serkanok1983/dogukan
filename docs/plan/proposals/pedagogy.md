# Pedagogy proposal — learning architecture for "Doğukan'ın Yeri"

Author role: child-development / early-education expert (Turkish okul öncesi + MEB 1. sınıf, executive function, screen-time research).
Target learner: Doğukan, 6, anaokulu → 1. sınıf, emerging reader, Turkish, habitual mobile gamer / short-video watcher.
Inputs: the five code maps in `scratchpad/maps/*.md` plus direct reads of `src/lib/menu.ts`, `src/activities/data/quizData.ts`, `src/activities/shared/*.tsx`, `src/activities/games/{LetterTrace,BalloonPop,TreasureMap,ColorRace,MemoryGame}.tsx`, `src/hooks/useGameScore.ts`, `src/lib/{activityLog,gameSession,utils,sounds}.ts`, `src/components/encyclopedia/EncyclopediaTools.tsx`, `src/components/ParentInfoScreen.tsx`.

The one-sentence diagnosis: the app has 69 doors and nothing behind most of them that a six-year-old can use alone, because every door is labelled in text, every task is a text multiple-choice, nothing remembers what he can do, and nothing he does in the "learning" half feeds back into the half he actually likes (the arcade games). The fix is not more content; it is a **skill graph + mastery store + voiced exercise engine + a short daily loop** that the arcade games plug into.

---

## 1. Vision

**First 5 minutes (day 1, phone, alone).** He taps the icon on the home screen (installed PWA, his photo as the icon). No password: a big card with his face says "Doğukan" out loud; he taps it. He lands on a pannable island map with six big illustrated islands and one glowing tile: "Günün Görevi 🎒" with three dots. A voice says "Merhaba Doğukan! Bugün üç küçük görev var. Hazır mısın?" He taps it. First task is *Ses Avı*: a 🍋 appears, the voice says "li-mon. Hangi harf?" and three large letter cards appear (l, a, e — first MEB sound group only). He gets it wrong; the card wiggles, the voice says "Hmm, bir daha dinle: lll-imon", the picture pulses. He gets it; confetti star, "Dikkatle dinledin!" Six items, about ninety seconds, three stars. Second task: *Say Bakalım* — eight ducks in two rows of five, "Kaç ördek var?" — he taps a big numeral. Third: a 25-second *Merak Kapsülü* — the animated heart from the encyclopedia lab beats on screen: "Kalbin şimdi böyle atıyor. Zıpla, sonra elini göğsüne koy. Ne olur?" Two picture guesses, no wrong answer, then the heart speeds up and the voice explains in one sentence. The bag fills: "Üç görev tamam! Oyun Parkı açıldı 🎮" and his energy meter fills to 20 minutes. He opens Süper Ayı, now at 60 fps, sharp, with thumb-zone controls, and level 1 has one wolf instead of two.

**Day 7.** He opens the app on his own because the streak flame says 6 and the sticker album has an empty slot that today's quest fills. The quest now has letter *k* (he mastered e, l, a this week — the parent panel told his father so and his father practised "kkk-edi" at dinner). *Say Bakalım* has moved to a ten-frame with 13 ducks. The capsule is about shadows and ends with "Babanla dene: akşam el feneriyle duvarda gölge yap" — his father gets the same mission in /bilgi. Süper Ayı now hides honey pots marked with *k* and *e*; he grabs the *k* ones because the bear shouts the sound. After 20 minutes of arcade the energy runs out and the "Mola" screen offers one more capsule or "yarın görüşürüz". He has spent 25–30 minutes, roughly 10 of them in explicit learning, and he will come back tomorrow.

---

## 2. Learning architecture (the spine everything hangs on)

### 2.1 Skill graph — `src/lib/skills.ts` (new, pure data)

~34 skills in 5 strands. Each: `id, strand, label (child), labelParent, mebCode, prereq[], levels: 5, description per level`. Prerequisites make the daily quest picker automatic; `mebCode` lets the parent panel speak the school's language.

**TR — Türkçe / ilk okuma-yazma** (ses esaslı, MEB ses grupları; lowercase dik temel harfler first, uppercase second)
| id | what it is | L1 → L5 |
|---|---|---|
| `tr.ses-ayirt` | hear a word, pick the picture that starts with the same sound (pure phonological awareness, no letters) | 1 target vs 2 pictures → 3 pictures, end-sound |
| `tr.ses-harf` | hear a word + see its picture, pick the letter of its first sound | group 1 (e l a k i n) → +group 2 (o m u t ü y) → +3 (ö r ı d s b) → +4 (z ç g ş c p) → +5 (h v ğ f j) |
| `tr.harf-yaz` | trace the letter with stroke order (lowercase then uppercase) | same group progression; L4–5 without guide dots |
| `tr.hece` | build open/closed syllables (e+l→el, l+e→le) and blend two syllables | el/al/la → 2-syllable words from groups 1–2 → 3-syllable |
| `tr.kelime` | picture ↔ word, lowercase | 2 options, group-1 words (ela, al, el, kal) → 4 options, any word |
| `tr.cumle` | read a 2–3-word sentence and pick the picture ("Ela ata bak.") | 2 words → 3 words → with question word |
| `tr.dinle` | listening comprehension: voiced 2–3-sentence story, picture question | 1 question → sequence 3 event cards |
| `tr.sozcuk` | vocabulary: category, opposite, odd one out (pictures) | categories → opposites → "same group but why" |

**MAT — Matematik 1** (MEB: 20'ye kadar; somut → yarı somut → soyut)
| id | what it is | L1 → L5 |
|---|---|---|
| `mat.sayma` | count objects, tap numeral | 1–5 → 1–10 rows of 5 → 11–20 ten-frame → scattered 20 → count on from 10 |
| `mat.rakam` | numeral recognition and tracing 0–9 → 10–20 | |
| `mat.sira` | before/after/between, compare (more/less), order 3–5 numbers | to 10 → to 20 |
| `mat.ritmik` | skip counting 1s/2s/5s/10s forward and back (voiced, tap the next) | 1s to 20 → 10s → 5s → 2s → backwards |
| `mat.toplama` | addition with ten-frame / objects / number line | sums ≤5 → ≤10 → with ten-frame to 20 → number line → bare numerals |
| `mat.cikarma` | subtraction with objects crossed out / number-line hops back | ≤5 → ≤10 → to 20 |
| `mat.eksik` | missing addend 3 + □ = 5, part-whole | ≤5 → ≤10 → ≤20 |
| `mat.oruntu` | continue/complete AB, AAB, ABC, growing patterns (pictures, sounds) | AB → AABB/ABC → shape+colour → growing (1,2,3) → "what is the rule" |
| `mat.sekil` | 2D shapes (kare, üçgen, daire, dikdörtgen) in real-object photos; count sides/corners | name → find in scene → sides/corners → compose |
| `mat.cisim` | 3D: küp, silindir, küre, prizma matched to objects (kutu, kutu kola, top) | |
| `mat.simetri` | complete the mirror half on a 4×4 / 6×6 grid; find the symmetric picture | |
| `mat.uzamsal` | sağ/sol, üst/alt, iç/dış, ön/arka; follow arrow paths (TreasureMap) | 1 step → 3 steps → relative to a character |
| `mat.olcme` | long/short, tall/short, heavy/light, full/empty, more/less liquid (pictures) | |
| `mat.zaman` | tam saat → yarım saat on an analog face; sabah/öğle/akşam; day/week order | |
| `mat.para` | recognise 1/5/10/20 TL; which is more; make 5 with 1s | recognise → compare → compose |
| `mat.veri` | read a 3-column picture graph ("kaç kedi?") | |

**HB — Hayat Bilgisi 1** (and the father's "zararlı içerikten korunma" goal lives here)
| id | content |
|---|---|
| `hb.saglik` | food groups (drag to plate), hand-washing/tooth-brushing order cards |
| `hb.guvenli` | traffic light & crossing, 112, "yabancıdan bir şey alma / anneye babaya söyle", hot/sharp things at home, "ekranda korkutucu bir şey görürsen büyüğüne göster" |
| `hb.duygular` | name the feeling on a face, what helps (breathe, tell), waiting/turn-taking |
| `hb.doga` | seasons ↔ clothes, plant stages, animal homes, recycling bins, weather today |

**FEN — bilimsel süreç (Merak Kapsülleri)**
| id | content |
|---|---|
| `fen.tahmin` | predict–observe–explain loops on the 14 lab stages |
| `fen.gozlem` | "same or different?" observation, slow-motion compare |
| `fen.siniflama` | sort living/non-living, solid/liquid, magnetic/not |

**EF — yürütücü işlevler**
| id | content / existing game |
|---|---|
| `ef.hafiza` | visual memory — MemoryGame (levels), "what disappeared?" |
| `ef.isitsel` | auditory sequence memory — new *Ses Sırası* (Simon with animal sounds) |
| `ef.dikkat` | selective attention — fark-bul (odd one out), WhackMole, BubbleBurst |
| `ef.ketleme` | inhibition — new *Dur-Git* (go/no-go: tap the fish, do not tap the shark; later rule switches) |
| `ef.planlama` | planning — MazeGame, SlidingPuzzle, TreasureMap, Tetris |
| `ef.refleks` | timing/reaction — all arcade runners (SuperBear, Flappy, LaneRacer…) |

Prerequisite edges that matter: `tr.ses-ayirt → tr.ses-harf → tr.hece → tr.kelime → tr.cumle`; `tr.ses-harf → tr.harf-yaz` (same group); `mat.sayma(L2) → mat.toplama(L1)`; `mat.toplama(L2) → mat.eksik`; `mat.sayma(L3) → mat.toplama(L3)`; `mat.sekil → mat.cisim`; `mat.sira → mat.ritmik`.

### 2.2 Mastery store — `src/lib/mastery.ts` (new; localStorage `dogukan-mastery-v1:<player>`, mirrored to Firebase `users/<player>/skills/<skillId>`)

```ts
type SkillState = {
  level: 1|2|3|4|5;        // current working level
  streak: number;          // consecutive first-try correct at this level
  misses: number;          // consecutive misses at this level
  attempts: number; correct: number; firstTryCorrect: number;
  box: 0|1|2|3|4;          // spaced-repetition box (Leitner): due after 0,1,3,7,14 days
  lastAt: number; nextDueAt: number;
  masteredAt?: number;     // set when level 5 streak ≥ 3
};
```
Rules (deliberately simple, explainable to the father):
- **Level up** after 3 consecutive first-try correct at the level; **level down** after 2 consecutive misses (never below 1). Level-up triggers `levelUp` sound + voiced "Yeni seviye!" and a sticker roll.
- **Spaced review**: a correct review promotes `box` by 1 (max 4), a miss resets to 0. `nextDueAt = now + [0,1,3,7,14][box] days`. The daily quest always includes 1–2 due skills (the "yesterday's letter comes back" effect that makes school transfer happen).
- **Scaffold on miss**: first miss → retry with a hint (prompt re-spoken slower + the visual pulses, one distractor fades out). Second miss → reveal, voice explains in one sentence, item is re-queued at the end of the set.
- **Stars**: 1 per item correct (first or second try), +1 bonus when all first-try. Stars are the only currency that touches the arcade (see 2.5).
- Events exported: `recordExercise({skill, level, firstTry, correct, ms})`, `nextLevel(skill)`, `dueSkills(now)`, `summary()` for the parent panel.

### 2.3 Exercise engine — `src/activities/engine/`

Replaces `QuizGame`, `CountGame`, `OrderGame`, `SymmetryGame`, `TangramLite`, `ShapeDraw`, `ExplorePanel` and `KnowledgeCheck` with one type and six renderers.

```ts
// src/activities/engine/types.ts
type Visual =
  | { type: "picture"; emoji: string; alt: string }                  // one big picture
  | { type: "count"; emoji: string; n: number; layout: "rows5"|"tenframe"|"scatter" }
  | { type: "tenframe"; a: number; b?: number; op?: "+"|"-" }
  | { type: "numberline"; from: number; to: number; start: number; hops?: number }
  | { type: "clock"; hour: number; half: boolean }
  | { type: "coins"; values: number[] }
  | { type: "letter"; char: string; case: "lower"|"upper"; highlight?: boolean }
  | { type: "pattern"; items: string[]; blankIndex: number }
  | { type: "grid"; size: 4|6; left: boolean[][] }                  // symmetry
  | { type: "scene"; src: string; hotspots?: {shape: string; x: number; y: number}[] }
  | { type: "lab"; mode: EncyclopediaTopic["lab"]; preset: number }; // reuse InteractiveLab stages

type Choice = { id: string; emoji?: string; text?: string; say: string };

type Exercise = {
  id: string; skill: SkillId; level: 1|2|3|4|5;
  kind: "choice" | "sort" | "order" | "trace" | "grid" | "tapcount";
  prompt: { say: string; text?: string; visual?: Visual };          // `say` mandatory
  choices?: Choice[]; answerIds: string[];                           // sort/order use answerIds as target order / bins
  feedback: { correct: string; retry: string; reveal: string };     // all voiced
  bigTap?: boolean;                                                  // 2 giant buttons for L1
};
type Generator = (rng: Rng, level: number) => Exercise;             // one file per skill
```
Renderers: `ChoiceCard` (2–4 picture/letter/number buttons ≥ 96 px, long-press any option to hear it), `SortBins` (drag emoji into 2–3 labelled bins, pointer events, snap, big drop zones), `OrderStrip` (tap cards in order, like OrderGame but with pictures and random content), `TraceCanvas` (LetterTrace generalised: stroke-order animation ghost, DPR-aware, 29 lowercase + 29 uppercase + digits 0–9 point paths), `MirrorGrid` (tap cells to complete the right half; compare to mirrored left), `TapCount` (tap each object once; counted aloud "bir, iki, üç…" — this is how MEB teaches one-to-one correspondence).

`ExerciseSession` orchestrates a set of **6 items** (≈ 90–150 s): 4 from the focus skill at `level` (first item at `level-1` as warm-up when `streak == 0`), 1 due-review item, 1 "surprise" from an adjacent unlocked skill (interleaving improves retention and keeps it from feeling like a drill). On finish: stars screen (`CelebrationProvider`), voiced process praise picked from a growth-mindset list ("Çok dikkatli baktın", "Bir daha denedin ve buldun", "Zor olanı seçtin"), then two giant buttons: "Bir tane daha ⭐" / "Haritaya dön 🗺️". No `window.location.reload()` anywhere.

### 2.4 Voice — `src/lib/speech.ts` + `SpeechProvider` in `layout.tsx`

- `speak(text, {rate=0.9, pitch=1.05, interrupt=true, onEnd})`, `stop()`, `preferredVoice()` ranking (`voiceschanged` listener; prefer Google Türkçe / Yelda / Microsoft Emel; cache), `unlock()` called on the avatar tap and on every "Başla" (iOS gesture rule), `cancel()` on route change (`usePathname` effect), persisted mute `dogukan-voice-on`.
- **Every** prompt auto-speaks on mount; a ≥ 56 px 🔊 button on the card repeats it; options speak on long-press (and always after a reveal). Menu tiles speak their one-word label on tap-and-hold; the daily quest speaks itself when it appears.
- Phoneme reality check: Turkish TTS says letter *names* ("ke", "le"), not sounds. MEB ses esaslı needs sounds. Phase 1 workaround: the prompt is always *word + picture* ("kedi… hangi harf?") and the hint re-speaks the word; the engine never asks TTS to pronounce a bare consonant. Phase 2: **father records ~150 short clips** (29 sounds, 29 names, 0–20, 60 core words, 10 praise lines) on his phone as m4a into `public/voice/`; `speak()` plays a clip when one exists and falls back to TTS. His voice is also the single biggest engagement lever available for this particular child.

### 2.5 The daily loop — `src/lib/quests.ts`, `src/lib/energy.ts`

- **Günün Görevi**: 3 slots generated at first open each day from the mastery store: (1) the current TR focus skill, (2) the current MAT focus skill, (3) a Merak Kapsülü or an HB/EF set; one of the three is swapped for a *due review* when something is due. Completing all three → +1 streak day, 1 sticker roll, and the Oyun Parkı island opens for the day.
- **Enerji**: arcade play costs energy (1 per minute); the energy tank is `settings.dailyArcadeMinutes` (parent-set, default 20) and is **only refilled by learning**: every learning set adds 3 minutes (cap at tank). This is a pragmatic token economy for a child who already has the habit; the research caveat (extrinsic rewards can crowd out intrinsic motivation) is handled by (a) never phrasing learning as a cost ("Enerji topla!" not "önce ders"), (b) making the learning sets themselves juicy, and (c) Phase 2 embedding skills *inside* the arcade so the boundary blurs.
- **Mola**: when energy hits 0 a full-screen friendly card: "Enerji bitti! Bir kapsül dinle ya da yarın görüşürüz 👋" — it offers a capsule (which also refills 3 min) or a "Babanla dene" mission; it never offers more arcade. Also soft **bedtime** (`settings.bedtime`, default 20:30): the map dims, the voice says "Uyku zamanı yaklaştı", only capsules remain.
- Streak uses a 1-day grace ("Dondurma 🍦" once a week) so a missed day does not punish.

### 2.6 Arcade integration (Phase 1 hooks, Phase 2 content)

Hook points are already clean (`useGameScore.submitFinal`, `resetMilestones`, SuperBear goal block, Tetris level). Phase 1: `submitFinal` → `logGameResult(slug, score, ms)` and `ef.refleks`/`ef.planlama` XP; energy drain timer in `GameSessionProvider`. Phase 2: **Süper Ayı harf balı** — honey pots carry the current `tr.ses-harf` letters, the bear says the sound on pickup, a wrong-letter pot just gives no bonus (no punishment inside a fun game); **Balon Patlat** reads `mat.toplama` level (sums ≤5 → ≤10 → ten-frame visual on the balloons); **Renk Yarışı** speaks the colour name (its guide already promises this); **Hazine Haritası** becomes `mat.uzamsal` with voiced "iki sağ, bir aşağı" and generated levels; **Hafıza Kartları** pairs letter ↔ picture starting with that sound at `tr.ses-harf` level.

### 2.7 Parent insight — `/bilgi` → "Bu hafta" (`src/components/parent/ParentInsights.tsx`)

Three cards, no tables of timestamps:
1. **Zaman**: minutes/day split learning vs arcade (7-day bars), streak, bedtime hits.
2. **Beceriler**: strand heatmap (TR/MAT/HB/FEN/EF), "Şu an öğreniyor: *k* sesi, 20'ye kadar sayma", "Zorlanıyor: eksik terim (2 gün üst üste geriledi)", "Bu hafta ustalaştı: e, l, a". Each skill row shows the MEB kazanım so he can talk to the teacher.
3. **Evde birlikte**: the 3 `talkQuestion`s of the activities played this week (already written, adult register is right here) + this week's capsule mission ("El feneriyle gölge: 5 dk") + a one-line tip from the skill ("Yemekte 'kkk-edi, kkk-apı' diye ilk sesi uzatın").
Plus settings: daily arcade minutes, bedtime, voice on/off, "Ebeveynle" games on/off, PIN change, "Telefona ekle" button.

---

## 3. Feature list

Priority: P0 = without it the child cannot use the app alone; P1 = needed for school transfer / retention; P2 = polish. Phase: 1 = this session, 2 = next, 3 = later.

### F1. Speech layer — P0, Phase 1
- **Why for him**: he cannot read; every screen that is not voiced is a screen he leaves for YouTube Shorts.
- **Teaches**: nothing by itself; unlocks everything. Voiced prompts also model correct Turkish pronunciation and give the "ses" in ses esaslı okuma.
- **UX**: auto-speak on every prompt/tile/quest; 🔊 repeat ≥ 56 px; long-press to hear options; mute in parent settings only.
- **Data**: `dogukan-voice-on`; voice preference cache.
- **Files**: new `src/lib/speech.ts`, `src/components/SpeechProvider.tsx`; modify `src/app/layout.tsx`, `src/components/encyclopedia/EncyclopediaTools.tsx` (consume the lib, delete local `findTurkishVoice`), `IntroModal.tsx`, `MenuScreen` replacement.
- **Risks**: Android devices without a Turkish TTS voice installed (Samsung often has it; some Xiaomi do not) → detect no `tr` voice and show the parent a one-time card "Google Metin Okuma'da Türkçe sesi indir"; iOS Safari drops utterances after backgrounding → `unlock()` on every gesture, `cancel()` before `speak()`.

### F2. Exercise engine + mastery store + skill graph — P0, Phase 1
- **Why for him**: fixed arrays repeat, he memorises positions, and the app never gets harder or easier; children his age disengage within two sessions when a task is either trivial or impossible. Adaptive level + retry keeps him in the zone of proximal development.
- **Teaches**: every strand; the structure is the pedagogy (immediate specific feedback, retry before reveal, interleaving, spaced review).
- **UX**: 6-item sets, 2–4 giant picture buttons, retry with hint, stars, "bir tane daha?".
- **Data**: `dogukan-mastery-v1:<player>` + Firebase `users/<player>/skills`; `recordExercise` events into `users/<player>/sessions/<YYYY-MM-DD>`.
- **Files**: new `src/lib/skills.ts`, `src/lib/mastery.ts`, `src/lib/rng.ts` (seeded `mulberry32`, already exists inline in `superBearLevelGen.ts` — extract), `src/activities/engine/{types.ts,ExerciseSession.tsx,ChoiceCard.tsx,SortBins.tsx,OrderStrip.tsx,TraceCanvas.tsx,MirrorGrid.tsx,TapCount.tsx,visuals/{CountVisual,TenFrame,NumberLine,ClockFace,Coins,LetterCard,PatternStrip,LabStage}.tsx}`; modify `src/activities/registry.tsx` (map slugs to `<ExerciseSession skill=… />`), `src/lib/activityLog.ts` (+`logExerciseSet`), tests `src/activities/engine/*.test.ts` (generator invariants: answer ∈ choices, no duplicate choices, level ranges, `say` non-empty, every `SKILLS` prerequisite exists, graph acyclic).
- **Risks**: drag-and-drop on mobile Safari (use pointer events + `touch-action: none`, provide tap-to-select fallback in `SortBins`); over-engineering levels — ship 5 levels but only L1–L3 need content on day one.

### F3. Türkçe track (ses esaslı) — P0, Phase 1 (generators 1–5), Phase 2 (6–8)
Generators in `src/activities/content/tr/`:
1. `sesAyirt.ts` — "Hangisi 'e' ile başlar?" voice says the target word slowly, 2–3 pictures. Word bank per sound group (e: el, elma, eşek; l: limon, lale, leylek; a: at, ayı, araba; k: kedi, kapı, kuş; i: inek, ip, iğne; n: nar, nine, nokta; …). Replaces `harf-tanima`'s circular prompt.
2. `sesHarf.ts` — picture + spoken word → tap the letter (lowercase first; L3+ mixes uppercase). Fixes the "Ğ"/"Jilet" rows (Ğ is never a first sound: ask "dağ… sondaki ses?" only at L5; J → "jeton", "jöle").
3. `harfYaz.ts` + `TraceCanvas` — extend `LetterTrace.tsx` point paths from 8 uppercase to 29 lowercase + 29 uppercase **dik temel harfler** with stroke-order ghost animation; order follows `tr.ses-harf` level, not the alphabet.
4. `hece.ts` — *Hece Treni*: two wagons, drag/tap letters to form "el", "le", "al", "la", then join wagons to "ela", "lale", "kale"; voice blends "e… l… el!". Replaces 4-item `hece-birlestir`.
5. `kelime.ts` — picture → lowercase word (2 → 4 options), and reverse (word → picture) at L3; words restricted to letters already mastered so he can actually decode. Replaces all-caps `kelime-okuma` and the duplicate `kelime-avcisi`.
6. `cumle.ts` (Phase 2) — "Ela ata bak." → pick the picture; 3 sentences per visit; words from mastered groups.
7. `dinle.ts` (Phase 2) — 20 voiced micro-stories (3 sentences, 15 s) with 1 picture question, later 3 event cards to order. This is MEB "dinlediğini anlama" and is missing entirely today.
8. `sozcuk.ts` — pictures only: category, opposite (büyük/küçük, sıcak/soğuk), odd one out. Absorbs `benzer-kelime`, `grupla`, `mantik-eslestir`, `boyut-sirala`, `fark-bul`.
- **Why for him**: he is in the exact months when the school introduces e-l-a-k-i-n; mastering the first group at home means being the kid who already knows the sound in class, which is the fastest confidence loop available.
- **Risks**: his school's exact group order (ask, §5); if the teacher uses a different sequence the data file must be reorderable — make `SOUND_GROUPS` a single constant.

### F4. Matematik track (somut → soyut, 20'ye kadar) — P0, Phase 1 (1–6), Phase 2 (7–11)
Generators in `src/activities/content/mat/`:
1. `sayma.ts` + `TapCount`/`CountVisual` — rows of 5 (subitising), ten-frame at 11–20, voice counts along on tap. Replaces `CountGame` (cap 9, reload).
2. `rakam.ts` — numeral ↔ quantity, numeral tracing via `TraceCanvas` digits.
3. `sira.ts` — "7'den sonra?", "hangisi daha çok?" with object piles not `>` symbols; order 3–5 number cards. Replaces fixed `OrderGame([3,7,1,9,5])`, `karsilastir`.
4. `toplama.ts` — `TenFrame` visual: 3 red + 2 blue dots, "3 artı 2 kaç?"; L4 `NumberLine` hops. Replaces bare `3 + 2 = ?` pools, `hizli-matematik`, `hedef-vur`.
5. `cikarma.ts` — objects with crossed-out ones, then number-line hops back.
6. `oruntu.ts` — generated AB/AABB/ABC/growing patterns with emoji, colours, shapes, and **sound patterns** (clap-clap-stomp via sounds.ts). Replaces 3-item `desen-tamamla`, `sira-bul`.
7. `eksik.ts` (Phase 2) — part-whole bar: 5 on top, 3 shown, "kaç eksik?".
8. `sekil.ts` / `cisim.ts` (Phase 2) — real-object scenes (photo or SVG) "kareyi bul"; 3D cisimler ↔ kutu/top/kutu kola. Fixes the `⬛`-above-every-question bug by deleting that pool.
9. `simetri.ts` + `MirrorGrid` (Phase 2) — complete the right half; replaces the fake `SymmetryGame`.
10. `zaman.ts` + `ClockFace` SVG (Phase 2) — "saat kaç?" tam, then yarım; day-part pictures. Fixes the 🕐-for-3:00 bug by deleting the emoji approach.
11. `para.ts` + `Coins` (Phase 2) — recognise 1/5/10/20 TL images, "hangisi daha çok", make 5 TL from 1s. Drops `para üstü` (2. sınıf).
12. `olcme.ts`, `veri.ts`, `ritmik.ts` (Phase 2/3).
- **Why for him**: 1. sınıf math failure almost always starts with counting that stops at 10 and addition done as symbol-matching; ten-frames and number lines are the two representations his teacher will use, so the app should use the same ones. The encyclopedia topic `sayilar-sifir-ve-sayi-dogrusu` already motivates the number line — link it.

### F5. Merak Kapsülleri (encyclopedia re-cut into predict–observe–explain capsules) — P0, Phase 1 (engine + 4 topics), Phase 2 (remaining 10)
- **Why for him**: this is the healthy replacement for the short-video reflex — full-screen, swipe, 25–35 s, a voice, something moving — but finite (12–15 per episode), with a question in every capsule and a real-world exit at the end.
- **Teaches**: `fen.tahmin` (POE loop is the single best-evidenced primary-science routine), `fen.gozlem`, `fen.siniflama`, plus vocabulary (one "Sözcük" capsule per episode: "yoğunlaşma" becomes "buğu").
- **UX**: `scroll-snap` vertical cards; each card = one picture/animated lab stage + ≤ 2 spoken sentences + a tap ("Ne olur?" 2 picture guesses with no wrong answer → stage animates → one-sentence explanation). Episode order per topic: hook → 3× (wonder → lab POE → fact) → sözcük → 2 quiz → **mission** ("Babanla dene") → "Bugünlük bu kadar". Daily cap 2 episodes.
- **Data**: `src/lib/capsules.ts` with `Capsule` type (map §11.2 of encyclopedia map), hand-rewritten `say` strings at ≤ 8 words/sentence; progress per `capsuleId` per player in `dogukan-merak-kapsul-v1:<player>` + Firebase `users/<player>/progress/topics`; keep firing `dogukan-encyclopedia-progress`; call `logDogukanVisit`.
- **Files**: new `src/lib/capsules.ts`, `src/app/kesfet/[slug]/kapsul/page.tsx` (static params over TOPICS), `src/components/kesfet/{CapsulePlayer,CapsuleCard,PredictTap}.tsx`; refactor `InteractiveLab.tsx` to export `*Stage` components with one prop (file split, CSS already isolated); keep `/kesfet/[slug]/` as the parent reference page; render sources as plain text for the child.
- **Phase 1 topics** (the four that map to the most activities and to 1. sınıf): `kalbim-ve-nefesim` (body — the beating heart is the best demo), `isik-ve-golge` (shadow lab, easy home mission), `sayilar-sifir-ve-sayi-dogrusu`, `sekiller-oruntuler-ve-simetri`.
- **Risks**: content rewrite is manual and the quality bar is "a 6-year-old repeats it to his mother"; the original hedged adult phrasing must not leak back in. Reserve one engineer-day per 3–4 topics.

### F6. Island map home + Günün Görevi + avatar login — P0, Phase 1
- **Why for him**: a 12-screen text list with a search box is the main reason he never gets to the content; a map with six pictures and one glowing quest tile is how every game he loves starts.
- **Teaches**: autonomy (choosing an island), goal-setting (three dots), delayed gratification (energy).
- **UX**: avatar tap (his photo, spoken greeting) → map: islands **Harf Adası 🔤** (TR), **Sayı Dağı 🔢** (MAT), **Şekil Ormanı 🔷** (geometry + EF puzzles), **Merak Gölü 🔬** (capsules + HB + FEN), **Oyun Parkı 🎮** (arcade; lock icon until quest done or energy > 0), **Babamla 👨‍👦** (parent-with games + missions; needs parent mode). Tiles ≥ 96 px, one word + 🔊, star ring per island from mastery. "Devam et ▶" hero tile. Parent gear behind long-press (3 s) + 4-digit PIN keypad.
- **Data**: `MENU` keeps `id/icon/title/accent/items` but is regrouped (see §4); `dogukan-last-slug`; quests in `dogukan-quests-v1:<player>:<date>`.
- **Files**: replace `src/components/LoginScreen.tsx`, `MenuScreen.tsx` with `AvatarGate.tsx`, `IslandMap.tsx`, `QuestTile.tsx`, `EnergyMeter.tsx`; modify `src/lib/menu.ts`, `src/lib/auth.ts` (PIN hash, keep `PlayerId`), `src/app/page.tsx` (server-render the map skeleton, no null).
- **Risks**: the island illustrations — emoji are not enough; budget 6 SVG illustrations (can be simple flat shapes) or the map reads as a web form again.

### F7. Hayat Bilgisi strand incl. Güvenli Hayat — P1, Phase 1 (guvenli + saglik), Phase 2 (duygular, doga)
Generators in `src/activities/content/hb/`:
- `guvenli.ts` — *Güvenli Yol*: traffic light (red = dur, green = yürü, tap at the right moment, a `ef.ketleme` task in disguise), "Kayboldun, kimden yardım istersin?" (polis/görevli/anne-baba vs yabancı), "112'yi tuşla" on a keypad, home hazards (ocak, priz, bıçak → 🚫), **"Ekranda korkunç/garip bir şey gördün, ne yaparsın?" → "Kapat ve büyüğüne göster"** — this is the direct, age-appropriate version of the father's protection goal.
- `saglik.ts` — *Besin Tabağı* drag food to süt/sebze-meyve/tahıl/et-yumurta bins (upgrade of the only good Bilim quiz), tooth-brushing and hand-washing step order.
- `duygular.ts` (Phase 2) — face → feeling word (voiced), "ne yapmalı?" (nefes al, söyle, bekle); turn-taking scenario.
- `doga.ts` — *Mevsim Dolabı*: dress the bear for the weather shown (replaces lise-level `mevsimler`, `hava-durumu`); *Tohumdan Çiçeğe* 4-card order (replaces `bitki-buyume` with its "stoma"); *Kim Nerede Yaşar* animal → habitat (replaces `hayvanlar` ExplorePanel); recycling bins.
- **Why for him**: Hayat Bilgisi is a third of 1. sınıf and is zero in the app; the safety content is the one place "protection from harmful content" can be taught rather than only enforced.
- **Files**: new content files; delete `vucudumuz`, `mevsimler`, `bitkiBuyume`, `havaDurumu`, `gezegenler`, `hayvanlar` pools from `quizData.ts` (fold their accurate facts into capsules).

### F8. Executive-function mini-games — P1, Phase 1 (Dur-Git), Phase 2 (Ses Sırası, what-disappeared)
- `DurGit.tsx` (canvas or DOM): fish swim by, tap fish, never tap the shark; 45 s; L3 adds rule switch ("şimdi sadece kırmızı balık"); measures commission errors → `ef.ketleme`. Inhibition is the EF most predictive of early school success and the one a game-habituated child most needs.
- `SesSirasi.tsx`: Simon with 4 animal sounds/pictures; sequence grows; `ef.isitsel` (auditory working memory feeds phonics directly).
- Retune existing: `MemoryGame` pairs letter↔picture at the current sound group; `WhackMole` 30 s rounds with pause on `visibilitychange`.
- **Files**: `src/activities/games/{DurGit,SesSirasi}.tsx`, registry/menu entries, `useGameScore` → `recordExercise` bridge for EF XP.

### F9. Arcade retune for a 6-year-old — P1, Phase 1 (difficulty + energy hooks), Phase 2 (embedded skills)
- Difficulty: `superBearLevelGen.buildProceduralLevel(L, ease)` with `ease` from mastery (`ef.refleks` level) — level 1 = 1 wolf, 0 bees, wider platforms; Flappy `PIPE_GAP` 128 → 170, `PIPE_SPD` 2.4 → 1.7 at ease 1; LaneRacer/RunnerDash spawn rate −35 %. Three-lives runs ≤ 2 min.
- Feedback: replace `ScoreHud` rival paragraph with stars + big numeral; `CelebrationProvider` toast mode mid-run (never freeze an action game); voiced "Tekrar dene!" on game over with a *next goal* ("1 yıldız daha!").
- Energy: `GameSessionProvider` ticks `energy.consume(slug, seconds)` only while `running`.
- Embedded skills (Phase 2): SuperBear harf balı, BalloonPop ten-frame balloons, ColorRace voice, TreasureMap voiced generated paths, MemoryGame letter pairs.
- **Files**: `superBearLevelGen.ts`, `SuperBear.tsx`, `FlappyBird.tsx`, `LaneRacer.tsx`, `RunnerDash.tsx`, `ScoreHud.tsx`, `CelebrationProvider.tsx`, `gameSession.tsx`, `useGameScore.ts`.
- **Risks**: making the arcade too easy removes the challenge he came for — `ease` must rise with his `ef.refleks` level within a few runs.

### F10. Parent insight panel + settings — P1, Phase 1 (cards 1–2 + settings), Phase 2 (card 3, weekly digest)
- See §2.7. **Files**: `src/components/parent/{ParentInsights,SkillHeatmap,WeekBars,HomeTogether,ParentSettings}.tsx`, `src/lib/settings.ts` (Firebase `settings/<player>` + local), modify `src/app/bilgi/page.tsx`, `src/lib/activityLog.ts` (day-bucketed sessions replace `visits`/`logins`).
- **Why**: the father's stated success criterion is "okuluna faydası olsun"; without skill-level data he cannot see it, and he cannot act (the dinner-table "kkk-edi" practice is where transfer actually happens).

### F11. Content hygiene & tests — P0, Phase 1
- Delete dead/duplicate pools and fix the known bugs by deletion (🕐, ⬛, "Ğ" clue, `para üstü`, `cumleKur`, `alfabeSirasi`, `onlukBirlik`, `ciftTek`).
- Vitest: MENU ↔ registry ↔ `ACTIVITY_KNOWLEDGE` ↔ `GUIDES` ↔ `SKILLS` consistency; generator invariants (1,000 seeded draws per generator per level); mastery transitions; capsules: every `say` ≤ 12 words, every quiz has exactly one correct, every topic keeps its slug.
- **Files**: `quizData.ts` (shrink to the few keepers, then delete), `guides.ts` (rewrite `intro` to one voiced sentence ≤ 10 words; drop keyboard-only controls lines on touch), `activityLearning.ts` (keep; it is parent material), `src/**/*.test.ts`.

### F12. Father's voice pack — P2, Phase 2
- ~150 clips (sounds, letter names, numbers 0–20, 60 words, praise lines, "Günaydın Doğukan") recorded on a phone, trimmed, saved as `public/voice/<id>.m4a`; `speech.ts` prefers clips. Risk: his time; provide a `scripts/voice-manifest.md` script list he can read in 20 minutes.

### F13. Installable PWA, DPR canvases, pause on background, error boundaries — P0, Phase 1 (owned by the platform/infra engineers; listed because the pedagogy depends on them: a blurry, stuttering, non-installed app loses the comparison with Super Bear Adventure before any learning starts).

---

## 4. Mapping the 69 existing activities (keep / rebuild / merge / remove)

Legend: **K** keep (retune), **R** rebuild on the engine, **M** merge into another skill, **X** remove (demote to parent mode where noted).

| current slug(s) | skill | verdict |
|---|---|---|
| super-ayi, flappy-bird, kosu-macera, serit-yarisi, ziplama-adasi, yagmur-damlasi, top-yakala, baloncuk-patlat, meyve-bicagi | `ef.refleks` | **K** — ease scalar, thumb controls, DPR, 2-min runs |
| tetris, labirent, kaydir-puzzle, yilan-oyunu, royal-match, pinball-space-cadet, tugla-kir, pong | `ef.planlama` / `ef.refleks` | **K** — pong/breakout/pinball need the landscape layer or they stay in Oyun Parkı "büyük ekran" sub-shelf |
| asteroids, uzay-savunma, uzayli-istilasi, tank-savasi | `ef.refleks` | **K** in Oyun Parkı but behind the "Babamla" toggle (shooting themes; the father labelled some "Ebeveynle" already) |
| dovus-arenasi | — | **X** from the child's map; parent-mode only. A sparring game is the wrong flagship for "zararlı içerikten korunma" even with the disclaimer |
| hafiza-kartlari | `ef.hafiza` | **K** + letter↔picture pairs |
| kostebek-vur | `ef.dikkat` | **K** + pause on background |
| balon-patlat | `mat.toplama` | **K** + ten-frame on balloons, level from mastery |
| renk-yaris | `tr.sozcuk` (colours) | **K** + voice |
| hazine-haritasi | `mat.uzamsal` | **K** → generated voiced paths |
| hizli-matematik, hedef-vur | `mat.toplama` | **X** duplicates |
| kelime-avcisi | `tr.kelime` | **X** duplicate |
| harf-tanima | `tr.ses-harf` | **R** Ses Avı |
| harf-yazma | `tr.harf-yaz` | **R** TraceCanvas, 29+29 letters, stroke order |
| hece-birlestir | `tr.hece` | **R** Hece Treni |
| kelime-okuma | `tr.kelime` | **R** lowercase, generated |
| sesli-harf | `tr.ses-ayirt` | **M** into Ses Avı L4 ("ünlü mü?" as pictures of mouth shapes) |
| cumle-kur | `tr.cumle` | **X** (grammar metalanguage) → replaced by picture-sentence reading in Phase 2 |
| alfabe-sirasi | — | **X** (2. sınıf) |
| benzer-kelime, grupla, mantik-eslestir, boyut-sirala, fark-bul | `tr.sozcuk` / `ef.dikkat` | **M** into one `sozcuk` generator with pictures |
| bosluk-doldur | `tr.dinle` | **M** → voiced sentence completion with picture options (Phase 2) |
| sayma-oyunu | `mat.sayma` | **R** TapCount to 20 |
| toplama-oyunu, cikarma-oyunu | `mat.toplama`, `mat.cikarma` | **R** TenFrame / NumberLine |
| sayi-sirasi, karsilastir | `mat.sira` | **R** generated, pictures |
| cift-tek | — | **X** (2. sınıf) |
| onluk-birlik | `mat.sayma` L3 | **M** → ten-frame "bir onluk ve 3 birlik" only to 20 |
| saat-ogren | `mat.zaman` | **R** ClockFace (Phase 2) |
| para-say | `mat.para` | **R** Coins (Phase 2) |
| sekil-tani, sekil-say | `mat.sekil` | **R** scenes (Phase 2); interim: fix pool by deleting `⬛` |
| sekil-ciz | `tr.harf-yaz` prep | **R** → *Çizgi Çalışması*: trace lines, zigzag, spiral, then shapes on `TraceCanvas` (okul öncesi pre-writing) |
| simetri | `mat.simetri` | **R** MirrorGrid (Phase 2) |
| tangram | `mat.sekil` compose | **R** drag-to-silhouette with snap (Phase 3) — until then **X** from the map (it is not an exercise) |
| desen-tamamla, sira-bul | `mat.oruntu` | **R** generated |
| renk-atolyesi | free play | **K** in Şekil Ormanı (colour mixing is `fen.gozlem`) |
| dinozor-kazi | `fen.gozlem` | **K** — add voiced dino facts |
| hava-durumu, mevsimler | `hb.doga` | **R** Mevsim Dolabı |
| bitki-buyume | `hb.doga` | **R** Tohumdan Çiçeğe cards |
| hayvanlar, gezegenler | `hb.doga` / capsules | **X** ExplorePanel; facts move into capsules `hayvanlar-ve-yasam-alanlari`, `gunes-dunya-ve-ay` |
| vucudumuz, su-dongu | capsules | **X** quizzes; content lives in `kalbim-ve-nefesim`, `bir-su-damlasinin-yolculugu` episodes |
| besin-gruplari | `hb.saglik` | **R** drag to plate |

Net: the map shows ~45 real activities instead of 69 labels, and every one of them is voiced, generated and mastery-tracked. The "69 aktivite" stat disappears from the child's screen.

Build invariant to preserve: `activityLearning.ts` and `guides.ts` throw when their keys ≠ `MENU` slugs. New slugs (`ses-avi`, `hece-treni`, `say-bakalim`, `onluk-cerceve`, `oruntu-treni`, `guvenli-yol`, `besin-tabagi`, `mevsim-dolabi`, `tohumdan-cicege`, `dur-git`, `cizgi-calismasi`, `merak-kapsulleri`) each need a knowledge entry (parent register is fine) and a one-sentence guide. Removed slugs are deleted from all three.

---

## 5. Phase 1 scope — one session, ~8 engineers in parallel

Goal at end of session: the child can open an installed app alone, do a voiced three-part daily quest from the first MEB sound group and counting to 10, play a sharper, fairer Süper Ayı for a parent-set number of minutes, and the father sees skills instead of timestamps. Everything below is designed to be mergeable in parallel; the contracts (types in `engine/types.ts`, `skills.ts`, `mastery.ts` API, `speech.ts` API) are written first by E1 in the first hour and frozen.

| eng | owns | deliverables |
|---|---|---|
| **E1 Learning core** | `src/lib/skills.ts`, `src/lib/mastery.ts`, `src/lib/rng.ts`, `src/lib/quests.ts`, `src/lib/energy.ts`, `src/activities/engine/{types,ExerciseSession}.tsx`, tests | skill graph (34 skills, prereqs, MEB codes), mastery rules, quest picker, energy tank, session orchestrator (6 items, retry→reveal, stars, praise), `recordExercise` → activityLog + Firebase mirror |
| **E2 Renderers** | `engine/{ChoiceCard,SortBins,OrderStrip,TapCount,TraceCanvas,MirrorGrid}.tsx`, `engine/visuals/*` | touch-first, ≥ 96 px targets, long-press-to-hear, DPR-aware TraceCanvas with stroke ghost; 29+29 letter paths + 0–9 digits (extend `LetterTrace.tsx` data) |
| **E3 Türkçe content** | `src/activities/content/tr/{sesAyirt,sesHarf,harfYaz,hece,kelime,sozcuk}.ts`, word bank `content/tr/words.ts` (≥ 12 picture-words per sound, groups 1–5), guides/knowledge entries | generators L1–L3 complete, L4–L5 at least structurally; `cizgi-calismasi` pre-writing paths |
| **E4 Matematik + HB + EF content** | `content/mat/{sayma,rakam,sira,toplama,cikarma,oruntu}.ts`, `content/hb/{guvenli,saglik,doga}.ts`, `games/DurGit.tsx`, retune `BalloonPop`, `TreasureMap`, `MemoryGame` | generators L1–L3; Güvenli Yol incl. the "ekranda garip bir şey" scenario; Dur-Git |
| **E5 Speech + capsules** | `src/lib/speech.ts`, `SpeechProvider`, `src/lib/capsules.ts`, `kesfet/[slug]/kapsul/page.tsx`, `CapsulePlayer`, `InteractiveLab` stage split, rewrite 4 topics into capsules (≈ 52 capsules), plain-text sources for the child | voice everywhere the engine asks; POE loop; mission capsule; daily cap |
| **E6 Shell: map, gate, quest, parent panel** | `AvatarGate`, `IslandMap`, `QuestTile`, `EnergyMeter`, `MolaScreen`, PIN keypad in `auth.ts`, `ParentInsights` cards 1–2 + `ParentSettings`, `settings.ts`, regroup `menu.ts` into 6 worlds, server-rendered skeleton on `/` | no text catalogue, no search, no logout button in the child's reach; parent entry via long-press + PIN |
| **E7 Game infra** | `useGameLoop` (dt, pause on `visibilitychange`, resume countdown), `useCanvasFit` DPR, thumb-zone `GameTouchBar`, `sounds.unlock()`, haptics, `CelebrationProvider` toast mode + viewport canvas, `ScoreHud` → stars, `ease` in `superBearLevelGen`, Flappy/LaneRacer/RunnerDash easing, energy drain in `GameSessionProvider`, fix the 14 lint errors | migrate at least SuperBear, Flappy, BalloonPop, WhackMole, MemoryGame to the new loop/fit; others follow pattern in Phase 2 |
| **E8 Production** | `manifest.ts`, PNG icons, `apple-icon.png`, `sw.js` + `PwaRegister`, `/offline`, `error.tsx` ×2, `not-found.tsx`, `global-error.tsx`, Firebase anonymous auth + `database.rules.json` (add `users/`, `settings/`, `errors/`), lazy Firebase import, CI `check` → `deploy`, `verify-out.mjs`, delete `dogukan.png`, EXIF-stripped WebP avatar, CSS split (tokens/shell/engine/games/kesfet), `(hover:hover)` and reduced-motion gating, remove `BubbleBg` under games | green CI with lint 0/0, tsc, vitest, build verification |

Cross-cutting rules for Phase 1 (write them into `AGENTS.md`):
1. No child-facing string without a `say`. No child-facing font under 18 px. No tap target under 56 px (96 px for answer choices).
2. No `window.location.reload()`. No `alert()`. No text-only feedback.
3. Praise is process-focused ("dikkatle baktın", "tekrar denedin"), never trait-focused ("zekisin"). Wrong answers get a soft sound (`sounds.tap` low) and a retry, never the sawtooth buzz.
4. Every generator is seeded and tested with 1,000 draws per level.
5. Adult text (knowledge panel, sources, MEB codes, settings) renders only under parent mode.

Explicitly **not** in Phase 1: Phase-2 generators (`cumle`, `dinle`, `eksik`, `sekil/cisim`, `simetri`, `zaman`, `para`, `ritmik`, `olcme`, `veri`, `duygular`), the remaining 10 capsule topics, father's voice pack, embedded letters in Süper Ayı, Ses Sırası, real tangram, landscape layer for Pong/Breakout/Pinball, Playwright. Those are listed above with their files so the next session starts from a plan, not a map.

Success measures the father can check in /bilgi after two weeks: (a) app opened unprompted ≥ 4 days/week; (b) median session 10–20 min with ≥ 35 % in learning islands; (c) `tr.ses-harf` at L2 (groups 1–2) with ≥ 80 % first-try; (d) `mat.sayma` at L3 (to 20); (e) at least one home mission done together.

---

## 6. What to remove or demote, and why

- **Typed login, search box, filter tabs, "69 aktivite · 7 kategori", "Çıkış yap" in the child's header** — a non-reader cannot use any of them, and each is a dead-end tap that teaches him the app is "for grown-ups".
- **Text multiple-choice `QuizGame` as the default learning format** (32 activities) — unusable unvoiced, deterministic distractors, reveal-without-retry removes the learning moment. Replaced by the engine; the type `QuizQuestion` and `KnowledgeCheck` go away (one engine, one `Exercise` type).
- **Lise/ortaokul register content presented to the child**: `mevsimler` (eksen eğikliği), `bitkiBuyume` (stoma, kontrollü karşılaştırma), `vucudumuz` (gaz alışverişi), `suDongu` (yoğunlaşma), `GEZEGENLER` (sera etkisi), `cumleKur` (yüklem), `onlukBirlik` (23, 45), `paraSay` (para üstü), `karsilastir` Q3 (`>`), `benzerKelime` Q6, `boslukDoldur` Q3. The facts are correct and well-sourced — they move to parent notes and to capsules rewritten at ≤ 8 words/sentence.
- **Three fake exercises**: `TangramLite` (any order wins), `SymmetryGame` (two correct buttons, tests "same"), `ShapeDraw` (free-draw) — misleading to the parent ("Tangram ✓") and teaching nothing; rebuilt or hidden.
- **Duplicates**: `hizli-matematik`, `hedef-vur`, `kelime-avcisi`; dead pools `gezegenler`, `hayvanlar`.
- **Out-of-grade items**: `alfabe-sirasi` (alphabet order is 2. sınıf; MEB 1. sınıf teaches by sound groups), `cift-tek` (2. sınıf).
- **`dovus-arenasi` from the child's map** — parent-mode only. The shooting games stay in Oyun Parkı behind the existing "Ebeveynle" flag the father already chose.
- **`ActivityKnowledgePanel` under every game, `IntroModal` text walls, `ScoreHud` rival paragraphs** — all adult text interleaved into the child's screen; keep the data (the `talkQuestion`s are the best parent content in the repo) and move it to parent mode / the "Evde birlikte" card. `IntroModal` becomes one picture + one voiced sentence + a giant Başla (keep its focus-trap mechanics).
- **Rival mechanic as the main motivator** ("Serkan'ı geçtin!") — a 6-year-old competing against his father's high score is motivating for a week and discouraging after; keep it as a parent-mode Easter egg, make stars/stickers/streak the child's visible progress.
- **One 100–137 s TTS monologue per encyclopedia topic** — kept only on the parent reference page; the child gets capsules.
- **External source links reachable by the child** — plain text under child mode.
- **Fixed-position infinite animations under live games (`BubbleBg`) and 10–13 px type** — not pedagogy, but they are why the app "looks cheap" next to the games he compares it to, and the comparison is lost before learning begins.

---

## 7. Open questions for the father (only the ones that change the build)

1. **Which sound-group order does Doğukan's school use?** The 2018+ MEB order is e-l-a-k-i-n / o-m-u-t-ü-y / ö-r-ı-d-s-b / z-ç-g-ş-c-p / h-v-ğ-f-j; some schools using the 2024 Maarif Modeli materials start differently. One photo of the first page of his okuma-yazma defteri settles it. `SOUND_GROUPS` is a single constant either way.
2. **Is he in anaokulu this year or already 1. sınıf?** This sets the starting levels (`tr.ses-ayirt` L1 and `mat.sayma` L1 vs `tr.ses-harf` L1 and `mat.sayma` L2) and whether `cizgi-calismasi` is in the daily quest.
3. **Daily arcade minutes and bedtime** defaults (proposal: 20 min, 20:30), and whether the shooting games (`asteroids`, `uzay-savunma`, `uzayli-istilasi`, `tank-savasi`) should be visible to him at all or stay behind "Babamla".
4. **Will you record ~150 short voice clips** (20 minutes with a phone; we provide the script)? It is the single highest-leverage Phase 2 item for *this* child, and it decides whether we build the clip-preference path into `speech.ts` now.
5. **Which phone and OS version** does he use (Android brand or iPhone)? It decides which Turkish TTS voice we test first and whether the "install Turkish voice" parent card is needed on day one.
