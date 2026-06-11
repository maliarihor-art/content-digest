# Feature 003 — AI Summarization Core

> **Amended by [ADR 004](../decisions/004-free-ai-via-gemini.md):** the seam is
> provider-neutral. The default model id is now `gemini-2.5-flash` and the request
> is mapped onto Google Gemini in the proxy. Where this doc says "Claude", read
> "the AI provider"; the prompt/parse contracts below are unchanged.

## User story
As a developer relying on the digest pipeline, I want the Claude integration's
deterministic pieces — prompt construction and response validation — to be pure,
unit-tested modules with no network or API key, so that the serverless proxy (M2)
and frontend integration (M3) can build on a trustworthy seam.

## Scope decisions (see ADR 003)
- **Pure only:** no SDK calls, no network, no key, no time/randomness. Same input → same output.
- **Two modules** under `app/src/digest/ai/`:
  - `buildDigestPrompt(text)` — builds the Claude **Messages API request payload**
    (`model`, `max_tokens`, `system`, `messages`). It does **not** send anything.
  - `parseDigestResponse(input)` — strictly validates Claude's JSON reply against the
    `Digest` shape and the fixed taxonomy, returning a discriminated result.
- **Reuse the contract:** `Digest` (`summary`, `keyPoints`, `tags`, `category`) and
  `CATEGORIES` are the existing types from `app/src/digest/` — not redefined.

## Acceptance criteria

### buildDigestPrompt
- GIVEN any article text
  WHEN `buildDigestPrompt(text)` runs
  THEN it returns a payload with a non-empty `model`, a positive `max_tokens`, a `system`
  string, and `messages` containing exactly one `user` message whose content includes the
  supplied text.
- GIVEN the prompt payload
  WHEN inspected
  THEN the `system` instruction names every category in `CATEGORIES`, names all four
  `Digest` fields (`summary`, `keyPoints`, `tags`, `category`), and instructs the model to
  reply with **JSON only** (no prose, no markdown fences).
- GIVEN the same input text
  WHEN `buildDigestPrompt` runs twice
  THEN both payloads are deeply equal (deterministic).
- GIVEN empty text
  WHEN `buildDigestPrompt('')` runs
  THEN it returns a valid payload without throwing.

### parseDigestResponse
- GIVEN a well-formed JSON object (or JSON string) with a non-empty `summary`, string
  arrays `keyPoints`/`tags`, and a `category` from the taxonomy
  WHEN `parseDigestResponse(input)` runs
  THEN it returns `{ ok: true, digest }` where `digest` satisfies the `Digest` invariants:
  trimmed non-empty `summary`, `keyPoints` ≤ 5, `tags` lowercased + unique + ≤ 6, and a
  valid `category`.
- GIVEN malformed input — non-JSON string, non-object, missing field, wrong-typed field
  (e.g. `summary` not a string, `keyPoints` not an array of strings), or a `category`
  outside the taxonomy
  WHEN parsed
  THEN it returns `{ ok: false, error }` and never throws.

## Out of scope
- Sending the request / handling HTTP (M2 — serverless proxy).
- Wiring prompt+parse into the UI and the heuristic fallback (M3).
- Streaming, retries, cost/latency tuning.

## Open questions
- None. Model id and token budget are defaults exported from the prompt module and may be
  overridden by the proxy in M2; the taxonomy is fixed (see `category.ts`).
