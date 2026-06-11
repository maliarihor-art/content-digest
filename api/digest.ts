import Anthropic from '@anthropic-ai/sdk';
import { runDigest, type ClaudeCaller } from '../app/src/digest/ai/service';

/**
 * M2 — stateless serverless Claude proxy (Vercel convention: repo-root `api/`).
 *
 * This file is the *only* I/O boundary: it reads the key from the environment,
 * performs the network call via `@anthropic-ai/sdk`, and forwards the pure
 * core's HTTP result verbatim. All logic (validation, prompt, parse, status
 * mapping) lives in the unit-tested `app/src/digest/ai/service.ts`. Persists
 * nothing (ADR 003).
 */

/** Real Claude caller: wires the env key + SDK around the M1 request payload. */
const callClaude: ClaudeCaller = async (request) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: request.model,
    max_tokens: request.max_tokens,
    system: request.system,
    messages: request.messages,
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude reply contained no text block');
  }
  return textBlock.text;
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

  const result = await runDigest(body, callClaude);
  return Response.json(result.body, { status: result.status });
}
