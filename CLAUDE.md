# my-webapp

A sandbox to learn and prototype web app features, run locally by a single developer in the browser. Built with Vite + React + TypeScript under agentic-engineering discipline: spec-first, decisions recorded, governance separated from code.

## Repository layout

Governance lives at the repo **root**; all application code lives under **`app/`**. This split is intentional (see [ADR 001](docs/decisions/001-agent-structure.md)) and is a hard rule — never mix them.

```
my-webapp/
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

- [docs/requirements/overview.md](docs/requirements/overview.md) — project goal, user, success criteria
- [docs/requirements/feature-001-hello-world.md](docs/requirements/feature-001-hello-world.md) — hello-world feature spec
- [docs/decisions/001-agent-structure.md](docs/decisions/001-agent-structure.md) — ADR: root-vs-`app/` split
- [docs/constraints.md](docs/constraints.md) — what NOT to do
- [docs/retrospectives/](docs/retrospectives/) — per-feature retrospectives

## Current state

Hello world greeting rendered; no features specced beyond Feature 001.

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

## Critical files

- [app/vite.config.ts](app/vite.config.ts) — dev/preview ports, path alias (`@` → `app/src`)
- [app/vitest.config.ts](app/vitest.config.ts) — test environment + alias
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
