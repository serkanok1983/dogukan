# Map #4 — Merak Ansiklopedisi (`/kesfet`)

Reader: #4 of 5. Scope: the encyclopedia subsystem only (data, hub, topic page, narration, labs, quiz, progress). Line numbers are from the current working tree (`/home/user/dogukan`).

## 0. TL;DR

- **What exists:** a well-engineered, source-cited, 7-category / 14-topic "science reader" with one voiced article per topic (Web Speech API, `tr-TR`), one slider/button "mini lab" per topic, a 3-question text quiz, a real-world "Gözlem bileti" mission, a 4-term glossary and links back into the games. ~5,300 words of Turkish content, all in one 2,268-line data file.
- **Who it is actually written for:** a fluent reader aged ~8–11. Average sentence 9–11 words, max 26; vocabulary such as `karbondioksit`, `yoğunlaşma`, `görünür hareket`, `saat dilimi`, `eylemsizlik`; `readingTime` 6–8 dk per topic; one continuous ~100–137 s TTS monologue per topic with no segmenting, no highlighting, no pictures. For a 6-year-old emerging reader this is a wall of text with a "play" button.
- **Technical state:** builds, tsc clean, **eslint clean for all encyclopedia files** (exit 0). Static export (`generateStaticParams`, `dynamicParams = false`). No auth gate on `/kesfet` (reachable without login). Progress is localStorage-only, not per player, not sent to Firebase, not shown in the parent panel.
- **Best asset for the redesign:** the data is already atomized into 42 sections + 42 "Merak köşesi" wonders + 42 facts + 42 quiz items + 56 glossary terms + 14 lab visuals (several CSS-animated). That is ~200 ready "capsule seeds" — but every string must be rewritten for a 6-year-old and voiced, and each capsule needs one picture.

## 1. Files and responsibilities

| File | Lines | Kind | Role |
|---|---|---|---|
| `src/lib/encyclopedia.ts` | 2268 | pure data (no imports) | types, `CATEGORIES`, 14 `topicSources`, classification, sources, related activities, derivation to `TOPICS`, `getTopic()` |
| `src/lib/encyclopediaProgress.ts` | 40 | client lib | localStorage favorites / complete / lastVisited + `CustomEvent` bus |
| `src/app/kesfet/page.tsx` | 89 | server component | hub route: hero + `<EncyclopediaHub>` + promise aside |
| `src/app/kesfet/[slug]/page.tsx` | 248 | async server component | topic article; builds `narrationText`; composes Tools / Lab / KnowledgeCheck |
| `src/components/encyclopedia/EncyclopediaHub.tsx` | 183 | `"use client"` | progress ring, "Kaldığın yerden", search, category tabs, `discovery-card` grid |
| `src/components/encyclopedia/EncyclopediaTools.tsx` | 119 | `"use client"` | **TTS** ("Bana oku"), favorite, complete toggles |
| `src/components/encyclopedia/InteractiveLab.tsx` | 646 | `"use client"` | 14 lab modes (`SensesLab` … `ShapeLab`) + `RangeControl` |
| `src/components/encyclopedia/KnowledgeCheck.tsx` | 146 | `"use client"` | 3-question MCQ, deterministic option rotation, marks complete |
| `src/app/globals.css` | 2149–4540 (encyclopedia part) | CSS | all `.encyclopedia-*`, `.discovery-*`, `.topic-*`, `.mini-lab-*`, `.knowledge-*` styles; media queries at 900px / 620px; reduced-motion |
| `src/lib/activityLearning.ts` | 651 | `server-only` | 69 activity → topic bridges via `relatedTopicSlug`; `getActivityLearning`, `getActivityLearningPreviews` (lines 618–651) |
| `src/components/ActivityKnowledgePanel.tsx` | 94 | server | "Ansiklopedide devam et" card on every activity page → `/kesfet/${slug}/` |
| `src/components/MenuScreen.tsx` | 139–160, 218–229 | client | `.merak-portal` entry card on the menu; per-game `.menu-knowledge-link` to its topic |

Git history: only two commits touch this area (`c907ef0 Merak ansiklopedisini ve mini laboratuvarları ekle`, `85134cd Etkinlikleri ansiklopedi katmanıyla zenginleştir`).

## 2. Routing, build, access

- `next.config.ts`: `output: "export"`, `trailingSlash: true`, `basePath` `/dogukan` in prod. All internal links are written with trailing slashes (`/kesfet/`, `/kesfet/${slug}/`, `/aktivite/${slug}/`).
- `src/app/kesfet/[slug]/page.tsx:12-16`: `export const dynamicParams = false;` + `generateStaticParams()` over `TOPICS` → 14 static HTML pages. `params` is a `Promise` (Next 15+/16 async params), awaited at lines 19 and 29.
- `generateMetadata` (lines 18–26) uses `topic.title` / `topic.summary`.
- **No auth check** anywhere under `/kesfet`. `HomeClient` gates only `/` (login → `MenuScreen`). The child (or anyone) can open `/dogukan/kesfet/` directly. No `logDogukanVisit` call in encyclopedia pages, so the parent panel's Firebase activity log never sees encyclopedia use.
- Root layout (`src/app/layout.tsx`): fonts `Baloo_2` (`--font-baloo` → `--font-display`) and `Nunito` (`--font-nunito`), `lang="tr"`, `viewportFit: "cover"`, `appleWebApp.capable`. No web manifest, no service worker, no dark mode (`prefers-color-scheme` count in CSS: 0).

