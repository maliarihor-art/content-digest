# Constraints — what NOT to do

## Project scope (from interview)
- **No backend / API / database.** This is a frontend-only sandbox. No server, persistence layer, or backend services.
- **No authentication.** No login, accounts, sessions, or user management.

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
