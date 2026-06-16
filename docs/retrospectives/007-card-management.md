# Retrospective 007 — Card management (M5)

## What shipped
The board is no longer append-only. Three pure store functions + per-card UI controls let
the user correct the board, persisted through the existing `localStorage` mechanism.
- `app/src/board/store.ts` — `removeCard(board, id)`, `updateCardTitle(board, id, title)`
  (trimmed; empty → `'Untitled'`), `recategorize(board, id, category)`. All pure: return a
  new `Board`, never mutate input, no-op on unknown `id`, preserve the rest of the digest.
- `app/src/board/store.spec.ts` — 7 new specs (new + unchanged cards, input untouched,
  unknown-id no-op, title trim/fallback, digest preserved). Suite 75 → **82**, all green.
- `app/src/App.tsx` — `CardView` gained Delete / inline title edit (click "Edit title" →
  input, commit on Enter/blur, Escape cancels) / Category `<select>` of `CATEGORIES`. App
  holds the handlers + local edit state; every board mutation goes through the pure fns.
- `docs/requirements/feature-004-card-management.md` — the M5 spec.

## What worked
- **The `Digest`/`Board` seam held a fourth time.** M5 is entirely in the board layer; the
  digest pipeline and AI client were untouched. The roadmap's "stable seam" claim keeps paying
  off — UX work and AI work stay independent (M5 needs no key, no network).
- **Spec-first caught the shape early.** Writing the 7 specs first nailed the contracts
  (no-op on unknown id, trim+fallback, digest preservation) before any UI existed; red → green
  was one pass with no rework.
- **The three fns mirror the existing `addCard` style** (spread, `.filter`/`.map`, no
  mutation), so they read like the surrounding code and needed no new abstractions or deps.
- **Browser-verified the full triad in `vite dev`** (the fallback path, since `/api/digest`
  404s locally): add → re-categorize (Politics/Health section moves, empty sections vanish) →
  edit title (trim confirmed) → delete (board empties), each asserted against `localStorage`.

## What didn't / friction
- **`preview_click` raced the React state commit.** Clicking "Add digest" immediately after
  setting inputs via the native-setter trick added nothing — the snapshot still showed "No
  cards yet". Driving the whole sequence (set inputs → `await` a tick → click → `await` the
  async digest) inside **one `preview_eval`** fixed it deterministically. The cross-tool gap
  between separate `preview_eval`/`preview_click` calls is where the race lived.
- **`preview_screenshot` timed out twice (30s each).** Same flakiness retro 005 flagged;
  `preview_snapshot` gave a cleaner, faster proof of the controls (Edit title button, Category
  combobox with all 8 options + current value, Delete button) and the section regrouping.

## Acceptance status
- `removeCard` / `updateCardTitle` / `recategorize` pure + unit-tested: **done** (7 specs).
- Delete removes the card, count drops, empty section disappears: **verified** in browser.
- Edit title updates + persists (trim → `'Untitled'` fallback): **verified** (localStorage).
- Re-categorize moves the card to another section + persists: **verified** (localStorage).
- Existing suite green (**82** specs); `npm run build` + `npm run typecheck:api` clean.

## Workflow changes (applied this session)
- `CLAUDE.md` "Current state" gained an M5 paragraph; "Critical files" notes the new store
  fns; self-improvement log links this retro. Doc map links the M5 requirements doc.
- **No new ADR.** M5 adds no architecture or dependency — it extends the existing pure store
  under ADR 002. (Direct DOM/component tests remain deferred to M7, which *does* need an ADR.)

## Carry-forward
- **Drive React-form interactions inside a single `preview_eval`** (set → await tick → act →
  await async), not split across `preview_eval` + `preview_click` — the inter-call gap races
  the state commit. Prefer `preview_snapshot` over `preview_screenshot` (still flaky).
- **M6 (Search & filter)** builds directly on this card UI: a pure
  `filterCards(board, { query, tag })` reusing `digest/text.ts` tokenization, plus a search box
  and clickable tag chips, with section counts reflecting the filtered set.
- **M7** can now add `@testing-library/react` (via its ADR) to test these interactive controls
  directly, replacing the `preview_eval`-driven manual verification used here.