## 3. Content model (`src/lib/encyclopedia.ts`)

### 3.1 Authoring shape — `RawTopic` (lines 10–49)

```ts
type RawTopic = {
  slug; title; kicker; icon; accent; summary; bigQuestion;
  storySections: { title; body; wonder }[];        // 3 per topic
  facts: { icon; title; body }[];                   // 3 per topic
  glossary: { term; definition }[];                 // 4 per topic
  observation: { title; time; materials[]; steps[]; safety; think };
  parentNote;
  quiz: { question; options: string[]; answer: number; explanation }[]; // 3 per topic, 3 options each
  labMode: RawLabMode;   // "body-beat" | "living-world" | ... — NOT used by the UI
  labPrompt: string;     // NOT used by the UI
};
```

Dead fields (never reach `EncyclopediaTopic` or any component): `kicker`, `accent`, `labMode`, `labPrompt`. `facts[].icon` survives only as a prefix inside `facts[].label`.

### 3.2 Public shape — `EncyclopediaTopic` (lines 81–122)

`slug, category: CategoryId, title, emoji, bigQuestion, summary, readingTime, sections[{title, body}], facts[{label, value, detail}], glossary[{term, meaning}], mission{title, steps[], safety?, parentNote}, quiz: EncyclopediaQuiz[], relatedActivities[{slug,title,emoji,reason}], reviewedAt, sources: EncyclopediaSource[], lab: "senses"|"body"|"plant"|"habitat"|"weather"|"water"|"orbit"|"moon"|"matter"|"light"|"motion"|"magnet"|"number"|"shape"`.

Exported types: `CategoryId`, `EncyclopediaCategory`, `EncyclopediaQuiz`, `EncyclopediaSource`, `EncyclopediaTopic`. Exported values: `CATEGORIES`, `TOPICS`, `getTopic(slug)`.

### 3.3 `CATEGORIES` (lines 124–174) — 7 worlds, 2 topics each

| id | emoji | title | color | topics |
|---|---|---|---|---|
| `ben` | 🫶 | Ben ve vücudum | `#ef476f` | bes-duyum, kalbim-ve-nefesim |
| `canlilar` | 🌱 | Canlılar dünyası | `#2a9d8f` | tohumdan-bitkiye, hayvanlar-ve-yasam-alanlari |
| `dunya` | 🌦️ | Değişen Dünya | `#118ab2` | hava-bugun-nasil, bir-su-damlasinin-yolculugu |
| `uzay` | 🌙 | Gökyüzü ve uzay | `#6c63ff` | gece-ve-gunduz, gunes-dunya-ve-ay |
| `madde` | 🧊 | Madde ve ışık | `#00b4d8` | kati-ve-sivi, isik-ve-golge |
| `hareket` | 🛹 | Kuvvet ve hareket | `#fb5607` | itme-cekme-ve-yuvarlanma, miknatislar |
| `matematik` | 🔢 | Matematik ve örüntüler | `#9c36b5` | sayilar-sifir-ve-sayi-dogrusu, sekiller-oruntuler-ve-simetri |

Category `description` strings are adult-register ("Duyularımızı, organlarımızı ve bedenimizin şaşırtıcı işleyişini keşfet.").

### 3.4 Side tables and derivation (lines 1820–2268)

- `topicClassification` (1820–1862): `slug → { category, lab, readingTime }`. This is the only place `lab` and `category` are assigned; `RawTopic.labMode` is ignored.
- `ENCYCLOPEDIA_REVIEWED_AT = "2026-08-01"` (1864). Note `[slug]/page.tsx:208` hardcodes the display string `1 Ağustos 2026` separately — duplication.
- `topicSourcesBySlug` (1866–2040): 2–3 adult sources per topic (NIH, NASA, NOAA, USGS, ACS, OpenStax). Validated at build: `sources.length < 2 || > 3` throws (2222–2224).
- `relatedActivitiesByTopic` (2042–2207): 0–3 game links per topic (`kati-ve-sivi` and `miknatislar` have none).
- `TOPICS = topicSources.map(...)` (2209–2262) — the transform rules implementers must know:
  - `sections[i].body = \`${body} Merak köşesi: ${wonder}\`` (2237) — the wonder is glued into the paragraph; the TTS reads the literal words "Merak köşesi:".
  - `facts[i] = { label: \`${icon} Biliyor muydun?\`, value: fact.title, detail: fact.body }` (2241–2245) — emoji ends up in a spoken label.
  - `mission.title = \`${observation.title} · ${observation.time}\``; `mission.steps = ["Hazırla: " + materials.join(", ") + ".", ...steps, "Sonra düşün: " + think]` (2251–2259) → always 6 steps.
  - `emoji = icon`, `readingTime` from classification, `reviewedAt` constant.
