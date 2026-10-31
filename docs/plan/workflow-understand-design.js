export const meta = {
  name: 'dogukan-understand-design',
  description: 'Map the codebase in parallel, then run a 4-lens product design panel judged and synthesized into a master plan',
  phases: [
    { title: 'Understand', detail: '5 parallel readers map subsystems' },
    { title: 'Design', detail: '4 independent proposals from different lenses' },
    { title: 'Judge', detail: '3 judges score and graft ideas' },
    { title: 'Synthesize', detail: 'master plan with work packages' },
  ],
}

const SCRATCH = 'docs/plan'
const REPO = '/home/user/dogukan'

const CONTEXT = `
PROJECT CONTEXT (read carefully):
Repo: ${REPO} — "Doğukan'ın Yeri", a Next.js 16.2.6 (App Router, Turbopack, React Compiler enabled via eslint react-hooks rules), React 19, Tailwind 4, TypeScript strict app. Static export (output: "export") deployed to GitHub Pages under basePath "/dogukan" (see next.config.ts, .github/workflows/deploy-pages.yml). Firebase Realtime Database is optional (leaderboard + activity log), silently disabled without env.
Routes: "/" (login + menu), "/aktivite/[slug]" (69 activities: 32 canvas games in src/activities/games, data-driven quizzes in src/activities/shared + src/activities/data/quizData.ts, registry in src/activities/registry.tsx, menu in src/lib/menu.ts), "/kesfet" + "/kesfet/[slug]" (Merak Ansiklopedisi: 7 categories, 14 topics in src/lib/encyclopedia.ts), "/bilgi" (parent panel, only for player "serkan").
Two hardcoded players: dogukan (the child) and serkan (the father). Build passes, tsc clean, lint has 14 React-Compiler errors + 44 warnings.
node_modules is installed. AGENTS.md says: this Next.js version has breaking changes; read node_modules/next/dist/docs/ guides before writing Next-specific code.

THE USER'S GOAL (father, Turkish): The app is for his 6-year-old son Doğukan, who is addicted to mobile games and short videos. The current site failed to hook him because it can't compete with games like "Super Bear Adventure" and "Minecraft". He wants: a mobile-first app the child opens on a phone voluntarily and enjoys; that entertains while teaching and nurturing; protects from harmful content; builds skills, curiosity, intelligence, interest in basic sciences; helps with school (Turkish child, age 6 = anaokulu / 1. sınıf, emerging reader — many labels must be voiced, not just read). Technically he wants production quality. He explicitly allows reorganizing, adding, and changing existing content.
`

const MAP_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string', description: 'absolute path of the markdown map you wrote' },
    headline: { type: 'string' },
    keyFindings: { type: 'array', items: { type: 'string' } },
    problems: { type: 'array', items: { type: 'string' } },
    opportunities: { type: 'array', items: { type: 'string' } },
  },
  required: ['file', 'headline', 'keyFindings', 'problems', 'opportunities'],
}

