# Product Requirements Document — Content Digest

| | |
|---|---|
| **Product** | Content Digest |
| **Status** | v0.1 shipped (Feature 002); PRD living document |
| **Owner** | maliarihor-art (solo developer) |
| **Last updated** | 2026-06-09 |
| **Repository** | https://github.com/maliarihor-art/content-digest |

This PRD describes *why* Content Digest exists, *who* it is for, and *what* it should do. Engineering decisions are recorded separately as ADRs under [docs/decisions/](decisions/); per-feature acceptance criteria live under [docs/requirements/](requirements/); hard guardrails live in [docs/constraints.md](constraints.md). This document is the product-level umbrella over those.

---

## 1. Summary

Content Digest turns long article text into a compact, skimmable **card** — a short summary, key points, tags, and a topic category — and files it onto a **board organized by topic**. It is a personal reading-triage tool: capture what an article says without re-reading it, and keep a browsable, self-organizing collection.

The product runs **entirely in the browser**, with no backend, no accounts, and no external services. The board persists locally so it survives reloads.

## 2. Problem statement

People read more than they can retain. Articles pile up in tabs and bookmarks; revisiting them means re-reading. There is no lightweight, private way to (a) distill an article into its essence on the spot and (b) keep those distillations organized by subject without signing up for a service or trusting a third party with the content.

## 3. Goals & non-goals

### Goals
- Distill pasted article text into a **summary + key points + tags + category** in one action.
- File each result as a **card** under the right **topic section** automatically.
- Keep the collection **persistent, private, and offline** (local-only).
- Stay a **fast, frictionless** capture tool — paste, click, done.

### Non-goals (this version)
- Not a read-it-later service, RSS reader, or web scraper.
- Not a multi-user or collaborative product.
- Not a knowledge base / note editor — cards are read-mostly artifacts.
- Not an LLM product (the "AI" is local heuristics — see §8 and [ADR 002](decisions/002-content-digest-pipeline.md)).

## 4. Target user & context

**Primary persona — "the self-learner."** A single developer/curious reader running the app locally in a browser during the day. Reads technical and general-interest articles, wants to triage and remember them, values privacy and zero setup. This matches the project's founding context (local dev, solo user) recorded in [overview.md](requirements/overview.md).

There is no secondary persona in scope. Multi-user is explicitly deferred.

## 5. Success metrics

Because the app is local and unauthenticated, success is measured by usefulness to the single user rather than server-side analytics:

- **Time-to-digest:** from pasting text to a saved card in under ~5 seconds, no configuration.
- **Capture friction:** a digest requires exactly one required input (the text) and one click.
- **Organization quality (qualitative):** the proposed category is "right enough" that the user rarely wishes they could re-file a card.
- **Durability:** zero data loss across reloads (board round-trips through storage reliably).
- **Trust:** no data ever leaves the browser (verifiable: no network calls in the digest path).

## 6. Scope

### In scope (shipped — Feature 002)
- Paste article **text** (plus optional title and source/link label).
- Generate a **Digest**: summary, key points (≤5), tags (≤6), proposed category.
- Render the result as a **card** in a **topic section**; sections ordered by a fixed taxonomy, empty sections hidden.
- **Persist** the board in `localStorage`; restore it on load.

### Out of scope (deferred — gated behind a future ADR + constraint amendment)
- **URL ingestion** ("paste a link → fetch text"): blocked by browser CORS; needs a backend or proxy. Currently forbidden by [constraints.md](constraints.md).
- **Real LLM summarization**: needs an API key (→ backend, or browser-side key + proxy) and is a new runtime dependency.
- Editing, deleting, reordering, or re-categorizing cards; drag-and-drop.
- Search/filter, multiple boards, export/import.
- Authentication, multi-user, cross-device sync.

Out-of-scope items are not "won't ever" — they are "not without an explicit decision," to keep the product honest about its current privacy/no-backend promise.

## 7. Functional requirements & user flows

### FR-1 — Create a digest
**Flow:** user pastes text → (optional) types title/source → clicks **Add digest** → a card appears in the matching topic section.
- The "Add digest" action is disabled until non-empty text is present.
- Title defaults to "Untitled" if left blank.
- The same input always produces the same digest (deterministic).

