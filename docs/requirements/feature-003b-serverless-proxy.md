# Feature 003b — Serverless Claude proxy (M2)

## User story
As the app, I want a stateless serverless function that holds the Anthropic key
server-side and turns article text into a validated `Digest`, so the frontend
(M3) can request real AI summaries without ever seeing the key.

## Scope decisions (see [ADR 003](../decisions/003-real-ai-via-serverless.md))
- **Reuse the M1 seam:** `buildDigestPrompt`, `DIGEST_MODEL`, `DIGEST_MAX_TOKENS`,
  and `parseDigestResponse` — do **not** rebuild prompt or validation.
- **Pure core, thin adapter.** All logic lives in a pure, unit-tested module
  `app/src/digest/ai/service.ts` (`runDigest(body, callClaude)`); the actual
  Claude call is **injected** as a `ClaudeCaller`. The Vercel handler
  `api/digest.ts` (repo root) only reads `process.env.ANTHROPIC_API_KEY`, wires
  the real `@anthropic-ai/sdk` caller, and forwards the core's HTTP result.
- **Stateless.** Persists nothing — forwards text to Claude, returns the digest.
- **`api/` at repo root** is the Vercel convention; it is the one sanctioned
  exception to "no app code outside `app/`" (roadmap M2 + ADR 003). The testable
  logic still lives under `app/src/`.

## Acceptance criteria

### runDigest (pure core)
- GIVEN a body `{ text: "<non-empty article>" }` and a `ClaudeCaller` that returns
  a valid digest JSON string
  WHEN `runDigest(body, call)` runs
  THEN it resolves to `{ status: 200, body: <Digest> }` where the digest obeys the
  M1 invariants, and the caller was invoked with `buildDigestPrompt(text)`.
- GIVEN a body that is not an object, lacks `text`, has a non-string `text`, or an
  empty/whitespace `text`
  WHEN `runDigest` runs
  THEN it resolves to `{ status: 400, body: { error } }` and the caller is **not**
  invoked.
- GIVEN a `text` longer than the input cap
  WHEN `runDigest` runs
  THEN it resolves to `{ status: 400, body: { error } }` (caller not invoked).
- GIVEN the `ClaudeCaller` rejects (network/SDK error)
  WHEN `runDigest` runs
  THEN it resolves to `{ status: 502, body: { error } }` and never throws.
- GIVEN the `ClaudeCaller` resolves with malformed JSON / a non-`Digest` reply
  WHEN `runDigest` runs
  THEN it resolves to `{ status: 502, body: { error } }` (the M1 parse error) and
  never throws.

### api/digest.ts (adapter — owner-verified)
- Non-`POST` requests return `405`.
- A `POST` with a JSON body is forwarded to `runDigest`; the result's `status` and
  `body` are returned verbatim as JSON.
- The handler reads the key only from `process.env.ANTHROPIC_API_KEY`; a missing
  key surfaces as a `502` via the caller (never a `200`).

## Out of scope
- Frontend wiring + heuristic fallback (M3).
- `vercel.json` / hosting / secret provisioning (M4).
- Rate-limit / timeout / oversized-input UX polish (M8 refines the cap).

## Open questions
- None. Model/token budget come from M1's exports; the input cap is a coarse guard
  (50k chars) that M8 may refine.