const READERS = [
  {
    key: 'shell-ui-mobile',
    prompt: `Map the app shell, navigation and visual system with a MOBILE-FIRST eye. Read fully: src/app/layout.tsx, src/app/page.tsx, src/components/HomeClient.tsx, LoginScreen.tsx, MenuScreen.tsx, ActivityShell.tsx, IntroModal.tsx, BubbleBg.tsx, CelebrationProvider.tsx, ActivityKnowledgePanel.tsx, src/app/aktivite/[slug]/*, src/app/globals.css (all 4867 lines — skim structure, read the responsive @media blocks and touch/HUD/game-panel sections closely), src/lib/asset.ts, src/lib/utils.ts, public/ contents. Document: component tree, CSS architecture (tokens, classes, breakpoints), how the menu presents 69 activities to a 6-year-old (reading load, tap targets, scroll depth), login flow friction for a child, safe-area/viewport-fit handling, orientation handling, animation performance risks, accessibility, and what is reusable vs should be replaced for a kid-first world-map style home.`,
  },
  {
    key: 'game-infra',
    prompt: `Map the game infrastructure and the pattern a canvas game follows. Read fully: src/hooks/useGameScore.ts, useCanvasFit.ts, useGameRunning.ts, src/lib/gameSession.tsx, src/components/GameTouchBar.tsx, ScoreHud.tsx, src/lib/gameKeys.ts, sounds.ts, acelyaSounds.ts, gameJuice.ts, particles.ts, leaderboard.ts, firebase.ts, activityLog.ts. Then read 3 representative games fully: src/activities/games/SuperBear.tsx (+ superBearConstants.ts, superBearLevelGen.ts), FlappyBird.tsx, RoyalMatch.tsx; skim WhackMole.tsx and Tetris.tsx for how game over / score submit / touch input are wired. Document: lifecycle (boot, loop, pause, game over), how scores are recorded and celebrated, touch input scheme and its mobile ergonomics (button sizes, thumb reach, landscape), audio unlock on iOS/Android (AudioContext created lazily? resumed on gesture?), the exact hook points where a progression/XP/quest system could receive events (game start, score, game over, level complete), and a checklist for making a game feel "AAA mobile" (juice, haptics, difficulty curve, short sessions). Also list the lint errors (run: cd ${REPO} && npm run lint 2>&1 | grep -E "error" -B2) and categorize them by fix strategy.`,
  },
  {
    key: 'learning-content',
    prompt: `Map the educational content layer and judge its fit for a Turkish 6-year-old (anaokulu / 1. sınıf, emerging reader). Read fully: src/lib/menu.ts, src/activities/registry.tsx, src/activities/data/quizData.ts, src/activities/shared/*.tsx (QuizGame, CountGame, OrderGame, ExplorePanel, ShapeDraw, SymmetryGame, TangramLite), src/lib/activityLearning.ts, activityLearning.types.ts, guides.ts, src/components/IntroModal.tsx, ActivityKnowledgePanel.tsx. Document: which skills are covered and which MEB 1. sınıf / okul öncesi outcomes are missing (Türkçe: ses/harf tanıma, hece, okuma-yazma hazırlığı; Matematik: 20'ye kadar sayma, toplama-çıkarma, örüntü, geometri, ölçme, zaman; Hayat Bilgisi/Fen; bilişsel beceriler: dikkat, hafıza, planlama), whether question text is readable/voiced for a non-reader, whether quizzes have audio (TTS) support, difficulty adaptation, repetition/variety, feedback quality, and how content is structured (could it be generated per-session?). Rate each shared component's engagement for a 6-year-old (1-5) with reasons. Identify content that is too text-heavy or adult-facing.`,
  },
  {
    key: 'encyclopedia',
    prompt: `Map the Merak Ansiklopedisi. Read fully: src/lib/encyclopedia.ts (2268 lines — read the data model, CATEGORIES, the derivation at the end, and sample 3 topics fully), src/lib/encyclopediaProgress.ts, src/app/kesfet/page.tsx, src/app/kesfet/[slug]/page.tsx, src/components/encyclopedia/*.tsx (EncyclopediaHub, EncyclopediaTools — check how narration/TTS works, InteractiveLab — all lab modes, KnowledgeCheck). Document: the content model, how narration works (Web Speech API? Turkish voice selection?), what is interactive vs text, how progress/favorites are stored, reading level vs a 6-year-old, and concretely how this content could be re-cut into short, swipeable, voiced "micro-capsules" (a healthy replacement for short videos: 20-40 s each, one picture/animation, one voiced fact, one tap question). Also list the 14 topic slugs with their category and lab mode.`,
  },
  {
    key: 'production-readiness',
    prompt: `Assess production readiness and the Next.js 16 constraints. Read: package.json, next.config.ts, tsconfig.json, eslint.config.mjs, postcss.config.mjs, .github/workflows/deploy-pages.yml, src/lib/auth.ts, src/lib/firebase.ts, src/lib/activityLog.ts, src/lib/leaderboard.ts, src/app/bilgi/page.tsx, src/components/ParentInfoScreen.tsx, src/components/LoginScreen.tsx. Then read the Next.js docs that matter for this project from node_modules/next/dist/docs/ (find the pages on: static exports / output export, metadata & manifest.json (app/manifest.ts), icons, PWA / progressive web apps guide, next/font, next/image with unoptimized, dynamic imports, "use client" boundaries, caching, generateStaticParams, React Compiler). Document: how to add a PWA (manifest via app/manifest.ts under basePath, icons, a hand-written service worker in public/ compatible with static export + basePath, offline shell), install prompt handling on Android/iOS, what Next 16 changed that affects this codebase (list the exact doc file paths you used), test strategy (no tests exist — propose vitest + @testing-library or node:test; what is pure and testable), CI changes (lint + typecheck + test gates), error boundaries (error.tsx, not-found.tsx, global-error.tsx), security notes (client-side plaintext passwords — acceptable for a family app? propose a kid-friendly PIN/avatar login), Firebase data model for syncing per-child progress + parent dashboard, performance (bundle, fonts, 760KB dogukan.png at repo root unused), and privacy (no external links reachable by the child except in adult-only sections).`,
  },
]

