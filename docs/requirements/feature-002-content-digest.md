# Feature 002 — Content Digest

## User story
As a developer collecting things I read, I want to paste an article's text and get back a short summary, key points, tags, and a proposed category, so that each article lands as a card on a board organized into sections by topic — without leaving the app or setting up any services.

## Scope decisions (see ADR 002)
- **Ingestion:** paste the article **text** (not a URL). No fetching, no CORS, no backend.
- **"AI":** local, deterministic extractive heuristics (no LLM, no API key, no network).
- **Persistence:** the board is stored in `localStorage`.

## Acceptance criteria
- GIVEN a block of article text
  WHEN `buildDigest(text)` runs
  THEN it returns a `Digest` with: a non-empty `summary`, a `keyPoints` array (≤ 5), a `tags` array (≤ 6, lowercased, unique), and a `category` from the fixed taxonomy.
- GIVEN article text dominated by a topic's vocabulary (e.g. software/AI terms)
  WHEN categorized
  THEN `proposeCategory` returns the matching category (e.g. `Technology`); with no clear match it returns `Other`.
- GIVEN a few sentences of varying relevance
  WHEN summarized
  THEN the summary contains the highest-scoring sentence(s) and preserves their original order.
- GIVEN a `Board` and a new `Card`
  WHEN `addCard` runs
  THEN it returns a new board including the card (pure — input not mutated).
- GIVEN a board with cards in several categories
  WHEN `groupByCategory` runs
  THEN it returns sections ordered by the taxonomy, each listing only its cards, and omits empty sections.
- GIVEN a serialized board string (or `null`/garbage)
  WHEN `deserializeBoard` runs
  THEN it returns a valid `Board` (empty board on `null`/invalid input — never throws).
- GIVEN the running app
  WHEN I paste text, optionally a title/source, and click "Add digest"
  THEN a card appears in the correct topic section AND survives a page reload.

## Out of scope
- Fetching article text from a URL (deferred — needs backend/proxy + ADR).
- Real LLM summarization (deferred — needs key handling + ADR).
- Editing/reordering cards, drag-and-drop, multi-board, export, search.
- Authentication, multi-user, server sync.

## Open questions
- None for this iteration. Taxonomy is fixed (Technology, Science, Business, Health, Politics, Sports, Culture, Other); expanding it is a future feature.
