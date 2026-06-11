# Task Plan — Content Digest

Actionable breakdown of upcoming work, derived from the [PRD](PRD.md) and the decisions in the ADRs. **Updated 2026-06-11** for the pivot to real AI ([ADR 003](decisions/003-real-ai-via-serverless.md)) on a **free provider** ([ADR 004](decisions/004-free-ai-via-gemini.md)): the app gains a thin **serverless AI proxy** (Google Gemini free tier over `fetch`) hosted on **Vercel**; the local heuristic stays as a fallback.

Every item follows the working agreement in [CLAUDE.md](../CLAUDE.md): feature = requirements doc → failing test → minimal code → green → commit → retrospective; architectural changes get an ADR first.

## Technology overview

| Capability | Technology | New? |
|---|---|---|
| App, UI, logic, unit tests | Vite + React + TS + Vitest (current) | — in place |
| Real summarization | **Google Gemini API** (free tier, over built-in `fetch`, model `gemini-2.5-flash`) | **No runtime dep** ([ADR 004](decisions/004-free-ai-via-gemini.md)) |
| API key safety | **Vercel serverless function** (`api/digest`) holding the key as a secret | **New backend** (ADR 003) |
| Hosting (frontend + function) | **Vercel** | **New infra** |
| Offline / fallback | existing local heuristic `buildDigest` | — kept |
| Persistence | `localStorage` | — unchanged |
| Card management & search (later) | pure TS + React (current stack) | No new tech |

## Prerequisites — YOU provide these (Claude cannot)

These are accounts/keys/secrets — I never create accounts or enter keys.

- **P1.** Google AI Studio (https://aistudio.google.com/apikey) → create a **free API key** (no credit card, free tier does not expire).
- **P2.** Vercel account → **import** the `content-digest` GitHub repo.
- **P3.** In Vercel project settings → add secret env var **`GEMINI_API_KEY`** = your key. (Also keep it in a local `.env` — gitignored — for local dev.)

I'll tell you exactly when each is needed.

---

## Track 1 — Real AI via serverless (primary)

The existing `Digest` interface is reused, so the board and most UI are untouched — we swap *how* a digest is produced.

- **T1.0 — ✅ ADR 003 + ADR 004 + constraints amendment.** Done (allow a stateless AI-proxy function; provider = Gemini free tier; DB/auth still forbidden).
- **T1.1 — ✅ Requirements docs.** `feature-003-ai-summarization.md` (M1 core) + `feature-003b-serverless-proxy.md` (M2 proxy): contract (`POST /api/digest` ↔ `Digest`), model, fallback, error states.
- **T1.2 — ✅ M1: prompt + parse module (spec-first, network-free).** Pure, unit-tested `buildDigestPrompt(text)` and `parseDigestResponse(json)` — provider-neutral, testable **without** network calls.
- **T1.3 — ✅ M2: serverless function `api/digest.ts`.** Pure `runDigest` core (in `app/src/digest/ai/service.ts`) + thin handler reading `process.env.GEMINI_API_KEY`, calling Gemini over `fetch`, validating via `parseDigestResponse`, returning the `Digest` JSON; clear error on failure. Live `vercel dev`/key run is owner-gated.
- **T1.4 — ✅ M3: Frontend integration + fallback.** Pure `requestDigest(text, deps)` (`app/src/digest/ai/client.ts`, injected `fetch`/`fallback`) `POST`s `/api/digest`, re-validates the `200` body via `parseDigestResponse`, and falls back to local `buildDigest(text)` on any non-OK/invalid/network failure — never throws. `App.tsx` (render-only) gained loading + fallback-notice UI. 7 specs cover every path with no network; fallback path browser-verified. Live AI-success path is owner-gated behind `vercel dev` (T1.5).
- **T1.5 — M4: Vercel config.** `vercel.json`: build the frontend (`npm run build` → `app/dist`), `outputDirectory: app/dist`, functions in `api/`. Local dev via `vercel dev` (uses `.env`). Needs **P1–P3**.
- **T1.6 — Verify + retro.** Confirm a real AI digest end-to-end locally (`vercel dev`) and on the deployed URL. Update README + PRD (privacy note: content is sent to Google Gemini; free-tier prompts may be used to improve Google's products).

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
- Paid services — everything must run on a free tier ([ADR 004](decisions/004-free-ai-via-gemini.md)).
- URL ingestion (paste-a-link) — still deferred; would need its own ADR (fetch + extraction in the function).

## Open decisions for you

1. **M3 next** (wire the frontend to `/api/digest` + fallback), or detour to Track 2 (card management / search) first?
2. **Model:** default `gemini-2.5-flash` — OK, or prefer `gemini-2.5-flash-lite` (higher free-tier rate limits, lighter quality)? Override via `GEMINI_MODEL`.
3. Keep the **local heuristic fallback** (recommended), or AI-only?