phase('Understand')
log('Mapping the codebase with 5 parallel readers')
const maps = (await parallel(READERS.map((r, i) => () =>
  agent(`${CONTEXT}

You are reader #${i + 1} of 5 mapping this codebase for a product redesign. Your area: ${r.key}.

${r.prompt}

Write your full map as a well-structured markdown file at ${SCRATCH}/maps/${r.key}.md (create the directory; use mkdir -p). Be concrete: cite file paths and line numbers, quote exact function/class names and CSS class names that later implementers will need. Length: as long as needed to be useful to an engineer who has NOT read the code (typically 200-500 lines). Write in English; keep Turkish strings as-is.
Then return the structured summary.`, { label: `read:${r.key}`, phase: 'Understand', schema: MAP_SCHEMA })
))).filter(Boolean)

log(`Understand done: ${maps.length}/5 maps written`)

const mapIndex = maps.map(m => `- ${m.file} — ${m.headline}`).join('\n')
const mapDigest = maps.map(m => `### ${m.headline}\nFindings:\n${m.keyFindings.map(x => '- ' + x).join('\n')}\nProblems:\n${m.problems.map(x => '- ' + x).join('\n')}\nOpportunities:\n${m.opportunities.map(x => '- ' + x).join('\n')}`).join('\n\n')

const PROPOSAL_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    title: { type: 'string' },
    vision: { type: 'string' },
    topFeatures: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, why: { type: 'string' }, phase: { type: 'number' } }, required: ['name', 'why', 'phase'] } },
    phase1Summary: { type: 'string' },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['file', 'title', 'vision', 'topFeatures', 'phase1Summary', 'risks'],
}

