# Task Plan — Content Digest

Actionable breakdown of the next work, derived from the [PRD](PRD.md) roadmap and the two chosen directions: **improve the local app** and **publish it online**. Both stay 100% frontend — no backend, no `constraints.md` amendment needed.

Every item follows the working agreement in [CLAUDE.md](../CLAUDE.md): a feature = requirements doc → failing test → minimal code → green → commit → retrospective; any architectural choice or new dependency gets an ADR first.

## Technology overview

| Capability | Technology | New? |
|---|---|---|
| App, UI, logic, unit tests | Vite + React + TS + Vitest (current) | — already in place |
| Card management & search | Pure TS modules + React (current stack) | **No new tech** |
| Component/DOM tests (optional) | `@testing-library/react` + `jsdom` (dev deps) | New dev dep → ADR |
| Hosting | **GitHub Pages** via **GitHub Actions** | New infra → ADR |
| CI (test + lint on push/PR) | GitHub Actions | New infra |

Only two genuinely new pieces: a **deploy pipeline** (Track B) and an **optional DOM-testing layer** (Track A). Neither touches the no-backend charter.

---

## Track B — Publish online (recommended first: quick, independent, immediate value)

Vite already produces a static build (`npm run build` → `app/dist/`). Publishing is mostly wiring, no app changes beyond a base-path setting.

> **Open decision — where to host.** Recommended: **GitHub Pages** (free, same GitHub account, no extra signup; the repo already lives there). Alternatives: Netlify or Vercel (nicer preview deploys, but another account). The plan below assumes GitHub Pages; swap the deploy step if you prefer another host.

- **B0 — ADR 004: hosting & deployment.** Record the host choice (GitHub Pages), the build command (`npm --prefix app run build`), the publish dir (`app/dist`), and the public URL (`https://maliarihor-art.github.io/content-digest/`). *Tech: none (decision doc).*
- **B1 — CI workflow (`.github/workflows/ci.yml`).** On push/PR: `npm run setup`, `npm run lint`, `npm run test:run`, `npm run build`. Green check before anything deploys. *Tech: GitHub Actions. (Was listed as "Deferred" in the bootstrap.)*
- **B2 — Set Vite `base` for Pages.** Pages serves the app under `/content-digest/`, so `app/vite.config.ts` needs `base: '/content-digest/'` (for the production build only; dev stays `/`). *Tech: Vite config. Add a tiny test/build check that the built `index.html` references the correct base.*
- **B3 — Deploy workflow (`.github/workflows/deploy.yml`).** On push to `master`: build `app/`, upload `app/dist`, publish via `actions/deploy-pages`. Enable Pages → "GitHub Actions" in repo settings (one-time, done by you in the GitHub UI). *Tech: GitHub Actions + Pages.*
- **B4 — Verify live.** Confirm the deployed URL serves 200, the app loads, and a digest can be created in the hosted version. *Tech: curl / browser.*
- **B5 — Retrospective + README/PRD update.** Add the live URL to `README.md` and the PRD; retro `chore(retro): NNN`.

**Note:** `.github/` files may need to be created from your own terminal — Claude's self-modification classifier can block writes under tooling/CI paths. If so, I'll provide the exact file contents to paste.

---

## Track A — Improve the local app (no new runtime tech)

Iterative UX features on the existing stack. As these add buttons and forms, a component-test layer becomes worthwhile.

- **A0 — ADR 003 + DOM-testing setup (optional but recommended).** Add `@testing-library/react`, `@testing-library/user-event`, `jsdom` as **dev** dependencies; configure a `jsdom` test environment for `*.tsx` specs while keeping pure modules on `node`. Justifies itself once cards have interactive controls. *Tech: React Testing Library + jsdom (dev deps) → ADR per working-agreement rule 5.*
- **A1 — Feature 003: Card management.**
  - `docs/requirements/feature-003-card-management.md`.
  - Pure store functions (spec-first): `removeCard(board, id)`, `updateCardTitle(board, id, title)`, `recategorize(board, id, category)`.
  - UI: a delete (✕) control, inline title edit, and a category selector on each card.
  - Persist changes to `localStorage` (already wired).
  - Retro `chore(retro): 003`.
- **A2 — Feature 004: Search & filter.**
  - `docs/requirements/feature-004-search-filter.md`.
  - Pure function (spec-first): `filterCards(board, { query, tag })` matching title/summary/tags (case-insensitive), reusing tokenization from `digest/text.ts`.
  - UI: a search box + clickable tag chips that filter the board; section counts reflect the filtered set.
  - Retro `chore(retro): 004`.

---

## Suggested order & dependencies

1. **B0 → B1 → B2 → B3 → B4 → B5** — get it live first (independent of app changes, fast win, and CI then guards every later change).
2. **A0** (DOM-testing ADR/setup) — do once, before the interactive features.
3. **A1 (Feature 003)** then **A2 (Feature 004)** — each its own spec-first loop + retro.

Tracks are independent: we can start either first. Publishing first means every subsequent feature ships through CI to a live URL automatically.

## What stays out (unchanged)

Real LLM summarization and URL ingestion remain deferred — they require a backend or browser-key+proxy decision and a `constraints.md` amendment ([PRD §6](PRD.md), [ADR 002](decisions/002-content-digest-pipeline.md)). Not part of this plan.

## Open decisions for you

1. **Host:** GitHub Pages (recommended) vs Netlify/Vercel?
2. **DOM-testing layer (A0):** add it now, or defer until the UI clearly needs it?
3. **Start order:** publish first (Track B), or build features first (Track A)?
