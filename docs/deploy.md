# Deploy runbook — Vercel (M4)

How to take Content Digest (frontend + `api/digest` function) from this repo to a live URL
on Vercel's free (Hobby) tier. Architecture rationale: [ADR 003](decisions/003-real-ai-via-serverless.md),
[ADR 004](decisions/004-free-ai-via-gemini.md). Config: [`vercel.json`](../vercel.json).

The repo config is done — these steps are the owner-gated ops (accounts, keys, deploy).

## Prerequisites

1. **Free Gemini key** — get one at <https://aistudio.google.com/apikey> (no credit card).
2. **Vercel account** — sign up / log in at <https://vercel.com> (free Hobby tier).
3. **Vercel CLI** — `npm i -g vercel` (only needed for the CLI path / `vercel dev`).

## Step 0 — local `.env` (for `vercel dev`)

```
cp .env.example .env        # then edit .env
# GEMINI_API_KEY=<your key>
```

`.env` is gitignored — never commit it.

## Step 1 — verify the AI-success path locally with `vercel dev`

This is the one path the unit tests can't reach (it needs a real key + the function runtime).

```
vercel dev                  # serves the app + /api/digest on http://localhost:3000
```

Paste an article in the UI → expect a real AI digest **with no fallback banner**.
Quick API smoke test (PowerShell):

```powershell
$body = @{ text = "Paste a few sentences of article text here..." } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/digest -Method Post `
  -ContentType 'application/json' -Body $body
```

Expect a JSON `Digest` (summary / keyPoints / tags / category). A `400` means the body was
rejected; a `502` means the upstream Gemini call failed (check the terminal logs).

## Step 2 — link the project

**CLI:** from the repo root, `vercel link` (creates `.vercel/`, gitignored).
**Dashboard:** "Add New… → Project" → import the GitHub repo. Framework preset: **Other**
(our `vercel.json` already pins build/output, so leave the detected settings alone).

## Step 3 — set the secret in Vercel

**CLI:**
```
vercel env add GEMINI_API_KEY production
vercel env add GEMINI_API_KEY preview
# optional: vercel env add GEMINI_MODEL production   (defaults to gemini-2.5-flash)
```
**Dashboard:** Project → Settings → Environment Variables → add `GEMINI_API_KEY` for
Production **and** Preview. Never expose it to the browser (no `VITE_` prefix).

## Step 4 — deploy

```
vercel            # preview deploy (gets a *.vercel.app preview URL)
vercel --prod     # promote to the production URL
```
(Or just `git push` once the GitHub project is imported — Vercel auto-deploys master to
prod and branches to previews.)

## Step 5 — verify production (acceptance)

On the deployed URL:
- Paste an article → real AI digest, **no** fallback banner → `source: 'ai'`. ✅
- (Optional) temporarily remove the env var & redeploy → app still returns a **local**
  digest with the fallback banner → graceful degradation holds. ✅

## Notes / gotchas

- **Function timeout:** `vercel.json` sets `maxDuration: 30` for `api/digest.ts` so Gemini
  (15 s in-code timeout) isn't cut off by the platform default.
- **Free tier:** Hobby has no function cost; Gemini free tier has per-minute/day rate
  limits — a `429` from upstream surfaces to the client as a `502`, and the UI falls back
  to the local heuristic (no crash).
- **Stateless:** the function persists nothing (ADR 003); board data lives only in the
  browser's `localStorage`.
- **Privacy:** article text is sent to Google Gemini for summarization — a user-facing
  disclosure is M8, not M4.
