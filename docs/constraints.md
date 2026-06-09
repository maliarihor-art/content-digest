# Constraints — what NOT to do

## Project scope (from interview)
- **No authentication.** No login, accounts, sessions, or user management.
- ~~**No backend / API / database.**~~ — **Amended by [ADR 003](decisions/003-real-ai-via-serverless.md) (2026-06-09).** A single-purpose **serverless function** is now allowed *solely* as a Claude API proxy (key kept server-side). Still forbidden: **a database / any server-side data storage** (persistence stays `localStorage`), and the proxy must be **stateless** (persists no article content or user data). Anything beyond the Claude proxy needs its own ADR.

## Engineering guardrails (baseline)
- **No unscoped refactors.** Change only what a feature requires. Broad rewrites need their own requirements doc.
- **No new runtime dependency without an ADR.** Propose it, record an ADR under `docs/decisions/`, then install.
- **No code without a spec.** Every module starts from a failing `*.spec.ts(x)` test (see `CLAUDE.md` Rules).
- **No skipping the retrospective.** Every feature ends with a `docs/retrospectives/NNN-<slug>.md`.
- **No governance files inside `app/`.** `CLAUDE.md`, `README.md`, and `docs/**` live at the repo root only.
- **No app code outside `app/`.** All application source lives under `app/`.
- **No loosening TypeScript strictness.** Do not disable `strict`, `noImplicitAny`, `strictNullChecks`, or `noUncheckedIndexedAccess`.

## Tooling notes
- **No `eslint-plugin-react` until it supports ESLint 10.** The current Vite template ships ESLint 10; `eslint-plugin-react` is incompatible. `eslint-plugin-react-hooks` covers the important rules. Revisit when upstream compatibility lands.
- **Lint script is `eslint .` (no `--ext`).** ESLint 10 flat config removed the `--ext` flag; file scoping lives in `eslint.config.js` (`files: ['**/*.{ts,tsx}']`).
- **No `baseUrl` in `tsconfig*.json`.** TypeScript 7 deprecates it (TS 6 errors). The `@/*` path alias resolves relative to the config file without it — do not re-add `baseUrl`.

## Platform / tooling notes (Windows)
This repo was bootstrapped on Windows via Git Bash. POSIX-only tooling was substituted (see retrospective 001):
- **Port probing uses Node**, not `netcat`/`nc` (not installed). A `net.createServer()` scan finds the first free port.
- **Browser opens with `cmd.exe /c start ""`**, not `open` (macOS) or `xdg-open` (Linux).
- **`.claude/launch.json`** must be created from your own terminal — Claude's self-modification classifier blocks `.claude/` writes. Only needed for Cowork's preview panel.
- Git may warn `LF will be replaced by CRLF` — harmless; `.editorconfig` pins `end_of_line = lf` for editors.