- `TOPIC_BY_SLUG` Map + `getTopic()` (2264–2268).

### 3.5 The 14 topics

| # | slug | category | lab | emoji | title | time | related games |
|---|---|---|---|---|---|---|---|
| 1 | `bes-duyum` | ben | `senses` | 👀 | Beş duyum | 6 dk | vucudumuz |
| 2 | `kalbim-ve-nefesim` | ben | `body` | ❤️ | Kalbim ve nefesim | 7 dk | vucudumuz |
| 3 | `tohumdan-bitkiye` | canlilar | `plant` | 🌱 | Tohumdan bitkiye | 7 dk | bitki-buyume, su-dongu |
| 4 | `hayvanlar-ve-yasam-alanlari` | canlilar | `habitat` | 🦊 | Hayvanlar ve yaşam alanları | 8 dk | hayvanlar, grupla |
| 5 | `hava-bugun-nasil` | dunya | `weather` | 🌦️ | Hava bugün nasıl? | 7 dk | hava-durumu, mevsimler |
| 6 | `bir-su-damlasinin-yolculugu` | dunya | `water` | 💧 | Bir su damlasının yolculuğu | 7 dk | su-dongu, yagmur-damlasi |
| 7 | `gece-ve-gunduz` | uzay | `orbit` | 🌗 | Gece ve gündüz | 7 dk | gezegenler, saat-ogren |
| 8 | `gunes-dunya-ve-ay` | uzay | `moon` | ☀️ | Güneş, Dünya ve Ay | 8 dk | gezegenler |
| 9 | `kati-ve-sivi` | madde | `matter` | 🧊 | Katı ve sıvı | 7 dk | — |
| 10 | `isik-ve-golge` | madde | `light` | 🔦 | Işık ve gölge | 7 dk | renk-atolyesi |
| 11 | `itme-cekme-ve-yuvarlanma` | hareket | `motion` | 🛹 | İtme, çekme ve yuvarlanma | 8 dk | pong, asteroids, tugla-kir |
| 12 | `miknatislar` | hareket | `magnet` | 🧲 | Mıknatıslar | 7 dk | — |
| 13 | `sayilar-sifir-ve-sayi-dogrusu` | matematik | `number` | 🔢 | Sayılar, sıfır ve sayı doğrusu | 8 dk | sayma-oyunu, sayi-sirasi, onluk-birlik |
| 14 | `sekiller-oruntuler-ve-simetri` | matematik | `shape` | 🔷 | Şekiller, örüntüler ve simetri | 8 dk | sekil-tani, desen-tamamla, tangram |

Big questions (good hooks, but phrased for older kids), e.g. `gece-ve-gunduz`: "Güneş gerçekten gökyüzünde Dünya'nın çevresinde mi dolaşıyor, yoksa hareket eden biz miyiz?"; `miknatislar`: "Mıknatıs kâğıdın arkasındaki ataşı nasıl dokunmadan hareket ettirebilir?"; `sayilar…`: "Hiç elma yoksa bunu bir sayıyla nasıl anlatırız; sıfır neden “hiç” olmasına rağmen çok önemlidir?"

Reverse links: `activityLearning.ts` maps **all 69** activities to one of these 14 topics (build-time check that every `MENU` slug has an entry, lines 600–610), so the encyclopedia is the semantic backbone of the whole app — any re-cut must keep the 14 slugs (or provide a redirect map) or `getActivityLearning` throws at build.

## 4. Topic page anatomy (`src/app/kesfet/[slug]/page.tsx`)

Rendered top-to-bottom as one long scroll (on a phone roughly 8–12 screens):

| Order | Lines | Section | Key classes / components | Content source |
|---|---|---|---|---|
| 0 | 56–63 | sticky top bar | `.encyclopedia-topbar`, `.encyclopedia-back` ("← Tüm keşifler"), `.encyclopedia-topbar-mark` | category emoji/title |
| 1 | 66–87 | hero | `.topic-hero`, `.topic-hero-visual` (emoji + 3 floating `<i>` specks, `@keyframes topicSpeck`), `.eyebrow`, `.topic-big-question`, `<EncyclopediaTools>` | emoji, title, bigQuestion, summary |
| 2 | 89–110 | "Keşif hikâyesi" | `.topic-reading`, `.topic-reading-intro`, `.topic-section`, `.topic-section-number` | 3 `sections` (body split on blank lines; in practice one paragraph each) |
| 3 | 112–128 | "Üç cep bilgisi" | `.fact-shelf`, `.fact-cards article` | 3 `facts` |
| 4 | 130 | mini lab | `<InteractiveLab mode={topic.lab} />` | lab only |
| 5 | 132–149 | "GÖZLEM BİLETİ" | `.home-mission`, `.mission-ticket`, `.mission-safety` | `mission` (6 steps, safety) |
| 6 | 151–165 | "Sözcük bahçesi" | `.word-garden dl` | 4 `glossary` |
| 7 | 167 | quiz | `<KnowledgeCheck slug questions={topic.quiz} />` | 3 `quiz` |
| 8 | 169–199 | "Keşfi oyunla sürdür" | `.related-activities`, `.related-activity-card` | `relatedActivities` |
| 9 | 201–209 | "Büyüklere not" | `.parent-note` | `mission.parentNote` |
| 10 | 211–236 | "İçerik şeffaflığı" | `.parent-note` + `<details>` | `sources`, reviewedAt |
| 11 | 238–254 | prev/next | `.topic-neighbors` | neighbours in `TOPICS` array order (crosses categories) |

