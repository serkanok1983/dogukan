# Wellbeing & parent-layer proposal — "Doğukan'ın Yeri"

Author role: digital-wellbeing & parenting expert (and parent of a screen-loving 6-year-old).
Inputs: the five code maps in `scratchpad/maps/*.md`; the sibling proposals `game-designer.md` (bear companion "Bal", honey economy, `progress.ts`, `settings.ts`, `RewardSheet`, `BalKapisi`) and `pedagogy.md` (`skills.ts`, `mastery.ts`, `quests.ts`, energy tank, `MolaScreen`, `ParentInsights`); direct reads of `src/lib/{activityLog,auth,leaderboard,encyclopediaProgress,firebase}.ts`, `src/hooks/useGameScore.ts`, `src/components/{CelebrationProvider,ActivityShell,IntroModal,ParentInfoScreen}.tsx`, `src/app/bilgi/page.tsx`, `src/app/layout.tsx`.

This document owns the layer the other two assume: **how long, when, how it stops, how it praises, how the father sees and steers it, and how the switch-over happens without taking Süper Ayı away.** Where the siblings conflict (honey vs energy), this document decides, and says so.

---

## 1. Vision

**First 5 minutes (day 1, a Saturday afternoon, with his father next to him for the first launch).** Doğukan taps a bear icon on the home screen (installed PWA, no browser bar). His own photo appears, large; he taps it and a bear says "Hoş geldin Doğukan! Ben senin ayınım. Bana bir isim ver." Four voiced names (Bal, Pati, Fıstık, Kaptan) plus a ⭐ "Baban yazsın" — he picks "Kaptan". Kaptan says "Kaptan! Harika. Bugün tanışma günü: istediğin adaya git." The map has six islands; Macera Adası has the Süper Ayı bear on it and a "Devam et ▶" tile showing his old high score ("Rekorun hâlâ burada: 1240"). He plays Süper Ayı — same game, same slug, same score, but crisp, fast, thumb-zone buttons, no text wall, and when he dies a sheet slides up with two equal buttons: "▶ Tekrar" / "🗺️ Harita". Nothing is locked on days 1–3 (grace period). At minute 20 a soft chime: the screen becomes a "Hareket Kartı": Kaptan jumps, the voice counts "Bir… iki… üç… dört… beş zıpla!" with a 60-second ring. The father jumps too (the parent panel told him to). The card ends with "Hazır mısın?" and a big ▶. He plays another ten minutes, then at 30 minutes Kaptan yawns: "Son turunu seç." He finishes the run; the "Bugünlük bu kadar!" screen shows the two stars he earned as pictures, says "Yarın Sayı Dağı'nda yeni bir şey var", and offers one card: "Babanla dene: gölgeni ölç." No argument — the run was allowed to finish, the ending was predicted five minutes earlier, and tomorrow has a preview.

**Day 7.** He opens the app himself after school. Kaptan wears a hat earned from letters e-l-a. The jar on the top bar shows 8 honey — the day's arcade minutes, drawn as something he can see. He does the Günün Görevi first because it is the glowing tile and because he knows it fills the jar (+2 honey per set, so learning buys play, within a ceiling the father set). The Merak Gölü episode about magnets is twelve swipes long with a dot rail that shows where the end is; the twelfth card says "Babanla dene: buzdolabında mıknatıs ara" and the feed stops — there is no thirteenth card, and the second episode of the day is the last; the hub then says "Yarın yeni bölüm." At 20:00 the map turns amber: "Akşam modu" — the arcade islands are asleep (💤), only tracing, blocks and capsules remain, sounds are half volume. At 20:30 Kaptan is asleep and the screen says "İyi geceler Doğukan" and nothing else responds except the parent gear. That evening the father opens /bilgi: 31 minutes (12 learning, 15 arcade, 4 capsules), two breaks taken, bedtime respected, letters k and i at level 2, counting to 15 solid, one suggestion "Yemekte 'kkk-edi' diye ilk sesi uzatın", and the mission card they can do together after dinner. The app sent no notification, showed no ad, opened no link, and never once said "zekisin".

---

## 2. Feature list

Priority: P0 = the app is not safe/healthy for this child without it; P1 = clearly needed, can follow; P2 = later. Phase: 1 = this session, 2 = next, 3 = later.

### F1. One child-visible meter — the honey jar as the arcade budget (decision) — P0, Phase 1
- **Why for him:** minutes are abstract at 6; a jar that drains while he plays and fills when he learns is concrete. Two meters (sibling proposals: honey *and* energy) would be one too many. **Decision: one meter.** Parent sets minutes; the app renders them as honey. `1 🍯 = 2 minutes of arcade time`. Honey is **not** spent per run (a child who dies in 8 seconds must not lose a unit) — it drains by active arcade time only. Learning sets add honey (+2 per completed 6-item set, +1 per capsule episode) up to a daily arcade ceiling. Stickers/cosmetics (game-designer F4) are bought with **stars**, never with honey, so the budget meter is never also a shop currency.
- **How it teaches:** makes the learning→play relationship visible without words; reading the jar is early quantity comparison.
- **UX:** jar in the companion bar on every screen except inside a running game (where a tiny jar sits in the pause corner). Full jar = `arcadeMinutes/2` cells; drains in whole cells; at 2 cells left the jar wobbles once and the bear says "Bal azalıyor. Son oyunlarını seç." At 0: `LimitScreen` for arcade only — learning islands and capsules stay open until the total daily cap (F3).
- **Data:** `settings.arcadeMinutes` (default 16 → 8 honey), `settings.learningBonusMinutes` (4 → 2 honey), `settings.arcadeMaxMinutes` (26 → 13 honey). Day bucket `arcadeSec`, `honeyEarned`.
- **Files:** `src/lib/wellbeing.ts` (pure rules), `src/lib/sessionClock.ts` (time attribution), `src/components/wellbeing/HoneyJar.tsx`; game-designer's `progress.ts` keeps `honey` as a *derived* value computed from these two, not a separate counter.
- **Risks:** children test limits on day 4 when the jar first bites; mitigated by the grace period (F10) and by the bear explaining the jar on day 3 in one sentence: "Yarından sonra bal böyle çalışıyor: oynarken azalır, öğrenirken dolar."