const LENSES = [
  {
    key: 'game-designer',
    lens: `You are a senior MOBILE GAME DESIGNER who has shipped top-grossing kids' games and deeply understands why a 6-year-old prefers Super Bear Adventure, Minecraft and short-video feeds: fast feedback loops, agency, collection, progression, a world to explore, a character to care for, surprise/variable rewards, autonomy, mastery, social proof. Your job: make THIS app the one he chooses to open, using those mechanics ethically (no dark patterns, no loot boxes, no manipulation — but yes to progression, collectibles earned by learning, a companion that grows, a world map that unlocks, a creative sandbox). Think hard about: a kid-first home screen (world map / islands, huge icons, voice labels), a meta-progression layer (XP, stars, levels, streaks, daily quests, sticker/creature collection), a Minecraft-like 2D block-building sandbox on canvas with touch (with learning challenges: build with N blocks, mirror a pattern, follow a blueprint), a healthy "shorts" replacement (swipeable voiced micro-facts with one-tap questions), the "learning gate" mechanic (short learning moments that earn energy/continues in arcade games) and how to make the 32 existing games feel better (juice, haptics, difficulty curves, session length) with minimal per-game changes.`,
  },
  {
    key: 'pedagogy',
    lens: `You are a CHILD DEVELOPMENT & EARLY-EDUCATION EXPERT specialising in Turkish okul öncesi and MEB 1. sınıf curricula (Türkçe ilk okuma-yazma: ses esaslı, harf grupları sırası e-l-a-k-i-n...; Matematik 1: 20'ye kadar sayılar, toplama/çıkarma, örüntü, geometrik şekiller, ölçme, zaman; Hayat Bilgisi; fen temelleri) and in executive-function development (working memory, inhibition, attention, planning) for 6-year-olds. You also know the research on screen time and learning transfer: short sessions, spaced repetition, immediate specific feedback, scaffolding, voiced instructions for emerging readers, concrete-to-abstract progressions, growth-mindset praise. Design the LEARNING ARCHITECTURE: skill graph, mastery tracking per skill, adaptive difficulty, how each existing activity maps to skills, which new activities are needed, how to make quizzes voiced and non-reader friendly (Web Speech API tr-TR), how curiosity about basic science is nurtured (predict-observe-explain loops, home experiments with parent), and how the parent gets actionable insight. Be concrete about what content to ADD, CHANGE, or REMOVE.`,
  },
  {
    key: 'mobile-production',
    lens: `You are a PRINCIPAL FRONTEND ENGINEER who ships production PWAs for kids (installable, offline, fast, touch-perfect) on Next.js. Design the TECHNICAL plan to bring this codebase to production: PWA (manifest via app/manifest.ts honoring basePath, icons set, hand-written service worker for static export with precache + runtime cache, offline fallback, update flow), install prompt UX (Android beforeinstallprompt, iOS add-to-home instructions), fullscreen standalone handling, safe-area insets, orientation (per-game preference, lock where supported), touch targets ≥ 56px, haptics via navigator.vibrate, iOS audio unlock pattern, performance budget and code-splitting per game, state persistence model (localStorage + optional Firebase sync with conflict strategy; per-child profile), error boundaries, test strategy (vitest for pure logic + data integrity tests of menu/registry/encyclopedia consistency; Playwright smoke using the preinstalled Chromium at /opt/pw-browsers/chromium), CI gates (lint, typecheck, test, build), fixing the 14 React-Compiler lint errors without disabling rules, kid-friendly login (avatar + 4-digit PIN instead of typed password; parent PIN for /bilgi), Next 16 specifics (cite node_modules/next/dist/docs paths). Also propose a file/module architecture for a progression system and a world-map home that keeps game components untouched where possible.`,
  },
  {
    key: 'parent-wellbeing',
    lens: `You are a DIGITAL-WELLBEING & PARENTING EXPERT (and a parent of a screen-loving 6-year-old). The father wants his son to prefer this app over addictive mobile games and short videos, while being protected, growing skills and curiosity. Design the WELLBEING & PARENT layer: healthy session design (natural stopping points, "mola" break prompts with movement/eye-rest mini-activities, parent-set daily limits with gentle countdown, bedtime mode), replacing short-video compulsion with a bounded, voiced "Merak Kapsülleri" feed (finite per day, ends with an invitation to a real-world action), co-play prompts that pull the parent in, a parent dashboard (what he practiced, skill mastery, time, streak, suggestions for offline follow-ups), zero external links or ads in the child surface, praise language that builds growth mindset, and how to handle the transition from the current app without losing what he already likes (Süper Ayı). Also address autonomy: let the child choose, avoid nagging, make learning feel like play not homework. Be concrete about screens, copy (Turkish, child-voiced), and data to store.`,
  },
]

phase('Design')
log('Running 4 independent design proposals')
const proposals = (await parallel(LENSES.map((l, i) => () =>
  agent(`${CONTEXT}

${l.lens}

A team already mapped the codebase. READ ALL of these map files first (they are detailed and essential):
${mapIndex}

Digest of their findings:
${mapDigest}

You may also read any source file in ${REPO} to verify details. Then write your proposal as markdown at ${SCRATCH}/proposals/${l.key}.md (mkdir -p). Structure it as:
1. Vision (one paragraph: what the child experiences on a phone in his first 5 minutes and on day 7)
2. Feature list, each with: name, why it works for THIS child, how it teaches, priority (P0/P1/P2), phase (1 = this session, 2 = next, 3 = later), concrete UX, data needed, files to create/modify (paths), and risks.
3. Phase 1 scope: what a team of ~8 engineers working in parallel for one session should build so the app is transformed and production-ready. Be realistic but ambitious.
4. What to REMOVE or demote from the current app and why.
5. Open questions for the father (only if truly necessary).
Write in English with Turkish UI copy where you specify copy. Be concrete and opinionated; avoid generic advice. 300-700 lines.
Return the structured summary.`, { label: `design:${l.key}`, phase: 'Design', schema: PROPOSAL_SCHEMA, effort: 'high' })
))).filter(Boolean)