Topic color is injected as `--topic-color` on the page root (line 48) and consumed by nearly every encyclopedia class (`.encyclopedia-tools button.active`, `.topic-section-number`, `.mini-lab-stage`, `.choice-row button.active`, `.lab-range output`, etc.).

## 5. Hub anatomy (`kesfet/page.tsx` + `EncyclopediaHub.tsx`)

- Server page builds `EncyclopediaTopicSummary[]` (slug, category, title, emoji, bigQuestion, summary, readingTime) and renders hero copy "Merak edince / bilim başlar." with badges "🔊 Sesli anlatım · 🧪 14 mini laboratuvar · 🏠 Güvenli ev gözlemleri".
- `EncyclopediaHub` (client):
  - progress ring `.encyclopedia-progress-ring` driven by `--progress` deg (line 74) and `countCompleted()`.
  - "Kaldığın yerden" card `.continue-discovery` — picks most recent `lastVisited` that is not complete (lines 56–61; uses `Array.prototype.toSorted`, ES2023 — fine on modern iOS/Chrome, fails on old Android WebViews; `tsconfig` lib is `esnext`).
  - search `.encyclopedia-search` with `normalizeSearch()` (NFD strip; note Turkish dotless `ı` is not decomposed, so "isik" does not match "ışık").
  - category tabs `.encyclopedia-tabs button[.active]`.
  - grid `.discovery-grid` → `.discovery-card[.is-complete]` with `--world-color`, `--delay` stagger (`@keyframes discoveryReveal`), `min-height: 330px` (300px on phones), 3 → 2 → 1 columns at 900px / 620px.
  - empty state `.empty-discoveries`.
  - sounds: `sounds.tap()` on tab/card click (`src/lib/sounds.ts` — WebAudio oscillator tones; API: `tap, success, wrong, pop, win, star, coin, shoot, jump, spring, explode, boost, gameOver, combo(n), levelUp`).

Each card shows 5 text blocks (category, title, bigQuestion, summary, CTA "Keşfe başla"/"Yeniden keşfet") — a 6-year-old sees text, not a picture.

## 6. Narration / TTS (`EncyclopediaTools.tsx`)

**Mechanism:** browser Web Speech API only. No audio files, no server TTS, no caching.

- `findTurkishVoice()` (lines 15–18): `window.speechSynthesis.getVoices()` → first voice whose `lang.toLocaleLowerCase("tr").startsWith("tr")`. Called synchronously at click time; **does not listen to `voiceschanged`**, so on Chrome/Android the list can be empty on first tap and the utterance falls back to the engine default with `lang = "tr-TR"` (usually still Turkish, but not guaranteed on iOS where voices load lazily). No preference ordering (e.g., prefer `Yelda`/Google Türkçe/online voices).
- `toggleSpeech()` (lines 43–75): builds **one** `SpeechSynthesisUtterance(\`${title}. ${narrationText}\`)`, `lang "tr-TR"`, `rate 0.9`, `pitch 1.04`; `cancel()` then `speak()`. Toggle = stop. `onend`/`onerror` update an `aria-live` message (`.sr-only`). Unsupported browser → "Bu tarayıcı sesli anlatımı desteklemiyor…".
- Cleanup: `window.speechSynthesis?.cancel()` on unmount (line 39) — navigating away stops speech.
- **`narrationText`** is assembled server-side in `[slug]/page.tsx:37-42`: `[bigQuestion, summary, ...sections.flatMap(s => [s.title, s.body]), ...facts.flatMap(f => [f.label, f.value, f.detail])].join(". ")`. Consequences:
  - 215–296 words per topic → **~100–137 s of continuous speech** at ~130 wpm (measured per topic; `sekiller…` is the longest at 296 words).
  - Bodies already end in "." so the join yields ".." pauses; headings are read as sentences; "Merak köşesi:" is spoken 3×; "👀 Biliyor muydun?" is spoken 3× (emoji may be read aloud as "göz" or produce a glitch depending on engine).
  - Not included: mission, glossary, quiz, lab text. The quiz and lab — the parts a non-reader most needs voiced — have **no voice at all**.
  - No word/sentence highlighting (`onboundary` unused), no pause/resume, no per-section play, no speed control, no autoplay (correct: iOS requires a user gesture).
- `[slug]/page.tsx` reading-intro literally says "Önce oku veya “Bana oku” düğmesini kullan" — the button label itself (`font-size: 0.73rem`, `.encyclopedia-tools button`) must be read to be found.
- No other `speechSynthesis` usage exists in the repo (grep confirmed) — the games have no voice either.

## 7. Interactive vs text

### 7.1 `InteractiveLab.tsx` — 14 modes

