import type { Digest } from '../types';
import type { DigestRequest } from './prompt';
import { buildDigestPrompt } from './prompt';
import { parseDigestResponse } from './parse';

/**
 * Sends a built Claude request and resolves to the raw text reply. Injected into
 * `runDigest` so the orchestration core stays pure and unit-testable; the real
 * implementation (Anthropic SDK + key) lives in the `api/digest.ts` adapter.
 */
export type ClaudeCaller = (request: DigestRequest) => Promise<string>;

/** HTTP-shaped outcome the serverless adapter forwards verbatim. */
export type DigestServiceResult =
  | { status: 200; body: Digest }
  | { status: 400; body: { error: string } }
  | { status: 502; body: { error: string } };

/** Coarse guard against runaway payloads (chars). M8 may refine. */
export const MAX_INPUT_CHARS = 50_000;

/**
 * Extract a usable article string from an arbitrary request body.
 * Returns the trimmed text, or `null` when the body is not `{ text: string }`
 * with non-empty content.
 */
export const extractArticleText = (body: unknown): string | null => {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const text = (body as Record<string, unknown>).text;
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  return trimmed.length === 0 ? null : trimmed;
};

/**
 * Stateless orchestration for the digest proxy: validate the body, build the M1
 * prompt, delegate the network call to `call`, then validate the reply with the
 * M1 parser. Never throws — every failure is mapped to an HTTP-shaped result
 * (400 bad request, 502 upstream/parse failure).
 */
export const runDigest = async (
  body: unknown,
  call: ClaudeCaller,
): Promise<DigestServiceResult> => {
  const text = extractArticleText(body);
  if (text === null) {
    return { status: 400, body: { error: 'request body must include a non-empty "text" string' } };
  }
  if (text.length > MAX_INPUT_CHARS) {
    return { status: 400, body: { error: `"text" exceeds the ${MAX_INPUT_CHARS}-character limit` } };
  }

  let reply: string;
  try {
    reply = await call(buildDigestPrompt(text));
  } catch {
    return { status: 502, body: { error: 'failed to reach the summarization service' } };
  }

  const parsed = parseDigestResponse(reply);
  if (!parsed.ok) {
    return { status: 502, body: { error: parsed.error } };
  }
  return { status: 200, body: parsed.digest };
};
