# ADR 002 — Content Digest as a local, pure-module pipeline

## Status
Accepted.

## Context
Feature 002 ("Content Digest") takes an article, produces a short summary, key points, tags, and a proposed category, and drops the result as a card onto a board with sections grouped by topic.

As literally described ("paste a link → app fetches the text → AI summarizes"), the feature would require:
- fetching arbitrary third-party URLs (blocked by CORS in the browser → needs a backend or external proxy), and
- a real LLM call (an API key → normally a backend → and a new runtime dependency).

Both collide with [constraints.md](../constraints.md): **no backend / API / database**, and **no new runtime dependency without an ADR**. The conflict was surfaced to the project owner (escalation rules in `CLAUDE.md`), who chose to keep the feature **fully within the existing charter** rather than amend it.

## Decision
Build Content Digest as a **100% frontend, dependency-free pipeline of pure modules**, with these three resolutions:

1. **Ingestion = paste text.** The user pastes the article body (and an optional title/source label) instead of a URL. No fetching, no CORS, no backend. ("Paste a link" is explicitly deferred — see Consequences.)
2. **"AI" = local extractive heuristics.** Summary, key points, tags, and category are computed by deterministic pure functions under `app/src/digest/`:
   - extractive summary + key points via sentence scoring over stopword-filtered term frequency,
   - tags via top content-word frequency,
   - category via keyword-rule matching against a small fixed taxonomy, defaulting to `Other`.
   No LLM, no API key, no network. This honors the "Pure modules" rule — components only render.
3. **Persistence = `localStorage`.** The board (cards + their categories) is serialized to `localStorage`. No database. Pure `serialize`/`deserialize` functions are unit-tested; the `localStorage` read/write itself is a thin impure wrapper used only by the React layer.

Time-varying values (card `id`, `createdAt`) are **passed into** the pure builders by the caller, never generated inside pure code, so the modules stay deterministic and testable.

## Consequences
- **Positive:** Zero new dependencies, no key handling, no backend; the whole pipeline is pure and unit-tested, fitting the spec-first loop perfectly. Works offline.
- **Positive:** Clean seam — if the charter is later relaxed, the heuristic `buildDigest` can be swapped for an LLM-backed implementation behind the same `Digest` interface without touching the board/UI.
- **Negative / trade-off:** Heuristic summaries are weaker than an LLM's and the category taxonomy is fixed and coarse. Accepted for a learning sandbox.
- **Deferred:** URL ingestion and real-LLM summarization remain out of scope until `constraints.md` is amended via a future ADR (would require a backend or browser-side key + proxy decision).