Shell: `.mini-science-lab.lab-${mode}` → `.mini-lab-heading` ("Dokun · değiştir · gözle") → `.mini-lab-layout` (2 cols, 1 col ≤900px) with `.mini-lab-stage` (visual, `aria-live="polite"`, `min-height 310/270px`) and `.mini-lab-controls`. Shared controls: `RangeControl` (`.lab-range` + `<input type=range>` + `<output>`), `.choice-row button` (2-col grid, `min-height 48px`), `.step-track button` (46px), `.lab-action` (48px), `.observation-note`.

State is 4 generic hooks reused across modes (`value`, `value2`, `step`, `active`, lines 150–153) with per-mode scaling (e.g., `WeatherLab temperature = value - 25`, `OrbitLab angle = value * 3.6`, `MagnetLab distance = round(value/8)`, `NumberLab start = round(value/10), jump = round(value2/10)`).

| lab | component | control(s) | visual / animation | reusability for capsules |
|---|---|---|---|---|
| `senses` | `SensesLab` | 5 `.choice-row` buttons (👁️👂👃👅🖐️) | static emoji swap, `.senses-stage` | high — already tap-to-reveal |
| `body` | `BodyLab` | slider 50–140 atım/dk; toggle "Yavaş nefes modelini başlat" | `.beating-heart` (`@keyframes heartBeat`, `--beat-speed`), `.breathing-lungs.is-breathing` (`@keyframes breathe`) | high — animated heart is a great capsule picture |
| `plant` | `PlantLab` | 2 sliders Işık / Su | emoji 🌻/🌱/🥀 by `balance`, `--plant-size` | medium (2 sliders → reduce to 3 taps) |
| `habitat` | `HabitatLab` | 4 `.choice-row` (Orman/Deniz/Çöl/Kutup) | `.habitat-backdrop` + `.habitat-animal` emoji | high |
| `weather` | `WeatherLab` | 2 sliders Sıcaklık (−20..40) / Rüzgâr | emoji 🌬️❄️🌡️🌤️ | medium |
| `water` | `WaterLab` | `.step-track` 4 steps | emoji per step, `.water-step-${n}` | high — natural 4-capsule sequence |
| `orbit` | `OrbitLab` | slider 0–360° "Dünya'yı döndür" | `.model-sun`, `.model-rays`, `.model-earth` rotated by `--earth-angle`; text "Modelde gündüz/gece · HH:00" | high — drag/spin gesture |
| `moon` | `MoonLab` | slider 0–7 | 8 moon emoji, `.moon-stage` | high — swipe through phases |
| `matter` | `MatterLab` | slider energy 0–100 | `.particle-box` 18 `<i>` dots, `@keyframes particleJiggle` speed via `--matter-energy`, `.state-katı/.state-sıvı/.state-gaz` layouts | high — animated |
| `light` | `LightLab` | slider angle 10–85° | `.shadow-sun`, `.shadow-object` 🌳, `.cast-shadow` sized by `--shadow-length`, `--light-angle` | high — drag sun |
| `motion` | `MotionLab` | 2 sliders İtme / Sürtünme + "Topu it" button | `.rolling-ball.is-moving` (`@keyframes ballTravel`, `--travel`), `sounds.jump()` | high — tap to launch |
| `magnet` | `MagnetLab` | slider distance 1–12 | `.model-magnet` margin `--magnet-gap`, `.paperclips` 📎×n | high |
| `number` | `NumberLab` | 2 sliders start 0–10 / jump 0–5 | `.number-equation`, `.number-track` 0–15 with `.is-start/.is-result/.is-path`, `.number-legend` | high (school-relevant) |
| `shape` | `ShapeLab` | 4 `.choice-row` + "Bir simetri doğrusu göster" | `.shape-model.shape-${id}`, `.shape-symmetry-axis`, `.shape-pattern` with `?` | high (school-relevant) |

All lab explanatory text (`<strong>` + `<p>` + `.observation-note`) is adult-register and unvoiced, e.g. MatterLab: "Bu, gerçek bir sıcaklık ölçeği değil tanecik davranışını anlatan basit bir modeldir". Sliders (`<input type=range>`) are fiddly for small thumbs; buttons are 46–52px which is OK.

### 7.2 `KnowledgeCheck.tsx`

- 3 questions, 3 text options each, rendered as `<fieldset class="knowledge-question">` → `.knowledge-options button` (52px, 3-col → 1-col ≤620px), lettered A/B/C.
- `arrangeOptions()` rotates options by `(slug.length + questionIndex) % 3` — deterministic, not random (same order every visit).
- Feedback `.answer-note[.correct]`: "Harika gözlem!" / "Birlikte bakalım:" + `explanation`. Correct → `sounds.success()`, wrong → `sounds.tap()` (no negative sound; good). Options disable after one pick (no retry).
- When all 3 answered: `.knowledge-result` with 🏅/🌱 and button "Keşfi tamamla ✓" → `updateEncyclopediaProgress(slug, { complete: true })` + `sounds.win()`.
- No voice for questions/options; options are plain text (no emoji/pictures) → unusable for a non-reader without an adult.

### 7.3 Text-only parts
Sections, facts, glossary, mission, parent notes, sources, hub cards — i.e. roughly 80 % of the page area.

