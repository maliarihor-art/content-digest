# Roadmap — Content Digest

Milestone-level plan. Each milestone maps to **one GitHub issue** (title prefixed `Mx —`) and links back here. This roadmap is the architecture overview per milestone; deeper detail lives in the linked ADRs and per-feature requirements docs.

- Product context: [PRD.md](PRD.md)
- Granular how-to steps: [task-plan.md](task-plan.md)
- Decisions: [decisions/](decisions/) · Guardrails: [constraints.md](constraints.md)
- Working agreement (spec → test → code → green → retro; ADR per architectural change): [CLAUDE.md](../CLAUDE.md)

## Already shipped (foundation — not tracked as forward issues)

| | Scope | Docs |
|---|---|---|
| **F001** | Spec-first bootstrap, hello-world | [feature-001](requirements/feature-001-hello-world.md), [ADR 001](decisions/001-agent-structure.md) |
| **F002** | Local digest pipeline + topic board + `localStorage` | [feature-002](requirements/feature-002-content-digest.md), [ADR 002](decisions/002-content-digest-pipeline.md) |

Cards, board, grouping, and persistence already exist — so the forward milestones build on them rather than recreating them.

## Direction

Replace the local heuristic with **real AI** (Google Gemini, free tier) behind a **Vercel serverless proxy** ([ADR 003](decisions/003-real-ai-via-serverless.md), [ADR 004](decisions/004-free-ai-via-gemini.md)), then round out UX (card management, search) and resilience. The local heuristic stays as an offline fallback. The `Digest` interface is the stable seam between "how a digest is produced" and "the board/UI".

---

## M1 — AI summarization core (prompt + validation)
- **Goal:** deterministic, unit-tested pieces of the Claude integration that need **no network/key**.
- **Architecture:** two pure modules under `app/src/digest/ai/` — `buildDigestPrompt(text)` (composes the Claude request payload) and `parseDigestResponse(json)` (validates Claude's JSON against the `Digest` shape + fixed taxonomy, mirroring the guard style in `board/store.ts`). No SDK calls here; specs cover prompt shape and strict parsing of good/bad responses.
- **Docs:** [ADR 003](decisions/003-real-ai-via-serverless.md); requirements → `requirements/feature-003-ai-summarization.md` (created when work starts).
- **Acceptance:** specs green for prompt construction and response validation (valid → `Digest`; malformed → rejected).
- **Depends on:** —. **Needs key?** No.

## M2 — Serverless AI proxy (`api/digest`)
- **Goal:** a stateless function that holds the key and calls the AI provider.
- **Architecture:** `api/digest.ts` (Vercel convention, repo root `api/`). Calls **Google Gemini's free tier over `fetch`** ([ADR 004](decisions/004-free-ai-via-gemini.md)) — no SDK, zero runtime deps. Reads `process.env.GEMINI_API_KEY`; uses M1's prompt/parse helpers (provider-neutral); returns `Digest` JSON or a clear error. Persists nothing (constraint: stateless proxy only).
- **Docs:** [ADR 003](decisions/003-real-ai-via-serverless.md), [ADR 004](decisions/004-free-ai-via-gemini.md).
- **Acceptance:** function returns a valid `Digest` for sample text via `vercel dev` locally.
- **Depends on:** M1. **Needs key?** Yes (free Gemini key in local `.env`).

## M3 — Frontend integration + fallback
- **Goal:** the UI uses real AI, degrading gracefully.
- **Architecture:** on "Add digest", `POST /api/digest`; on success use the returned `Digest`; on network/error/missing-key, fall back to local `buildDigest(text)`. Add loading + error states. Board/card components unchanged (same `Digest` interface).
- **Docs:** `requirements/feature-003-ai-summarization.md`.
- **Acceptance:** real digest when the function is up; heuristic digest when it's not; visible loading/error UI.
- **Depends on:** M2. **Needs key?** Yes (to exercise the AI path).

## M4 — Vercel hosting + deploy
- **Goal:** the app (frontend + function) live on the internet.
- **Architecture:** `vercel.json` (build `npm run build` → `app/dist`, `outputDirectory: app/dist`, functions in `api/`). `GEMINI_API_KEY` set as a Vercel project secret. Replaces the earlier GitHub Pages idea (Pages can't run functions).
- **Docs:** [ADR 003](decisions/003-real-ai-via-serverless.md), [ADR 004](decisions/004-free-ai-via-gemini.md).
- **Acceptance:** deployed URL serves the app and produces a real AI digest.
- **Depends on:** M3 + prerequisites P1–P3 (free Gemini key, Vercel account+import, secret). **Needs ADR/secret?** Secret required.

## M5 — Card management
- **Goal:** edit the board, not just append to it.
- **Architecture:** pure store fns (spec-first) `removeCard`, `updateCardTitle`, `recategorize`; per-card UI controls (delete, inline title edit, category select). Persists via existing `localStorage`. No new tech.
- **Docs:** `requirements/feature-004-card-management.md`.
- **Acceptance:** delete/edit/re-categorize work and survive reload; pure fns unit-tested.
- **Depends on:** — (independent of AI). **Needs key?** No.

## M6 — Search & filter
- **Goal:** find cards across the board.
- **Architecture:** pure `filterCards(board, { query, tag })` (case-insensitive over title/summary/tags, reusing `digest/text.ts` tokenization) + search box and clickable tag chips; section counts reflect the filtered set.
- **Docs:** `requirements/feature-005-search-filter.md`.
- **Acceptance:** filtering by text and by tag narrows the board correctly; pure fn unit-tested.
- **Depends on:** M5 (shares card UI). **Needs key?** No.

## M7 — DOM-testing layer
- **Goal:** test the now-interactive UI directly.
- **Architecture:** add `@testing-library/react`, `@testing-library/user-event`, `jsdom` (dev deps); `jsdom` env for `*.tsx` specs while pure modules stay on `node`. Requires its own **ADR 004** (working-agreement rule 5: add a DOM-testing layer only via an ADR).
- **Docs:** ADR 004 (to be written).
- **Acceptance:** component tests for the digest form and card controls pass.
- **Depends on:** M5/M6. **Needs ADR?** Yes (ADR 004).

## M8 — Resilience & polish
- **Goal:** behave well under real-world failure.
- **Architecture:** handle Anthropic errors/rate limits/timeouts in `api/digest`; user-facing messages; guard empty/huge inputs; add a privacy note (content is sent to Anthropic) to the UI + README; optional request size cap.
- **Docs:** [ADR 003](decisions/003-real-ai-via-serverless.md) (privacy note), README.
- **Acceptance:** graceful, clear behavior on API failure, rate limit, and oversized input; privacy disclosure visible.
- **Depends on:** M2–M4. **Needs key?** Partially (to test error paths).

---

## Dependency view

```
M1 → M2 → M3 → M4            (AI track; M4 needs P1–P3)
M5 → M6                      (UX track; independent of AI)
M5/M6 → M7                   (DOM tests; needs ADR 004)
M2–M4 → M8                   (resilience)
```

AI track (M1–M4) and UX track (M5–M6) are independent — either can go first.
