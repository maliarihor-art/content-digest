# Content Digest

Content Digest turns article text into a compact card — summary, key points, tags, and a topic category — filed onto a board organized by subject. Run locally by a single developer; see [docs/PRD.md](docs/PRD.md) for the product spec. Built with Vite + React + TypeScript under agentic-engineering discipline: spec-first, decisions recorded, governance separated from code.

## Repository layout

Governance lives at the repo **root**; all application code lives under **`app/`**. This split is intentional (see [ADR 001](docs/decisions/001-agent-structure.md)) and is a hard rule — never mix them.

```
content-digest/
  CLAUDE.md          ← this file (entry point for Claude)
  README.md          ← entry point for humans
  package.json       ← root pass-through scripts (npm run dev, etc.)
  .gitignore .editorconfig .nvmrc .env.example
  docs/              ← requirements / decisions / retrospectives / constraints
  app/               ← Vite + React + TypeScript application code
```

## How to work in this repo

> **Working agreement**
>
> 1. No code without a spec. Every feature begins as a file under `docs/requirements/` (at repo root) and a failing test under `app/src/**/*.spec.ts(x)`.
> 2. No architectural choice without an ADR under `docs/decisions/`.
> 3. Read `docs/constraints.md` before proposing anything new. Surface conflicts, don't silently comply.
> 4. The loop is: spec → failing test → minimal code → green test → commit. One concern per commit.
> 5. Logic in pure modules, rendering in components. Specs target the logic. Add a DOM-testing layer (e.g. React Testing Library) only via an ADR when a real need appears.
> 6. When in doubt, ask. Use AskUserQuestion rather than guessing requirements.
> 7. Keep `CLAUDE.md`'s "Current state" section updated after every merged change.
> 8. Dev server lives at `http://127.0.0.1:<DEV_PORT>/` where `DEV_PORT` is recorded in `.dev-port` (defaults to 5173, probed for a free port at bootstrap time). Always read the current port from `.dev-port` instead of hardcoding 5173. `strictPort: true` is set so Vite never silently drifts.
> 9. **Retrospective after every feature.** Once a feature is green and committed, write `docs/retrospectives/NNN-<slug>.md` capturing what worked, what didn't, and concrete workflow changes. If the retro proposes a change, **edit `CLAUDE.md` (working agreement, constraints, or links) in the same session** — don't defer. Add a new ADR if the change is architectural. Then update the "Self-improvement log" section to link the new retro. Commit as `chore(retro): NNN-<slug>`.
> 10. **Layout discipline.** Governance files (`CLAUDE.md`, `README.md`, `docs/**`) live at the repo root and never inside `app/`. App code lives inside `app/` and never at the repo root. Root-level config (CI, dotfiles) is allowed; app code at root is not.
> 11. **Conventional Commits.** Format: `<type>(<scope>): <subject>`. Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `style`. Retros are committed as `chore(retro): NNN-<slug>`. ADR additions as `docs(adr): NNN-<slug>`.
> 12. **CLAUDE.md ≤ ~200 lines.** It is a router, not an encyclopedia. If a retro update would push it past ~200 lines, move detail into a linked file under `docs/` and link from here instead. Same applies to `constraints.md` — split into topical files once over ~150 lines.

## Documentation map