### F2. Natural stopping points inside every loop — P0, Phase 1
- **Why for him:** "just one more" is the mechanism of his current habit. Every current loop restarts with a single "Tekrar oyna" button and the encyclopedia narration is a 2-minute monologue. Stopping points must be *designed*, not imposed.
- **Rules (implement these exactly):**
  1. Every arcade run ends in a `RewardSheet` with **two equal-size buttons**: "▶ Tekrar" and "🗺️ Harita". No auto-restart, no countdown to restart, no "Tekrar" as the only button.
  2. After **3 consecutive runs of the same game** the sheet adds a third voiced option once per session: "Başka bir adaya bakalım mı?" showing the next quest tile. Never more than once per session (no nagging).
  3. Learning sets are 6 items (~90–150 s), then a sheet: "Bir tane daha ⭐" / "Haritaya dön 🗺️". Capsule episodes are 12 cards with a dot rail; the last card is always a real-world mission; there is no "next episode" button on the end screen — only "Harita" and the mission.
  4. **Günün Görevi completion is the session's natural chapter end**: "Çanta doldu! Bugünlük bu kadar mı, devam mı?" with equal buttons. Expect ~40 % of sessions to end here voluntarily.
  5. Never kill a run mid-way. All limits (F3, F4) wait for `run_end` or 120 s, whichever first; the clock shows the bear yawning in the corner meanwhile.
- **Data:** `sessions[].ended: "run_end" | "map" | "limit" | "bedtime" | "background"` so the father can see how sessions end.
- **Files:** `RewardSheet.tsx` (game-designer F4 — add the two-button contract and the 3-run suggestion), `ExerciseSession.tsx` end state, `CapsuleFeed.tsx` end card, `src/lib/sessionClock.ts` (`consecutiveRuns(slug)`).
- **Risks:** games that end on the canvas only (Flappy draws game over on canvas and in DOM) need the sheet to be the single end UI; audit the 23 `submitFinal` callers.

### F3. Daily cap with a gentle, predicted countdown — P0, Phase 1
- **Why for him:** a limit that arrives as a surprise produces a tantrum; one that is announced at −5 and −1 minutes and *lets him finish* is accepted. The father needs a single number he can set per weekday/weekend.
- **UX / copy (all voiced by the bear, shown as pictures):**
  - −5 min: bear yawns in the bar; "Beş dakika kaldı. Son oyununu seç." (once)
  - −1 min: bar turns amber; "Bu son tur!" (once)
  - 0: wait for `run_end` (≤120 s) → `LimitScreen`: big sleeping bear, today's stars as a picture row, "Bugünlük bu kadar! Harikaydın." then "Yarın: [next quest tile picture]" and one mission card "Babanla dene: …". Buttons: "📒 Çıkartmalarım" (album, read-only, 2 min soft) and nothing else. Parent gear (long-press 3 s) → PIN → "+10 dk" (logged as `extension`).
  - The limit **never** interrupts: a capsule card finishes its sentence; an exercise finishes its item.
- **Data:** `settings.weekdayMinutes` (30), `settings.weekendMinutes` (45); day bucket `totalSec`, `limitReachedAt`, `extensions[]`. Weekend = Sat/Sun in `Europe/Istanbul`; also `settings.holidayMode: boolean` for tatil weeks.
- **Files:** `src/lib/wellbeing.ts` `computePhase()`, `src/components/wellbeing/{CountdownBadge,LimitScreen}.tsx`, `src/components/wellbeing/WellbeingGuard.tsx` mounted in `layout.tsx`; `ActivityShell.tsx` passes `active={showHelp === false && !blocking}` to `GameSessionProvider`.
- **Risks:** time attribution when the phone locks mid-run — `visibilitychange` pauses the clock (and the game, via `useGameLoop`), so background time never counts.

### F4. Break ("Mola") every 20 minutes with movement/eye-rest Hareket Kartları — P0, Phase 1
- **Why for him:** he currently sits still for an hour with his eyes 25 cm from a 6-inch screen. A break that is a *game with the bear* is accepted; a grey "take a break" dialog is not. Breaks also train counting and body awareness.
- **UX:** after 20 min of active screen time (`settings.breakEveryMinutes`: 15/20/30), at the next natural pause (run end, set end, card end; ≤120 s wait) the `MolaScreen` slides in: one Hareket Kartı, a 60-second ring, the bear animated doing the action, the voice counting. "Devam ▶" appears only when the ring completes (child cannot skip; the parent gear can). Breaks are not counted against the daily cap. Cards rotate without repeating within a day:

| id | voice (child register) | what it is |
|---|---|---|
| `goz` | "Pencereye bak. En uzaktaki şeyi bul. On'a kadar sayalım: bir… on." | 20-20-20 eye rest + counting to 10 |
| `zipla` | "Ayağa kalk. Beş kere zıpla: bir, iki, üç, dört, beş!" | movement + ritmik sayma |
| `gerin` | "Ayı gibi gerin. Kollar yukarı… yavaş aşağı. Üç kere." | stretch |
| `flamingo` | "Flamingo ol! Tek ayak, beşe kadar. Şimdi diğer ayak." | balance |
| `nefes` | "Bal kokla (burnundan)… mumu söndür (ağzından). Üç kere." | breathing; links to the `kalbim-ve-nefesim` capsule |
| `su` | "Bir bardak su iç. Dönünce ▶ bas." | hydration (ring is 90 s) |
| `bul` | "Odada üç kırmızı şey bul. Bana göster!" | attention / colour; the bear 'looks' with the child |
| `sarıl` | "Yanında biri var mı? Ona bugün ne oynadığını anlat." | social; only shown when an adult has been marked present (F6) |

