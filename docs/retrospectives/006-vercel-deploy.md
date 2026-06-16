# Retrospective 006 — Vercel hosting + deploy (M4)

## What shipped
Content Digest is **live**: <https://content-digest-seven.vercel.app> serves the app and
produces a real Gemini AI digest in production.
- `vercel.json` — `buildCommand: npm run build`, `outputDirectory: app/dist`,
  `installCommand: npm install --prefix app`, `maxDuration: 30` for `api/digest.ts`.
- `docs/requirements/feature-003d-vercel-deploy.md` — the M4 spec (config, not logic; no
  new pure module/spec — recorded deviation).
- `docs/deploy.md` — owner-gated deploy runbook.
- `api/digest.ts` — **pinned to the Edge runtime** (`export const config = { runtime: 'edge' }`)
  to fix a production 500 (below). No logic change.
- Deployed via the **Vercel dashboard GitHub import** (free Hobby tier, auto-deploy on push,
  PR previews) — no CLI needed.

## What worked
- **The provider-neutral seam let us verify before deploying.** With a working key, a direct
  `curl` of `generateContent` using the exact `buildGeminiBody` shape (system prompt +
  `responseSchema` + category enum) returned a well-formed `Digest` (HTTP 200). That
  **resolved the open note in `gemini.ts`** (retro 004 #2): the lowercase JSON-Schema `type`
  casing is correct — no 400.
- **`runDigest`'s never-throw design made diagnosis instant.** Because the core maps every
  failure to 400/502 and provably can't throw, the production 500 *had* to be the I/O shell
  in `api/digest.ts` — not the logic. That narrowed the bug to the handler boundary in one
  step.
- **Dashboard import was the right "free + correct" call.** Auto-detected all build settings
  from `vercel.json`; the only manual field was the `GEMINI_API_KEY` env var. Zero
  interactive-CLI/browser-auth friction (which an agent can't complete anyway).

## What didn't / friction
- **The Web-standard handler crashed on Vercel's default Node runtime.** `api/digest.ts`
  (from M2) is written to `Request → Response` / `req.json()` / `Response.json()`. On the
  Node runtime that boundary returned **HTTP 500 `FUNCTION_INVOCATION_FAILED`**. It was never
  caught earlier because **M2/M3 were never run on a real Vercel runtime** — unit tests inject
  the caller and never exercise the platform's handler contract. Fix: pin `runtime: 'edge'`,
  where the Web-standard signature is native. One-line, free, no new dependency.
- **Wrong credential first.** The initial key (`AQ.Ab8…`, an OAuth-type token) returned
  `401 ACCESS_TOKEN_TYPE_UNSUPPORTED`; a real AI Studio key (also `AQ.Ab8…` format, but valid)
  worked. Lesson: validate the key with a one-line `curl` before any deploy plumbing.
- **Secret almost committed.** The key was first pasted into the **tracked** `.env.example`
  (not the gitignored `.env`). Caught and reverted before any commit. The runbook now stresses
  `.env`, not `.env.example`.
- **`content-digest.vercel.app` is someone else's project.** The clean global alias was taken
  (its `/api/digest` is a FastAPI app expecting a `url` field). Our app is the team-slugged
  `content-digest-seven.vercel.app`. Probing the wrong host wasted a cycle.
- **Preview deploys stayed auth-protected.** Disabling Deployment Protection applied to
  production only, so the PR-preview URL returned Vercel's "Authentication Required" page and
  couldn't be `curl`-verified. We validated the fix on production after merge instead.
- **M3 was sitting unmerged** when M4 began (its commits were only on the feature branch).
  Caught at the start of M4; opened + squash-merged PR #11 before basing M4 on master.

## Acceptance status
- Deployed URL serves the app: **verified** (HTTP 200).
- Real AI digest in production: **verified** — `POST /api/digest` returns a valid `Digest`
  (`summary` / `keyPoints` / `tags` / `category: Technology`).
- Graceful degradation: client-side fallback is unchanged from M3 (browser-verified there);
  the deployed proxy now succeeds, so the banner only appears on a real outage/rate-limit.
- Suite still green (75 specs); `npm run build` + `npm run typecheck:api` clean.

## Workflow changes (applied this session)
- `CLAUDE.md` "Current state" finalised for M4 with the live URL; self-improvement log links
  this retro.
- `gemini.ts` schema note rewritten to "live-verified" (no longer a TODO).
- **No new ADR.** Edge-vs-Node is a runtime detail of the existing serverless proxy
  (ADR 003/004), not a new architectural decision or dependency.

## Carry-forward
- **Verify the platform handler contract, not just the logic.** Unit tests injecting the
  caller can't catch a runtime/signature mismatch — the I/O shell needs a real-deploy smoke
  test. (Now satisfied; keep it in mind for any future function.)
- **Edge runtime constraint:** `api/digest.ts` must stay free of Node-only APIs (it already
  uses only `fetch` / `AbortSignal.timeout` / `process.env` / `Response`). M8 error-handling
  work must respect this.
- **Merge each milestone's PR before starting the next** — don't stack unmerged milestones.
- **Secrets → `.env` (gitignored), never `.env.example`;** validate any API key with a
  one-line `curl` before wiring it into a deploy.
- To `curl`-verify a PR preview, Deployment Protection must be disabled for **Preview** too
  (or use a protection-bypass token).
- M8 can now exercise the real deployed error paths (rate-limit `429` → client fallback,
  oversized input) and add the privacy disclosure (content is sent to Google Gemini).
