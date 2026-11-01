# Integration Contract — Phase 1

> Companion to `docs/plan/MASTER_PLAN.md` (Turkish product plan). This file is
> the **single source of truth for interfaces**. Every package codes against the
> signatures here and nothing else. If you need to change an exported signature,
> you change this file in the same PR and notify the owner of every consumer
> listed in §12. Additive changes (new optional fields, new exports) by the
> file's owner are allowed without a contract change.
>
> Paths use the `@/` alias (`@/` = `src/`). Language: code and identifiers in
> English, child-facing copy in Turkish. Last updated 2026-10-31.

---

## C0 implementation notes (2026-10-31, C0 landed)

C0 is merged. Deviations from the first draft of this file, already applied below:

- Event payload fields may not be called `id` or `at` (they are stamped by
  `trackEvent`). Hence `break_done.breakId`, `cosmetic_buy.cosmeticId`,
  `cosmetic_equip.cosmeticId`.
- `reduceDay` takes an optional 4th argument `runStars` so the day bucket can
  record a run's stars without recomputing them.
- `activitiesInWorld` returns `ACTIVITY_INFO` table order.
- `useRunResult` lives in `src/components/progress/useRunResult.ts` (`.ts`, not `.tsx`).
- Additive helpers: `isSkillId` (skills), `setStars` (reducers), `voiceLine`
  (content/voice), `readRaw`/`writeRaw` (storage), `DAY_MS` (progress/time),
  `_applyEvent`/`_readStoredForTests` (store, internal).
- Mastery selectors (`dueSkills`, `weakestSkills`, `planSession`,
  `pickForGate`, `summary`) ship with simple working bodies so S1/S5/S6 can use
  them immediately; S2 refines them without changing signatures.
- Tests: `npm test` runs `vitest run` (jsdom; `server-only` aliased to Next's
  empty module in `vitest.config.mts`). Test files: `src/**/*.test.{ts,tsx}`.
- Lint baseline after C0: the 14 pre-existing errors (games, `useGameScore`,
  `bilgi/page.tsx`) are unchanged; owners S4/S5/S6 fix them. One warning comes
  `docs/plan/workflow-understand-design.js` (S8: add `docs/**` to the
  ESLint ignores).

**Integration notes (2026-10-31, S1–S9 merged):**

- `useCanvasFit` DPR is opt-in (`dpr: "auto"`), see §10.3.
- `src/app/manifest.ts` needs `export const dynamic = "force-static"` under `output: "export"`.
- `verify-out` budgets are gzip sizes (`/` JS ≤ 250 KB, CSS ≤ 25 KB) and are hard errors.
- Firebase: `@/lib/firebaseConfig` is SDK-free and safe to import statically; the SDK is only
  loaded via `await import("@/lib/firebase")` (`getAuthedDb`, `pushValue`, re-exported `ref/set/get/…`).
- `/` renders the island skeleton without JS (not "Kim oynuyor?"), so logged-in launches don't flash the login.
- `BubbleBg` is deleted.
- Canvas text: `ctx.font` cannot resolve CSS variables (`var(--font-nunito)` is silently ignored and the
  previous font stays, e.g. `42px serif`). Always wrap with `canvasFont("bold 13px var(--font-nunito), sans-serif")`
  from `@/lib/canvasFont`.
- E2E: `npm run e2e` (Playwright, installed Chrome via `channel: "chrome"`; `E2E_CHANNEL=` for bundled Chromium)
  runs `e2e/smoke.spec.ts` and `e2e/child-flow.spec.ts` (390×844, clock pinned to a weekday morning,
  reduced motion, zero console errors). Not part of `npm run check`.

**Review fixes (2026-11-01, live after deploy):**

- Session: `loginAs("dogukan")` is persistent (local + session); `loginAs("serkan")` is **session-only**.
  On load, a persistent non-dogukan login in localStorage is removed (old "Oturumu açık tut" father logins).
  The map shows a "👨 Baba oynuyor" banner when the session player is serkan.
- Clock (§10.2): `running` = `started && useGameActive()` (false under RewardSheet/HoneyGate/overlays/pause).
  The "show overlay now" pause window closes on the first tap/key, `run_start`, or running false→true (30 s cap);
  `card_end` counts only at that instant; `finishBreak` opens no window. Clock-jump reference persisted in
  `dogukan-clock-ref` (backward jumps logged; forward jumps while asleep are indistinguishable from sleep).
- `WellbeingState` adds `graceDay`, `arcadeOpen`, `honeyRefill`; `jarEmpty` excludes coplay and grace;
  `evening` = `isEveningAt(now) || night override` (independent of warn phases). Overlays only for a
  logged-in child session. New exports: `startCoplay`, `canStartArcadeNow`, `extensionMinutesFor`,
  `canEarnHoney`, `canStartArcade(…, { ignoreNight })`, `SETTING_RANGES` (all settings sanitized/clamped).
- Bal topla: one shared 2-per-session counter (StartCard + RewardSheet), never offered at the jar ceiling;
  the game restarts only if a cell exists; in the evening arcade gets Harita only. One coplay gate (arithmetic);
  the Baba ile pass is the coplay state.
- Progress (§2/§3.5): additive fields `TopicState.favoriteAt/completeAt`, `DayUsage.breakAtTotalSec/extensionGrants`,
  `Progress.ackedNotices/lifetime`. Merge stays commutative + idempotent and can now undo: acked notices stay
  acked, break resets survive, extensions merge by grant id, favourites are last-writer-wins, `starsSpent` =
  max(recorded, Σ owned catalogue prices). Load validates every field; persist merges with storage first;
  re-read on `pageshow`/visible.
- Firebase: every read/write awaits `getAuthedDb()` (returns null on failed anonymous sign-in, retried later);
  `leaderboard.ts` loads the SDK lazily. Rival wording removed entirely: with `rivalVisible`, only
  " · 🏆 Baba: N" is appended to a `praise()` line. **Re-paste `database.rules.json` in the Firebase console.**
- QuizGame speaks (question, read-out of choices with highlight, retry → reveal, `praise()`), emits
  `exercise_set_end` + natural pauses, 6 questions per set. ExerciseSession/CapsuleFeed read choices aloud and
  never speak or reveal while inactive (overlay/pause); re-speak once afterwards. Bare consonants are blocked
  at token level in all spoken strings. Ses Avı words carry optional `aka` names; distractors never share the
  target's first sound under any name.

**S5 additive changes (2026-10-31):**

- `types.ts`: `Progress.rewards.questDays?: DayKey[]` (days on which all three
  quests were completed; sticker trigger). Merge = sorted union. `emptyProgress`
  initialises it to `[]`; old stores without it stay valid.
- `reducers.ts`: `quests_set` is ignored when the store already holds the same
  or a later day with items (two tabs cannot overwrite done flags).
  `exercise_set_end` with `mode: "gate"` no longer writes activity stats/stars
  (the gate slug `bal-topla` is not an activity); the day bucket still gets +1
  honey. Sticker awards and quest completion run after `reduceDay`.
