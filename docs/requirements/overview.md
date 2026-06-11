# Overview

## Goal
Content Digest distills an article into a compact, skimmable card — a short summary, key points, tags, and a proposed topic category — and files it onto a board organized by subject. It is a personal reading-triage tool: capture what an article says without re-reading it, and keep a browsable, self-organizing collection. Built with Vite + React + TypeScript under spec-first discipline. Full product detail: [PRD.md](../PRD.md).

## Primary user / context
A single developer (the project owner), running the app locally in a browser. Currently no multi-user audience; online publishing (via Vercel) is planned — see the [roadmap](../roadmap.md).

## Success criteria
- Pasting article text yields a useful summary + key points + tags + category in one action, with the card filed under the right topic section.
- The board persists across reloads.
- A new feature goes from a requirements doc to a passing test to working code via the spec-first loop in `CLAUDE.md`.
- TypeScript strict mode stays on; logic lives in pure, tested modules; every feature ends with a retrospective.

## Out of scope
See [constraints.md](../constraints.md) for the authoritative list. In short: no database / server-side data storage, no authentication, and no paid services. (A stateless serverless AI proxy — Google Gemini's free tier — is allowed per [ADR 003](../decisions/003-real-ai-via-serverless.md) / [ADR 004](../decisions/004-free-ai-via-gemini.md).)
