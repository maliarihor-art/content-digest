import { runDigest, type DigestCaller } from '../app/src/digest/ai/service';

/**
 * M2 — stateless serverless AI proxy (Vercel convention: repo-root `api/`).
 *
 * The only I/O boundary: it reads the key from the environment, calls Google
 * Gemini's REST `generateContent` over the built-in `fetch` (no SDK — ADR 004),
 * and forwards the pure core's HTTP result verbatim. All logic (validation,
 * prompt, parse, status mapping) lives in the unit-tested
 * `app/src/digest/ai/service.ts`. Persists nothing (ADR 003).
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/** Real caller: maps the neutral request onto Gemini's REST body and returns its text. */
const callGemini: DigestCaller = async (request) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const model = process.env.GEMINI_MODEL ?? request.model;
  const userText = request.messages.map((m) => m.content).join('\n\n');

  const response = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: request.system }] },
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      generationConfig: {
        maxOutputTokens: request.max_tokens,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('Gemini reply contained no text');
  }
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