## 8. Progress / favorites storage (`encyclopediaProgress.ts`)

- `STORAGE_KEY = "dogukan-merak-ansiklopedisi-v1"` → `Record<slug, { favorite?, complete?, lastVisited? }>` (`EncyclopediaProgress`, `EncyclopediaProgressEntry`).
- `readEncyclopediaProgress()` (SSR-safe, try/catch), `updateEncyclopediaProgress(slug, patch)` (merges, writes, dispatches `window.dispatchEvent(new CustomEvent("dogukan-encyclopedia-progress", { detail }))`), `countCompleted()`.
- Writers: `EncyclopediaTools` (`lastVisited` on mount via `useEffect`, lines 32; favorite/complete toggles), `KnowledgeCheck` (complete). Readers: `EncyclopediaHub`, `EncyclopediaTools` (both subscribe to the custom event and `storage`).
- **Not keyed by player** (dogukan vs serkan share the same key on one device), **not synced** to Firebase (`activityLog.ts` / `leaderboard.ts` are never imported here), **not visible** in `ParentInfoScreen`. "Favorite" is stored but never displayed anywhere (no favorites filter in the hub).
- Quiz answers themselves are not persisted (component state only).

## 9. Reading level vs a 6-year-old

Measured with a script over `TOPICS` (sections + facts):

| topic | section words | narration words | TTS ≈ | avg sent. | max sent. | words ≥12 chars |
|---|---|---|---|---|---|---|
| bes-duyum | 146 | 236 | 109 s | 9.7 | 20 | 10 |
| kalbim-ve-nefesim | 154 | 238 | 110 s | 10.3 | 18 | 15 |
| hayvanlar-ve-yasam-alanlari | 158 | 240 | 111 s | 10.8 | 23 | 10 |
| bir-su-damlasinin-yolculugu | 140 | 225 | 104 s | 9.0 | 18 | 20 |
| sayilar-sifir-ve-sayi-dogrusu | 188 | 294 | 136 s | 10.4 | 26 | 14 |
| sekiller-oruntuler-ve-simetri | 192 | 296 | 137 s | 11.0 | 23 | 17 |
| (all 14) | 137–192 | 215–296 | 99–137 s | 8.9–11.0 | 15–26 | 8–20 |

Total ≈ 5,340 words of body copy. Vocabulary sampled from section bodies: `titreşimlerini, karbondioksit, keseciklerinde, ayrıştırıcılar, Meteorologlar, damlacıklarına, kristallerine, modellenebilir, eylemsizlik, yoğunlaşma, görünür hareket, saat dilimi, basamak değeri, simetri doğrusu`. Content is accurate and nuanced (hedged with "genellikle", "olabilir", models vs reality) — exactly the register of a good 3rd–5th grade science reader, not a 6-year-old's.

For Doğukan (anaokulu/1. sınıf, emerging reader, Turkish): appropriate is ≤ 6–8 words per sentence, concrete nouns he can see, one idea per screen, every string voiced, choices as pictures. Nothing in the current UI copy meets that either: hub hero "Burada ezberlenecek uzun listeler yok…", button labels "Keşfi tamamla", "Favorime ekle", quiz heading "Şimdi fikri başka bir örnekte kullanalım". The missions (`observation`) explicitly need an adult ("Bir yetişkin nesneleri torbaya koysun") — good as parent-child activities, wrong as autonomous phone content.

Verdict: pedagogically strong *reference material* that can be mined; as a *child-facing surface* it must be re-cut and re-voiced, not polished.

## 10. Mobile/UX notes relevant to the redesign

- Breakpoints: 900px (hero/lab to 1 col, grid 2 col), 620px (grid 1 col, topbar hides title, fact cards 1 col, quiz options 1 col). Safe-area insets handled in `.encyclopedia-topbar` and `.encyclopedia-main` padding. `prefers-reduced-motion` honoured (globals.css 4523–4540).
- The topic page is a long-form article; there is no "one thing per screen" layout anywhere. Hover transforms on cards (`.discovery-card:hover`) are irrelevant on touch.
- Small type for a child: `.encyclopedia-tools button` 0.73rem, `.choice-row button` 0.75rem, `.knowledge-options button` 0.75rem, `.topic-section p` 0.97rem.
- No haptics, no celebration beyond `sounds.win()`; `CelebrationProvider` (used by games) is not used here.
- Background `BubbleBg` canvas at 0.28 opacity + 3 `.encyclopedia-sky` blobs + per-card reveal animation: fine, but the article itself has no imagery except emoji.

## 11. How to re-cut into voiced micro-capsules (20–40 s each)

### 11.1 Seed inventory already in the data

Per topic: 1 `bigQuestion`, 3 `sections` (each = 1 explanation + 1 `wonder`), 3 `facts`, 3 `quiz`, 4 `glossary`, 1 lab visual, 1 mission. Across 14 topics: 42 sections, 42 wonders, 42 facts, 42 quiz items, 56 glossary terms, 14 labs → **~180–200 capsule seeds without inventing anything new**; roughly 12–15 capsules per topic, i.e. a 5–8 minute "episode" per topic if every capsule is 25–35 s.

