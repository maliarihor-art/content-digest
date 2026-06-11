# Retrospective 004 — Serverless Claude proxy (M2)

## What shipped
A stateless Vercel proxy that turns article text into a validated `Digest`:
- `app/src/digest/ai/service.ts` — pure orchestration `runDigest(body, callClaude)`
  + `extractArticleText`, with the network call injected as a `ClaudeCaller`.
  Maps every outcome to an HTTP-shaped result (200 / 400 / 502) and never throws.
- `api/digest.ts` — thin Vercel handler (repo root) wiring `@anthropic-ai/sdk` +
  `process.env.ANTHROPIC_API_KEY` around the pure core. The only I/O boundary.
- Root `package.json` gains the `@anthropic-ai/sdk` runtime dep (pre-approved by
  ADR 003) and a `typecheck:api` script; `api/tsconfig.json` type-checks the
  boundary; `.env.example` documents the key.

## What worked
- **The M1 carry-forward held exactly.** `buildDigestPrompt`, `parseDigestResponse`,
  `DIGEST_MODEL`, `DIGEST_MAX_TOKENS` were imported, not rebuilt — M2 added only the
  validation/HTTP-mapping shell and the SDK boundary.
- **Dependency injection kept the proxy pure-testable.** Injecting `ClaudeCaller`
  meant the whole milestone's logic (input validation, prompt, parse, status codes,
  error paths) is covered by `node`-env unit tests — no network, no key, no SDK in
  the test path. 10 new tests, all deterministic.
- **The charter's `api/`-at-root exception was already sanctioned** (roadmap M2 +
  ADR 003), so "no app code outside `app/`" didn't block us; the testable logic
  still lives under `app/src/`.

## What didn't / friction
- **Cross-boundary import + type-checking.** `api/digest.ts` imports `app/src/...`
  via a relative path, which the app's own `tsc -b` doesn't cover. Resolved by a
  dedicated `api/tsconfig.json` (lib `DOM` for the Web `Request`/`Response` handler,
  `types: ["node"]` for `process.env`) and a `typecheck:api` script.
- **Two `node_modules` trees now.** Root install (SDK only) is separate from
  `app/`'s. Acceptable because the pure core has zero external deps, so bundling
  `service.ts` into the function needs nothing from `app/node_modules`. M4's
  `vercel.json` will formalize the build.

## Acceptance status
- Pure core: **green** (10/10 new, 60/60 total), build + lint + `typecheck:api` clean.
- Live `vercel dev` round-trip with a real key is **owner-gated** (key + Vercel
  account per ADR 003 prerequisites) — verified by the owner, like M4's secret.

## Workflow changes (applied this session)
- `CLAUDE.md`: "Current state" updated for M2; doc map gains
  `feature-003b-serverless-proxy.md`; "Common commands" gains `typecheck:api`;
  layout note clarifies the sanctioned root `api/` exception.
- Carry-forward to **M3**: call `POST /api/digest`; on any non-200 (or network
  failure / missing key) fall back to the local `buildDigest`. Reuse the `Digest`
  contract so the board/card UI stays untouched. Add loading + error states.