- **Data:** day bucket `breaksTaken`, `breaksSkippedByParent`, `breakIds[]`; `settings.breakEveryMinutes`, `settings.breakSeconds` (60).
- **Files:** `src/components/wellbeing/MolaScreen.tsx`, `src/content/breaks.ts` (the table above, tested for ≤ 14 words per sentence), bear frames from game-designer F13 atlas (`jump`, `stretch`, `sleep`, `yawn`, `wave`).
- **Risks:** the first mandatory break will be resented once; make the first ever break the `zipla` card with the father doing it too (parent onboarding checklist says so). Device-motion jump counting is tempting but iOS permission prompts make it Phase 3.

### F5. Evening mode and bedtime — P0, Phase 1
- **Why for him:** fast arcade at 20:15 and sleep at 20:30 do not mix; a hard "off" at 20:30 produces conflict. A 30-minute amber wind-down with only calm activities is how it works at home with lights.
- **UX:** from `bedtime − eveningModeMinutes` (20:00): the map gets a warm filter (`filter: sepia(.3) brightness(.9)` on the map container, token `--evening` so games are untouched), master gain to 0.5, arcade islands show 💤 and say "Macera Adası uyuyor. Sabah görüşürüz." Allowed: capsules, tracing (`harf-yazma`, `cizgi`), blocks (no challenge timer), memory, drawing. At `bedtime`: `NightScreen` — bear asleep, stars twinkle slowly (reduced-motion aware), "İyi geceler Doğukan. Yarın görüşürüz." No buttons except the parent gear. Same screen before `wakeFrom` (07:00) so a 6 a.m. grab does not become a session. Optional `schoolHours` lock (08:30–15:00 weekdays) — off by default, Phase 2, ask the father (§5).
- **Data:** `settings.bedtime` "20:30", `settings.wakeFrom` "07:00", `settings.eveningModeMinutes` 30; day bucket `bedtimeBlocks` (attempts to open at night).
- **Files:** `src/lib/wellbeing.ts` phases `evening`/`night`, `src/components/wellbeing/NightScreen.tsx`, map container class `is-evening` in the new `IslandMap.tsx`; `sounds.ts` master gain (game-infra map §8.10).
- **Risks:** device clock is the only clock (static export). Acceptable for a family; the parent panel shows "Telefon saati: 20:12" so misconfiguration is visible.

### F6. Co-play that pulls the father in ("Baba buradayım") — P0 minimal, Phase 1; P1 full, Phase 2
- **Why for him:** the strongest protective factor against problematic use at this age is a parent who plays *with* the child some of the time, not a lock. The current app only has a "Serbest Oyunlar · Ebeveynle" label that nothing enforces.
- **UX:**
  - A 🔔 "Babanı çağır" button on: the mission card at the end of every capsule episode, the `LimitScreen`, the Baba ile island, and the `sarıl` break card. Tapping plays a doorbell and shows a card for the adult: "Baba buradayım" guarded by the **Ebeveyn kapısı** (one arithmetic question "17 + 26 = ?", 64 px keypad — trivial for an adult, impossible for him; no PIN needed for presence). Success → `coplay` for 30 minutes: Baba ile games unlock, the bear says "İkiniz birlikte! Hadi.", the session is logged as `coplay`, and co-play time **does not drain honey** (we want more of it).
  - Co-play prompts are *offered*, never required, and at most once per session.
  - Phase 2: local two-player on one phone (Pong top/bottom, Köstebek split board, Refleks Arenası as the two-player it already half is) under Baba ile only; "Babanın görevi": the father picks tomorrow's quest tile or records a 5-second voice line from /bilgi.
- **Data:** `coplayUntil` in session state; day bucket `coplaySec`; `settings.babaIleEnabled` (default false until the father confirms; §5).
- **Files:** `src/components/wellbeing/CoPlayPrompt.tsx`, `src/components/ParentGate.tsx` (shared with login PIN; exports `ArithmeticGate` and `PinGate`), `src/lib/activityLog.ts` (`startCoplay`).
- **Risks:** an older sibling or the child memorising "43" — the question is random each time within 11–49 + 11–49.

### F7. Merak Kapsülleri feed — bounded, voiced, active, ends in the real world — P0, Phase 1 (rules), content by the pedagogy/encyclopedia engineers
- **Why for him:** short-video habit = vertical swipe, one idea, instant audio, endless. We keep the first three and kill the fourth. The rules below are the wellbeing contract the `CapsuleFeed` must satisfy (tests enforce them).
- **Rules:**
  1. An episode is exactly 12 cards; a dot rail shows position; card 12 is a mission ("Babanla dene: …") with a 🔔 button (F6). No card 13, no "sonraki bölüm" on the end card.
  2. `settings.episodesPerDay` (default 2). After the cap the hub shows "Yarın yeni bölüm" with a *preview picture* of tomorrow's episode (anticipation, not extension).
  3. No autoplay chain: each card's voice starts on the tap/swipe that revealed it (also the iOS gesture rule); after `onend` the tap question appears; the next card needs a gesture.
  4. Every card has a tap (predict / choose / "bir daha dinle"); a card never advances by time alone. This is what makes it active rather than passive viewing.
  5. No wrong-answer buzz in capsules ("Birlikte bakalım" + reveal); the goal is curiosity, not scoring.
  6. Capsule time counts toward the daily total but not the arcade jar; completing an episode gives +1 honey (F1).
  7. Capsule progress is per player and `logDogukanVisit` fires so the father sees it.
- **Data:** `dogukan-merak-kapsul-v1:<player>` (pedagogy F5), day bucket `episodesDone`.
- **Files:** `src/components/kesfet/CapsuleFeed.tsx` (rules 1–5), `src/lib/capsules.ts` test `episodes.length === 12 && last.kind === "mission"`, `src/lib/wellbeing.ts` (`canStartEpisode`).
- **Risks:** the hub itself can become a browse-loop; limit the hub to the 2 current episodes + locked previews, not a 14-card catalogue.

