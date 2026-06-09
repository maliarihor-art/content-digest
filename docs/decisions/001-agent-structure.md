# ADR 001 — Repository structure: governance at root, app code under `app/`

## Status
Accepted (bootstrap).

## Context
This project is developed with an AI agent (Claude) as a primary contributor. Agent effectiveness depends heavily on a focused, predictable context. If governance material (instructions, requirements, decisions, retrospectives) is interleaved with application source, two problems follow:

1. The agent's context gets polluted with prose when it should be reasoning about code, and vice versa.
2. It becomes ambiguous where a new file "belongs," which erodes the spec-first discipline over time.

We also want a single, unambiguous source of truth for tooling: one `.gitignore`, one place to run scripts from, one entry point for humans (`README.md`) and one for the agent (`CLAUDE.md`).

## Decision
Physically separate the two layers:

- **Repo root** holds governance and project-level config only: `CLAUDE.md`, `README.md`, root `package.json` (pass-through scripts), dotfiles, and `docs/`.
- **`app/`** holds the entire Vite + React + TypeScript application and its own `package.json`, config, and `node_modules`.
- `docs/` is further split into `requirements/`, `decisions/` (ADRs like this one), `retrospectives/`, and a top-level `constraints.md`.
- Root scripts delegate into `app/` via `npm --prefix app run <script>`.

No governance file may live inside `app/`; no application code may live at the repo root.

## Consequences
- **Positive:** Clean separation keeps the agent's context focused; the layout is self-documenting; tooling has one obvious home; the spec-first loop has clear file destinations.
- **Positive:** Easy to later add sibling packages (e.g. `packages/shared/`) without disturbing governance.
- **Negative / trade-off:** Two `package.json` files and the `--prefix app` indirection add a small amount of ceremony. Accepted as the cost of separation; revisit with npm workspaces if a second package appears.