### 11.2 Proposed capsule type (new file, e.g. `src/lib/capsules.ts`)

```ts
export type Capsule = {
  id: string;                 // `${topicSlug}-${n}`
  topic: string;              // one of the 14 slugs (keeps activityLearning links valid)
  kind: "hook" | "fact" | "wonder" | "lab" | "word" | "quiz" | "mission";
  say: string;                // ≤ 2 short sentences, child register, what TTS speaks (and shows large)
  visual:                     // exactly one picture/animation
    | { type: "emoji"; glyph: string; bg?: string }
    | { type: "lab"; mode: EncyclopediaTopic["lab"]; preset: number }   // reuse stage visuals
    | { type: "svg"; name: string };
  tap?: {                     // one tap question, 2–3 picture answers
    prompt: string;           // also voiced
    options: { glyph: string; label: string; correct: boolean }[];
    reply: { correct: string; wrong: string };   // voiced feedback, ≤ 1 sentence
  };
  source?: { kind: "section" | "fact" | "quiz" | "glossary"; index: number }; // provenance
};
```

### 11.3 Mapping rules from existing fields

| capsule kind | from | rewrite rule (must be done by hand, strings today are too hard) |
|---|---|---|
| hook | `bigQuestion` + `emoji` | shorten to one concrete question ("Buz eriyince nereye gider?"), add tap "Ne düşünüyorsun?" with 2 emoji guesses, no wrong answer |
| fact | `facts[i].value` (title) + `.detail` | headline = title as-is (they are already short: "Dil haritası bir efsane", "Deri de bir organdır"), detail → one 6–8-word sentence |
| wonder | the `wonder` string currently glued after "Merak köşesi:" in `sections[i].body` — recover from `RawTopic.storySections[i].wonder` (split on ` Merak köşesi: ` or export the raw) | already one sentence; simplify vocabulary |
| lab | `InteractiveLab` stage for `topic.lab` with a fixed preset (e.g. `MoonLab step=4` 🌕, `MatterLab energy=90`, `OrbitLab angle=180`) | tap = "Dokun ve değiştir" with 2–3 big buttons instead of a slider (`.choice-row` already exists) |
| word | `glossary[i].term` | one picture + the word spoken slowly; tap "Hangisi X?" with 2 pictures |
| quiz | `quiz[i]` | keep `question`, convert 3 text options to emoji+label, voice `explanation` as reply |
| mission | `mission` | one capsule at the end of an episode: "Babanla dene: …" — a deliberate off-screen exit |

Every `say`/`prompt`/`label` must be voiced; keep `EncyclopediaQuiz`-style `answer: number` semantics so `KnowledgeCheck` logic (`arrangeOptions`, success/tap sounds) can be reused.

### 11.4 Rendering and interaction