### F8. Praise language that builds growth mindset — P0, Phase 1
- **Why for him:** a child who is told "zekisin" after easy wins avoids hard tasks; a child praised for strategy and persistence seeks them. Current copy: "Harika!", "Süpersin!", "Aferin! Yeni rekor", "Serkan'ı geçtin!" — person praise and rivalry. All child-facing feedback goes through one module.
- **Rules:** praise the *process* (effort, attention, strategy, retry, choosing hard), never the person; never compare with anyone (the father included); vary — never the same line twice in a row, name used ≤ once per session; after a miss, normalise ("Yanlışlar öğretir") and give a next action; ≤ 7 words; "Mükemmel/en iyi" never; "Harika" at most once per session.
- **Copy (`src/lib/praise.ts`, excerpt):**

| context | lines (voiced) |
|---|---|
| `correct_first` | "Dikkatle baktın!" · "Buldun. Nasıl bildin?" · "Kulağın iyi dinledi." · "Tam isabet." · "Sakin baktın, buldun." |
| `correct_retry` | "Bir daha denedin ve buldun!" · "Pes etmedin. İşte bu." · "İkinci deneme, doğru!" |
| `wrong_try_again` | "Henüz değil. Bir daha dinle." · "Hmm, tekrar bakalım." · "Yaklaştın. Bir kez daha." |
| `wrong_reveal` | "İşte bu. Şimdi biliyorsun." · "Cevap buydu. Bir dahakine!" |
| `set_done_high` | "Altı soru, hepsi senin." · "Çok çalıştın, oldu." |
| `set_done_low` | "Zor bir setti. Beynin çalıştı!" · "Yanlışlar öğretir. Yarın yine." |
| `run_end` | "İyi oynadın. Ne öğrendin?" · "Her seferinde biraz daha ileri." · "Zor bölümdü, denedin." |
| `new_star` | "Yeni yıldız! Sabrın kazandı." |
| `persisted` (3+ tries) | "Üç kere denedin. Bu cesaret." |
| `chose_hard` | "Zor olanı seçtin. Süper." |
| `break_done` | "Gözlerin dinlendi. Hadi." |
| `day_done` | "Bugün çok şey yaptın. Yarın görüşürüz." |

- **Data:** `recentPraise: string[]` in session memory (no persistence).
- **Files:** `src/lib/praise.ts` (`praise(context, {name?}) → string`, deterministic test: no repeats in 3, all ≤ 7 words, no banned words `zeki|akıllı|en iyi|mükemmel|geçtin`), wired into `ExerciseSession`, `RewardSheet`, `CelebrationProvider.toast`, `MolaScreen`, `LimitScreen`; `leaderboard.ts` `buildCelebrateMessage` strings move to parent-only display (`settings.rivalVisible` default false).
- **Risks:** TTS prosody makes short lines sound flat; prefer 2-beat lines with a comma; Phase 2 father's voice pack (pedagogy F12) fixes this best.

### F9. Parent dashboard v2 (`/bilgi`) — what he practiced, time, streak, suggestions, settings — P0, Phase 1 (cards 1–4, settings, install); P1 (weekly digest), Phase 2
- **Why for him (via the father):** the father's success criterion is "okuluna faydası olsun" and "severek zaman geçirsin". Today /bilgi lists login timestamps and 80 raw visits — it cannot answer either. The dashboard must answer in 20 seconds: *how much, what, is it working, what do I do tonight.*
- **Screens (one scroll, cards in this order):**
  1. **Bugün** — ring: total minutes vs cap, split arcade/learning/capsule; jar state; breaks taken 2/2; "Yatma saati: ✓"; sessions ended by limit 1. Copy: "Bugün 31 dk · 12 öğrenme · 15 oyun · 4 keşif".
  2. **Bu hafta** — 7 bars (learning vs arcade stacked), streak 🔥 6, days opened, average session length, breaks per hour. A one-line verdict from rules: "Öğrenme payı %38 — hedef %35 ✓".
  3. **Beceriler** — from `mastery.summary()`: "Şu an öğreniyor: *k* sesi (2/5), 20'ye kadar sayma (3/5)" / "Bu hafta ustalaştı: e, l, a" / "Zorlanıyor: eksik terim". Each row carries the MEB kazanım text so he can talk to the teacher.
  4. **Bu akşam birlikte** — three cards: today's capsule mission, one `talkQuestion` from `activityLearning.ts` for something he played today ("Sor: Süper Ayı'da 4. seviyeye nasıl geçtin?"), one 1-line skill tip ("Yemekte 'kkk-edi, kkk-apı' diye ilk sesi uzatın"). Button "Yaptık ✓" logs it (it is the only "achievement" in the parent panel).
  5. **Ne oynadı** — sessions grouped by day: icon, name, duration, stars, how it ended. Replaces the raw visit list.
  6. **Ayarlar** — sliders/toggles for every `settings.*` field with defaults shown; "Telefona ekle 📲" (beforeinstallprompt / iOS card); "Baba ile oyunlar" toggle; "Rekabet (Serkan ile yarış) çocuğa göster" toggle (default off); "Ayının adı"; "Tanışma günleri" counter; "+10 dk şimdi" button.
  7. **Sağlık** — crash list (`errors/dogukan`), Firebase status ("Bu cihazda yerel; Firebase yok" vs synced), phone clock, TTS voice found ("Türkçe ses: Google Türkçe ✓" or a card "Google Metin Okuma'da Türkçe sesi indirin").