log(`Design done: ${proposals.length}/4 proposals written`)

const propIndex = proposals.map(p => `- ${p.file} — "${p.title}": ${p.vision}`).join('\n')

const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    scores: { type: 'array', items: { type: 'object', properties: { proposal: { type: 'string' }, engagement: { type: 'number' }, learning: { type: 'number' }, feasibility: { type: 'number' }, wellbeing: { type: 'number' }, total: { type: 'number' }, verdict: { type: 'string' } }, required: ['proposal', 'engagement', 'learning', 'feasibility', 'wellbeing', 'total', 'verdict'] } },
    mustHaveIdeas: { type: 'array', items: { type: 'string' } },
    rejectIdeas: { type: 'array', items: { type: 'string' } },
    conflicts: { type: 'array', items: { type: 'string' } },
  },
  required: ['file', 'scores', 'mustHaveIdeas', 'rejectIdeas', 'conflicts'],
}

const JUDGE_LENSES = [
  'You judge primarily AS THE 6-YEAR-OLD and as a game designer: will he actually open this instead of Super Bear / Minecraft / shorts? Is it fun in the first 60 seconds? Is there a reason to come back tomorrow? Is the first-week loop believable?',
  'You judge primarily AS AN EARLY-EDUCATION EXPERT AND THE FATHER: does it teach real skills aligned with Turkish 1. sınıf outcomes, nurture curiosity about science, respect the child, and protect him? Is the parent given real insight without surveillance creep?',
  'You judge primarily AS THE STAFF ENGINEER who must ship Phase 1 in ONE session with ~8 parallel agents on THIS Next.js 16 static-export codebase: is the scope realistic, is the architecture sound, does it keep the 32 games working, does it reach production quality (PWA, tests, CI, lint-clean)? Penalize hand-waving and scope that cannot be integrated safely.',
]

phase('Judge')
const judgements = (await parallel(JUDGE_LENSES.map((lens, i) => () =>
  agent(`${CONTEXT}

You are judge #${i + 1} of 3 on a design panel. ${lens}

Read ALL four proposals fully:
${propIndex}

Also skim the codebase maps for grounding:
${mapIndex}

Score each proposal 1-10 on: engagement (for this specific child), learning (real skill + curiosity value), feasibility (Phase 1 deliverable in this codebase in one session by ~8 parallel agents), wellbeing (healthy use, protection, parent value). total = sum. Then list the MUST-HAVE ideas across all proposals (the ones a synthesis must keep, naming which proposal), ideas to REJECT (with reasons), and CONFLICTS between proposals that the synthesizer must resolve (with your recommended resolution). Write your full judgement to ${SCRATCH}/judgements/judge-${i + 1}.md (mkdir -p) and return the structured result.`, { label: `judge:${i + 1}`, phase: 'Judge', schema: JUDGE_SCHEMA, effort: 'high' })
))).filter(Boolean)

log(`Judging done: ${judgements.length}/3 judgements`)

const judgeIndex = judgements.map(j => j.file).join('\n')
const judgeDigest = judgements.map((j, i) => `Judge ${i + 1}:\n${j.scores.map(s => `  ${s.proposal}: eng ${s.engagement} learn ${s.learning} feas ${s.feasibility} well ${s.wellbeing} = ${s.total} — ${s.verdict}`).join('\n')}\n  Must-have: ${j.mustHaveIdeas.join(' | ')}\n  Reject: ${j.rejectIdeas.join(' | ')}\n  Conflicts: ${j.conflicts.join(' | ')}`).join('\n\n')

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    planFile: { type: 'string' },
    contractFile: { type: 'string' },
    productName: { type: 'string' },
    visionTr: { type: 'string' },
    corePackage: { type: 'object', properties: { id: { type: 'string' }, goal: { type: 'string' }, files: { type: 'array', items: { type: 'string' } } }, required: ['id', 'goal', 'files'] },
    workPackages: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, goal: { type: 'string' }, ownedFiles: { type: 'array', items: { type: 'string' } }, dependsOnContract: { type: 'array', items: { type: 'string' } }, acceptance: { type: 'array', items: { type: 'string' } } }, required: ['id', 'title', 'goal', 'ownedFiles', 'dependsOnContract', 'acceptance'] } },
    sharedFilesPolicy: { type: 'string' },
    laterPhases: { type: 'array', items: { type: 'string' } },
  },
  required: ['planFile', 'contractFile', 'productName', 'visionTr', 'corePackage', 'workPackages', 'sharedFilesPolicy', 'laterPhases'],
}