### FR-2 — Organize by topic
- Each card carries exactly one category from the taxonomy: **Technology, Science, Business, Health, Politics, Sports, Culture, Other**.
- The board shows one section per non-empty category, in taxonomy order, with a per-section card count.

### FR-3 — Persist & restore
- The board is saved to local browser storage on every change.
- On load, a valid stored board is restored; missing/corrupt storage yields an empty board (never an error/crash).

### FR-4 — Digest contents (per card)
- **Summary:** a few of the most representative sentences, in original order.
- **Key points:** the most relevant sentences, ranked.
- **Tags:** most frequent meaningful terms, lowercased and unique.
- **Category:** best keyword match, or "Other" when nothing matches.

## 8. Technical approach (summary)

Full rationale in the ADRs; this is the product-facing summary.

- **Pure-module pipeline.** All analysis (sentence scoring, summary, key points, tags, category) is implemented as deterministic, unit-tested pure functions under `app/src/digest/`. The board store (grouping, serialize/deserialize) lives under `app/src/board/`. React components only render. ([ADR 002](decisions/002-content-digest-pipeline.md))
- **Local heuristics, not an LLM.** "AI" here means extractive, frequency-based heuristics — no network, no key, fully offline. The `Digest` interface is a deliberate seam so a future LLM implementation can be swapped in without touching the board/UI.
- **Governance split.** Product/governance docs at the repo root and under `docs/`; all application code under `app/`. ([ADR 001](decisions/001-agent-structure.md))
- **Stack.** Vite + React + TypeScript (strict), Vitest, ESLint/Prettier.

## 9. Constraints & assumptions

- **No backend, no database, no authentication** — frontend-only by charter ([constraints.md](constraints.md)).
- **No new runtime dependency without an ADR.**
- **TypeScript strict mode is non-negotiable** (no loosening `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`).
- **Assumption:** the user has the article *text* available to paste (the URL-fetch convenience is deferred).
- **Assumption:** a single browser/profile is the system of record; no cross-device expectation.

## 10. Roadmap

| Stage | Scope | Status |
|---|---|---|
| **v0.1** | Hello-world bootstrap; spec-first scaffold | ✅ Done (Feature 001) |
| **v0.2** | Content Digest: paste text → digest → topic board → localStorage | ✅ Done (Feature 002) |
| **v0.3 (candidate)** | Card management: delete / re-categorize / edit title | Proposed |
| **v0.4 (candidate)** | Search & filter across cards and tags | Proposed |
| **vNext (gated)** | URL ingestion and/or LLM summarization | Blocked — needs ADR + constraint amendment (backend or browser-key+proxy decision) |

Each future stage follows the working agreement: requirements doc → failing test → implementation → retrospective, with an ADR for any architectural change.

## 11. Risks

- **Heuristic quality.** Frequency-based summaries can favor long sentences; the fixed taxonomy is coarse. *Mitigation:* accepted for v0.x; the `Digest` seam allows upgrading to an LLM later. (Noted in [retro 002](retrospectives/002-content-digest.md).)
- **Local-only persistence.** `localStorage` can be cleared by the user/browser; no backup. *Mitigation:* future export/import; communicate the local-only nature in the UI.
- **Scope creep toward a backend.** The most-requested features (URL fetch, real AI) break the privacy/no-backend promise. *Mitigation:* the escalation gate — such changes require an explicit ADR + constraint amendment, not a silent addition.

## 12. Open questions

- If/when AI or URL-fetch is pursued, which architecture: a real backend, or a browser-side key with a proxy? (Decides the privacy trade-off; needs its own ADR.)
- Should the taxonomy be user-extensible, or stay fixed and curated?

## 13. References

- [overview.md](requirements/overview.md) — goal, user, success criteria
- [feature-001-hello-world.md](requirements/feature-001-hello-world.md), [feature-002-content-digest.md](requirements/feature-002-content-digest.md) — feature specs
- [ADR 001 — repo structure](decisions/001-agent-structure.md), [ADR 002 — digest pipeline](decisions/002-content-digest-pipeline.md)
- [constraints.md](constraints.md) — guardrails
- [retrospectives/](retrospectives/) — per-feature retros
- [CLAUDE.md](../CLAUDE.md) — how the repo is worked in