- **Entry:** long-press 3 s on the bear's hat corner of the map → `ParentGate` (arithmetic + 4-digit PIN hash). The "Çıkış yap" button and the "📊 Bilgi" header button disappear from the child surface.
- **Data:** reads `users/dogukan/days/*`, `sessions/*`, `skills/*`, `settings/dogukan`, `errors/dogukan`; local-first fallbacks for all.
- **Files:** `src/app/bilgi/page.tsx` (gate + layout), `src/components/parent/{Dashboard,TodayCard,WeekBars,SkillsCard,TogetherCard,SessionsList,SettingsForm,HealthCard,InstallCard}.tsx`, `src/lib/settings.ts`, `src/lib/activityLog.ts` (day buckets + sessions), delete `ParentInfoScreen.tsx`.
- **Risks:** without Firebase everything is single-device; say so plainly on the card rather than showing empty lists.

### F10. Transition from the current app without losing Süper Ayı — P0, Phase 1
- **Why for him:** the risk is not that he dislikes the new app; it is that the first impression is "they took my game and added homework". The switch must feel like his game grew.
- **Plan:**
  1. **Keep what he already likes, identical in identity:** slug `super-ayi`, its leaderboard key, his local high score (`dogukan-scores-dogukan`) and Flappy/Tetris/Royal Match all stay; the hero tile on day 1 is "Devam et ▶ Süper Ayı" with "Rekorun hâlâ burada: N" voiced.
  2. **The bear is the bridge:** the companion uses the Süper Ayı bear sprite; Doğukan names it on first launch (autonomy, ownership). `settings.companionName` defaults to "Bal" if skipped.
  3. **Tanışma günleri (grace): 3 days** with no jar gating — only the daily cap, breaks and bedtime, which are framed as the bear's own routine from day 1 ("Ben de mola veriyorum"). On day 3 the bear explains the jar in one sentence; day 4 it is live. `settings.graceUntil` is editable by the father.
  4. **First launch is co-play** (the parent onboarding checklist in /bilgi: install to home screen, let him name the bear, do the first break together, show him the jar on day 3).
  5. **Migrations:** `dogukan-merak-ansiklopedisi-v1` → `…:<player>`; guide prefs become irrelevant (IntroModal removed); scores untouched; sessionStorage-only sessions become persistent for the child (`setLoggedIn("dogukan", true)`).
  6. **Nothing he could do yesterday needs reading today**; nothing he liked yesterday is behind a lock on day 1. Dövüş Arenası / shooters move to Baba ile — he has not been playing them alone anyway (the label said so), and the father confirms in §5.
- **Files:** `src/lib/settings.ts` (`graceUntil`, `companionName`), `src/components/onboarding/{NameTheBear,FirstLaunch}.tsx`, `src/lib/migrations.ts`, parent checklist in `InstallCard.tsx`.
- **Risks:** if the father skips the first co-play launch, day-4 gating lands cold; the dashboard nags *him* (not the child) with the checklist until done.

### F11. Autonomy: choice, no nagging, play not homework — P0, Phase 1 (rules across all screens)
- **Why for him:** compliance produced by locks evaporates; choice produces return visits. Principles the whole team implements:
  - Every screen offers **2–3 choices**, never one ("Tekrar" alone is banned; "Şimdi ders zamanı" never exists).
  - Quests are *suggestions with a glow*, not gates: the arcade is open from the first minute of every day with the base jar; learning *extends* it (F1). Never phrase learning as a price: the jar "fills", it is not "paid for".
  - **One proactive voice nudge per session** from the bear (the 3-run suggestion or the quest reminder), chosen by `wellbeing.ts`; the rest is reactive.
  - No push notifications ever (not possible under static export and against the goal); no badges with counts; streak has a weekly "Dondurma 🍦" freeze and drops by one instead of resetting.
  - Learning screens look and sound like the games: same bear, same stars, same sheet; the word "ders" does not appear in the child surface (test).
  - The child can always see **where the end is** (dot rails, jar cells, 6-slot star rail) — predictability is what makes stopping acceptable.
- **Files:** copy audit test `src/content/__tests__/childCopy.test.ts` over `src/content/*.ts` (banned: `ders|ödev|yasak|zeki|akıllı|en iyi|mükemmel|geçtin|kaybettin|başarısız`), `wellbeing.ts` `nudgeBudget`.

### F12. Zero external surface in the child app — P0, Phase 1
- **Why:** the father's "zararlı içerikten korunma" is concretely: no path from the child surface to the open web, no third-party content, no ads, no data leaving except to his own Firebase.
- **Scope:** encyclopedia sources rendered as plain text for the child and as links only inside `/bilgi`; `rel="noopener noreferrer"` if ever kept; a post-build test greps every `out/**/index.html` except `out/bilgi/` for `href="http` and `target=`; `manifest display: standalone` so a stray link could not open a browser anyway; CSP via headers is impossible under export, so the test is the gate; Firebase anonymous auth + rules (production map §9.3) so the behavioural log of a minor is not world-readable; EXIF stripped from his photo.
- **Files:** `scripts/verify-out.mjs` (add the link check), `src/app/kesfet/[slug]/page.tsx` sources block, `database.rules.json`.

### F13. Weekly digest and school-term rhythm — P1, Phase 2
- "Bu hafta" summary card the father can screenshot for the teacher; term/holiday mode (`holidayMode` raises caps, shifts bedtime 30 min); the bear's "hafta sonu" greeting.

### F14. Father's voice for praise, breaks and bedtime — P2, Phase 2
- ~60 clips (praise lines, break cards, "İyi geceler Doğukan") recorded by the father (pedagogy F12 script); a child regulates better to a parent's voice than to TTS, and a bedtime line in his father's voice is the single most "sticky" wellbeing asset.

---

## 3. Phase 1 scope — one session, ~8 engineers in parallel

This document's work maps onto the sibling team tables as follows (game-designer E7 "Production & parent", pedagogy E6 "Shell: map, gate, quest, parent panel"). I recommend splitting one engineer out explicitly for wellbeing so that limits, breaks and bedtime are not the last thing bolted on.

**Contracts frozen in hour 0 (written by the wellbeing engineer, reviewed by E1/E2):**