- `RunResult` gains optional `runStars?: Stars` (this run's stars) and `level?`.
- `leaderboard.ts`: `recordScore(..., opts?: { rivalVisible?})` and
  `checkLiveMilestone(..., opts?: { rivalVisible?})`; when omitted they read
  `getSettings().rivalVisible`. Rival wording is suppressed when off.
  `checkLiveMilestone` returns `LiveMilestone` (adds `kind`).
- New exports: `starRules.{STAR_TABLE, DEFAULT_THRESHOLDS, starRuleFor}`,
  `stickers.{STICKER_PAGES, getSticker, stickerTriggered}`,
  `cosmetics.{getCosmetic, starsAvailable}`,
  `quests.{buildQuests, questView, slugForSkill}`,
  `components/progress/session.ts` (`consecutiveRuns`, session counters),
  `HoneyGate.HONEY_GATE_SLUG = "bal-topla"`, `RewardSheet.SUGGEST_LINE`,
  `NoticeToaster.STICKER_REVEAL_MS`.

## 0. Ground rules (all packages)

1. **Order:** package **C0 (core)** lands alone first. Then S1–S9 run in
   parallel. Nothing in S1–S9 starts before C0 is merged.
2. **Disjoint ownership:**
   - A file may only be edited by its owner (§12).
   - Files that C0 creates as **stubs** (§11) are handed to their owner, who
     replaces the body and keeps the exported signature.
3. **Never break the build in your own branch:** `npm run lint`,
   `npx tsc --noEmit`, `npm test` and `npm run build` must pass before you
   hand over (after S8 lands: `npm run check`). There is **no CI** — GitHub
   Actions minutes are exhausted — so these local runs are the only gate. New and edited files must have zero lint warnings.
4. **All 73 activities stay reachable** at `/aktivite/<slug>/` (69 existing + 4
   new; §5). No slug is deleted in Phase 1. Hiding a slug from the child map is
   done with `ACTIVITY_INFO[slug].hidden`.
5. **No lint rule is disabled** to make code pass. Fix the code. Existing
   `eslint-disable` lines may only be removed, not added.
6. **Next 16:** read the relevant guide in `node_modules/next/dist/docs/` before
   writing Next-specific code (paths in MASTER_PLAN §4). Static export means no
   `headers()`, no Server Actions, no route handlers except metadata routes.
   Every dynamic route needs a non-empty `generateStaticParams` and
   `export const dynamicParams = false`.
7. **Child surface rules:**
   - Every child-facing string has a spoken form.
   - Text is ≥ 18 px; tap targets are ≥ 56 px, answer choices ≥ 96 px and game
     touch buttons ≥ 72 px.
   - No `window.location.reload()`, no `alert()`, no external `href`, no
     `target=`.
   - Praise goes through `praise()`.
8. **Storage access** only through `@/lib/storage` helpers. They are SSR-safe
   and never throw (private mode / quota errors are swallowed).
9. **Firebase** is optional. Every Firebase call is lazy (`await import("@/lib/firebase")`)
   and silent-fail. Nothing on the child path awaits Firebase.
10. **Commit messages are in Turkish** (repo convention). No model names in code
    or commits.

---

## 1. Storage keys and window events

| Key                                    | Store           | Owner                 | Shape                                                           |
| -------------------------------------- | --------------- | --------------------- | --------------------------------------------------------------- |
| `dogukan-logged-in`                    | local + session | S1 (`auth.ts`)        | `"true"` (unchanged)                                            |
| `dogukan-player`                       | local + session | S1                    | `PlayerId` (unchanged)                                          |
| `dogukan-progress-v1:{player}`         | local           | C0 store              | `Progress` (§2)                                                 |
| `dogukan-settings-v1`                  | local           | C0 → S6               | `Settings` (§7). Device-wide, describes the child.              |
| `dogukan-blocks-v1:{player}`           | local           | S9                    | `BlockSave[]` (§10.6)                                           |
| `dogukan-outbox-v1`                    | local           | S6                    | `ProgressEvent[]` (≤ 500, FIFO)                                 |
| `dogukan-errors`                       | local           | S8                    | `ErrorEntry[]` ring of 20 (§10.9)                               |
| `dogukan-pin-lock`                     | local           | S1                    | `{ fails: number; until: number }`                              |
| `dogukan-parent-until`                 | session         | S1                    | epoch ms; parent mode expiry                                    |
| `dogukan-install-card-dismissed`       | local           | S8                    | `"1"`                                                           |
| `dogukan-scores-*`, `leaderboard` keys | local           | S5 (`leaderboard.ts`) | **unchanged**                                                   |
| `dogukan-merak-ansiklopedisi-v1`       | local           | S7                    | legacy; migrated into `progress.topics` and then left untouched |
| `dogukan-guide:v2:*`                   | local           | —                     | obsolete; ignored (not deleted)                                 |

Key helpers live in `@/lib/storage` (§3.1). The separator is always `:`.

**Window events** (`CustomEvent`, `detail` as typed):

| Event                           | Fired by                            | Detail                                                    |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| `dogukan:progress`              | C0 store, after every applied event | `{ type: ProgressEvent["type"] }`                         |
| `dogukan:settings`              | C0 `settings.ts` on write           | `Settings`                                                |
| `dogukan:audio-unlock`          | C0 `speech.unlockAudio()`           | none. `sounds.ts` listens and resumes its `AudioContext`. |
| `dogukan-encyclopedia-progress` | S7 adapter                          | legacy, kept for `/kesfet`                                |

---

## 2. Core types — `src/lib/progress/types.ts` (C0)

```ts
import type { PlayerId } from "@/lib/auth";
import type { SkillId, SkillLevel } from "@/lib/skills";

export type DayKey = string; // "YYYY-MM-DD" in Europe/Istanbul
export type Stars = 0 | 1 | 2 | 3;
export type StickerId = string; // catalogue owned by S5 (stickers.ts)
export type CosmeticId = string; // catalogue owned by S5 (cosmetics.ts)
export type BreakId =
  "goz" | "zipla" | "gerin" | "flamingo" | "nefes" | "su" | "bul" | "saril";
export type ClockKind =
  "arcade" | "learning" | "capsule" | "creative" | "break" | "map";
export type SessionEndReason =
  "run_end" | "map" | "limit" | "bedtime" | "background";

export type ActivityStats = {
  plays: number; // completed runs or sets
  best: number; // best raw score (arcade) or best correct count (sets)
  bestLevel: number; // highest level reported via level_complete / run_end.level
  stars: Stars; // max over all runs
  ease: number; // 0.6–1.0, starts 0.7 (arcade difficulty scalar)
  consecutiveLow: number; // consecutive runs scoring 0 stars (for ease down)
  seconds: number; // total active seconds
  lastAt: number; // epoch ms
};

export type SkillState = {
  level: SkillLevel; // current working level, 1–5
  streak: number; // consecutive first-try correct at this level
  misses: number; // consecutive wrong-final at this level
  attempts: number;
  correct: number;
  firstTryCorrect: number;
  box: 0 | 1 | 2 | 3 | 4; // Leitner box
  lastAt: number;
  nextDueAt: number;
  masteredAt?: number; // first time a level-up from L3 was earned
};

export type TopicState = {
  capsuleDone: boolean;
  capsuleDoneAt?: number;
  favorite: boolean; // parent /kesfet only
  complete: boolean; // parent /kesfet only
  lastAt: number;
};

export type DayUsage = {
  totalSec: number; // every visible, non-idle second except breaks
  arcadeSec: number; // arcade seconds NOT under coplay (drains the jar)
  learningSec: number;
  capsuleSec: number;
  creativeSec: number;
  coplaySec: number; // arcade seconds under coplay (never drain the jar)
  breakSec: number; // not counted in totalSec
  sinceBreakSec: number; // totalSec since the last break_done (reset there)
  honeyEarned: number; // jar cells earned today (set +2, gate +1, episode +1)
  setsDone: number;
  episodesDone: number;
  breaksTaken: number;
  breaksSkippedByParent: number;
  opens: number;
  extensions: number;
  extensionMinutes: number;
  limitReached: boolean;
  bedtimeBlocks: number; // COUNT only; never render as a list (MASTER_PLAN K28)
  togetherDone: boolean;
  clockJumps: number;
  sessionsEndedBy: Record<SessionEndReason, number>;
  plays: Record<string, { sec: number; runs: number; stars: Stars }>; // per slug, today
};

export type QuestKind = "tr" | "mat" | "extra" | "review";
export type QuestState = {
  id: string; // `${day}:${slot}`
  kind: QuestKind;
  slug?: string; // activity to open
  skill?: SkillId;
  topic?: string; // capsule topic
  done: boolean;
};

export type NoticeKind =
  "new_star" | "level_up" | "sticker" | "quest_done" | "quests_all_done" | "streak";
export type Notice = {
  id: string;
  kind: NoticeKind;
  at: number;
  slug?: string;
  skill?: SkillId;
  stars?: Stars;
  stickerId?: StickerId;
  streak?: number;
};

export type Progress = {
  v: 1;
  player: PlayerId;
  createdAt: number;
  installDay: DayKey;
  updatedAt: number;
  activities: Record<string, ActivityStats>;
  skills: Partial<Record<SkillId, SkillState>>;
  topics: Record<string, TopicState>;
  days: Record<DayKey, DayUsage>; // keep last 60 days; older pruned on load
  rewards: {
    stickers: Partial<Record<StickerId, number>>; // id → unlockedAt
    cosmetics: { owned: CosmeticId[]; equipped: CosmeticId | null };
    starsSpent: number;
    streak: { count: number; lastDay: DayKey | null; freezeUsedWeek: string | null };
  };
  quests: { day: DayKey | null; items: QuestState[] };
  inbox: Notice[]; // consumed by UI via notices_ack
  seenEventIds: string[]; // last 300 event ids (idempotence)
};
```

`src/lib/progress/time.ts` (C0):

```ts
export const TIME_ZONE = "Europe/Istanbul";
export function dayKey(ms?: number): DayKey; // Intl "sv-SE" formatting in TIME_ZONE
export function addDays(day: DayKey, n: number): DayKey;
export function daysBetween(a: DayKey, b: DayKey): number; // b - a in whole days
export function weekKey(ms?: number): string; // ISO week "2026-W44"
export function isWeekend(ms?: number): boolean; // Sat/Sun in TIME_ZONE
export function minutesOfDay(ms?: number): number; // 0–1439 in TIME_ZONE
export function parseHHMM(s: string): number; // "20:30" → 1230
export function emptyDay(): DayUsage;
export function emptyProgress(player: PlayerId, now?: number): Progress;
```

---

## 3. Event bus and store

### 3.1 `src/lib/storage.ts` (C0)

```ts
export const KEYS: {
  loggedIn: "dogukan-logged-in";
  player: "dogukan-player";
  settings: "dogukan-settings-v1";
  outbox: "dogukan-outbox-v1";
  errors: "dogukan-errors";
  pinLock: "dogukan-pin-lock";
  parentUntil: "dogukan-parent-until";
  installDismissed: "dogukan-install-card-dismissed";
  legacyEncyclopedia: "dogukan-merak-ansiklopedisi-v1";
};
export function progressKey(player: PlayerId): string; // "dogukan-progress-v1:dogukan"
export function blocksKey(player: PlayerId): string; // "dogukan-blocks-v1:dogukan"
export function readJSON<T>(key: string, fallback: T, area?: "local" | "session"): T;
export function writeJSON(
  key: string,
  value: unknown,
  area?: "local" | "session",
): void;
export function removeKey(key: string, area?: "local" | "session"): void;
```

### 3.2 Events — `src/lib/progress/types.ts` (C0)

```ts
export type ProgressEventInput =
  | { type: "app_open" }
  | { type: "activity_open"; slug: string }
  | { type: "run_start"; slug: string }
  | {
      type: "run_end";
      slug: string;
      score: number;
      durationMs: number;
      level?: number;
    }
  | { type: "level_complete"; slug: string; level: number }
  | {
      type: "exercise_item";
      slug: string;
      skill: SkillId;
      level: SkillLevel;
      firstTry: boolean;
      correct: boolean;
      review: boolean;
      ms: number;
    }
  | {
      type: "exercise_set_end";
      slug: string;
      skill: SkillId;
      correct: number;
      total: number;
      firstTry: number;
      mode: "session" | "gate";
    }
  | { type: "capsule_end"; topic: string }
  | {
      type: "usage";
      day: DayKey;
      kind: ClockKind;
      sec: number;
      coplay: boolean;
      slug?: string;
    }
  | { type: "break_done"; breakId: BreakId; skippedByParent: boolean }
  | { type: "limit_reached" }
  | { type: "extension"; minutes: number }
  | { type: "bedtime_block" }
  | { type: "session_end"; reason: SessionEndReason; slug?: string }
  | { type: "coplay_start" }
  | { type: "together_done" }
  | { type: "clock_jump"; deltaMs: number }
  | { type: "blocks_saved"; index: number; shared: boolean }
  | { type: "topic_flag"; slug: string; favorite?: boolean; complete?: boolean }
  | { type: "quests_set"; day: DayKey; items: QuestState[] } // emitted by S5 quests.ts
  | { type: "cosmetic_buy"; cosmeticId: CosmeticId; price: number }
  | { type: "cosmetic_equip"; cosmeticId: CosmeticId | null }
  | { type: "notices_ack"; ids: string[] };

export type ProgressEvent = ProgressEventInput & { id: string; at: number };
export type ProgressEventType = ProgressEvent["type"];
```

### 3.3 `src/lib/progress/events.ts` (C0)

```ts
/** Stamps id/at, applies the reducer synchronously, persists (300 ms debounce),
 *  fires `dogukan:progress`, then calls listeners. Returns the stamped event. */
export function trackEvent(e: ProgressEventInput): ProgressEvent;

/** Subscribe to stamped events after they were applied. "*" = all. */
export function onEvent<T extends ProgressEventType>(
  type: T | "*",
  cb: (e: Extract<ProgressEvent, { type: T }>, next: Progress) => void,
): () => void;
```

Rules:

- `trackEvent` is a no-op on the server and when no player is logged in. It
  never throws.
- Listeners run synchronously in subscription order. A throwing listener is
  caught and logged with `console.warn`.
- The id is `crypto.randomUUID()` when available, otherwise a timestamp+random
  fallback.

### 3.4 `src/lib/progress/store.ts` (C0)

```ts
export function getProgress(): Progress; // current player's in-memory state
export function getServerProgress(): Progress; // stable empty snapshot for SSR
export function subscribeProgress(cb: () => void): () => void;
export function reloadProgressForPlayer(): void; // call after login/logout (S1)
export function readProgressSnapshot(player: PlayerId): Progress; // read-only, for /bilgi
export function flushProgress(): void; // immediate persist (pagehide)
export function _resetProgressForTests(p?: Progress): void;
```

- **On load:**
  1. Parse the stored value. If it is missing or invalid, start from
     `emptyProgress`.
  2. Prune `days` older than 60 days.
  3. Run migrations:
     - legacy encyclopedia key → `topics`, mapping
       `{favorite, complete, lastVisited}`;
     - `installDay = dayKey(createdAt)`.
- **Cross-tab:** `storage` events for this key replace state through
  `mergeProgress(local, incoming)`.
- **Persistence:** debounced 300 ms; also flushed on `pagehide` and
  `visibilitychange → hidden`.

### 3.5 Reducers — `src/lib/progress/reducers.ts` (C0 → S5) and `dayReducer.ts` (C0 → S6)

```ts
export function reduceProgress(p: Progress, e: ProgressEvent): Progress; // pure
export function mergeProgress(a: Progress, b: Progress): Progress; // commutative, idempotent
// dayReducer.ts
export function reduceDay(
  d: DayUsage,
  e: ProgressEvent,
  p: Progress,
  runStars?: Stars,
): DayUsage; // pure; runStars = stars of this run_end
```

**General reducer behaviour:**

- If `seenEventIds` already contains `e.id`, return `p` unchanged.
- Otherwise push the id (cap 300) and set `updatedAt = e.at`.
- `reduceProgress` delegates the day bucket `days[dayKey(e.at)]` to `reduceDay`.
  The bucket is created with `emptyDay()` if missing. For `usage` events the
  bucket is `days[e.day]`.

**Semantics C0 implements** (owners may extend; existing semantics are
contract):

**`app_open`**

- `opens++`.

**`run_end`**

- Activity stats:
  - `plays++`
  - `best = max(best, score)`
  - `bestLevel = max(bestLevel, level ?? 0)`
  - `lastAt = e.at` (`seconds` is written only by `usage`, below)
- Stars: `runStars = starsForRun(slug, {score, level})` (`starRules.ts`), then
  `stars = max`. If stars increased, push a `new_star` notice.
- Ease:
  - `runStars === 3` → `ease = min(1, ease + 0.05)` and `consecutiveLow = 0`.
  - `runStars === 0` → `consecutiveLow++`. At 3: `ease = max(0.6, ease - 0.05)`
    and `consecutiveLow = 0`.
  - Otherwise `consecutiveLow = 0`.
  - New stats start at `ease: 0.7`.
- Day bucket: `plays[slug].runs++`; `plays[slug].stars = max`.
- Every arcade `run_end` also feeds skill `ef.refleks` through `applyExercise`.
  Treat it as one item: `firstTry = runStars >= 1`, `correct = runStars >= 1`,
  `review: false`, at `level = progress.skills["ef.refleks"]?.level ?? 1`.

**`level_complete`**

- `bestLevel = max(bestLevel, level)`.

**`exercise_item`**

- `skills[skill] = applyExercise(skills[skill], {...})` (§6.2).
- On level-up push a `level_up` notice.

**`exercise_set_end`**

- Activity stats: `plays++`, `best = max(best, correct)`.
- Stars: `stars = max(stars, setStars(correct, total))`, where `setStars` is
  ratio ≥ 1 → 3, ≥ 5/6 → 2, ≥ 4/6 → 1, else 0. Push `new_star` if increased.
- Day bucket:
  - `setsDone++` when `mode === "session"`.
  - `honeyEarned += mode === "session" ? 2 : 1`.
- Streak tick (below).

**`capsule_end`**

- Topic: `capsuleDone = true`, `capsuleDoneAt = at`.
- Day bucket: `episodesDone++`, `honeyEarned += 1`.
- Streak tick.

**`usage`** (`reduceDay`)

- `kind === "break"`: `breakSec += sec` only.
- Otherwise: `totalSec += sec` and `sinceBreakSec += sec`, plus the kind
  counter:
  - `arcade` with `coplay` → `coplaySec`;
  - `arcade` without coplay → `arcadeSec`;
  - `learning` → `learningSec`, `capsule` → `capsuleSec`,
    `creative` → `creativeSec`;
  - `map` → only `totalSec`.
- If `e.slug` is set (the clock context slug, §10.2), also add `sec` to
  `plays[e.slug].sec` and to `activities[e.slug].seconds` in `reduceProgress`.
  In that case `run_end` does **not** add `durationMs` to `seconds` again;
  `run_end` only adds duration when no `usage` event carried that slug today.
  Simplest correct implementation: `run_end` never touches `seconds`; `usage`
  is the only writer of `seconds`.

**Other day-bucket events**

- `break_done`: `breaksTaken++` or `breaksSkippedByParent++`;
  `sinceBreakSec = 0`.
- `limit_reached`: `limitReached = true`.
- `extension`: `extensions++`; `extensionMinutes += minutes`.
- `bedtime_block`: `bedtimeBlocks++`.
- `session_end`: `sessionsEndedBy[reason]++`.
- `together_done`: `togetherDone = true`.
- `clock_jump`: `clockJumps++`.

**Progress-level events**

- `topic_flag`: merge the given flags into `topics[slug]`.
- `quests_set`: `quests = { day, items }`.
- `cosmetic_buy` (field `cosmeticId`): requires `totalStars(p) - starsSpent >= price`, otherwise
  ignored. Then `owned.push(id)` and `starsSpent += price`.
- `cosmetic_equip` (field `cosmeticId`): `equipped = cosmeticId` when it is owned or `null`.
- `notices_ack`: remove the given ids from `inbox`.

**Streak tick** (on `exercise_set_end` with `mode === "session"` and on
`capsule_end`):

```
today = dayKey(at)
if lastDay === today → nothing
else if lastDay === null or daysBetween(lastDay, today) === 1 → count++
else:
  missed = daysBetween(lastDay, today) - 1
  if missed === 1 and freezeUsedWeek !== weekKey(at) → count++, freezeUsedWeek = weekKey(at)
  else count = max(0, count - missed) + 1
lastDay = today
```

When a streak tick crosses 3, 7, 14 or 30, push a `streak` notice.

Helper exported from `reducers.ts`:

```ts
export function totalStars(p: Progress): number; // Σ activities[*].stars
```

**`mergeProgress(a, b)`:**

- `activities`: per slug, take `max` of `plays`, `best`, `bestLevel`, `stars`
  and `seconds`. `ease` and `consecutiveLow` come from the side with the
  greater `lastAt`.
- `skills`: per skill, the state with greater `attempts` wins; on a tie, the
  greater `lastAt`.
- `topics`: OR the booleans; `max` of the timestamps.
- `days`: per day and per numeric counter, `max`. Booleans are OR'd. Nested
  records are merged recursively with `max`.
- `rewards.stickers`: union, keeping the `min` unlock time.
- `cosmetics.owned`: union. `equipped` and `starsSpent` come from the side
  with the greater `updatedAt`.
- `streak`: the side with the later `lastDay` wins; on a tie, the greater
  `count`.
- `quests`: the side with the later `day` wins; on the same day, OR the `done`
  flags by id.
- `inbox`: union by id. `seenEventIds`: union, keeping the last 300.
- `createdAt` = min; `installDay` = min; `updatedAt` = max.

Tests must prove `merge(a,b) ≡ merge(b,a)` and `merge(a,a) ≡ a` (deep-equal
after sorting arrays).

### 3.6 `src/hooks/useProgress.ts` (C0)

```ts
/** useSyncExternalStore over the store. The selector result is cached; the
 *  component re-renders only when isEqual(prev, next) is false (default
 *  Object.is). Selectors must not allocate unless isEqual handles it. */
export function useProgress<T>(
  selector: (p: Progress) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
export function useTodayUsage(): DayUsage; // stable object until today's bucket changes
export function useActivityStats(slug: string): ActivityStats | undefined;
export function shallowEqual<T extends object>(a: T, b: T): boolean;
```

---

## 4. How a game reports results

Owner: S5 (`src/hooks/useGameScore.ts`). The return shape stays backward
compatible, so the 26 games that are not migrated keep working untouched.

```ts
export function useGameScore(gameSlug: string): {
  player: PlayerId | null;
  playerName: string;
  rivalName: string; // "" unless settings.rivalVisible
  selfHigh: number;
  rivalHigh: number; // 0 unless settings.rivalVisible
  submitFinal(
    score: number,
    opts?: { level?: number },
  ): Promise<ScoreResult | undefined>;
  checkMilestone(currentScore: number): Promise<void>;
  resetMilestones(): void; // = "a new run starts"
  reportLevel(level: number): void;
};
```

- **`resetMilestones()`** emits `run_start` and opens a run token.
- **`submitFinal()`** emits exactly **one** `run_end` per open run. Any second
  call in the same run is ignored, which fixes Tetris's double submit
  centrally. If no run is open, the duration is measured from the last
  `run_start` or from mount.
- **`submitFinal()`** still calls `recordScore()` for the leaderboard.
  - Celebration messages go through `toast()`, not `show()`.
  - Rival or "Serkan'ı geçtin" wording is suppressed unless
    `settings.rivalVisible` is on.
- **`checkMilestone()`** only toasts self-progress lines from `praise()` unless
  `rivalVisible` is on.
- **`reportLevel(level)`** emits `level_complete`.
- **Lint fix (S5):** use `const [player] = useState(() => getPlayerId())` and
  drop the manual `useCallback`s that React Compiler cannot preserve.

**Flagship games** (S4 edits these six files only: `SuperBear`, `FlappyBird`,
`RunnerDash`, `BalloonPop`, `WhackMole`, `MemoryGame`):

```tsx
const scoreGame = useGameScore("super-ayi");
const { registerRestart } = useGameRestart(); // @/lib/gameSession
useEffect(() => registerRestart(restartRun), [registerRestart, restartRun]);
// each run start:      scoreGame.resetMilestones();
// level complete:      scoreGame.reportLevel(level);
// game over:           void scoreGame.submitFinal(score, { level });
// difficulty:          const ease = useActivityStats("super-ayi")?.ease ?? 0.7;
```

A game that called `registerRestart` gets the shell's `RewardSheet` (§10.4).
The shell then hides the game's own `.game-over` block with the class
`gf-sheet-open` on `.activity-page`. Games that never register keep their own
game-over UI.

---

## 5. Worlds and activity info — `src/lib/worlds.ts` (C0 → S3)

```ts
import type { SkillId } from "@/lib/skills";

export type WorldId =
  "macera" | "harf" | "sayi" | "sekil" | "merak" | "blok" | "baba";
export type ActivityKind = "arcade" | "learning" | "creative";

export type World = {
  id: WorldId;
  name: string; // shown + spoken
  say: string; // one short spoken line on tap
  emoji: string;
  accent: string; // CSS colour
  order: number;
  gated?: "coplay"; // baba: needs ArithmeticGate + settings.babaIleEnabled
};

export type ActivityInfo = {
  world: WorldId;
  kind: ActivityKind; // arcade drains the honey jar
  skill: SkillId | null; // primary skill (parent panel, quests)
  hidden?: true; // not on the child map (route still works; listed in /bilgi)
  exercise?: true; // rendered by ExerciseSession → StartCard is skipped
  flagship?: true; // migrated game: registers restart, gets RewardSheet
  isNew?: true; // Phase 1 new slug
};

export const WORLDS: readonly World[];
export const ACTIVITY_INFO: Readonly<Record<string, ActivityInfo>>;
export function getWorld(id: WorldId): World;
export function getActivityInfo(slug: string): ActivityInfo | undefined;
/** Slugs of a world in ACTIVITY_INFO table order (§5 table). */
export function activitiesInWorld(
  id: WorldId,
  opts?: { includeHidden?: boolean },
): string[];
```

`WORLDS` data:

| id     | name         | say                | emoji | accent    | order                |
| ------ | ------------ | ------------------ | ----- | --------- | -------------------- |
| macera | Macera Adası | "Macera Adası"     | 🏝️    | `#ff6b9d` | 1                    |
| harf   | Harf Ormanı  | "Harf Ormanı"      | 📖    | `#4ecdc4` | 2                    |
| sayi   | Sayı Dağı    | "Sayı Dağı"        | 🔢    | `#ffd93d` | 3                    |
| sekil  | Şekil Köyü   | "Şekil Köyü"       | 🔷    | `#a78bfa` | 4                    |
| merak  | Merak Gölü   | "Merak Gölü"       | 🔬    | `#6bcb77` | 5                    |
| blok   | Blok Dünyası | "Blok Dünyası"     | 🧱    | `#f59e0b` | 6                    |
| baba   | Baba ile     | "Babanla birlikte" | 👨‍👦    | `#f97316` | 7, `gated: "coplay"` |

`ACTIVITY_INFO` data. This table is normative; S8's integrity test checks that
the keys equal the `MENU` slugs. Legend: K = arcade, L = learning,
C = creative; H = hidden; E = exercise; F = flagship; N = new.

| slug                | world  | kind | skill         | flags                  |
| ------------------- | ------ | ---- | ------------- | ---------------------- |
| super-ayi           | macera | K    | ef.refleks    | F                      |
| flappy-bird         | macera | K    | ef.refleks    | F                      |
| kosu-macera         | macera | K    | ef.refleks    | F                      |
| baloncuk-patlat     | macera | K    | ef.dikkat     |                        |
| balon-patlat        | macera | K    | mat.toplama   | F                      |
| kostebek-vur        | macera | K    | ef.dikkat     | F                      |
| hafiza-kartlari     | macera | K    | ef.hafiza     | F                      |
| ziplama-adasi       | macera | K    | ef.refleks    |                        |
| yagmur-damlasi      | macera | K    | ef.refleks    |                        |
| top-yakala          | macera | K    | ef.refleks    |                        |
| serit-yarisi        | macera | K    | ef.refleks    |                        |
| tetris              | macera | K    | ef.planlama   |                        |
| labirent            | macera | K    | ef.planlama   |                        |
| kaydir-puzzle       | macera | K    | ef.planlama   |                        |
| yilan-oyunu         | macera | K    | ef.planlama   |                        |
| royal-match         | macera | K    | ef.planlama   |                        |
| tugla-kir           | macera | K    | ef.refleks    |                        |
| pong                | macera | K    | ef.refleks    |                        |
| harf-tanima         | harf   | L    | tr.ses-harf   | E                      |
| ses-avi             | harf   | L    | tr.ses-ayirt  | E N                    |
| harf-yazma          | harf   | L    | tr.harf-yaz   | E                      |
| kelime-okuma        | harf   | L    | tr.kelime     | E                      |
| hece-birlestir      | harf   | L    | tr.hece       |                        |
| sesli-harf          | harf   | L    | tr.ses-ayirt  |                        |
| benzer-kelime       | harf   | L    | tr.sozcuk     |                        |
| bosluk-doldur       | harf   | L    | tr.dinle      |                        |
| cumle-kur           | harf   | L    | tr.cumle      | H                      |
| alfabe-sirasi       | harf   | L    | null          | H                      |
| kelime-avcisi       | harf   | L    | tr.kelime     | H                      |
| sayma-oyunu         | sayi   | L    | mat.sayma     | E                      |
| toplama-oyunu       | sayi   | L    | mat.toplama   | E                      |
| cikarma-oyunu       | sayi   | L    | mat.cikarma   | E                      |
| sayi-sirasi         | sayi   | L    | mat.sira      | E                      |
| karsilastir         | sayi   | L    | mat.sira      |                        |
| onluk-birlik        | sayi   | L    | mat.sayma     |                        |
| saat-ogren          | sayi   | L    | mat.zaman     |                        |
| para-say            | sayi   | L    | mat.para      |                        |
| cift-tek            | sayi   | L    | null          | H                      |
| hizli-matematik     | sayi   | L    | mat.toplama   | H                      |
| hedef-vur           | sayi   | L    | mat.toplama   | H                      |
| desen-tamamla       | sekil  | L    | mat.oruntu    | E                      |
| sira-bul            | sekil  | L    | mat.oruntu    | E                      |
| sekil-tani          | sekil  | L    | mat.sekil     |                        |
| sekil-say           | sekil  | L    | mat.sekil     |                        |
| sekil-ciz           | sekil  | L    | tr.harf-yaz   |                        |
| simetri             | sekil  | L    | mat.simetri   |                        |
| tangram             | sekil  | L    | mat.sekil     | H                      |
| renk-atolyesi       | sekil  | C    | fen.gozlem    |                        |
| renk-yaris          | sekil  | L    | tr.sozcuk     |                        |
| hazine-haritasi     | sekil  | L    | mat.uzamsal   |                        |
| boyut-sirala        | sekil  | L    | mat.olcme     |                        |
| mantik-eslestir     | sekil  | L    | tr.sozcuk     |                        |
| grupla              | sekil  | L    | fen.siniflama |                        |
| fark-bul            | sekil  | L    | ef.dikkat     |                        |
| dur-git             | sekil  | L    | ef.ketleme    | N, H until S3 ships it |
| guvenli-yol         | merak  | L    | hb.guvenli    | E N                    |
| dinozor-kazi        | merak  | L    | fen.gozlem    |                        |
| besin-gruplari      | merak  | L    | hb.saglik     |                        |
| hava-durumu         | merak  | L    | hb.doga       |                        |
| mevsimler           | merak  | L    | hb.doga       |                        |
| bitki-buyume        | merak  | L    | hb.doga       |                        |
| vucudumuz           | merak  | L    | hb.saglik     |                        |
| su-dongu            | merak  | L    | hb.doga       |                        |
| gezegenler          | merak  | L    | hb.doga       |                        |
| hayvanlar           | merak  | L    | hb.doga       |                        |
| blok-dunyasi        | blok   | C    | mat.simetri   | N                      |
| dovus-arenasi       | baba   | K    | ef.refleks    |                        |
| tank-savasi         | baba   | K    | ef.refleks    |                        |
| uzayli-istilasi     | baba   | K    | ef.refleks    |                        |
| uzay-savunma        | baba   | K    | ef.refleks    |                        |
| asteroids           | baba   | K    | ef.refleks    |                        |
| pinball-space-cadet | baba   | K    | ef.refleks    |                        |
| meyve-bicagi        | baba   | K    | ef.refleks    |                        |

Total: 73 (69 existing + `ses-avi`, `guvenli-yol`, `blok-dunyasi`, `dur-git`).

**New slugs in shared files:** C0 adds the four new slugs to `menu.ts` (new
items in the existing categories: `ses-avi` → okuma; `guvenli-yol` → bilim;
`dur-git` → mantik; `blok-dunyasi` → oyun). C0 also adds them to `guides.ts`,
`activityLearning.ts` (with `relatedTopicSlug`s `bes-duyum`, `bes-duyum`,
`sekiller-oruntuler-ve-simetri` and `sekiller-oruntuler-ve-simetri`) and to
`registry.tsx`, pointing at stub components (§11).

---

## 6. Skills and mastery

### 6.1 `src/lib/skills.ts` (C0 → S2)

```ts
export const SKILL_IDS = [
  "tr.ses-ayirt",
  "tr.ses-harf",
  "tr.harf-yaz",
  "tr.hece",
  "tr.kelime",
  "tr.cumle",
  "tr.dinle",
  "tr.sozcuk",
  "mat.sayma",
  "mat.rakam",
  "mat.sira",
  "mat.ritmik",
  "mat.toplama",
  "mat.cikarma",
  "mat.eksik",
  "mat.oruntu",
  "mat.sekil",
  "mat.cisim",
  "mat.simetri",
  "mat.uzamsal",
  "mat.olcme",
  "mat.zaman",
  "mat.para",
  "mat.veri",
  "hb.saglik",
  "hb.guvenli",
  "hb.duygular",
  "hb.doga",
  "fen.tahmin",
  "fen.gozlem",
  "fen.siniflama",
  "ef.hafiza",
  "ef.isitsel",
  "ef.dikkat",
  "ef.ketleme",
  "ef.planlama",
  "ef.refleks",
] as const;
export type SkillId = (typeof SKILL_IDS)[number];
export type SkillLevel = 1 | 2 | 3 | 4 | 5;
export type Strand = "tr" | "mat" | "hb" | "fen" | "ef";

export type SkillDef = {
  id: SkillId;
  strand: Strand;
  label: string; // child, ≤ 3 words, spoken
  labelParent: string; // parent panel
  mebArea: string; // e.g. "Türkçe 1 · İlk okuma yazma"; always filled
  mebCode?: string; // ONLY after verification against the official programme (MASTER_PLAN K21)
  prereq: { skill: SkillId; level: SkillLevel }[];
  levels: readonly [string, string, string, string, string]; // parent-facing level descriptions
  phase1: boolean; // true when a Phase-1 generator or game feeds it
  tip?: string; // one-line "Bu akşam birlikte" tip for parents
};

export const SKILLS: Readonly<Record<SkillId, SkillDef>>;
export const SOUND_GROUPS: readonly (readonly string[])[];
// [["e","l","a","k","i","n"],["o","m","u","t","ü","y"],["ö","r","ı","d","s","b"],["z","ç","g","ş","c","p"],["h","v","ğ","f","j"]]
export function lettersUpToGroup(group: 1 | 2 | 3 | 4 | 5): string[];
export function skillsByStrand(strand: Strand): SkillDef[];
```

Prerequisite edges are listed in MASTER_PLAN §3.1. The graph must be acyclic;
S8's integrity test checks this.

### 6.2 `src/lib/mastery.ts` (C0 rules → S2 selectors)

C0 implements these rules, which are part of the contract:

```ts
export const LEITNER_DAYS = [0, 1, 3, 7, 14] as const;
export function emptySkill(at: number): SkillState; // level 1, box 0, nextDueAt = at + 1 day
export function applyExercise(
  s: SkillState | undefined,
  item: {
    level: SkillLevel;
    firstTry: boolean;
    correct: boolean;
    review: boolean;
    at: number;
  },
): { next: SkillState; leveledUp: boolean; leveledDown: boolean };
```

Rules for `applyExercise`:

- Always: `attempts++` and `lastAt = at`.
- If `correct`, `correct++`. If `firstTry && correct`, `firstTryCorrect++`.
- If `item.level !== s.level`, only the counters and `lastAt` change. Warm-up,
  review and adjacent items do not move the level.
- Otherwise:
  - **First-try correct:** `streak++`, `misses = 0`. If `streak >= 3` and
    `level < 5`: `level++`, `streak = 0`, `leveledUp = true`,
    `nextDueAt = at + 1 day`. If this left L3, set `masteredAt ??= at`.
  - **Correct on retry:** `streak = 0`, `misses = 0`.
  - **Wrong final** (`correct === false`): `streak = 0`, `misses++`. If
    `misses >= 2` and `level > 1`: `level--`, `misses = 0`,
    `leveledDown = true`.
- If `review`: correct sets `box = min(4, box + 1)`, wrong sets `box = 0`.
  Then `nextDueAt = at + LEITNER_DAYS[box] * 86_400_000`.

S2 adds these selectors (pure; signatures are contract):

```ts
export function dueSkills(p: Progress, now: number): SkillId[]; // phase1 skills with nextDueAt <= now, oldest first
export function weakestSkills(p: Progress, n: number): SkillId[]; // phase1 skills, lowest first-try ratio with ≥ 3 attempts, else lowest level
export function planSession(
  p: Progress,
  skill: SkillId,
  now: number,
): {
  focusLevel: SkillLevel;
  warmUp: boolean;
  reviewSkill: SkillId | null;
  adjacentSkill: SkillId | null;
};
export function pickForGate(
  p: Progress,
  now: number,
): { skill: SkillId; level: SkillLevel }[]; // exactly 3 items: 2 from weakest + 1 confidence item
export type SkillSummary = {
  learning: { skill: SkillId; level: SkillLevel; ratio: number }[];
  masteredThisWeek: SkillId[];
  struggling: SkillId[]; // 2+ level-downs in the last 7 days, or ratio < 0.5 with ≥ 6 attempts
};
export function summary(p: Progress, now: number): SkillSummary;
```

---

## 7. Settings — `src/lib/settings.ts` (C0 → S6)

```ts
export type Settings = {
  weekdayMinutes: number; // 30  total daily cap Mon–Fri
  weekendMinutes: number; // 45
  arcadeMinutes: number; // 16  base jar (8 cells)
  arcadeMaxMinutes: number; // 26  jar ceiling (13 cells)
  breakEveryMinutes: 15 | 20 | 25 | 30; // 25
  breakSeconds: number; // 40  (allowed 30–45; MASTER_PLAN K13)
  bedtime: string; // "20:30"
  wakeFrom: string; // "07:00"
  eveningModeMinutes: number; // 30
  episodesPerDay: number; // 2
  voiceOn: boolean; // true
  soundOn: boolean; // true
  hapticsOn: boolean; // true
  babaIleEnabled: boolean; // false until the father confirms
  rivalVisible: boolean; // false
  companionName: string; // "Bal"
  graceUntil: DayKey | ""; // set on first launch to dayKey(now + 2 days)
  holidayMode: boolean; // false → weekend cap every day
  firstLaunchDone: boolean; // NameTheBear completed
  firstBreakDone: boolean; // first break is always "zipla", co-played
  updatedAt: number;
};
export const DEFAULT_SETTINGS: Settings;
export const COMPANION_NAMES: readonly ["Bal", "Pati", "Fıstık", "Kaptan"];
export function getSettings(): Settings; // SSR → DEFAULT_SETTINGS
export function updateSettings(patch: Partial<Settings>): Settings; // writes, sets updatedAt, fires dogukan:settings
export function subscribeSettings(cb: () => void): () => void;
export function useSettings<T>(selector: (s: Settings) => T): T; // useSyncExternalStore, cached like useProgress
export function ensureFirstLaunch(now?: number): Settings; // sets graceUntil if "" (idempotent)
export function dailyCapMinutes(s: Settings, now?: number): number; // weekend/holiday aware
```

---

## 8. Speech, sound, haptics

### 8.1 `src/lib/speech.ts` (C0 → S2)

```ts
export type SpeakOptions = {
  rate?: number; // default 0.9
  pitch?: number; // default 1.05
  interrupt?: boolean; // default true (cancel current first)
  clip?: string; // voice clip id; plays public/voice/<id>.m4a if listed in manifest
  onEnd?: () => void; // called on end, error, cancel or when speech is unavailable (async)
};
export function speak(text: string, opts?: SpeakOptions): void;
export function cancelSpeech(): void;
export function unlockAudio(): void; // call inside a user gesture; primes TTS, fires dogukan:audio-unlock
export function isSpeechSupported(): boolean;
export function hasTurkishVoice(): boolean;
export function getVoiceName(): string | null; // for the /bilgi health card
export function isSpeaking(): boolean;
export function subscribeSpeaking(cb: () => void): () => void;
/** Replaces {ad} with the player display name and {ayı} with settings.companionName. */
export function fillTemplate(text: string): string;
```

**Behaviour:**

- **Voice ranking:** Yelda → Google Türkçe → Microsoft Emel → any `tr*`
  voice, with `lang = "tr-TR"`. The list refreshes on `voiceschanged`.
- **Gating:** `speak` returns silently when `settings.voiceOn === false`, but
  `onEnd` is still called.
- **Clips:**
  - The manifest at `public/voice/manifest.json` is a `string[]` of ids,
    fetched lazily with `assetPath`.
  - Phase 1 ships `[]`.
  - If the manifest is missing, or an id is not in it, fall back to TTS.
- **`fillTemplate` is applied automatically** to every `speak` text.
- **Phoneme rule:** callers never pass a bare consonant. S8's integrity test
  checks that no generator `say` matches `/^\s*[bcçdfgğhjklmnprsştvyz]\s*[.?!]?\s*$/i`.

`src/components/SpeechProvider.tsx` (C0 → S2):

```tsx
/** Mounted once in the root layout (S8). Cancels speech on pathname change
 *  and when the document becomes hidden; re-primes after it becomes visible. */
export function SpeechProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode;
```

`src/components/SayButton.tsx` (C0 → S2):

```tsx
export function SayButton(props: {
  text: string; // spoken via speak(); fillTemplate applied
  clip?: string;
  size?: 56 | 72 | 96; // px, default 56
  label?: string; // aria-label, default "Tekrar dinle"
  className?: string;
}): React.ReactNode; // renders <button class="say-btn"> 🔊 </button>
```

### 8.2 `src/lib/sounds.ts` (S4; C0 adds shims)

The existing keys are unchanged. C0 adds these keys (no-op or alias bodies)
so other packages compile. S4 implements them:

```ts
sounds.unlock(): void;               // resume/create AudioContext; also bound to dogukan:audio-unlock
sounds.setMasterGain(v: number): void; // 0–1; evening mode uses 0.5
sounds.honey(): void;
sounds.sticker(): void;
sounds.countdown(): void;
sounds.softWrong(): void;            // replaces sawtooth `wrong` on learning surfaces
```

All sounds respect `settings.soundOn`.

### 8.3 `src/lib/haptics.ts` (C0 → S4)

```ts
export type HapticKind = "tick" | "hit" | "fail" | "win" | "sticker";
// tick 10 ms · hit 25 ms · fail [30,30,60] · win [20,40,20] · sticker [20,40,20]
export function haptic(kind: HapticKind): void; // no-op if !settings.hapticsOn, prefers-reduced-motion, or no navigator.vibrate
```

Haptics are edge-triggered only; never call them per frame.

---

## 9. Auth, session, parent mode — `src/lib/auth.ts` (C0 → S1)

```ts
export type PlayerId = "dogukan" | "serkan";
export const PLAYERS: Readonly<Record<PlayerId, { displayName: string }>>; // passwords REMOVED (S1)
export function getPlayerId(): PlayerId | null; // unchanged
export function getPlayerDisplayName(id?: PlayerId | null): string; // unchanged
export function getRivalId(id: PlayerId): PlayerId; // unchanged
export function isLoggedIn(): boolean; // unchanged
export function loginAs(player: PlayerId): void; // persistent (local + session); calls reloadProgressForPlayer()
export function logout(): void; // unchanged + reloadProgressForPlayer()
/** @deprecated use loginAs */ export function setLoggedIn(
  playerId: PlayerId,
  remember: boolean,
): void;

export type Session = { ready: boolean; player: PlayerId | null };
export function useSession(): Session; // useSyncExternalStore; server/hydration snapshot { ready:false, player:null }

// Added by S1:
export function isParentPinConfigured(): boolean; // NEXT_PUBLIC_PARENT_PIN_HASH present
export function verifyParentPin(pin: string): Promise<boolean>; // SHA-256(pin + ":" + NEXT_PUBLIC_PIN_SALT) via crypto.subtle; fixed-length compare; updates dogukan-pin-lock
export function getPinLockRemainingMs(): number; // 3 fails → 30 s
export function enterParentMode(minutes?: number): void; // default 15; sessionStorage dogukan-parent-until
export function exitParentMode(): void;
export function isParentMode(): boolean;
export function useParentMode(): boolean;
```

**Changes C0 makes in `auth.ts`:**

- Add `useSession`, `loginAs` and the cached snapshot.
- Keep `checkCredentials` until S1 deletes it together with `LoginScreen`.

Parent mode is **not** a player switch. The child stays logged in; `/bilgi`
reads `readProgressSnapshot("dogukan")`. Logging in as `serkan` happens only
via "Baba olarak oyna" in `/bilgi` (S6), for the leaderboard.

---

## 10. Cross-package APIs

### 10.1 Exercise engine (S2; types in C0)

`src/activities/engine/types.ts` (C0 → S2):

```ts
import type { SkillId, SkillLevel } from "@/lib/skills";
import type { EncyclopediaTopic } from "@/lib/encyclopedia";
import type { Rng } from "@/lib/rng";

export type Visual =
  | { type: "picture"; emoji: string; alt: string }
  | {
      type: "count";
      emoji: string;
      n: number;
      layout: "rows5" | "tenframe" | "scatter";
    }
  | { type: "tenframe"; a: number; b?: number; op?: "+" | "-" }
  | { type: "numberline"; from: number; to: number; start: number; hops?: number }
  | { type: "letter"; char: string; case: "lower" | "upper"; highlight?: boolean }
  | { type: "pattern"; items: string[]; blankIndex: number }
  | { type: "scene"; emoji: string; caption?: string }
  | { type: "lab"; mode: EncyclopediaTopic["lab"]; preset: number }
  | { type: "clock"; hour: number; half: boolean } // Phase 2 renderer
  | { type: "coins"; values: number[] } // Phase 2 renderer
  | { type: "grid"; size: 4 | 6; left: boolean[][] }; // Phase 2 renderer

export type Choice = { id: string; emoji?: string; text?: string; say: string };

export type ExerciseKind = "choice" | "tapcount" | "order" | "trace"; // Phase 1 renderers; "sort" | "grid" Phase 2

export type Exercise = {
  id: string;
  skill: SkillId;
  level: SkillLevel;
  kind: ExerciseKind;
  prompt: { say: string; text?: string; visual?: Visual; hintSay?: string }; // say mandatory; hintSay = slower re-say
  choices?: Choice[]; // choice/order
  answerIds: string[]; // choice: [correctId]; order: ids in correct order; tapcount: [String(n)]; trace: [char]
  trace?: { char: string }; // trace only; path data in engine/letterPaths.ts
  feedback: { correct?: string; retry: string; reveal: string }; // voiced; correct falls back to praise()
  bigTap?: boolean; // L1: 2 giant buttons
};

export type Generator = {
  skill: SkillId;
  maxLevel: SkillLevel; // Phase 1: 3
  generate(rng: Rng, level: SkillLevel): Exercise;
};
```

`src/activities/content/index.ts` (C0 stub → S3):

```ts
export const GENERATORS: Partial<Record<SkillId, Generator>>;
export function getGenerator(skill: SkillId): Generator | undefined;
```

`src/activities/engine/ExerciseSession.tsx` (C0 stub → S2):

```tsx
export type ExerciseSessionResult = {
  correct: number;
  total: number;
  firstTry: number;
};
export function ExerciseSession(props: {
  slug: string;
  skill: SkillId;
  mode?: "session" | "gate"; // session = 6 items + end sheet; gate = 3 items from pickForGate, no end sheet
  onDone?: (r: ExerciseSessionResult) => void;
  onExit?: () => void; // gate: child chose Harita
}): React.ReactNode;
```

- **Events:** emits `exercise_item` per answered item and one
  `exercise_set_end` at the end.
- **Generator levels:** clamps the requested level to the generator's
  `maxLevel`.
- **Missing generator:** renders a friendly "🚧" card and never throws.
- **End of a session:** shows the "Bir tane daha ⭐" / "Haritaya dön 🗺️"
  buttons and fires `notifyNaturalPause("set_end")`.

**`src/lib/rng.ts` (C0 → S2):**

```ts
export type Rng = () => number; // [0,1)
export function createRng(seed: number): Rng; // mulberry32
export function seedFrom(s: string): number; // string hash
export function randInt(rng: Rng, min: number, max: number): number; // inclusive
export function pick<T>(rng: Rng, arr: readonly T[]): T;
export function shuffled<T>(rng: Rng, arr: readonly T[]): T[];
```

### 10.2 Wellbeing (S6)

`src/lib/wellbeing.ts` (C0 implements `honeyCells` for real; the rest are
stubs → S6):

```ts
export type Phase =
  "grace" | "play" | "warn5" | "warn1" | "limit" | "evening" | "night";
/** Priority: night > limit > warn1 > warn5 > evening > grace > play.
 *  grace = today <= settings.graceUntil (jar never gates). */
export function computePhase(now: Date, s: Settings, d: DayUsage): Phase;
/** budgetSec = min(arcadeMaxMinutes*60, arcadeMinutes*60 + honeyEarned*120)
 *  left = ceil(max(0, budgetSec - arcadeSec) / 120); capacity = ceil(arcadeMaxMinutes*60 / 120) */
export function honeyCells(
  s: Settings,
  d: DayUsage,
): { left: number; capacity: number };
export function canStartArcade(
  now: Date,
  s: Settings,
  d: DayUsage,
  coplay: boolean,
): boolean;
export function canStartEpisode(s: Settings, d: DayUsage): boolean; // episodesDone < episodesPerDay
export function breakDue(s: Settings, d: DayUsage): boolean; // sinceBreakSec >= breakEveryMinutes*60
```

`src/lib/sessionClock.ts` (C0 stub → S6):

```ts
export function setClockContext(ctx: {
  slug: string | null;
  kind: ClockKind;
  running: boolean;
}): void;
export function notifyNaturalPause(
  reason: "run_end" | "set_end" | "card_end" | "episode_end",
): void;
export function requestCoplay(): void; // opens CoPlayPrompt overlay (🔔 buttons)
export function isCoplayActive(): boolean;
```

**Who sets the clock context:**

| Surface              | Package | Context                                                |
| -------------------- | ------- | ------------------------------------------------------ |
| Map and island pages | S1      | `{slug:null, kind:"map", running:true}`                |
| `ActivityShell`      | S4      | `{slug, kind: info.kind, running: started && !paused}` |
| `CapsuleFeed`        | S7      | `{slug:null, kind:"capsule", running:true}`            |
| `MolaScreen`         | S6      | `{kind:"break"}`                                       |

**Clock behaviour (S6):**

- Ticks every 5 s while the document is visible and the last pointer or key
  event was less than 60 s ago, emitting `usage`.
- S6 also listens via `onEvent` to `run_end`, `exercise_set_end` and
  `capsule_end`; together with `notifyNaturalPause` these count as natural
  pauses.

`src/hooks/useWellbeing.ts` (C0 stub → S6):

```ts
export type OverlayKind = "mola" | "limit" | "night" | "grace-hint" | "coplay";
export type WellbeingState = {
  phase: Phase;
  honey: { left: number; capacity: number };
  jarEmpty: boolean; // honey.left === 0 && phase !== "grace"
  blocking: boolean; // an overlay is mounted → games must pause
  overlay: OverlayKind | null;
  coplay: boolean;
  evening: boolean; // phase === "evening"
};
export function useWellbeing(): WellbeingState; // stub: { phase:"play", honey:{left:8,capacity:13}, jarEmpty:false, blocking:false, overlay:null, coplay:false, evening:false }
```

`src/components/wellbeing/AppOverlays.tsx` (C0 stub → S6). It is mounted once
in `layout.tsx` (S8) and renders the Mola, Limit, Night, GraceHint and CoPlay
overlays plus the countdown voice. The stub returns `null`.

`src/components/wellbeing/HoneyJar.tsx` (C0 stub → S6):
`HoneyJar({ size?: "sm" | "md" })`.

`src/lib/praise.ts` (C0 stub → S6):

```ts
export type PraiseContext =
  | "correct_first"
  | "correct_retry"
  | "wrong_try_again"
  | "wrong_reveal"
  | "set_done_high"
  | "set_done_low"
  | "run_end"
  | "new_star"
  | "persisted"
  | "chose_hard"
  | "break_done"
  | "day_done";
export function praise(ctx: PraiseContext, opts?: { name?: string }): string; // ≤ 7 words, no repeat within last 3
```

The C0 stub returns one fixed line per context, taken from the table in
`proposals/parent-wellbeing.md` F8.

`src/content/voice.ts` (C0 seeds with MASTER_PLAN §2.14 → S6):
`export const VOICE: Readonly<Record<VoiceKey, string>>`, where `VoiceKey` is a
string union of the §2.14 moments (`"welcome" | "nameAsk" | "nameDone" |
"continueRecord" | "start" | "exitAsk" | "jarEmpty" | "graceHint" | "warn5" |
"warn1" | "limit" | "evening" | "eveningTile" | "night" | "chapterEnd" |
"error"`). Templates use `{ad}`, `{ayı}` and `{skor}`.

### 10.3 Game frame (S4; C0 adds shims in `gameSession.tsx` and `CelebrationProvider.tsx`)

```ts
// @/lib/gameSession
export function GameSessionProvider(props: {
  active: boolean;
  children: React.ReactNode;
}): React.ReactNode; // unchanged prop
export function useGameActive(): boolean; // S4: active && !paused
export function useGameBoot(onBoot: () => void): void; // unchanged
export function useGamePaused(): boolean; // C0 stub: false
export function useGameRestart(): { registerRestart(fn: () => void): () => void }; // C0 stub: returns () => {}
export function useHasRestart(): boolean; // shell-side: true once a game registered (C0 stub: false)

// @/components/CelebrationProvider
export function useCelebration(): {
  show(message: string): void;
  toast(message: string): void;
}; // C0: toast = show alias
```

**S4 hooks** (new files, signatures are contract):

```ts
// @/hooks/useGameLoop
export function useGameLoop(
  running: boolean,
  step: (dt: number, nowMs: number) => void,
  opts?: { maxDtMs?: number },
): void;
// dt normalised to 60 Hz units (frameMs / 16.667), frame clamped to maxDtMs (50); paused when !running or document.hidden
// @/hooks/useCanvasFit — existing signature kept; options gain { dpr?: 1 | "auto" }. DEFAULT IS 1 (unchanged behaviour for the
// 26 unmigrated games); migrated games opt in with { dpr: "auto" } = backing store css * min(devicePixelRatio, 2) + setTransform.
// @/hooks/useCanvasPointer
export function useCanvasPointer(
  canvas: React.RefObject<HTMLCanvasElement | null>,
  logicalW: number,
  logicalH: number,
): (e: { clientX: number; clientY: number }) => { x: number; y: number };
```

**`ActivityShell`** (S4) keeps the props `{ slug, title, children, learning }`.
Phase 1 behaviour:

1. **StartCard instead of IntroModal.** It is skipped when
   `info.exercise === true`. Its tap calls `unlockAudio()` and
   `sounds.unlock()`.
2. **Arcade start gating:**
   - Arcade in the evening → a sleeping StartCard variant.
   - Arcade with `useWellbeing().jarEmpty` → StartCard shows `<HoneyGate>`
     (S5).
3. **Collapsed topbar, pause and exit:** `GameFrame` collapses the topbar to
   ⏸ and adds the pause overlay and a two-tap exit confirm.
   `ActivityKnowledgePanel` and the 💡/ℹ️ buttons are no longer rendered.
4. **Game activity:**
   `GameSessionProvider active = started && !wellbeing.blocking && !sheetOpen && !paused`.
5. **RewardSheet:** when `useHasRestart()` is true and
   `useLastRunResult(slug).result` is non-null, render `<RewardSheet>` (S5)
   and add `gf-sheet-open` to `.activity-page`.
6. **Clock context:** calls `setClockContext` (§10.2).

### 10.4 Progression UI (S5)

```tsx
// @/components/progress/useRunResult
export type RunResult = {
  slug: string;
  score: number;
  durationMs: number;
  starsBefore: Stars;
  starsAfter: Stars;
  isNewStar: boolean;
};
export function useLastRunResult(slug: string): {
  result: RunResult | null;
  dismiss(): void;
}; // C0 stub: { result: null, dismiss(){} }

// @/components/progress/RewardSheet
export function RewardSheet(props: {
  slug: string;
  result: RunResult;
  onRestart: () => void;
  onMap: () => void;
}): React.ReactNode;
// Two equal buttons; when useWellbeing().jarEmpty: "🍯 Bal topla (3 soru)" (≤ 2× per session) / "🗺️ Harita";
// after 3 consecutive runs of the same slug, once per session: "Başka bir adaya bakalım mı?"

// @/components/progress/HoneyGate
export function HoneyGate(props: {
  onFilled: () => void;
  onMap: () => void;
}): React.ReactNode;
// <ExerciseSession mode="gate" .../> → +1 cell via exercise_set_end(mode:"gate") → onFilled()

// @/components/progress/StickerAlbum
export function StickerAlbum(props: { onClose: () => void }): React.ReactNode;

// @/components/progress/NoticeToaster — mounted by S1 on the map and by S4 in ActivityShell;
// consumes progress.inbox (toast + sound + haptic, auto-reveal after 1 s), then trackEvent({type:"notices_ack"})
export function NoticeToaster(): React.ReactNode;

// @/components/progress/ChapterEnd — shown by S1 on the map when the quests_all_done notice arrives
export function ChapterEnd(props: {
  onContinue: () => void;
  onDone: () => void;
}): React.ReactNode;

// @/lib/quests
export type QuestView = {
  id: string;
  emoji: string;
  say: string;
  href: string;
  done: boolean;
};
export function ensureTodayQuests(now?: number): void; // emits quests_set once per day (S1 calls on map mount)
export function useQuests(): { items: QuestView[]; allDone: boolean }; // C0 stub: { items: [], allDone: false }

// @/lib/stickers, @/lib/cosmetics
export type StickerDef = {
  id: StickerId;
  emoji: string;
  name: string;
  say: string;
  page: string;
  trigger: string;
};
export const STICKERS: readonly StickerDef[]; // ~30
export type CosmeticDef = {
  id: CosmeticId;
  emoji: string;
  name: string;
  say: string;
  price: number;
};
export const COSMETICS: readonly CosmeticDef[]; // 5

// @/lib/progress/starRules
export function starsForRun(
  slug: string,
  run: { score: number; level?: number },
): Stars; // C0 stub: score thresholds [1, 50, 200]
```

**Quest href conventions:**

- activity: `/aktivite/<slug>/`
- capsule: `episodeHref(topic)`

S5 awards stickers inside `reducers.ts`, pushing `sticker` notices. S5 also
marks quests done in the reducer: a matching `run_end`, `exercise_set_end`
or `capsule_end` sets `done` and pushes `quest_done` / `quests_all_done`.

### 10.5 Capsules (S7)

`src/lib/capsules.ts` (C0 stub → S7):

```ts
import type { EncyclopediaTopic } from "@/lib/encyclopedia";
export type CapsuleChoice = {
  id: string;
  emoji: string;
  label: string;
  say: string;
};
export type CapsuleCardKind =
  "hook" | "fact" | "wonder" | "lab" | "word" | "quiz" | "mission";
export type CapsuleCard = {
  id: string;
  kind: CapsuleCardKind;
  say: string; // ≤ 8 words
  text?: string; // large caption, defaults to say
  visual:
    | { type: "emoji"; scene: string }
    | { type: "lab"; mode: EncyclopediaTopic["lab"]; preset: number };
  tap: {
    type: "predict" | "choose" | "listen" | "done"; // predict = no wrong answer; done = mission "Bitti!"
    prompt?: string;
    choices?: CapsuleChoice[];
    answerId?: string; // choose only
    explain?: string; // ≤ 8 words, spoken after a pick ("Birlikte bakalım" on wrong)
  };
};
export type CapsuleEpisode = {
  topic: string; // TOPICS slug
  title: string;
  emoji: string;
  previewEmoji: string; // "Yarın yeni bölüm" preview
  cards: CapsuleCard[]; // exactly 12; cards[11].kind === "mission" && tap.type === "done"
  parentNote: string; // shown in /bilgi "Bu akşam birlikte"
};
export const EPISODES: readonly CapsuleEpisode[]; // C0 stub: []
export function getEpisode(topic: string): CapsuleEpisode | undefined;
export function episodeHref(topic: string): string; // `/kesfet/${topic}/kapsul/`
```

- **Route:** `src/app/kesfet/[slug]/kapsul/page.tsx`, created by S7 only once
  `EPISODES` is non-empty. It uses `generateStaticParams` over `EPISODES` and
  `dynamicParams = false`.
- **Pause and completion:** the feed calls `notifyNaturalPause("card_end")`
  after every card. Finishing card 12 emits `capsule_end`.
- **Episode cap:** if `!canStartEpisode`, the route shows "Yarın yeni bölüm"
  with `previewEmoji` instead of the feed.
- **InteractiveLab split:** `InteractiveLab.tsx` exports `*Stage` components
  with a `preset` prop, e.g. `LightStage({ preset })`.
  `export function LabStage({ mode, preset })` dispatches to them.

### 10.6 Blok Dünyası (S9)

```ts
// @/activities/games/blocks/BlockWorld   (C0 stub component → S9)
export function BlockWorld(): React.ReactNode;
// @/activities/games/blocks/storage       (C0 stub → S9)
export type BlockSave = {
  index: number;
  name: string;
  cells: string;
  /* base64 Uint8Array 12*18 */ thumb: string;
  /* data URL ≤ 20 KB */ savedAt: number;
  sharedAt?: number;
};
export function listSaves(player: PlayerId): BlockSave[];
export function listSharedBuilds(player: PlayerId): BlockSave[]; // for /bilgi gallery (S6); C0 stub: []
// @/activities/games/blocks/engine  (pure)
export const GRID_W = 12,
  GRID_H = 18;
export type BlockKind = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // 0 empty; 1 çim 2 toprak 3 taş 4 tahta 5 cam 6 su 7 çiçek 8 bal
export type Grid = Uint8Array; // length GRID_W*GRID_H, row-major, y=0 top
export function validateSay(grid: Grid, n: number, kind?: BlockKind): boolean; // exact count (+ 4-connected when kind given)
export function validateAyna(grid: Grid): boolean; // grid[x] === grid[W-1-x] on every row
export function surfaceY(grid: Grid, x: number): number; // top filled cell for the walking bear
```

**Events:**

- Saving emits `blocks_saved` with `shared: false`.
- "Babaya göster" emits `blocks_saved` with `shared: true` and, if Firebase is
  configured, writes to `users/{player}/gallery/{index}`.

The registry entry is `"blok-dunyasi": () => <BlockWorld />`, using
`next/dynamic` with `ssr: false` like the other games.

### 10.7 Parent gate and shell pieces (S1)

```tsx
// @/components/auth/ParentGate   (C0 stub → S1; stub renders null)
export function ArithmeticGate(props: {
  onPass: () => void;
  onCancel: () => void;
  title?: string;
}): React.ReactNode; // random a+b, a,b ∈ 11..49, 64 px keypad
export function PinGate(props: {
  onPass: () => void;
  onCancel: () => void;
}): React.ReactNode;
export function ParentGate(props: {
  onPass: () => void;
  onCancel: () => void;
}): React.ReactNode; // Arithmetic → Pin (Pin skipped if !isParentPinConfigured()); onPass calls enterParentMode()
// @/components/home/BearAvatar   (C0 stub → S1; stub renders 🐻)
export type BearPose = "idle" | "wave" | "yawn" | "sleep" | "jump" | "stretch";
export function BearAvatar(props: {
  pose?: BearPose;
  size?: number;
  cosmetic?: CosmeticId | null;
}): React.ReactNode;
```

### 10.8 Parent panel data (S6)

`/bilgi` (S6) consumes:

- `readProgressSnapshot("dogukan")`, `getSettings()` / `updateSettings()`;
- `summary()` (S2) and `SKILLS` (S2);
- `ACTIVITY_INFO` (S3), `MENU` (S3) and `getActivityLearning()`-equivalent
  data;
- `listSharedBuilds` (S9), `EPISODES` (S7), `readErrors()` (S8);
- `getVoiceName()` / `hasTurkishVoice()` (S2) and `InstallCard` (S8).

`activityLearning.ts` is `server-only`. The S6 page is a client page, so
`/bilgi` gets the knowledge data as follows. S3 adds
`src/lib/activityTalk.ts` exporting a **client-safe**
`TALK_QUESTIONS: Record<string, string>`, generated by hand from
`ACTIVITY_KNOWLEDGE`; S8's integrity test checks the keys.

### 10.9 Production pieces (S8)

```tsx
// @/components/game/GameErrorBoundary
export class GameErrorBoundary extends React.Component<{
  slug: string;
  children: React.ReactNode;
}> {}
// @/lib/errors
export type ErrorEntry = {
  at: number;
  slug: string | null;
  message: string;
  ua: string;
  buildId: string;
};
export function recordError(slug: string | null, error: unknown): void; // ring of 20 + Firebase errors/{player} if configured
export function readErrors(): ErrorEntry[];
// @/components/pwa/InstallCard   (parent-facing only)
export function InstallCard(): React.ReactNode;
// @/components/pwa/PwaRegister  (mounted in layout; production only; updateViaCache: "none")
export function PwaRegister(): React.ReactNode;
```

**`ActivityClient`** (S8) renders:

```tsx
<ActivityShell key={slug} {...}>
  <GameErrorBoundary slug={slug}>
    <Activity />
  </GameErrorBoundary>
</ActivityShell>
```

This replaces the old `{Activity()}` call. It also emits
`trackEvent({ type: "activity_open", slug })` next to the existing
`logDogukanVisit`.

**Root layout** (S8) mounts the following inside `<body>`, in this order:

1. `<SpeechProvider>`
2. `{children}`
3. `<AppOverlays />`
4. `<PwaRegister />`

---

## 11. Stubs created by C0 (handed over to owners)

Each stub exports exactly the signature above, has a body of at most about 15
lines, and starts with this comment:

```ts
// STUB (C0) — owner: Sx. Replace body, keep signature (docs/plan/CONTRACT.md).
```

| Stub file                                                                                                | Owner | Stub behaviour                                                                                   |
| -------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------ |
| `src/activities/engine/ExerciseSession.tsx`                                                              | S2    | renders a `🚧` card with an exit link                                                            |
| `src/activities/content/index.ts`                                                                        | S3    | `GENERATORS = {}`                                                                                |
| `src/activities/games/DurGit.tsx`                                                                        | S3    | `🚧` card                                                                                        |
| `src/activities/games/blocks/BlockWorld.tsx`                                                             | S9    | `🚧` card                                                                                        |
| `src/activities/games/blocks/storage.ts`                                                                 | S9    | empty lists                                                                                      |
| `src/lib/wellbeing.ts`                                                                                   | S6    | real `honeyCells` + `canStartEpisode`; `computePhase` → grace/play only; `breakDue` real formula |
| `src/lib/sessionClock.ts`                                                                                | S6    | no-ops; `isCoplayActive` → false                                                                 |
| `src/lib/praise.ts`                                                                                      | S6    | fixed line per context                                                                           |
| `src/hooks/useWellbeing.ts`                                                                              | S6    | constant default state (§10.2)                                                                   |
| `src/components/wellbeing/AppOverlays.tsx`                                                               | S6    | `null`                                                                                           |
| `src/components/wellbeing/HoneyJar.tsx`                                                                  | S6    | 🍯 + number                                                                                      |
| `src/content/voice.ts`                                                                                   | S6    | seeded table (real content)                                                                      |
| `src/lib/capsules.ts`                                                                                    | S7    | `EPISODES = []`                                                                                  |
| `src/components/progress/{useRunResult,RewardSheet,HoneyGate,StickerAlbum,NoticeToaster,ChapterEnd}.tsx` | S5    | null / no-op                                                                                     |
| `src/lib/{quests,stickers,cosmetics}.ts`                                                                 | S5    | empty catalogues; `ensureTodayQuests` no-op                                                      |
| `src/lib/progress/starRules.ts`                                                                          | S5    | thresholds `[1, 50, 200]`                                                                        |
| `src/components/auth/ParentGate.tsx`                                                                     | S1    | `null`                                                                                           |
| `src/components/home/BearAvatar.tsx`                                                                     | S1    | `🐻` span                                                                                        |
| `src/lib/errors.ts`                                                                                      | S8    | console-only `recordError`, `readErrors` → `[]`                                                  |

C0 also adds **shims to existing files**: additive only, ≤ 10 lines each. The
file's owner takes over afterwards.

| File                                                                            | Shim                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/auth.ts`                                                               | `useSession`, `loginAs` (§9)                                                                                                                                                                                                                                                      |
| `src/lib/gameSession.tsx`                                                       | `useGamePaused`, `useGameRestart`, `useHasRestart` (stubs)                                                                                                                                                                                                                        |
| `src/components/CelebrationProvider.tsx`                                        | `toast` alias of `show`                                                                                                                                                                                                                                                           |
| `src/lib/sounds.ts`                                                             | `unlock`, `setMasterGain`, `honey`, `sticker`, `countdown`, `softWrong`                                                                                                                                                                                                           |
| `src/lib/guides.ts`                                                             | `Guide.short?: string` (≤ 10-word StartCard line) + 4 new entries                                                                                                                                                                                                                 |
| `src/lib/menu.ts`, `src/lib/activityLearning.ts`, `src/activities/registry.tsx` | 4 new slugs (§5)                                                                                                                                                                                                                                                                  |
| `src/app/globals.css`                                                           | `@import "../styles/tokens.css";` as first line                                                                                                                                                                                                                                   |
| `package.json`                                                                  | devDeps `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom` (+ `@types/node` ^22, required by vitest 5; Vite 8 resolves tsconfig paths natively, so no `vite-tsconfig-paths`); scripts `test` (= `vitest run`), `test:watch`, `typecheck` |

---

## 12. File ownership map (after C0)

A path ending in `/**` means everything under it, including new files. A file
not listed here belongs to **S8** (integrator), and nobody else edits it
without asking.

### C0 — Core (one agent, first, alone)

**Creates:**

- `src/lib/storage.ts`
- `src/lib/progress/{types,time,store,events,reducers,dayReducer}.ts`
- `src/hooks/useProgress.ts`
- `src/lib/{settings,skills,worlds,speech,haptics,rng,mastery}.ts`
- `src/activities/engine/types.ts`
- `src/components/{SayButton,SpeechProvider}.tsx`
- `src/styles/tokens.css`
- `vitest.config.mts`, `vitest.setup.ts`
- tests: `src/lib/progress/__tests__/{reducers,merge,time}.test.ts`,
  `src/lib/__tests__/{mastery,skills,worlds,settings}.test.ts`
- all §11 stubs and shims

**Post-C0 owners of core files:**

| Owner | Files                                                                                                      |
| ----- | ---------------------------------------------------------------------------------------------------------- |
| S5    | `storage.ts`, `progress/{types,time,store,events,reducers}.ts`, `useProgress.ts`                           |
| S6    | `progress/dayReducer.ts`, `settings.ts`                                                                    |
| S2    | `skills.ts`, `mastery.ts`, `rng.ts`, `speech.ts`, `engine/types.ts`, `SayButton.tsx`, `SpeechProvider.tsx` |
| S3    | `worlds.ts`                                                                                                |
| S4    | `haptics.ts`                                                                                               |
| S8    | `tokens.css`, `vitest.*`                                                                                   |

`types.ts`, `store.ts` and `events.ts` are **frozen**. Only additive changes
are allowed, and those require updating this file.

### S1 — Shell and login

- `src/lib/auth.ts`
- `src/app/page.tsx`, `src/app/ada/[world]/page.tsx`
- `src/components/HomeClient.tsx`
- `src/components/LoginScreen.tsx` (delete), `src/components/MenuScreen.tsx`
  (delete), `src/components/BubbleBg.tsx` (make it return `null`; S8 deletes it
  after integration)
- `src/components/auth/**`, `src/components/home/**`
- `src/content/shell.ts`
- `public/avatar/**`

### S2 — Exercise engine and speech

- `src/activities/engine/**` (including `types.ts`, `letterPaths.ts`, renderers
  and visuals)
- `src/lib/{mastery,skills,rng,speech}.ts`
- `src/components/{SayButton,SpeechProvider}.tsx`
- `public/voice/manifest.json`

### S3 — Content and catalogue owner

- `src/activities/registry.tsx`
- `src/lib/{menu,guides,activityLearning,activityLearning.types,activityTalk,worlds}.ts`
- `src/activities/data/**`, `src/activities/content/**`, `src/activities/shared/**`
- `src/activities/games/{DurGit,LetterTrace}.tsx`

### S4 — Game infra and feel

- `src/components/{ActivityShell,CelebrationProvider,GameTouchBar,ScoreHud,IntroModal,ActivityKnowledgePanel}.tsx`
- `src/components/game/**` except `GameErrorBoundary.tsx` and
  `GameSkeleton.tsx` (S8)
- `src/lib/{gameSession.tsx,sounds,acelyaSounds,acelyaAsteroidsMusic,gameJuice,particles,gameKeys,haptics}.ts`
- `src/hooks/{useCanvasFit,useGameRunning,useGameLoop,useCanvasPointer}.ts`
- `src/activities/games/**` except `blocks/**` (S9), `DurGit.tsx` and
  `LetterTrace.tsx` (S3)

### S5 — Progression

- `src/lib/progress/{types,time,store,events,reducers,starRules}.ts`
- `src/lib/storage.ts`
- `src/hooks/{useProgress,useGameScore}.ts`
- `src/lib/{leaderboard,quests,stickers,cosmetics}.ts`
- `src/components/progress/**`
- `src/content/progress.ts`

### S6 — Wellbeing and parent panel

- `src/lib/{settings,wellbeing,sessionClock,praise,activityLog}.ts`
- `src/lib/progress/dayReducer.ts`
- `src/hooks/useWellbeing.ts`
- `src/content/{voice,breaks}.ts`
- `src/components/wellbeing/**`, `src/components/parent/**`
- `src/components/ParentInfoScreen.tsx` (delete), `src/app/bilgi/**`
- `docs/plan/VOICE_SCRIPT.md`

### S7 — Capsules and encyclopedia

- `src/lib/{capsules,encyclopedia,encyclopediaProgress}.ts`
- `src/app/kesfet/**` except `src/app/kesfet/layout.tsx` (S8)
- `src/components/encyclopedia/**`, `src/components/kesfet/**`

### S8 — Production and integration

- `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`,
  `eslint.config.mjs`, `postcss.config.mjs`
- `.github/**`
- `src/app/{layout.tsx,globals.css,manifest.ts,error.tsx,global-error.tsx,not-found.tsx,apple-icon.png,icon.svg,favicon.ico}`
- `src/app/offline/**`, `src/app/aktivite/[slug]/**`, `src/app/kesfet/layout.tsx`
- `src/styles/**`
- `src/components/game/{GameErrorBoundary,GameSkeleton}.tsx`
- `src/components/pwa/**`
- `src/lib/{firebase,errors,asset,utils}.ts`
- `src/hooks/useDisplayMode.ts`
- `public/{sw.js,icons/**,.nojekyll}`; delete `public/{file,globe,next,vercel,window}.svg`,
  `src/app/apple-icon.svg` and `dogukan.png`
- `scripts/**`, `vitest.config.mts`, `vitest.setup.ts`, `src/__tests__/**`
- `playwright.config.ts`, `e2e/**`
- `database.rules.json`, `firebase.json`, `.firebaserc.example`, `.env.example`,
  `.nvmrc`
- `docs/ROLLOUT.md`, `docs/RELEASE.md`, `README.md`, `AGENTS.md`

### S9 — Blok Dünyası

- `src/activities/games/blocks/**`

### Shared-files policy

| Shared file                                                                | Single owner | How others get changes in                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `globals.css` / `src/styles/**`                                            | S8           | Each package creates its own stylesheet next to its components (e.g. `src/components/home/home.css`) and imports it from its own component file. Global CSS imports from components are allowed in the App Router. Use your package's class prefix (§14). |
| `layout.tsx`                                                               | S8           | Mounts only the components named in §10.9. Packages expose components; S8 mounts them.                                                                                                                                                                    |
| `menu.ts`, `registry.tsx`, `guides.ts`, `activityLearning.ts`, `worlds.ts` | S3           | Entries for all Phase-1 slugs already exist after C0. A registry entry pointing at another package's component is changed only by S3, at that package's request.                                                                                          |
| `ActivityShell.tsx`                                                        | S4           | Composes S5's `RewardSheet` / `HoneyGate` / `NoticeToaster`, S6's `useWellbeing` and `setClockContext`, and S8's boundary (wrapping from `ActivityClient`) strictly through the §10 APIs.                                                                 |
| `package.json`                                                             | S8           | Packages request a dependency by note; none are expected beyond C0's test deps.                                                                                                                                                                           |

### Integration order

1. S8 merges `ActivityClient` (`<Activity/>` + boundary) and the
   `check` script (the gate everyone runs).
   S1 merges `auth.ts`.
2. S4, S5 and S2.
3. S3, S6, S7 and S9.
4. S8: CSS split finalisation, `BubbleBg` deletion, service-worker precache
   against the final `out/`, full gate.

S8 runs the full gate (`npm run check`) after every merge and owns the merge
queue. There is no CI; publishing is a deliberate manual `npm run deploy`
(MASTER_PLAN §4.8).

---

## 13. Work packages — goals and acceptance

**Common acceptance for every package:**

- `npm run lint` passes with 0 errors and 0 warnings in owned files.
- `npx tsc --noEmit`, `npm test` and `npm run build` pass.
- All 73 `/aktivite/<slug>/` pages still build.
- No new external `href` on the child surface.
- The package's flow works at 390×844 in Chrome device mode.

### C0 — Core

**Goal:** every interface in §1–§11 exists, typed, with real implementations
for the store, events, reducers, time, settings, skills, worlds, speech,
haptics, rng and mastery rules, plus stubs everywhere else.

**Acceptance:**

1. Reducer tests cover every event semantics bullet in §3.5. Merge is
   commutative and idempotent (property-style tests over ≥ 50 random event
   sequences).
2. `applyExercise` is tested against every rule in §6.2.
3. `SKILLS` covers all 37 ids, and its prerequisite graph is acyclic (tested).
4. `ACTIVITY_INFO` keys equal the `MENU` slugs (73), and every skill is in
   `SKILL_IDS` (tested).
5. `useProgress` re-renders only on selected changes (RTL test).
6. `trackEvent` before login is a no-op.
7. The build passes, and the four new slugs render their stub cards.

### S1 — Shell and login

**Goal:** avatar login, parent gates, NameTheBear, the world map, island
screens, CompanionBar, the Continue and Quest tiles, a server-rendered
skeleton, and removal of `LoginScreen` / `MenuScreen`.

**Acceptance:**

1. `/` renders the "Kim oynuyor?" markup without JS.
2. A child tap logs in persistently. The session survives a reload. The tap
   calls `unlockAudio`.
3. NameTheBear runs only when `!settings.firstLaunchDone`. It writes
   `companionName` and calls `ensureFirstLaunch`.
4. The map shows 6 islands; Baba ile appears only when `babaIleEnabled`, behind
   `ArithmeticGate` → `requestCoplay`.
5. Every tile is ≥ 96 px and a tap speaks its label. There is no search, tab or
   logout on the child surface.
6. `/ada/<world>/` lists `activitiesInWorld(world)` (≤ 12 visible; overflow
   paginates by swipe, never scrolls to more than 2 screens). The Merak Gölü
   island also lists `EPISODES` tiles.
7. The Continue tile uses the most recent `activities[*].lastAt` and defaults
   to `super-ayi` with "Rekorun hâlâ burada: {skor}".
8. PIN tests cover correct, wrong ×3 → lockout, and no hash → arithmetic only.
9. The `bilgi` `set-state-in-effect` error is gone, because S6 uses
   `useSession`.
10. No rAF loop runs on `/`.

### S2 — Exercise engine and speech

**Goal:** `ExerciseSession`, the `ChoiceCard` / `TapCount` / `OrderStrip` /
`TraceCanvas` renderers, the visuals (`CountVisual`, `TenFrame`,
`NumberLine`, `LetterCard`, `PatternStrip`, `SceneVisual`, `LabStage`
passthrough), letter paths for sound groups 1–2 (12 lowercase + uppercase)
and digits 0–9, the mastery selectors, and speech hardening.

**Acceptance:**

1. A 6-item set follows the composition rules of MASTER_PLAN §2.8. The retry →
   reveal → requeue flow is RTL-tested with a fake generator.
2. The prompt auto-speaks on mount; the 🔊 button is ≥ 56 px; choices are
   ≥ 96 px.
3. Gate mode runs 3 items from `pickForGate`.
4. `planSession`, `pickForGate`, `dueSkills` and `summary` are unit-tested.
5. `speak` respects `voiceOn`, prefers clips, applies `fillTemplate`, and is
   cancelled by `SpeechProvider` on route change.
6. Wrong answers play `sounds.softWrong`, never the sawtooth sound.

### S3 — Content and catalogue

**Goal:** the 8 generators (`sesAyirt`, `sesHarf`, `kelime`, `sayma`,
`toplama`, `cikarma`, `oruntu`, `guvenli`) plus `harfYaz` (trace) and
`siralama` (order) at L1–L3; a word bank (≥ 6 picture-words per sound,
groups 1–2); E-flagged slugs switched to `ExerciseSession`; `guides.short`
for every slug; content-register cleanup; `activityTalk.ts`; and Dur-Git as a
stretch goal.

**Acceptance:**

1. Each generator passes 1,000 seeded draws per level: answer ∈ choices, no
   duplicate choices, non-empty `say`, no bare-consonant `say`, and numeric
   ranges per level (sums ≤ 5 / ≤ 10 / ≤ 20).
2. `Ğ` is never asked as a first sound.
3. The lise-register items listed in MASTER_PLAN §6 are removed, and every
   remaining pool keeps ≥ 4 items.
4. `window.location.reload()` is removed from `CountGame`, `OrderGame`,
   `SymmetryGame` and `TangramLite`.
5. The invariants still throw on any mismatch.
6. If `dur-git` ships, its `hidden` flag is removed; otherwise it stays hidden.

### S4 — Game infra and feel

**Goal:**

- `useGameLoop`, DPR `useCanvasFit`, `useCanvasPointer` and the pause model.
- `sounds.unlock` with master gain, AudioBuffer playback for the m4a files, and
  haptics.
- A thumb-zone `GameTouchBar` (≥ 72 px, icons).
- `GameFrame` / `StartCard` / pause / exit confirm, and toast mode in
  `CelebrationProvider`.
- The `ActivityShell` Phase-1 behaviour (§10.3).
- `ease` in `superBearLevelGen` and Flappy.
- Migration of the 6 flagship games.
- All 14 lint errors fixed structurally, plus the warnings in owned files.

**Acceptance:**

1. The 6 flagship games run at the same speed at 60 Hz and 120 Hz (fake-rAF
   test on `useGameLoop`) and render crisply at DPR 2.
2. Games pause on `visibilitychange` and while `useWellbeing().blocking`.
3. There is no accidental exit: exiting takes two taps.
4. Mid-run milestones toast and never block.
5. RewardSheet appears for the 6 flagship games, and their `.game-over` block
   is hidden.
6. The WhackMole background `setInterval` bug is fixed.
7. SuperBear draws its spawned particles, and screen shake is visible.
8. `npm run lint` across the whole repo reports 0 errors.

### S5 — Progression

**Goal:**

- Reducer extensions: stickers (~30, deterministic triggers), quests (3 per
  day, completion), cosmetics (5, bought with stars).
- `starRules` (game-designer §2.1 table + set stars).
- `useGameScore` hooks with the single `run_end` guarantee and rival
  suppression.
- `RewardSheet`, `HoneyGate`, `StickerAlbum`, `NoticeToaster` and
  `ChapterEnd`.
- The `useGameScore` lint fixes.

**Acceptance:**

1. Reducer and merge tests are extended for stickers, quests and cosmetics.
2. Stars appear on the map after a run.
3. RewardSheet shows two equal buttons. The jar-empty variant offers Bal topla
   at most 2× per session, and the "Başka bir ada?" option appears once after
   3 consecutive runs.
4. Rival text never shows when `rivalVisible === false` (tested).
5. A sticker reveal auto-plays after 1 s, with no drag reveal.
6. Tetris submits once.

### S6 — Wellbeing and parent

**Goal:**

- `settings` UI; `sessionClock` ticking, natural pauses and coplay;
  `wellbeing` (full `computePhase`); `praise` (copy table + rules); `breaks`
  (8 cards).
- `AppOverlays`: `MolaScreen`, `LimitScreen`, `NightScreen`, `GraceHint`,
  `CoPlayPrompt`, `CountdownBadge` and evening filter tokens.
- `HoneyJar`.
- `/bilgi` v2: the 8 cards of MASTER_PLAN §2.13 plus "Tüm etkinlikler" and
  "Baba olarak oyna".
- `activityLog` day summaries to Firebase (lazy) and the outbox.
- `VOICE_SCRIPT.md` (~150 lines grouped by priority).

**Acceptance:**

1. The phase matrix test passes, covering: weekday fresh → play;
   25/30 → warn5; 29/30 → warn1; 30/30 → limit; 20:05 → evening;
   20:31 and 06:30 → night; grace day with an empty jar → grace.
2. `honeyCells`: 16 min → 8 cells; after 3 sets → 13 cells (capped).
3. Clock tests with fake timers: hidden stops ticks; idle > 60 s stops ticks;
   midnight splits buckets; a clock jump is logged only.
4. Limits and breaks wait for a natural pause or 120 s and never cut a run.
5. The first break is `zipla`. The break ring is 30–45 s, set by the parent.
6. `praise` tests: 200 draws per context, no repeat within 3, ≤ 7 words, no
   banned words. `childCopy.test.ts` over `src/content/**` and the generator
   and capsule strings.
7. `/bilgi` requires `ParentGate`. Every `Settings` field is editable there.
   Its health card shows the TTS voice, Firebase status, phone clock and
   crashes.

### S7 — Capsules

**Goal:**

- `capsules.ts` with `isik-ve-golge` and `kalbim-ve-nefesim` (12 cards each,
  child register; game-designer §2.1 is the template). `miknatislar` and
  `tohumdan-bitkiye` are stretch goals.
- `CapsuleFeed` / `CapsuleCard` (scroll-snap, dot rail, voice on gesture, tap
  after `onend`, "Birlikte bakalım", mission card with 🔔 → `requestCoplay`).
- The `/kesfet/[slug]/kapsul/` route and the daily cap screen.
- The InteractiveLab `*Stage` split.
- `/kesfet` sources as plain text unless `useParentMode()`.
- `encyclopediaProgress` as an adapter over `progress.topics`.

**Acceptance:**

1. Capsule tests: exactly 12 cards, the last is the mission, every card has a
   `tap`, `say` ≤ 8 words, and every `choose` has exactly one `answerId` that
   exists.
2. There is no 13th card and no "next episode" button.
3. A third episode on the same day shows "Yarın yeni bölüm".
4. Episode completion adds +1 honey cell, through `capsule_end`.
5. `verify-out` finds no `href="http` in `out/kesfet/**`.

### S8 — Production and integration

**Goal:**

- `manifest.ts` (basePath-prefixed body), PNG icons, `apple-icon.png`,
  `sw.js` (strategy table), `scripts/sw-manifest.mjs`, `offline/`,
  `PwaRegister`, `UpdateToast` and `InstallCard`.
- `error.tsx` ×2, `global-error.tsx`, `not-found.tsx`, `GameErrorBoundary` +
  `<Activity/>`, and `dynamicParams = false` on the activity route.
- Lazy Firebase + anonymous auth + `database.rules.json`.
- The CSS split (`src/styles/*`, `kesfet/layout.tsx` with
  `encyclopedia.css`), `prefers-reduced-motion` and `(hover:hover)` gating,
  and no `backdrop-filter` over canvases.
- Fonts trimmed (drop Baloo 500 and Nunito 600) and assets cleaned up.
- The integrity suite: `MENU ↔ ACTIVITY_MAP ↔ ACTIVITY_KNOWLEDGE ↔ GUIDES ↔ ACTIVITY_INFO ↔ TALK_QUESTIONS`,
  `manifest()` for both base paths, `sw.js` parses, and the bare-consonant
  rule.
- `verify-out.mjs` (budgets + zero external links outside `out/bilgi/`) and a
  non-blocking Playwright smoke test (`npm run e2e`).
- **No CI (GitHub Actions minutes are exhausted; MASTER_PLAN §4.8, K30).**
  Instead:
  - `scripts/check.mjs` → `npm run check`: lint `--max-warnings 0` →
    `tsc --noEmit` → `vitest run` → `build:pages` → `verify-out`, stopping at
    the first failure and naming the step.
  - `scripts/deploy-pages.mjs` → `npm run deploy [--dry-run] [--allow-branch]`:
    refuses a dirty tree or a non-`main` branch; runs `check`; build secrets come
    from `.env.local` (missing ones are warnings, not errors); replaces
    `__BUILD_ID__` in `out/sw.js` with the short SHA; ensures `out/.nojekyll`;
    commits `out/` as an orphan commit `deploy: <full SHA>` to `gh-pages` via a
    temporary `git worktree`; `git push --force origin gh-pages`; then, if `gh`
    is available, prints `gh api repos/serkanok1983/dogukan/pages/builds/latest`
    status. The temporary worktree is always removed (try/finally).
  - `.github/workflows/deploy-pages.yml`: trigger reduced to
    `workflow_dispatch` only (no run on push).
  - `docs/RELEASE.md`: the manual release checklist (run `npm run deploy`, open
    the live URL, check manifest + SW + update toast on a phone).
- `.env.example`, `.nvmrc`, `docs/ROLLOUT.md`, and the cross-cutting child
  rules (§0.7) added to `AGENTS.md`.

**Acceptance:**

1. `out/manifest.webmanifest` is basePath-correct, and an `apple-touch-icon`
   is present.
2. A crash inside a game shows the "Oyun biraz yoruldu" card and the topbar
   survives (RTL test with a throwing child).
3. `npm run check` is green locally; `npm run deploy --dry-run` lists the files
   it would publish without pushing; `npm run deploy` refuses when `check`
   fails.
4. Budgets: `/` JS ≤ 250 KB, CSS ≤ 35 KB.
5. Firebase is absent from the `/` chunk graph when unconfigured.

### S9 — Blok Dünyası

**Goal:** the pure `engine.ts` (grid ops, `validateSay`, `validateAyna`,
`surfaceY`, encode/decode), a DPR renderer with a cached tile atlas
(OffscreenCanvas or a fallback canvas), the 8-block palette (56 px), tap and
drag painting, erase, undo, 5 save slots with thumbnails, the bear walking
on the surface, and "Babaya göster".

**Acceptance:**

1. Engine tests: encode/decode round-trip, `validateSay` with connectivity,
   `validateAyna`, `surfaceY`.
2. Saves persist across reloads; there are at most 5 slots and each thumbnail
   is ≤ 20 KB.
3. There are no Web Share and no external links.
4. A shared build appears in `/bilgi` via `listSharedBuilds`.
5. Creative seconds never drain the jar, because the kind is `creative`.
6. The page stays responsive at 390×844 (no rAF while idle; redraw only on
   change or while the bear walks).

---

## 14. CSS conventions

**Tokens** (`src/styles/tokens.css`, C0 → S8):

```css
:root {
  --kid-tap: 56px;
  --kid-tile: 96px;
  --kid-touch: 72px;
  --kid-font: 18px;
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-x: max(env(safe-area-inset-left, 0px), env(safe-area-inset-right, 0px));
  --world-macera: #ff6b9d;
  --world-harf: #4ecdc4;
  --world-sayi: #ffd93d;
  --world-sekil: #a78bfa;
  --world-merak: #6bcb77;
  --world-blok: #f59e0b;
  --world-baba: #f97316;
  --honey: #f6b93b;
  --ink: #173f5f;
  --soft-ink: #4a6b82;
  --z-sheet: 300;
  --z-wellbeing: 400;
  --z-gate: 450;
  --z-intro: 500;
  --z-toast: 600;
  --evening-filter: sepia(0.3) brightness(0.9);
  --ease-pop: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

`--ink` and `--soft-ink` already exist in `globals.css`. The token file
defines them only if they are missing; the values match the current ones.

**Class prefixes per package:**

| Package | Prefixes         |
| ------- | ---------------- |
| S1      | `home-`, `auth-` |
| S2      | `ex-`, `say-btn` |
| S4      | `gf-`            |
| S5      | `pr-`            |
| S6      | `wb-`, `parent-` |
| S7      | `cap-`           |
| S8      | `pwa-`, `err-`   |
| S9      | `blk-`           |

**Preserved game class contract:** never rename these, because 26 games that
are not migrated depend on them:

- `.game-panel`, `.canvas-game`, `.fullscreen-game`, `.acelya-game`,
  `.game-canvas`
- `.game-touch-bar[.layout-*]`, `.score-hud*`, `.game-over`, `.btn-primary`
- `.activity-page`, `.activity-main`

**Other rules:**

- Every infinite animation sits inside `@media (prefers-reduced-motion: no-preference)`.
- Hover transforms sit inside `@media (hover: hover)`.
- No `backdrop-filter` on elements over a canvas.
- Evening mode applies `.is-evening { filter: var(--evening-filter) }` to the
  map container only, never to game canvases.

---

## 15. Routes

| Route                         | Owner                        | Notes                                                                                 |
| ----------------------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| `/`                           | S1                           | Server skeleton + `HomeClient` (login or map)                                         |
| `/ada/[world]/`               | S1                           | `generateStaticParams` over `WORLDS`; `dynamicParams = false`; baba gated client-side |
| `/aktivite/[slug]/`           | S8 (page/client), S4 (shell) | 73 slugs; `dynamicParams = false`                                                     |
| `/kesfet/`, `/kesfet/[slug]/` | S7                           | Parent reference; not linked from the child surface                                   |
| `/kesfet/[slug]/kapsul/`      | S7                           | Only topics in `EPISODES`                                                             |
| `/bilgi/`                     | S6                           | `ParentGate` → dashboard                                                              |
| `/offline/`                   | S8                           | Precached                                                                             |
| `/manifest.webmanifest`       | S8                           | `app/manifest.ts`                                                                     |

**Internal links:**

- Use `next/link` with **trailing slashes** (`trailingSlash: true`).
- For `public/` assets use `assetPath()`.
- Never hard-code `/dogukan`.

---

## 16. Firebase paths (optional, silent-fail)

| Path                               | Writer | Notes                                                                              |
| ---------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| `leaderboard/{slug}/{player}`      | S5     | unchanged                                                                          |
| `activity/dogukan/{logins,visits}` | S6     | unchanged in Phase 1; read-only next release                                       |
| `users/{player}/days/{YYYY-MM-DD}` | S6     | `DayUsage` without `plays` detail, written at most once per 60 s and on `pagehide` |
| `users/{player}/gallery/{index}`   | S9     | `{ name, thumb, sharedAt }`                                                        |
| `errors/{player}/{pushId}`         | S8     | `ErrorEntry`                                                                       |

All of these are covered by one `database.rules.json` (S8), with `.validate`
shape rules and an anonymous auth requirement. The console steps are in
`docs/ROLLOUT.md`.
