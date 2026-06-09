# Task Plan — Content Digest

Actionable breakdown of upcoming work, derived from the [PRD](PRD.md) and the decisions in the ADRs. **Updated 2026-06-09** for the pivot to real AI ([ADR 003](decisions/003-real-ai-via-serverless.md)): the app gains a thin **serverless Claude proxy** and is hosted on **Vercel**; the local heuristic stays as a fallback.

Every item follows the working agreement in [CLAUDE.md](../CLAUDE.md): feature = requirements doc → failing test → minimal code → green → commit → retrospective; architectural changes get an ADR first.

## Technology overview

| Capability | Technology | New? |
|---|---|---|
| App, UI, logic, unit tests | Vite + React + TS + Vitest (current) | — in place |
| Real summarization | **Anthropic Claude API** (`@anthropic-ai/sdk`, model `claude-haiku-4-5`) | **New runtime dep** ([ADR 003](decisions/003-real-ai-via-serverless.md)) |
| API key safety | **Vercel serverless function** (`api/digest`) holding the key as a secret | **New backend** (ADR 003) |
| Hosting (frontend + function) | **Vercel** | **New infra** |
| Offline / fallback | existing local heuristic `buildDigest` | — kept |
| Persistence | `localStorage` | — unchanged |
| Card management & search (later) | pure TS + React (current stack) | No new tech |

## Prerequisites — YOU provide these (Claude cannot)

These are accounts/keys/secrets — I never create accounts or enter keys.

- **P1.** Anthropic account on console.anthropic.com → create an **API key** → enable **billing**.
- **P2.** Vercel account → **import** the `content-digest` GitHub repo.
- **P3.** In Vercel project settings → add secret env var **`ANTHROPIC_API_KEY`** = your key. (Also keep it in a local `.env` — gitignored — for local dev.)

I'll tell you exactly when each is needed.

---

## Track 1 — Real AI via serverless (primary)

The existing `Digest` interface is reused, so the board and most UI are untouched — we swap *how* a digest is produced.

- **T1.0 — ✅ ADR 003 + constraints amendment.** Done this session (allow a stateless Claude-proxy function; DB/auth still forbidden).
- **T1.1 — Requirements doc.** `docs/requirements/feature-003-ai-summarization.md`: contract (`POST /api/digest` ↔ `Digest`), model, fallback behavior, error states, privacy note (text leaves the browser).
- **T1.2 — Anthropic SDK + prompt module (spec-first, testable parts).**
  - Add `@anthropic-ai/sdk` (root deps for the function).
  - Pure, unit-tested helpers: `buildDigestPrompt(text)` and `parseDigestResponse(json)` (validates the model's JSON against the `Digest` shape / taxonomy — reuse the `isCard`/category-guard style from `board/store.ts`). These are testable **without** network calls.
- **T1.3 — Serverless function `api/digest.ts`.** Reads `process.env.ANTHROPIC_API_KEY`, calls Claude with the prompt, validates via `parseDigestResponse`, returns the `Digest` JSON; clear error on failure. *(May need to be created/committed from your terminal if the classifier blocks the path — I'll provide contents.)*
- **T1.4 — Frontend integration + fallback.** On "Add digest": `POST /api/digest`; on success use the returned `Digest`; on network/error/missing-key, fall back to local `buildDigest(text)`. Add loading + error UI states. Keep determinism note: AI results vary, that's expected.
- **T1.5 — Vercel config.** `vercel.json`: build the frontend (`npm run build` → `app/dist`), `outputDirectory: app/dist`, functions in `api/`. Local dev via `vercel dev` (uses `.env`). Needs **P1–P3**.
- **T1.6 — Verify + retro.** Confirm a real AI digest end-to-end locally (`vercel dev`) and on the deployed URL; `chore(retro): 003`. Update README + PRD (privacy note: content is sent to Anthropic).

**Order:** T1.1 → T1.2 (codeable now, no key needed) → T1.3 → T1.4 → then P1–P3 → T1.5 → T1.6.
We can build and unit-test T1.1–T1.4 **before** you set up any account; the key/Vercel are only needed to run it for real (T1.5–T1.6).

## Track 2 — Local UX (optional, later, no new tech)

Independent of the AI work; same current stack.

- **T2.1 — Feature 004: Card management** — delete / edit title / re-categorize (pure store fns + UI), spec-first + retro.
- **T2.2 — Feature 005: Search & filter** — `filterCards(board,{query,tag})` + UI, spec-first + retro.
- **T2.0 — (optional) ADR + React Testing Library** for DOM tests once interactive controls grow (working-agreement rule 5).

## Still out of scope

- A database / any server-side storage of content (the proxy is stateless — [ADR 003](decisions/003-real-ai-via-serverless.md)).
- Authentication / multi-user.
- URL ingestion (paste-a-link) — still deferred; would need its own ADR (fetch + extraction in the function).

## Open decisions for you

1. **Start coding T1.1–T1.4 now** (no account needed yet), or set up Anthropic + Vercel first?
2. **Model:** default `claude-haiku-4-5` (cheap/fast) — OK, or prefer `claude-sonnet-4-6` for higher quality at higher cost?
3. Keep the **local heuristic fallback** (recommended), or AI-only?