```ts
// src/lib/settings.ts  (localStorage "dogukan-settings-v1", mirrored Firebase settings/<player>)
export type Settings = {
  weekdayMinutes: number;      // 30  total daily cap Mon–Fri
  weekendMinutes: number;      // 45
  arcadeMinutes: number;       // 16  base jar (8 🍯)
  learningBonusMinutes: number;// 4   per completed 6-item set (+2 🍯); capsule episode = half
  arcadeMaxMinutes: number;    // 26  ceiling for jar (13 🍯)
  breakEveryMinutes: 15|20|30; // 20
  breakSeconds: number;        // 60
  bedtime: string;             // "20:30"
  wakeFrom: string;            // "07:00"
  eveningModeMinutes: number;  // 30
  episodesPerDay: number;      // 2
  voiceOn: boolean; hapticsOn: boolean;
  babaIleEnabled: boolean;     // false until confirmed
  rivalVisible: boolean;       // false
  companionName: string;       // "Bal"
  graceUntil: string;          // "YYYY-MM-DD" (install day + 2)
  holidayMode: boolean;        // false
  updatedAt: number;
};

// src/lib/wellbeing.ts (pure, tested)
export type Phase = "grace" | "play" | "warn5" | "warn1" | "limit" | "evening" | "night";
export type DayUsage = { totalSec: number; arcadeSec: number; learningSec: number; capsuleSec: number;
  honeyEarned: number; breaksTaken: number; sinceBreakSec: number; episodesDone: number; extensions: number[] };
export function computePhase(now: Date, s: Settings, d: DayUsage): Phase;
export function honeyLeft(s: Settings, d: DayUsage): number;          // cells
export function canStartArcade(s, d, coplay: boolean): boolean;
export function canStartEpisode(s, d): boolean;
export function breakDue(s, d): boolean;
export function nextNudge(session: SessionMemory): Nudge | null;        // ≤ 1 per session

// src/lib/sessionClock.ts (singleton; useSyncExternalStore hook useWellbeing())
clock.setContext({ slug, kind: "arcade"|"learning"|"capsule"|"break"|"map", coplay });
clock.subscribe(cb); clock.getDay(); clock.endSession(reason);
// ticks 5 s while visible && pointer activity < 60 s; persists day bucket; flushes to Firebase every 60 s + pagehide

// src/lib/praise.ts
export type PraiseContext = "correct_first"|"correct_retry"|"wrong_try_again"|"wrong_reveal"|"set_done_high"|"set_done_low"|"run_end"|"new_star"|"persisted"|"chose_hard"|"break_done"|"day_done";
export function praise(ctx: PraiseContext, o?: { name?: string }): string;
```

**Firebase/local data model additions (extends production map §10):**
```
settings/dogukan                               Settings
users/dogukan/days/{YYYY-MM-DD}                DayUsage + { opens, firstOpenAt, lastActiveAt, limitReachedAt?, bedtimeBlocks, coplaySec, sessionsEndedBy: {run_end, map, limit, bedtime, background}, breakIds[], togetherDone?: boolean }
users/dogukan/sessions/{YYYY-MM-DD}/{pushId}   { startAt, endAt, slug, kind, coplay, result?: {score?, stars?, correct?, total?}, ended }
users/dogukan/wellbeing/{pushId}               { at, type: "break_due"|"break_done"|"warn5"|"warn1"|"limit"|"extension"|"evening"|"night_block"|"coplay_start"|"nudge", slug? }
errors/dogukan/{pushId}                        { at, slug, message, ua }
```
Local keys: `dogukan-settings-v1`, `dogukan-day-v1:<player>:<date>`, `dogukan-outbox-v1` (flushed on `online`). `activity/dogukan/{logins,visits}` is kept read-only for one release, then removed.

