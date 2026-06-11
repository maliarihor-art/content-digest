# Retrospective 003 — AI Summarization Core (M1)

## What we did
Delivered milestone M1 spec-first. Wrote [feature-003](../requirements/feature-003-ai-summarization.md), then two failing specs, watched them go red (missing modules), and implemented two pure, network-free modules under `app/src/digest/ai/`:
- `buildDigestPrompt(text)` — builds a deterministic Claude Messages API request payload whose system prompt enumerates the `CATEGORIES` taxonomy and the four `Digest` fields and demands JSON-only output.
- `parseDigestResponse(input)` — strictly validates a reply (object or JSON string) into a `Digest`, or returns `{ ok: false, error }`. Never throws. 23 new tests; full suite 50 green, lint clean, build clean.

## What worked
- **The `Digest` seam from ADR 002 held.** Both modules reuse the existing `Digest` / `Category` / `CATEGORIES` types instead of redefining them, so the LLM path and the heuristic path produce the same shape — exactly the swap point predicted in retro 002.
- **Pure-module discipline made M1 entirely unit-testable** with no key, network, or SDK — matching the milestone's "no network/key" goal. No browser verification was needed (the change is logic, not UI).
- **`ParseResult` discriminated union over throwing** gives M3 a clean branch for the heuristic fallback (`if (!result.ok) fallback()`), and `noUncheckedIndexedAccess` was satisfied by guarding parsed JSON behind explicit type predicates (`isStringArray`, `isCategory`).
- **Normalizing in the parser** (trim summary, lowercase+dedupe+cap tags, cap keyPoints) keeps the LLM output obeying the same invariants feature-002 established for the heuristic digest.

## What didn't / friction points
- **Git identity was unset** in the freshly cloned repo, blocking the first commit. Set a repo-local `user.name`/`user.email` (GitHub noreply) and continued. Minor, one-time.
- **`model` / `max_tokens` placement** is a judgment call: M1 owns a complete request payload with exported defaults (`DIGEST_MODEL`, `DIGEST_MAX_TOKENS`), which the M2 proxy may override. Recorded here so M2 doesn't duplicate or fight these constants.

## Decisions to carry forward
- Reaffirms [ADR 003](../decisions/003-real-ai-via-serverless.md): real AI via a serverless proxy. M2 should import `buildDigestPrompt` and `DIGEST_MODEL`/`DIGEST_MAX_TOKENS` rather than reconstruct the payload, and call `parseDigestResponse` on the upstream reply.

## Changes made to CLAUDE.md / constraints / working agreement
- Updated `CLAUDE.md` "Current state" with the M1 summary and added feature-003 to the documentation map.
- Linked this retro in the Self-improvement log (below).
- No constraint or working-agreement changes — existing guardrails fit M1 as-is.

## Open questions for next session (M2)
- Where does the model id get overridden — env var on the serverless function, or always the exported default? Decide in M2 and keep it server-side per ADR 003.
