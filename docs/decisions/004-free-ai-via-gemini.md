# ADR 004 — Free AI summarization via Google Gemini (amends ADR 003's provider)

## Status
Accepted. **Amends [ADR 003](003-real-ai-via-serverless.md)** — keeps its serverless-proxy
architecture but replaces the AI provider. Everything ADR 003 decided about *shape*
(stateless proxy, `Digest` seam, local heuristic fallback, Vercel hosting) still holds.

## Context
ADR 003 chose the Anthropic Claude API. The owner then set a hard constraint:
**no paid services — everything must run on a free tier.** The Anthropic API has no
free tier for ongoing use (it requires billing), so it conflicts with that constraint.
Per the working agreement, this conflict was surfaced rather than silently accepted, and
the owner chose **Google Gemini**, which offers a genuine free tier (API key from Google
AI Studio, **no credit card**, does not expire; rate-limited per project).

## Decision
Replace the proxy's provider with **Google Gemini, called over plain `fetch`** — no SDK.

1. **No SDK dependency.** The `@anthropic-ai/sdk` runtime dependency is removed. Gemini's
   REST `generateContent` endpoint is called with the built-in `fetch`, so the proxy adds
   **zero runtime dependencies**.
2. **Endpoint & contract.**
   `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`,
   key passed in the `x-goog-api-key` header. The request maps our neutral prompt to
   Gemini's body: `system_instruction.parts[].text` (our `system`),
   `contents[].parts[].text` (our user text), `generationConfig.maxOutputTokens`
   (our `max_tokens`) and **`responseMimeType: "application/json"`** to force JSON-only
   output — which `parseDigestResponse` then validates unchanged.
3. **Model.** Default `gemini-2.5-flash` (free-tier eligible), overridable at the boundary
   via `process.env.GEMINI_MODEL`. The pure `buildDigestPrompt` keeps the default model id
   so it stays deterministic and env-free.
4. **Key handling.** `process.env.GEMINI_API_KEY` (a Vercel project secret in production;
   a local `.env` for dev). Never committed, never sent to the browser — identical
   discipline to ADR 003.

### What carries over unchanged from ADR 003 / M1 / M2
- The proxy stays **stateless** — persists nothing.
- The **`Digest` seam** and `parseDigestResponse` validation are provider-neutral and
  untouched (Gemini's JSON reply is validated exactly like Claude's would have been).
- The **local heuristic fallback** (`buildDigest`) stays as the offline/degraded path.
- Hosting stays **Vercel** (M4).
- M1's `buildDigestPrompt` keeps its shape; only the default model id changes
  (`claude-haiku-4-5` → `gemini-2.5-flash`) and provider-named types are renamed neutrally
  (`ClaudeCaller` → `DigestCaller`).

## Consequences
- **Positive:** Zero cost (free tier, no card), zero runtime dependencies (fetch only),
  and the whole M1/M2 validation seam is preserved.
- **Trade-off:** Free-tier **rate limits** (per-minute / per-day caps) apply — fine for a
  single-developer app; the fallback covers throttling. Gemini may **use free-tier prompts
  to improve Google's products** — a privacy note must accompany the existing
  "content leaves the browser" disclosure (M8 / README).
- **Negative:** A second provider migration's worth of churn in the proxy boundary, and a
  dependency on Google's evolving free-tier model availability (mitigated by the
  `GEMINI_MODEL` override).

## Prerequisites (owner-provided)
- A Google AI Studio API key (free, no card): https://aistudio.google.com/apikey
- Set it as `GEMINI_API_KEY` — local `.env` for dev; a Vercel project secret for deploy.
