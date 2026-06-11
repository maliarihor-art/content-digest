# Retrospective 004 — Serverless AI proxy (M2)

## What shipped
A stateless Vercel proxy that turns article text into a validated `Digest`:
- `app/src/digest/ai/service.ts` — pure orchestration `runDigest(body, call)`
  + `extractArticleText`, with the network call injected as a `DigestCaller`.
  Maps every outcome to an HTTP-shaped result (200 / 400 / 502) and never throws.
- `api/digest.ts` — thin Vercel handler (repo root). The only I/O boundary: reads
  `process.env.GEMINI_API_KEY` and calls **Google Gemini's free tier over `fetch`**
  (no SDK — ADR 004), forcing `responseMimeType: "application/json"`.
- Root `package.json` carries **zero runtime deps** (fetch only) + a `typecheck:api`
  script; `api/tsconfig.json` type-checks the boundary; `.env.example` documents
  `GEMINI_API_KEY`.

## What worked
- **The M1 carry-forward held exactly.** `buildDigestPrompt`, `parseDigestResponse`,
  `DIGEST_MODEL`, `DIGEST_MAX_TOKENS` were imported, not rebuilt.
- **The escalation gate paid off again.** "Everything must be free" conflicted with
  ADR 003's paid Anthropic API. Surfacing it (instead of silently complying or
  faking a free Claude path) turned it into a clean recorded pivot —
  [ADR 004](../decisions/004-free-ai-via-gemini.md), Gemini free tier.
- **The provider-neutral seam absorbed the pivot cheaply.** `parseDigestResponse`
  validates JSON regardless of provider, and `runDigest` injects a `DigestCaller`
  returning a plain string — so switching Anthropic→Gemini touched only the boundary
  caller + a renamed type + the default model id. No test logic changed; 60 specs
  stayed green.
- **Dropping the SDK for `fetch`** removed the one runtime dependency entirely —
  more aligned with the free/minimal constraint and simpler to host.

## What didn't / friction
- **Churn from a late provider change.** We built the Claude version first, then
  reworked it on the same (unmerged) PR branch. Lesson for future ADR-gated tech:
  confirm cost/free-tier constraints *before* writing the boundary, not after.
- **Cross-boundary import + type-checking.** `api/digest.ts` imports `app/src/...`;
  handled via a dedicated `api/tsconfig.json` (lib `DOM` for `fetch`/`Request`/
  `Response`, `types: ["node"]` for `process.env`) + `typecheck:api`.
- **Free-tier rate limits + data-use.** Gemini's free tier is rate-limited and may
  use prompts to improve Google's products — both must surface in the M8 privacy
  note alongside the existing "content leaves the browser" disclosure.

## Acceptance status
- Pure core: **green** (60/60, 1 live spec skipped without a key), build + lint +
  `typecheck:api` clean.
- Live round-trip with a real Gemini key is **owner-gated** (free key from Google
  AI Studio, no card) — verified by the owner / temporary harness.

## Workflow changes (applied this session)
- New [ADR 004](../decisions/004-free-ai-via-gemini.md); `constraints.md` gains the
  "no paid services" constraint + its ADR 004 resolution.
- `CLAUDE.md`, `roadmap.md`, `task-plan.md`, `overview.md`, and the M2 requirements
  doc updated from Anthropic/paid → Gemini/free.
- Carry-forward to **M3**: call `POST /api/digest`; on any non-200 (network failure,
  rate-limit, missing key) fall back to the local `buildDigest`. Reuse the `Digest`
  contract so the board/card UI stays untouched. Add loading + error states.
