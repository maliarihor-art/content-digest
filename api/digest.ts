import { runDigest, type DigestCaller } from '../app/src/digest/ai/service';
import { buildGeminiBody, extractGeminiText } from '../app/src/digest/ai/gemini';

/**
 * M2 — stateless serverless AI proxy (Vercel convention: repo-root `api/`).
 *
 * The only I/O boundary: it reads the key from the environment, calls Google
 * Gemini's REST `generateContent` over the built-in `fetch` (no SDK — ADR 004),
 * and forwards the pure core's HTTP result verbatim. All logic — validation,
 * prompt, the Gemini request/response mapping (`buildGeminiBody`/
 * `extractGeminiText`), parse, status mapping — lives in unit-tested pure
 * modules under `app/src/digest/ai/`. Persists nothing (ADR 003).
 */

/**
 * Run on Vercel's Edge runtime: the handler below is written to the Web
 * standard (`Request` → `Response`, `req.json()`, `Response.json()`), which the
 * Edge runtime serves natively. `fetch`, `AbortSignal.timeout`, and
 * `process.env` are all available there — and it stays on the free tier with no
 * new dependency.
 */
export const config = { runtime: 'edge' };

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 15_000;

/** Real caller: maps the neutral request onto Gemini's REST API and returns its text. */
const callGemini: DigestCaller = async (request) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const model = process.env.GEMINI_MODEL ?? request.model;

  let response: Response;
  try {
    response = await fetch(`${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(buildGeminiBody(request)),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    // Network failure / timeout — log for the operator; the client sees a generic 502.
    console.error('Gemini request failed to send:', err);
    throw err;
  }

  if (!response.ok) {
    // Log the upstream body (rate limit, bad arg, etc.); never forwarded to the client.
    console.error(`Gemini HTTP ${response.status}:`, await response.text().catch(() => ''));
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const text = extractGeminiText(await response.json());
  if (text === null) throw new Error('Gemini reply contained no text');
  return text;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return Response.json({ error: 'method not allowed' }, { status: 405 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null; // runDigest maps an unparseable body to a 400
  }

  const result = await runDigest(body, callGemini);
  return Response.json(result.body, { status: result.status });
}
