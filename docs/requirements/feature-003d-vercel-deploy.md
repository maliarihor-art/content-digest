# Feature 003d — Vercel hosting + deploy (M4)

## User story
As the owner, I want the app (frontend **and** the `api/digest` function) running on a
public URL on a free tier, so anyone can paste an article and get a **real AI digest** in
production — with the heuristic fallback still covering any AI outage.

## Scope decisions (see [ADR 003](../decisions/003-real-ai-via-serverless.md), [ADR 004](../decisions/004-free-ai-via-gemini.md))
- **No new architectural decision.** The serverless-proxy + Gemini-over-`fetch` design is
  already decided (ADR 003 / 004). M4 only *executes* it — so **no new ADR**, only this
  requirements doc and the deploy config.
- **No new pure module → no new spec.** M4 adds deployment configuration (`vercel.json`),
  not business logic. The regression guard stays the existing suite: `npm run test:run`
  (75 specs), `npm run build`, `npm run typecheck:api` — all must stay green. This is a
  deliberate, recorded deviation from "every module starts with a failing spec" (there is
  no module).
- **Layout stays intact** (ADR 001 / working-agreement rule 10): `vercel.json` is root
  config (allowed at root, like CI dotfiles); app code stays under `app/`, functions stay
  under `api/`. Nothing moves.
- **Provider key is a Vercel project secret.** `GEMINI_API_KEY` is set in the Vercel
  project (and optional `GEMINI_MODEL`), never committed, never shipped to the browser
  (ADR 003 / 004). The serverless function is the only code that reads it.
- **Stateless in prod too** (constraint): the function persists nothing; board data stays
  in the browser's `localStorage`.

## Deploy configuration — `vercel.json` (repo root)
- `buildCommand: "npm run build"` → runs `npm --prefix app run build` (tsc + vite).
- `outputDirectory: "app/dist"` → the static frontend Vercel serves.
- `installCommand: "npm install --prefix app"` → the build needs `app/` deps; the function
  has zero runtime deps (ADR 004), so no root install is required for it.
- `functions: { "api/digest.ts": { maxDuration: 30 } }` → headroom over the function's own
  15 s upstream timeout, so Gemini isn't cut off by the platform default (~10 s).
- `api/digest.ts` is auto-detected as a serverless function by Vercel convention (any file
  under repo-root `api/`). Its Web-standard `Request`→`Response` handler runs on Vercel's
  Node runtime.

## Acceptance criteria
- [ ] `vercel.json` present at the repo root; `npm run build` produces `app/dist` locally.
- [ ] `vercel dev` (with a local `GEMINI_API_KEY`) serves the app **and** `POST /api/digest`
      returns a validated `Digest` — the **AI-success path** that M1–M3 specs can't reach.
- [ ] Deployed Vercel URL serves the app.
- [ ] Pasting an article on the deployed URL produces a **real AI digest** (`source: 'ai'`,
      no fallback banner) when the key is configured.
- [ ] With the key removed/unreachable, the deployed app still produces a **local** digest
      (fallback banner) — graceful degradation holds in prod.

## Owner-gated prerequisites (P1–P3)
These can't be done from the repo — they need the owner's accounts:
1. **Free Gemini key** — <https://aistudio.google.com/apikey> (no card). Put in local `.env`
   for `vercel dev`; set as the Vercel project's `GEMINI_API_KEY` for prod.
2. **Vercel account + project import** — connect the GitHub repo (or `vercel link`).
3. **Secret set in Vercel** — `GEMINI_API_KEY` (and optional `GEMINI_MODEL`) as project
   Environment Variables (Production + Preview).

See [docs/deploy.md](../deploy.md) for the step-by-step runbook.

## Out of scope
- Rate-limit / timeout / oversized-input UX and the privacy disclosure (M8).
- Card management / search (M5 / M6); DOM-level tests (M7, needs an ADR).
- Custom domain, analytics, CI-gated preview deploys (not required for the milestone).

## Note on the issue text
GitHub issue #4 still says `ANTHROPIC_API_KEY` (pre-dates ADR 004). The real secret is
`GEMINI_API_KEY` — ADR 004 swapped the provider to Gemini's free tier. The issue body is
stale; this doc + the ADRs are authoritative.
