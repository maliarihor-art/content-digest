# Retrospective 005 — Frontend integration + fallback (M3)

## What shipped
The UI now produces real AI digests when the proxy is reachable and degrades to the
local heuristic when it isn't:
- `app/src/digest/ai/client.ts` — pure (but for injected I/O) `requestDigest(text, deps)`.
  POSTs `{ text }` to `/api/digest`; on `200` it re-validates the body through M1's
  `parseDigestResponse` (never trust the wire); on any non-OK status, invalid body, or
  network error it returns `buildDigest(text)` with `source: 'local'` + a human `notice`.
  Never throws. `fetch` and `fallback` are injected, defaulting to `globalThis.fetch` /
  `buildDigest`, so the whole decision tree is unit-tested with no network.
- `App.tsx` stays render-only: it gained `loading` + `notice` React state and an async
  `handleAdd` that awaits `requestDigest`, plus a "Summarizing…" button label, an
  in-flight status, and a non-blocking fallback banner. No branching/transform logic.
- `docs/requirements/feature-003c-frontend-integration.md` — the M3 spec.

## What worked
- **The `Digest` seam held a third time.** Board/card components were untouched — only
  *how* a digest is produced changed. The carry-forward from retro 004 (call `/api/digest`,
  fall back to `buildDigest`, add loading/error states) mapped 1:1 onto the work.
- **Branching-in-a-pure-module paid off in verification.** Because all the fallback logic
  lives in `client.ts` with injected `fetch`, the 7 specs cover every path (AI success,
  body normalisation, non-OK, invalid body, network reject, `json()` throw) deterministically
  — no DOM test, no network, no key. App stayed render-only, so there was little left to
  test in the component.
- **Re-validating the AI body through M1's parser** (defence in depth) gave a free spec
  case and means a misbehaving proxy can't inject a malformed `Digest` into the board.
- **The 404-in-dev reality became the verification.** Plain `vite dev` has no `/api/digest`,
  so the live run exercised exactly the fallback path: a card filed under Technology with a
  heuristic digest + the "Used a local summary" banner. The AI-success path is covered by
  specs and is owner-gated behind `vercel dev` (M4).

## What didn't / friction
- **`preview_fill` doesn't drive React controlled inputs.** It set the DOM `value` without
  firing React's `onChange`, so state stayed empty and `canAdd` was false — the first two
  click attempts silently no-oped. Fix: set the value via the native prototype setter and
  dispatch a bubbling `input` event (React's documented escape hatch). Carry-forward below.
- **`preview_screenshot` timed out twice** (flaky renderer). The accessibility snapshot is
  the preferred, more robust proof anyway and was conclusive; don't block a turn on the
  screenshot when the snapshot already verifies structure + text.

## Acceptance status
- Specs: **green** (75/75; +7 for `client.spec.ts`). Lint + `tsc -b` + `vite build` clean.
- Live (dev) fallback path: **verified** — card added with a heuristic digest and the
  fallback banner shown; console error-free.
- Live AI-success path: **owner-gated** (needs `vercel dev` + a Gemini key — M4).

## Workflow changes (applied this session)
- `CLAUDE.md` "Current state" gains the M3 paragraph; documentation map links
  `feature-003c`; this retro is linked from the self-improvement log.
- No ADR needed — M3 introduced no new architecture or dependency; it consumes the
  existing serverless contract and the `Digest` seam.

## Carry-forward to M4 (Vercel hosting + deploy)
- Add `vercel.json` (build `npm run build` → `app/dist`, `outputDirectory: app/dist`,
  functions in `api/`); set `GEMINI_API_KEY` as a Vercel secret (P1–P3, owner-provided).
- Verify the **AI-success path** for real on `vercel dev` and the deployed URL — that's the
  one branch specs can't exercise. Confirm Gemini's `responseSchema` casing (retro 004 #2).
- **Browser-verifying React forms:** drive inputs with the native-setter + `input`-event
  trick, not `preview_fill`; prefer `preview_snapshot` over `preview_screenshot` for proof.
