# ADR 003 — Real AI summarization via a serverless proxy (amends the no-backend constraint)

## Status
Accepted. **Amends [constraints.md](../constraints.md)** and supersedes the relevant "deferred" notes in [ADR 002](002-content-digest-pipeline.md).

## Context
The owner decided to replace the local extractive heuristics with **real LLM summarization (Anthropic Claude API)** and to **publish the app online**. A real LLM requires an API key. The owner explicitly chose to keep the key **server-side** (not exposed in the browser), because a public site with a browser-side key would let anyone extract and abuse it.

This breaks the original charter rule "No backend / API / database" and adds a new runtime dependency — both gated behind this ADR per the working agreement.

## Decision
Adopt a **thin serverless backend that acts solely as a Claude API proxy**, and host the whole app on **Vercel** (static frontend + serverless functions together, which also satisfies the "publish online" goal).

1. **Serverless function `api/digest`** (Vercel convention, at repo root `api/`):
   - reads the key from `process.env.ANTHROPIC_API_KEY` (a Vercel project secret — never committed, never sent to the browser),
   - calls the Anthropic Messages API (default model **`claude-haiku-4-5`** for cost/latency; configurable),
   - prompts Claude to return JSON matching the existing `Digest` shape (`summary`, `keyPoints`, `tags`, `category` from the fixed taxonomy),
   - validates the response and returns it; on any error returns a clear error status.
2. **Frontend calls `POST /api/digest`** instead of computing locally. The request/response contract is the existing `Digest` interface — the seam introduced in ADR 002 is reused, so the board and UI are untouched.
3. **Local heuristic stays as a fallback.** If the API is unreachable, the key is missing, or the call errors, the app falls back to the existing local `buildDigest` so it still works offline / degraded. The heuristic code is NOT deleted.
4. **Key handling:** the key is created and billed by the owner on console.anthropic.com and set as a Vercel secret by the owner. It is never entered by Claude, never committed, never placed in client code or URLs.

### Scope of the amendment (precise)
- **Now allowed:** a single-purpose serverless function that proxies the Claude API. Hosting moves to Vercel.
- **Still forbidden:** a database (persistence stays `localStorage`), user authentication/accounts, any server-side storage of article content or user data. The function is stateless — it forwards text to Claude and returns the digest; it persists nothing.

## Consequences
- **Positive:** Real, high-quality summaries/tags/category. Key stays secret. Vercel hosts frontend + function in one deploy, covering the publishing goal.
- **Positive:** Graceful degradation via the heuristic fallback; the `Digest` seam means minimal UI churn.
- **Negative / trade-off:** Introduces a backend (operational surface, cold starts), a paid dependency (Anthropic usage costs), and a new runtime dependency (`@anthropic-ai/sdk`). Article text now leaves the browser (sent to the function → Anthropic) — a privacy change from the local-only design; this must be stated in the UI/README.
- **Supersedes:** the GitHub Pages plan (Pages can't run serverless functions) — publishing now targets Vercel.

## Prerequisites (owner-provided; cannot be done by Claude)
- Anthropic account + API key + billing enabled.
- Vercel account, repo imported, `ANTHROPIC_API_KEY` set as a project secret.