- Route options under static export: a single client page `/kesfet/akis/` (feed) with `?topic=` or a `/kesfet/[slug]/kapsul/` page per topic via `generateStaticParams` over `TOPICS` (same pattern as today's `[slug]/page.tsx`). Keep `/kesfet/[slug]/` as the "parent/reference" view so `ActivityKnowledgePanel` and `MenuScreen` deep links keep working.
- Layout: full-viewport cards in a vertical scroller with `scroll-snap-type: y mandatory` / `scroll-snap-align: start`, `height: 100dvh`, gutters 16px; or a stepper with a big "▶" and swipe handlers. Reuse `--topic-color`, `.mini-lab-stage` visuals, `BubbleBg`, `sounds`.
- Voice per capsule: one short `SpeechSynthesisUtterance` per `say`, started by the tap that advanced the card (satisfies iOS gesture rule), `onend` → reveal the tap question; `voiceschanged` listener + preferred-voice ranking; `speechSynthesis.cancel()` on swipe. Keep `rate ≈ 0.85–0.9`. Add a persistent "🔊 tekrar" button. Consider pre-recorded MP3/M4A (the repo already serves `public/sounds/*.m4a`) for a fixed, high-quality — possibly the father's — voice, falling back to Web Speech.
- Progress: new storage key (`dogukan-merak-kapsul-v1` or bump the existing `-v1` schema) keyed by **player** and `capsuleId`; keep firing `dogukan-encyclopedia-progress` so the hub ring still works; also call `logDogukanVisit(slug, title)` so the parent panel sees it. Count a topic complete when ≥ N capsules seen.
- Healthy-use mechanics the "short video" format must *not* copy: no infinite feed — an episode ends (12–15 capsules), ends with a mission capsule, and shows a "Bugünlük bu kadar, yarın yeni keşif" screen with a daily cap stored in progress; no autoplay chain without a tap.

### 11.5 Reusing lab components

`InteractiveLab` sub-components are not exported and each couples visual + controls + state via props. Minimal refactor: export the stage halves (`BodyLab` heart block, `MatterLab` `.particle-box`, `OrbitLab` sun/earth, `LightLab` shadow, `MotionLab` track, `MagnetLab`, `MoonLab`, `HabitatLab`, `SensesLab`, `NumberLab` track, `ShapeLab` model) as `*Stage` components taking a single numeric/step prop, and keep `InteractiveLab` as the full-control composition for the reference page. The CSS already isolates visuals (`.mini-lab-stage` + mode-specific classes), so this is mostly a file split.

## 12. Problems (concrete)

1. Reading level: content and all UI copy are 3rd–5th grade; no capsule/one-idea format; `readingTime` 6–8 dk per topic (`topicClassification`, `encyclopedia.ts:1820-1862`).
2. TTS reads one 215–296-word monologue (`[slug]/page.tsx:37-42`, `EncyclopediaTools.tsx:55-71`); no segmenting/highlighting/pause; quiz, lab and glossary are never voiced.
3. `findTurkishVoice()` ignores `voiceschanged` and has no voice preference → inconsistent voice on Android/iOS (`EncyclopediaTools.tsx:15-18`).
4. Spoken artifacts: literal "Merak köşesi:" ×3 and "👀 Biliyor muydun?" ×3 in every narration (`encyclopedia.ts:2237, 2241-2245`); ".." double stops from `join(". ")`.
5. Quiz options are text-only with letters A/B/C; wrong answers cannot be retried; order deterministic (`KnowledgeCheck.tsx:13-24`).
6. Sliders as the primary lab control (10 of 14 labs) are hard for small thumbs; lab captions are adult text.
7. Progress is localStorage-only, device-wide (not per player), never sent to Firebase, invisible in the parent panel; "favorite" is stored but never shown (`encyclopediaProgress.ts`, `EncyclopediaHub.tsx`).
8. `/kesfet` has no login gate and no `logDogukanVisit` → parent cannot see encyclopedia usage.
9. Hardcoded review date string "1 Ağustos 2026" duplicates `ENCYCLOPEDIA_REVIEWED_AT` (`[slug]/page.tsx:208`).
10. Dead authoring fields (`kicker`, `accent`, `labMode`, `labPrompt`) and duplicated category/lab assignment (`topicClassification`) make the data file harder to edit than necessary.
11. `toSorted` in the hub (`EncyclopediaHub.tsx:58`) — ES2023, no polyfill; fine on current phones, breaks on old WebViews.
12. Hub cards and topic page are text-dense (5 text blocks per card, 11 sections per page) with no imagery beyond emoji.

## 13. Opportunities

1. ~200 ready capsule seeds (42 sections/wonders/facts/quiz, 56 words, 14 animated or tappable lab stages) with 2–3 vetted adult sources each — the hard "is it true?" work is done.
2. The 14 slugs are already the hub of `activityLearning.ts` (69 games → topics): capsules can be surfaced *inside* games ("bu oyunun kapsülü") and games inside capsules via `relatedActivitiesByTopic`.
3. Lab stages are CSS-variable driven (`--beat-speed`, `--matter-energy`, `--earth-angle`, `--shadow-length`, `--travel`, `--magnet-gap`) — trivial to drive from a preset or a tap instead of a slider.
4. `KnowledgeCheck` + `sounds` + `--topic-color` theming + reduced-motion CSS are reusable as-is for a tap-question capsule.
5. Math labs (`number`, `shape`) map directly to 1. sınıf curriculum (sayma, sayı doğrusu, şekil tanıma, örüntü, simetri) — the strongest "okuluna faydası" lever.
6. Missions (`observation`) are a built-in "put the phone down" exit — ideal as the last capsule of each episode and as parent-panel suggestions.
7. Infrastructure already right for mobile: static export, safe-area padding, 44–52px buttons, `aria-live` feedback, `prefers-reduced-motion`.

## 14. Quick reference

- Exports: `CATEGORIES`, `TOPICS`, `getTopic`, types `CategoryId`, `EncyclopediaCategory`, `EncyclopediaQuiz`, `EncyclopediaSource`, `EncyclopediaTopic` (`src/lib/encyclopedia.ts`); `readEncyclopediaProgress`, `updateEncyclopediaProgress`, `countCompleted`, types `EncyclopediaProgress`, `EncyclopediaProgressEntry` (`src/lib/encyclopediaProgress.ts`); components `EncyclopediaHub` (+ `EncyclopediaTopicSummary`), `EncyclopediaTools`, `InteractiveLab`, `KnowledgeCheck`.
- Storage key: `dogukan-merak-ansiklopedisi-v1`; event: `dogukan-encyclopedia-progress`; auth keys (`src/lib/auth.ts`): `dogukan-logged-in`, `dogukan-player`.
- CSS tokens: `--topic-color` (page root), `--world-color` (hub cards), `--progress`, `--ink #173f5f`, `--soft-ink #537188`, `--paper #fffdf5`, `--line`, fonts `--font-display` (Baloo 2) / `--font` (Nunito).
- Keyframes: `portalQuestion`, `encyclopediaOrbit`, `discoveryReveal`, `topicSpeck`, `heartBeat`, `breathe`, `particleJiggle`, `ballTravel`.
- Sounds used: `sounds.tap`, `.star`, `.win`, `.success`, `.jump`.
- Lint: `npx eslint src/components/encyclopedia src/app/kesfet src/lib/encyclopedia.ts src/lib/encyclopediaProgress.ts` → exit 0 (none of the repo's 14 React-Compiler errors are in this area).
