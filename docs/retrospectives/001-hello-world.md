# Retrospective 001 — Hello World Bootstrap

## What we did
Scaffolded the Vite + React + TypeScript app into `app/`, set up root pass-through scripts and dotfiles, wrote the agentic-engineering docs skeleton (`CLAUDE.md`, `README.md`, `docs/`), built the hello-world greeting spec-first (req doc → failing test → pure `greeting()` module → green test → wired into `App.tsx`), and brought up the dev server with a curl-verified HTTP 200. Four commits in history.

## What worked
- The spec-first loop ran cleanly: the failing test showed `Cannot find module './greeting'`, then the minimal implementation turned it green, then it was wired into the component.
- Root/`app/` separation kept governance and code cleanly apart; root pass-through scripts (`npm --prefix app run ...`) worked first try.
- The `@` path alias mirrored across `vite.config.ts`, `vitest.config.ts`, and `tsconfig.app.json` works in app, build, and specs.
- ESLint 10 flat config with `eslint-plugin-react-hooks` linted clean; dropping `eslint-plugin-react` avoided the known incompatibility.

## What didn't / friction points
- **Platform: Windows, not macOS/Linux.** The bootstrap assumes a POSIX shell. Ran everything through Git Bash. Several POSIX-isms needed substitution (see below).
- **`netcat` (`nc`) not installed.** Step 6's port probe depends on `nc`. Substituted a Node `net.createServer()` free-port probe with identical 21-port-scan semantics. Defaults 5173/4173 were free.
- **`baseUrl` is deprecated in TypeScript 7** (template ships TS ~6.x which errors on it). Removed `baseUrl` from `tsconfig.app.json`; modern TS resolves `paths` relative to the config file, so the `@/*` alias still works and the build passes.
- **`eslint . --ext ts,tsx` is invalid in ESLint 10 flat config** (the `--ext` flag was removed). The flat config already scopes to `**/*.{ts,tsx}`, so the lint script is just `eslint .`.
- **`open` doesn't exist on Windows.** Used `cmd.exe /c start ""` to open the browser instead.
- **`.claude/launch.json` not created by Claude.** Claude Code's self-modification classifier blocks writes under `.claude/`; this is a user-terminal step (relevant only for Cowork's preview panel, not the CLI here).

## Decisions to carry forward
- No new ADR required — the friction was tooling/platform substitution, not architecture. ADR 001 (root vs `app/`) still holds.

## Changes made to CLAUDE.md / constraints / working agreement
- Added a **"Platform / tooling notes (Windows)"** section to `docs/constraints.md` recording the four substitutions (Node port probe for `nc`, no `baseUrl`, `eslint .` without `--ext`, `start` instead of `open`) so future sessions don't re-discover them.
- Linked this retro in the `CLAUDE.md` "Self-improvement log".

## Open questions for next session
- None.