phase('Synthesize')
const plan = await agent(`${CONTEXT}

You are the LEAD PRODUCT ENGINEER synthesizing a design panel into an executable master plan. Read, in this order and FULLY:
1. The codebase maps:
${mapIndex}
2. The four proposals:
${propIndex}
3. The three judgements:
${judgeIndex}

Judge digest:
${judgeDigest}

Produce TWO files:

A) ${SCRATCH}/plan/MASTER_PLAN.md — written in TURKISH (technical terms in English are fine), for the father to read and for future sessions. Sections:
  1. Ürün vizyonu (the child's experience; the healthy-engagement thesis; what replaces games and shorts and how it teaches)
  2. Deneyim mimarisi: screens and flows (kid home / world map, companion, progression, learning gate, Merak Kapsülleri feed, Blok Dünyası sandbox or whatever the panel chose, activity shell, wellbeing/mola, parent dashboard, kid login). Include Turkish UI copy for key moments.
  3. Öğrenme mimarisi: skill graph (ids), mapping of all 69 existing activities to skills, mastery model, adaptive difficulty, TTS policy.
  4. Teknik mimari: module map, data model (progress store, events, persistence, Firebase sync), PWA, tests, CI, lint fixes. Cite the Next 16 docs paths that implementers must read.
  5. Faz 1 (bu oturum) — work packages (see below), Faz 2, Faz 3.
  6. Kaldırılan / değiştirilen içerik ve gerekçesi.
  7. Riskler ve kararlar (resolve every conflict judges raised; state the decision and why).

B) ${SCRATCH}/plan/CONTRACT.md — the INTEGRATION CONTRACT in English: the exact TypeScript interfaces, module paths, exported function signatures, event names, localStorage keys, CSS class/tokens conventions, route paths, and data shapes that the CORE package implements FIRST and all other packages depend on. Be precise enough that 8 agents can code in parallel without talking to each other. Include: progress store API (XP/stars/levels/streak/quests/collection/skills mastery), event bus (e.g. trackEvent('game_over', {...})), skill ids, world/island data model, TTS helper API, haptics/sound helper API, wellbeing/session timer API, profile/login API, how a game reports results (ideally through existing useGameScore + a new hook so games need minimal edits), and the file ownership map.

WORK PACKAGE RULES (critical for parallel execution):
- One CORE package (built first, alone): contract types + progress store + event bus + TTS/haptics helpers + skill graph + world data + persistence. Keep it < ~12 files.
- Then 7-10 parallel packages with DISJOINT ownedFiles (no two packages edit the same file). Shared files that several packages would touch (globals.css, menu.ts, registry.tsx, layout.tsx, MenuScreen) must be assigned to exactly ONE owner; others must create NEW css files / modules and the owner integrates, OR use CSS modules / new stylesheet files imported from their own components. State this sharedFilesPolicy explicitly.
- Each package: id, title, goal, ownedFiles (paths, may include new files), dependsOnContract (which contract APIs it consumes), acceptance (testable criteria, including "npm run lint, tsc and build pass").
- Packages should include at minimum: kid home/world map + companion; progression UI (celebrations, level-up, stickers, quests); Merak Kapsülleri feed; block sandbox (or the chosen creative mode); learning gate + voiced quiz upgrade of shared components; wellbeing/mola/daily limit + parent dashboard; PWA + CI + tests + lint fixes; game polish sweep (haptics/difficulty/touch bar across the 32 games with minimal edits). Adjust per the panel's verdict.
- Phase 1 must leave ALL 69 existing activities working.

Return the structured plan summary (planFile, contractFile, corePackage, workPackages with ownedFiles, sharedFilesPolicy, laterPhases).`, { label: 'synthesize:master-plan', phase: 'Synthesize', schema: PLAN_SCHEMA, effort: 'xhigh' })

return { maps: maps.map(m => m.file), proposals: proposals.map(p => ({ file: p.file, title: p.title })), judgements: judgements.map(j => j.file), plan }