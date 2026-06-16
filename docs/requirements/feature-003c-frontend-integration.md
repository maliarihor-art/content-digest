# Feature 003c — Frontend integration + fallback (M3)

## User story
As a user pasting an article, I want the app to produce a **real AI digest** via the
serverless proxy when it's reachable, and a **local heuristic digest** when it isn't —
with clear loading and status feedback — so the experience degrades gracefully and never
blocks on the network or a missing key.

## Scope decisions (see [ADR 003](../decisions/003-real-ai-via-serverless.md), [ADR 004](../decisions/004-free-ai-via-gemini.md))
- **Reuse the `Digest` contract.** The board and card UI are unchanged — only *how* a
  digest is produced changes. No new persisted shape.
- **Branching lives in a pure module.** A new pure, unit-tested
  `app/src/digest/ai/client.ts` owns the request + fallback decision. `App.tsx` stays
  render-only (per the working agreement / Rules): it calls the client and renders the
  outcome, holding only React state (input, loading, outcome notice).
- **Inject I/O.** `requestDigest(text, deps)` takes an injected `fetch` and `fallback`
  (default `buildDigest`), so the whole decision tree is testable with **no network**.
- **Fallback is silent-but-disclosed.** On any AI failure we still return a usable digest
  from `buildDigest(text)`; the outcome carries `source: 'local'` and a human `notice`
  so the UI can surface "used offline summary" without an error wall.
- **Endpoint.** `POST /api/digest` with `{ text }`, per the M2 contract; a `200` body is
  validated through M1's `parseDigestResponse` before use (defence in depth — never trust
  the wire shape).

## Contract — `requestDigest(text, deps): Promise<DigestOutcome>`

`DigestOutcome = { digest: Digest; source: 'ai' | 'local'; notice?: string }`

- GIVEN `fetch` resolves `200` with a body that validates as a `Digest`
  WHEN `requestDigest` runs
  THEN it resolves `{ source: 'ai', digest }` (the parsed/normalised digest) and `fallback`
  is **not** called; `fetch` was called once with `POST /api/digest`, JSON `{ text }`.
- GIVEN `fetch` resolves a non-OK status (e.g. 400/502), OR a `200` whose body fails
  `parseDigestResponse`, OR `fetch` rejects (network/offline)
  WHEN `requestDigest` runs
  THEN it resolves `{ source: 'local', digest: fallback(text), notice }` and never throws.
- GIVEN the same `text`
  WHEN the AI path fails
  THEN the returned digest equals `buildDigest(text)` (deterministic fallback parity).

## UI behaviour (App.tsx — render-only)
- "Add digest" is disabled while a request is in flight; a loading indicator shows.
- On success, a card is added exactly as today; if `source === 'local'`, a non-blocking
  notice ("Used a local summary — AI was unavailable") is shown.
- The form clears only after a card is successfully added.
- Empty/whitespace input is still blocked client-side (unchanged).

## Acceptance criteria
- `client.spec.ts` green: AI-success path, each fallback trigger (non-OK, bad body,
  network reject), fallback-parity with `buildDigest`, and request shape (`POST`, JSON
  `{ text }`) — all with an injected `fetch`, no real network.
- `App.tsx` contains no branching/transform logic beyond wiring state to the client.
- Build + lint + `test:run` clean; existing specs stay green.

## Out of scope
- `vercel.json` / hosting / secret provisioning (M4 — needed to exercise the live AI path).
- Rate-limit / timeout / oversized-input UX polish and the privacy disclosure (M8).
- Card management / search (M5/M6); DOM-level component tests (M7, needs an ADR).

## Open questions
- None. Model/token budget come from M1; the fallback-vs-AI-only choice is resolved
  (keep the heuristic fallback — roadmap "Direction" + retro 004 carry-forward).
