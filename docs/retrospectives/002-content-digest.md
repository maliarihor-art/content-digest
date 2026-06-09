# Retrospective 002 — Content Digest

## What we did
Built Feature 002 spec-first. The request ("paste a link → AI summarizes → card on a topic board") conflicted with the no-backend / no-new-dep constraints, so we escalated, the owner chose to stay in-charter, and we recorded the resolution in [ADR 002](../decisions/002-content-digest-pipeline.md): paste **text** (not URL), **local extractive heuristics** (not an LLM), **localStorage** persistence. Implemented six pure modules under `app/src/digest/` and `app/src/board/` (text helpers, summary/key-points, tags, category, digest orchestrator, board store) with 26 new tests, then wired a render-only `App.tsx` over them.

## What worked
- **The escalation gate did its job.** A request that would have quietly required a backend instead became an explicit, recorded decision before any code was written. This is exactly what the working agreement is for.
- **Pure-module discipline paid off.** Every piece of logic (scoring, grouping, serialization, category rules) is deterministic and unit-tested; `App.tsx` is pure glue. Writing all specs first, watching 6 suites go red, then green, was smooth.
- **The `Digest` interface is a clean seam** — if the charter is ever relaxed, `buildDigest` can be swapped for an LLM implementation without touching the board or UI.
- **`noUncheckedIndexedAccess` caught real gaps** — forced explicit guards on `scoreSentences()[0]` and parsed-JSON access in `deserializeBoard`, which also made the "invalid input → empty board" behavior robust.

## What didn't / friction points
- **Browser-level verification was unavailable** — the Claude-in-Chrome extension was not connected, and the preview tool resolves `.claude/launch.json` from the *session root* (parent dir), not the repo, so `npm run dev` there would fail. Verification rested on unit tests + `tsc` build + curl. **Carry-forward:** for the next UI feature, either keep logic in pure modules (so units cover it) or add a DOM-testing layer via ADR (working agreement rule 5) rather than depending on live browser tooling.
- **Heuristic quality is coarse** — sum-of-frequency sentence scoring favors longer sentences, and the fixed 7-topic taxonomy misses nuance. Acceptable per ADR 002; noted as a known limitation.

## Decisions to carry forward
- [ADR 002](../decisions/002-content-digest-pipeline.md) — content digest as a local pure-module pipeline; URL ingestion and real-LLM summarization remain deferred behind a future constraint amendment.

## Changes made to CLAUDE.md / constraints / working agreement
- Updated `CLAUDE.md` "Current state" to describe the Content Digest board.
- Added Feature 002 + ADR 002 to the `CLAUDE.md` documentation map and linked this retro in the Self-improvement log.
- No constraint or working-agreement changes — the existing guardrails held up and actively shaped the design.

## Open questions for next session
- If/when an LLM or URL-fetch is wanted, which path: browser-side key + proxy, or a real backend? That decision needs its own ADR and a `constraints.md` amendment.
