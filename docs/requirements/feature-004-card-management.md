# Feature 004 — Card management (M5)

Status: in progress · Milestone: [M5](../roadmap.md#m5--card-management) · Issue: #5
Depends on: F002 (board store + card UI). Independent of the AI track.

## Why

Today the board is append-only: a digest can be added but never corrected. Real use
needs basic editing — remove a card that's noise, fix a wrong title, and move a card
the heuristic (or AI) filed under the wrong topic. This is the smallest set of board
edits that makes the board trustworthy without new technology.

## What (scope)

Three pure board operations + the per-card UI controls that drive them.

### Pure store functions (`app/src/board/store.ts`)

All are pure: they return a **new** `Board`, never mutate the input, and are no-ops
(return an equivalent board) when the target `id` is not found.

1. `removeCard(board, id): Board`
   - Returns a board with the card whose `id` matches removed.
   - Unknown `id` → board with the same cards (no throw).

2. `updateCardTitle(board, id, title): Board`
   - Replaces the matched card's `title`.
   - Title is trimmed; an empty/whitespace-only title falls back to `'Untitled'`
     (mirrors the `App.tsx` add-path default).
   - Other cards and the matched card's `digest` are untouched.

3. `recategorize(board, id, category): Board`
   - Sets the matched card's `digest.category` to the given taxonomy `Category`.
   - The rest of the digest (summary, key points, tags) is preserved.
   - `Category` is enforced at the type level (the fixed taxonomy in `digest/category.ts`).

### UI controls (`app/src/App.tsx`, render-only)

Per card, inside `CardView`:
- **Delete** button → `removeCard`.
- **Inline title edit**: clicking the title (or an "Edit" affordance) reveals an input;
  committing calls `updateCardTitle`.
- **Category select**: a `<select>` of `CATEGORIES`; changing it calls `recategorize`,
  which re-files the card into another section on the next render.

`App.tsx` stays the render layer: it holds the handlers and local edit state, but all
board transformation goes through the pure store functions. No branching/transform
logic in components beyond local form state.

## Persistence

No new mechanism. Edits flow through `setBoard`, and the existing
`useEffect(() => saveBoard(board), [board])` persists to `localStorage`. Reload restores
the edited board.

## Acceptance criteria

- [ ] `removeCard`, `updateCardTitle`, `recategorize` are pure, unit-tested (new + unchanged
      cards verified, input not mutated, unknown-id no-op, title fallback, digest preserved).
- [ ] Per-card delete removes the card; the board re-renders without it and the section
      count drops (empty sections disappear).
- [ ] Editing a title updates the card and survives reload.
- [ ] Re-categorizing moves the card to another section and survives reload.
- [ ] All existing specs stay green; `npm run build` and `npm run typecheck:api` pass.

## Out of scope

- Reordering / drag-and-drop, multi-select, undo.
- Editing summary / key points / tags / source (only title + category here).
- Search & filter — that is M6.
- Direct DOM/component tests — that is M7 (needs ADR).
