<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project rules

Interfaces and file ownership: `docs/plan/CONTRACT.md` (single source of truth).
Static export (`output: "export"`, basePath `/dogukan` in production, GitHub Pages).

## Child surface rules (CONTRACT §0.7)

The user is a 6-year-old who is just learning to read. On every child-facing screen:

- Every child-facing string has a spoken form (`speak()` / `<SayButton>`); child copy is Turkish.
- Text is ≥ 18 px; tap targets are ≥ 56 px, answer choices ≥ 96 px and game touch buttons ≥ 72 px.
- No `window.location.reload()`, no `alert()`, no external `href`, no `target=`.
  (`scripts/verify-out.mjs` fails the gate on external links/`target=` outside `out/bilgi/`.)
- Praise goes through `praise()`.

## Engineering rules

- Storage only through `@/lib/storage` helpers (SSR-safe, never throw).
- Firebase is optional, lazy (`await import("@/lib/firebase")`) and silent-fail; nothing on the
  child path awaits it. `@/lib/firebaseConfig` is SDK-free and safe to import statically.
- Internal links use `next/link` with trailing slashes; `public/` assets use `assetPath()`; never
  hard-code `/dogukan`.
- Every dynamic route has a non-empty `generateStaticParams` and `export const dynamicParams = false`.
- CSS: each package keeps its stylesheet next to its components with its class prefix
  (CONTRACT §14). Never rename the preserved game classes. Infinite animations go inside
  `@media (prefers-reduced-motion: no-preference)`, hover transforms inside `@media (hover: hover)`,
  no `backdrop-filter` over canvases. `/kesfet`-only styles live in `src/styles/encyclopedia.css`.
- No lint rule is disabled to make code pass; no new `eslint-disable` lines.
- There is no CI. Before handing over: `npm run check` (lint 0 warnings → tsc → vitest → build →
  verify-out). Publishing is a deliberate `npm run deploy` (`docs/RELEASE.md`).
- Commit messages are in Turkish. No model names in code or commits.