**Engineer split (this layer's share of the 8):**

| Engineer | Owns | Deliverable at end of session |
|---|---|---|
| **E-W1 Wellbeing** | `settings.ts`, `sessionClock.ts`, `wellbeing.ts` (+ tests), `WellbeingGuard`, `HoneyJar`, `CountdownBadge`, `MolaScreen` + `src/content/breaks.ts` (8 cards), `LimitScreen`, `NightScreen` + evening filter, `praise.ts` (+ tests), `CoPlayPrompt`, `ArithmeticGate`, grace period, migrations | phases work end-to-end against the device clock; a run is never cut mid-way; breaks fire at 20 min with voice; praise module replaces every hard-coded "Harika!" |
| **E-W2 Parent & production** | `ParentGate` (PIN hash + arithmetic), `/bilgi` v2 cards 1–7, `SettingsForm`, `InstallCard` + onboarding checklist, `activityLog.ts` day buckets/sessions/outbox, Firebase anon auth + `database.rules.json`, `verify-out.mjs` external-link check, EXIF-stripped avatar, sources-as-text on `/kesfet/[slug]` | father can set every limit, see today/week/skills/together, install the app; CI fails on any `href="http` in the child surface |
| Shared with E-Shell (sibling) | `IslandMap` reads `useWellbeing()` for evening dim, jar in `CompanionBar`, no logout/📊 on the child surface, long-press parent entry, `NameTheBear` on first launch | |
| Shared with E-Progression (sibling) | `RewardSheet` two-button contract + 3-run suggestion; `progress.honey` derived from `wellbeing.honeyLeft`; stars (not honey) buy cosmetics; `CelebrationProvider.toast` uses `praise()` | |
| Shared with E-Learning (sibling) | `ExerciseSession` calls `praise()`, reports `learningEnd` → `+learningBonusMinutes`; no "ders" copy | |
| Shared with E-Capsules (sibling) | `CapsuleFeed` enforces F7 rules 1–5; `canStartEpisode`; mission card has 🔔 | |
| Shared with E-GameInfra (sibling) | `useGameLoop` pauses on `visibilitychange` **and** on `wellbeing.blocking`; `ActivityShell` `active` includes `!blocking`; `sounds.setMasterGain` for evening | |

**Definition of done (wellbeing slice):** on a 390×844 device: (1) day 1 after install shows the grace behaviour (no jar gating) and a break at 20 min with voice; (2) a fake clock at 20:05 shows evening mode, 20:30 shows NightScreen; (3) with `arcadeMinutes` set to 2 the jar empties after a full run, the run finishes, LimitScreen appears with today's stars and a mission; (4) `/bilgi` behind PIN shows minutes today split by kind, breaks taken, skill rows, three "birlikte" cards, every setting editable; (5) `vitest` covers `computePhase` (weekday/weekend/grace/evening/night/limit/warn), `honeyLeft`, `praise` (no repeats, banned words, ≤ 7 words), breaks table, capsules (12 cards, last is mission), and `verify-out` finds zero external links outside `/bilgi/`.

---

## 4. What to REMOVE or demote from the current app, and why

**Remove from the child surface**
- `LoginScreen` typed credentials and the header "Çıkış yap" / "📊 Bilgi" buttons (`MenuScreen.tsx:79-86`) — a child must never be one tap from logout or the parent panel; the child session is persistent, the parent enters via long-press + gate.
- `CelebrationProvider` modal mid-run and `checkLiveMilestone` messages "Eski rekorunu geçiyorsun! 🚀", "Serkan'ı geçtin! 🏆" (`leaderboard.ts`) — a blocking 3.2 s rival-comparison modal is both a flow-breaker and the wrong praise model; toast + `praise()` instead, rival stats parent-only (`settings.rivalVisible`).
- `ScoreHud` rival paragraph ("Bu oyunda lider: …") — comparison with the father on every screen; replace by stars + numeral.
- The 69-card text menu, search, tabs, "69 aktivite · 7 kategori", the `merak-portal` banner copy — none of it is for him; it is also the biggest reason he never reached the content.
- `IntroModal` text walls with keyboard controls on 69 first visits and `ActivityKnowledgePanel` under every game — adult text interleaved into play. Keep the data; move to `/bilgi` "Birlikte" cards and a long-press "Anne-baba" sheet.
- `window.location.reload()` restarts (Count/Order/Symmetry/Tangram) — they reload 800 KB and re-log a visit; also an invisible stopping point we want to design, not stumble into.
- External `<a href>` sources on `/kesfet/[slug]` for the child; starter SVGs; unreferenced `dogukan.png`; `apple-icon.svg`.
- Any "Tekrar oyna"-only end state (23 games) — replaced by the two-button `RewardSheet`.
- `activity/dogukan/visits` as the parent's main view — timestamps are surveillance without insight; day buckets + sessions + skills replace it.

**Demote (keep, behind the parent gate as "Baba ile")**
- `dovus-arenasi`, `tank-savasi`, `uzayli-istilasi`, `uzay-savunma`, `asteroids`, `pinball-space-cadet` — the father already labelled these "Ebeveynle"; now the app enforces it with the arithmetic gate, and they become co-play content rather than solo arcade.
- `/kesfet` hub and long articles — parent reference pages; the child gets episodes.
- Leaderboard rivalry — parent-panel stat and an optional toggle, not the child's motivation.
- The 100–137 s TTS monologue — parent page only.

**Explicitly not building (anti-patterns):** push notifications, badge counts, loot-box style random rewards (next sticker is predetermined), streak reset to zero, timers that create urgency on learning screens, autoplay chains, infinite feeds, "watch to unlock" mechanics, any shop with real or pseudo money.

---

## 5. Open questions for the father (only those that change the build)

1. **Defaults:** 30 min weekdays / 45 weekends total, 16 min base arcade, break every 20 min, evening mode 20:00, bedtime 20:30, wake 07:00, 2 capsule episodes/day — adjust? Should there be a school-hours block (08:30–15:00)?
2. **Baba ile games:** keep the fighting/shooter games in the app at all (gated, co-play only), or drop them? And is "Anne" a second parent profile (own PIN, same dashboard)? The app currently knows only Serkan.
3. **Phone:** iPhone or Android (brand/OS)? Decides Turkish TTS quality, the install flow and whether the "install Turkish voice" card is needed on day one.
4. **Rivalry:** should Doğukan still see his high scores against yours (off by default here), or is that parent-only?
5. **First launch:** can you do the first session together on a weekend afternoon and record ~60 short voice lines later (praise, breaks, "İyi geceler")? Both are optional; both are the highest-leverage things only you can do.

---

## Appendix A — Screen and copy inventory for the wellbeing overlays

All copy is voiced; text shown is large (≥ 22 px) and is a caption, never the only channel. `{ayı}` = `settings.companionName`. Buttons ≥ 64 px. Every overlay is rendered by `WellbeingGuard` above the route (`z-index` between `.celebration-overlay` 200 and `.intro-overlay` 500) and sets `GameSessionProvider active=false` through context so canvases pause under it.

| Screen | Trigger | Elements (top → bottom) | Voice line(s) | Buttons |
|---|---|---|---|---|
| `NameTheBear` | first launch, after avatar tap | bear waving; 4 name chips (64 px) + ⭐ "Baban yazsın" | "Ben senin ayınım. Bana bir isim ver." → "{ayı}! Harika isim." | chips; parent chip opens keyboard behind arithmetic gate |
| `GraceHint` (day 3 only) | first map open on `graceUntil` | bear pointing at the jar; jar fills/drains animation | "Yarından sonra bal böyle: oynarken azalır, öğrenirken dolar." | "Tamam ▶" |
| `CountdownBadge` | phase `warn5` / `warn1` | bear yawn in companion bar; amber bar at `warn1` | "Beş dakika kaldı. Son oyununu seç." / "Bu son tur!" | none |
| `MolaScreen` | `breakDue()` at next natural pause | one Hareket Kartı: bear animation, 60 s ring, counting text | card voice (table F4) → "Gözlerin dinlendi. Hadi." | "Devam ▶" appears when ring completes; parent gear |
| `LimitScreen` | phase `limit` after `run_end` | sleeping bear; today's stars as a row of pictures; "Yarın:" preview tile; mission card with 🔔 | "Bugünlük bu kadar! Harikaydın. Yarın Sayı Dağı'nda yeni bir şey var." | "📒 Çıkartmalarım" · 🔔 "Babanı çağır" · parent gear (+10 dk) |
| `EveningBanner` | phase `evening` | thin amber strip on the map; arcade tiles show 💤 | "Akşam oldu. Sakin oyunlar açık." (once) | tap 💤 tile → "Macera Adası uyuyor. Sabah görüşürüz." |
| `NightScreen` | phase `night` or before `wakeFrom` | bear asleep, slow stars (reduced-motion: static) | "İyi geceler {name}. Yarın görüşürüz." (once; no repeat on re-open) | parent gear only |
| `CoPlayPrompt` | 🔔 tapped | doorbell sound; adult card: "Baba buradayım" + arithmetic question + keypad | child: "Babanı çağırdım!" → on success: "İkiniz birlikte! Hadi." | "Vazgeç" (child) |
| `ChapterEnd` | Günün Görevi 3/3 | full bag animation; two equal tiles | "Çanta doldu! Bugünlük bu kadar mı, devam mı?" | "🗺️ Devam" · "👋 Bugünlük bu kadar" |
| `RewardSheet` (owned by progression; contract here) | every `run_end` / set end | stars earned, honey change (+2 or none), praise line | `praise("run_end")` or `praise("set_done_*")` | "▶ Tekrar" · "🗺️ Harita" (+ once/session: "Başka bir ada?" tile) |

Voice rules for all overlays: one utterance per screen on mount, started by the gesture that caused the screen (iOS); `speech.cancel()` on dismiss; never repeat a screen's line within the same session (`SessionMemory.spokenScreens`); if `voiceOn` is false the caption text is shown larger and an animated 🔊 button offers the line on tap.

## Appendix B — Session clock: edge cases and tests

Attribution model: the clock owns `now`, `context`, and a per-day bucket. It ticks every 5 s while `document.visibilityState === "visible"` **and** the last pointer/key event was < 60 s ago; each tick adds 5 s to `totalSec` and to the kind of the current context (`arcadeSec`, `learningSec`, `capsuleSec`; `break` and `map` count to `totalSec` only). Under `coplay` the arcade seconds are also added to `coplaySec` and excluded from `honeyLeft`.

Edge cases the implementation and tests must cover:
1. **Phone lock / app switch:** `visibilitychange` → `hidden` stops ticking immediately and ends the current session with `ended: "background"`; on `visible` a new session starts with the same slug. The game loop is paused by `useGameLoop` on the same event, so no "ghost minutes" accrue.
2. **Midnight rollover during a session:** day key is computed per tick in `Europe/Istanbul` (`Intl.DateTimeFormat("sv-SE", { timeZone })`); seconds after 00:00 go to the new day; `honeyLeft` resets with the new bucket; `phase` becomes `night` anyway, so in practice the overlay appears.
3. **Clock tampering (child moves the device clock forward to skip bedtime or reset the day):** store `lastTickAt`; if `now < lastTickAt − 5 min` or the day key jumps by > 1 day while `performance.now()` advanced < 1 h, enter `phase: "night"` until the parent gear confirms, and log `wellbeing: "clock_jump"`. Shown in the Sağlık card.
4. **Two tabs / PWA + browser open together:** the day bucket is written with `storage` event merge (`Math.max` per second counter), same approach `leaderboard.ts:106` already uses for scores.
5. **Firebase offline:** writes go to `dogukan-outbox-v1` and flush on `online`; the day bucket is local-first and authoritative on the device; the parent panel shows "Son eşitleme: 14:02".
6. **Grace period:** `computePhase` returns `grace` instead of `limit` for the jar only; the daily cap, breaks and bedtime still apply (they are the bear's routine, not a punishment).
7. **Weekend/holiday:** `isWeekend(now)` in Istanbul time; `holidayMode` uses the weekend cap on every day.
8. **Breaks and limits never pre-empt:** `breakDue` and `limit` set `pending` and the overlay mounts on the next `run_end`/`set_end`/`card_end` event or after 120 s, whichever first; a game's `.game-over` state counts as `run_end` even if the child has not tapped.

Test list (`src/lib/__tests__/`):
- `wellbeing.test.ts`: phase matrix (weekday 09:00 fresh → `play`; 25/30 min → `warn5`; 29/30 → `warn1`; 30/30 → `limit`; 20:05 → `evening`; 20:31 → `night`; 06:30 → `night`; grace day with jar empty → `grace`), `honeyLeft` (16 min → 8 cells; after 3 learning sets → 14 cells, capped at 13), `canStartArcade` under coplay with empty jar → true, `breakDue` at 1200 s since last break.
- `sessionClock.test.ts` (jsdom, fake timers): hidden stops ticks; idle > 60 s stops ticks; midnight rollover splits buckets; clock jump sets `night`.
- `praise.test.ts`: 200 draws per context → no immediate repeat, ≤ 7 words, no banned words, name at most once per session.
- `breaks.test.ts`: 8 cards, unique ids, sentences ≤ 14 words, each has `voice`, `seconds`, `bearFrame`.
- `capsules.test.ts` (shared): every episode has 12 cards and ends with `kind: "mission"`; every card has a `tap`.
- `childCopy.test.ts`: all strings in `src/content/*.ts` free of `ders|ödev|yasak|zeki|akıllı|en iyi|mükemmel|geçtin|kaybettin|başarısız`.
- `verify-out.mjs`: no `href="http` / `target=` in any `out/**/index.html` outside `out/bilgi/`; `manifest.webmanifest` and `apple-touch-icon` present.
