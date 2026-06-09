# Overview

## Goal
A sandbox to learn and prototype web app features using Vite + React + TypeScript. It exists to make experimentation cheap: a clean, strictly-typed baseline where new ideas can be specced, tested, and tried without ceremony.

## Primary user / context
A single developer (the project owner), running the app locally in a browser during development. There is no deployment target and no multi-user audience at this stage.

## Success criteria
- The dev server starts from the repo root with `npm run dev` and serves the app over HTTP.
- A new feature can go from a requirements doc to a passing test to working code following the spec-first loop in `CLAUDE.md`.
- TypeScript strict mode stays on; logic lives in pure, tested modules.
- Every feature ends with a retrospective that can feed workflow improvements back into `CLAUDE.md`.

## Out of scope (initial)
See [constraints.md](../constraints.md) for the authoritative list. In short: no backend/API/database and no authentication.