- [docs/PRD.md](docs/PRD.md) — product requirements (why/who/what; product-level umbrella)
- [docs/roadmap.md](docs/roadmap.md) — milestones (M1–M8), one per GitHub issue, with architecture per milestone
- [docs/task-plan.md](docs/task-plan.md) — actionable task breakdown for upcoming work
- [docs/requirements/overview.md](docs/requirements/overview.md) — project goal, user, success criteria
- [docs/requirements/feature-001-hello-world.md](docs/requirements/feature-001-hello-world.md) — hello-world feature spec
- [docs/requirements/feature-002-content-digest.md](docs/requirements/feature-002-content-digest.md) — content digest feature spec
- [docs/requirements/feature-003-ai-summarization.md](docs/requirements/feature-003-ai-summarization.md) — AI summarization core (prompt + parse) spec
- [docs/requirements/feature-003b-serverless-proxy.md](docs/requirements/feature-003b-serverless-proxy.md) — serverless Claude proxy (M2) spec
- [docs/requirements/feature-003c-frontend-integration.md](docs/requirements/feature-003c-frontend-integration.md) — frontend integration + fallback (M3) spec
- [docs/requirements/feature-003d-vercel-deploy.md](docs/requirements/feature-003d-vercel-deploy.md) — Vercel hosting + deploy (M4) spec
- [docs/requirements/feature-004-card-management.md](docs/requirements/feature-004-card-management.md) — card management: delete / edit / re-categorize (M5) spec
- [docs/deploy.md](docs/deploy.md) — Vercel deploy runbook (owner-gated ops)
- [docs/decisions/001-agent-structure.md](docs/decisions/001-agent-structure.md) — ADR: root-vs-`app/` split
- [docs/decisions/002-content-digest-pipeline.md](docs/decisions/002-content-digest-pipeline.md) — ADR: local pure-module digest pipeline
- [docs/decisions/003-real-ai-via-serverless.md](docs/decisions/003-real-ai-via-serverless.md) — ADR: real AI via a Vercel serverless proxy (amends no-backend)
- [docs/decisions/004-free-ai-via-gemini.md](docs/decisions/004-free-ai-via-gemini.md) — ADR: free AI via Google Gemini over `fetch` (amends ADR 003's provider)
- [docs/constraints.md](docs/constraints.md) — what NOT to do
- [docs/retrospectives/](docs/retrospectives/) — per-feature retrospectives

## Current state

**Content Digest** (Feature 002): paste an article's text → local heuristic pipeline produces a summary, key points, tags, and a proposed category → result is filed as a card on a topic board, persisted in `localStorage`. All analysis logic is pure and tested under `app/src/digest/` and `app/src/board/`; `App.tsx` is render-only. The Feature 001 `greeting` module remains as the bootstrap artifact.

**M1 — AI summarization core** (Feature 003): pure, network-free Claude seam under `app/src/digest/ai/`. `buildDigestPrompt(text)` builds a deterministic Claude Messages API request payload (system prompt enumerates the taxonomy + `Digest` fields, demands JSON-only); `parseDigestResponse(input)` strictly validates a reply (object or JSON string) into a `Digest` or `{ ok: false, error }`, never throwing.

**M2 — Serverless AI proxy** (Feature 003b): a stateless Vercel function turns article text into a validated `Digest`. The pure core `runDigest(body, call)` (in `app/src/digest/ai/service.ts`) validates the body, reuses M1's `buildDigestPrompt`/`parseDigestResponse`, and maps every outcome to an HTTP result (200/400/502) — never throwing; the network call is injected as a `DigestCaller`, so it's fully unit-tested with no key/network. The thin handler `api/digest.ts` (repo-root `api/`, Vercel convention) is the only I/O boundary: it reads `process.env.GEMINI_API_KEY` and calls **Google Gemini's free tier over `fetch`** (no SDK, zero runtime deps — [ADR 004](docs/decisions/004-free-ai-via-gemini.md)), then forwards the core's result. Persists nothing (ADR 003). UI wiring + heuristic fallback is M3; live `vercel dev` with a free Gemini key is owner-gated.

**M3 — Frontend integration + fallback** (Feature 003c): the UI now produces real AI digests when the proxy is reachable and degrades gracefully when it isn't. The pure (but for injected I/O) `requestDigest(text, deps)` (in `app/src/digest/ai/client.ts`) POSTs `{ text }` to `/api/digest`; on `200` it re-validates the body through M1's `parseDigestResponse` (never trusts the wire), returning `{ source: 'ai', digest }`; on any non-OK status, invalid body, or network error it falls back to `buildDigest(text)` with `source: 'local'` + a human `notice` — never throws. `fetch`/`fallback` are injected (default `globalThis.fetch`/`buildDigest`), so every path is unit-tested with no network. `App.tsx` stays render-only: it added `loading` + `notice` state, an async `handleAdd`, a "Summarizing…" label, and a non-blocking fallback banner. The live **AI-success** path needs `vercel dev` + a Gemini key (owner-gated, M4); the **fallback** path is browser-verified (no `/api/digest` in plain `vite dev`).

**M4 — Vercel hosting + deploy** (Feature 003d): **live at <https://content-digest-seven.vercel.app>** (free Hobby tier, GitHub auto-deploy). Root [`vercel.json`](vercel.json) pins `buildCommand: npm run build`, `outputDirectory: app/dist`, `installCommand: npm install --prefix app`, and `maxDuration: 30` for `api/digest.ts`; `GEMINI_API_KEY` is a Vercel project env var. `api/digest.ts` runs on the **Edge runtime** (`export const config = { runtime: 'edge' }`) — its Web-standard `Request`→`Response` handler 500'd on the default Node runtime, which Edge serves natively (free, no new dep). No new ADR (ADR 003/004 already decided the design) and no new pure module/spec (config only) — the regression guard stays the existing 75 specs + `npm run build` + `npm run typecheck:api`. The **AI-success path is verified in production** (`POST /api/digest` → valid `Digest`); this also confirmed Gemini's `responseSchema` casing. Deploy steps live in [docs/deploy.md](docs/deploy.md).

**M5 — Card management** (Feature 004): the board is no longer append-only. Three pure store fns in `app/src/board/store.ts` — `removeCard(board, id)`, `updateCardTitle(board, id, title)` (trimmed; empty → `'Untitled'`), `recategorize(board, id, category)` — return a new `Board`, never mutate, no-op on unknown `id`, and preserve the rest of the digest (7 new specs; suite 75 → **82**). `App.tsx` stays render-only: `CardView` gained Delete / inline title edit (Enter/blur commits, Escape cancels) / a `CATEGORIES` `<select>`, with all board mutations routed through the pure fns and persisted via the existing `saveBoard` effect. No new ADR/dep (extends ADR 002); direct DOM tests stay deferred to M7. Browser-verified end to end in `vite dev` (fallback path). Independent of the AI track — needs no key/network.

## Dev server

From the repo root: `npm run dev` → `http://127.0.0.1:5173/`. The port is read from `.dev-port` (defaults to 5173, probed at bootstrap). `strictPort: true` prevents Vite from drifting to another port.

## Common commands

All run from the **repo root**:

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build |
| `npm run test` | Run vitest in watch mode |
| `npm run test:run` | Run vitest once (CI mode) |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |
| `npm run setup` | Install `app/` dependencies |
| `npm run typecheck:api` | Type-check the serverless proxy (`api/`) |

## Critical files

- [app/vite.config.ts](app/vite.config.ts) — dev/preview ports, path alias (`@` → `app/src`)
- [app/vitest.config.ts](app/vitest.config.ts) — test environment + alias
- [app/src/digest/ai/client.ts](app/src/digest/ai/client.ts) — frontend AI client + heuristic fallback (M3)
- [app/src/board/store.ts](app/src/board/store.ts) — pure board store: add/group/(de)serialize + remove/rename/recategorize (M5)
- [api/digest.ts](api/digest.ts) — serverless Claude proxy (M2); [api/tsconfig.json](api/tsconfig.json) type-checks it
- [vercel.json](vercel.json) — Vercel build/output/function config (M4); [docs/deploy.md](docs/deploy.md) is the deploy runbook
- [docs/constraints.md](docs/constraints.md) — project guardrails

## Escalation rules

> Stop and ask via AskUserQuestion when:
> - The same test has failed 3 times with different fixes (you're guessing — get more context).
> - A request conflicts with `docs/constraints.md` or a rule in the "Rules" section of `CLAUDE.md` (surface it, don't silently comply).
> - A new runtime dependency is needed (ask + add an ADR before installing).
> - `:5173` or `:4173` is taken (fix the conflict, do not let Vite drift to another port).
> - This change would push `CLAUDE.md` past ~200 lines (route detail into a linked doc first).
> - Acceptance criteria in a `docs/requirements/feature-*.md` are ambiguous or contradict each other.

## Rules

> **TypeScript strict:** Do NOT disable `strict`, `noImplicitAny`, `strictNullChecks`, or `noUncheckedIndexedAccess` in any `tsconfig*.json`. Narrow the type or guard the value — never loosen the config.
>
> **Pure modules:** Business logic lives in pure modules under `app/src/`. React components only render — no branching/transform logic. Extract any non-trivial computation into a pure module and spec it before wiring it in.
>
> **Spec first:** Every new module starts with a failing `*.spec.ts(x)` test. Show the red output, then write the minimum code to turn it green, then commit.

## Self-improvement log

- [001 — Hello World Bootstrap](docs/retrospectives/001-hello-world.md) — spec-first loop held up; recorded Windows/Git Bash tooling substitutions (Node port probe vs `nc`, no `baseUrl`, `eslint .` without `--ext`, `start` vs `open`) in [constraints.md](docs/constraints.md).
- [002 — Content Digest](docs/retrospectives/002-content-digest.md) — escalation gate turned a backend-requiring request into a recorded in-charter decision ([ADR 002](docs/decisions/002-content-digest-pipeline.md)); pure-module pipeline kept logic fully unit-tested. Carry-forward: prefer pure modules / a DOM-test ADR over live-browser verification.
- [003 — AI Summarization Core](docs/retrospectives/003-ai-summarization-core.md) — M1 reused the `Digest` seam for pure, network-free `buildDigestPrompt`/`parseDigestResponse`; `ParseResult` union sets up M3's heuristic fallback. Carry-forward: M2 should import the prompt payload + `DIGEST_MODEL`/`DIGEST_MAX_TOKENS` rather than rebuild them.
- [004 — Serverless Proxy](docs/retrospectives/004-serverless-proxy.md) — M2 kept the proxy pure-testable by injecting a `DigestCaller` into `runDigest`; M1's prompt/parse were imported, not rebuilt. The escalation gate caught "everything must be free" vs. ADR 003's paid Claude → pivoted to **Gemini free tier over `fetch`** ([ADR 004](docs/decisions/004-free-ai-via-gemini.md)), absorbed cheaply by the provider-neutral seam. Carry-forward: M3 calls `POST /api/digest`, falls back to local `buildDigest` on any non-200/rate-limit/missing-key, adds loading + error states.
- [005 — Frontend Integration](docs/retrospectives/005-frontend-integration.md) — M3 put all the request/fallback branching in a pure `requestDigest(text, deps)` with injected `fetch`/`fallback`, so `App.tsx` stayed render-only and 7 specs covered every path with no network; the `Digest` seam held a third time (board/card UI untouched). The 404-in-`vite dev` reality became the live verification of the fallback path. Carry-forward: M4 must verify the **AI-success** path on `vercel dev` (the one branch specs can't reach); when browser-checking React forms, drive inputs with the native-setter + `input`-event trick (not `preview_fill`) and prefer `preview_snapshot` over `preview_screenshot`.
- [006 — Vercel Deploy](docs/retrospectives/006-vercel-deploy.md) — M4 went live (<https://content-digest-seven.vercel.app>) via free dashboard GitHub import. The AI-success path verified in prod (and confirmed Gemini's `responseSchema` casing). Key catch: the Web-standard `Request`→`Response` handler 500'd on Vercel's default **Node** runtime — never caught earlier because M2/M3 never ran on a real Vercel runtime — fixed by pinning `runtime: 'edge'`. Carry-forward: verify the platform **handler contract**, not just the injected logic; keep `api/digest.ts` free of Node-only APIs (Edge); merge each milestone's PR before the next; secrets go in `.env` (gitignored), never `.env.example`.
- [007 — Card Management](docs/retrospectives/007-card-management.md) — M5 made the board editable via three pure store fns (`removeCard`/`updateCardTitle`/`recategorize`) + per-card Delete/edit/category controls; the `Digest`/`Board` seam held a fourth time (digest + AI layers untouched), spec-first nailed the no-op/trim/preserve contracts in one red→green pass (75 → 82 specs). Carry-forward: drive React-form interactions inside a **single `preview_eval`** (set → await tick → act → await async) — splitting across `preview_eval` + `preview_click` races the state commit; `preview_screenshot` still flaky, prefer `preview_snapshot`. M6 (search/filter) builds on this card UI with a pure `filterCards`.
