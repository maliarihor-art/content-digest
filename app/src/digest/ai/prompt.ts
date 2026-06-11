import { CATEGORIES } from '../category';

/** Default model for digest summarization (free-tier; see ADR 004). */
export const DIGEST_MODEL = 'gemini-2.5-flash';

/** Token budget for one digest response. */
export const DIGEST_MAX_TOKENS = 1024;

/** A single prompt message. Provider-neutral; the proxy maps it per provider. */
export interface PromptMessage {
  role: 'user';
  content: string;
}

/**
 * A provider-neutral digest request. The serverless proxy (ADR 003/004) maps it
 * onto whatever AI backend is in use (currently Google Gemini, over `fetch`).
 */
export interface DigestRequest {
  model: string;
  max_tokens: number;
  system: string;
  messages: PromptMessage[];
}

const SYSTEM = [
  'You summarize an article into a structured digest.',
  'Reply with JSON only — a single object, no prose and no markdown code fences.',
  'The object must have exactly these fields:',
  '- "summary": a concise string capturing the article.',
  '- "keyPoints": an array of at most 5 short strings.',
  '- "tags": an array of at most 6 lowercase, unique keyword strings.',
  `- "category": exactly one of: ${CATEGORIES.join(', ')}.`,
  'Use "Other" for "category" when no other category clearly fits.',
].join('\n');

/**
 * Build the provider-neutral digest request payload for summarizing `text`.
 * The proxy maps it onto the active AI backend (currently Gemini; ADR 003/004).
 * Pure and deterministic: same input → deeply-equal payload. Sends nothing.
 */
export const buildDigestPrompt = (text: string): DigestRequest => ({
  model: DIGEST_MODEL,
  max_tokens: DIGEST_MAX_TOKENS,
  system: SYSTEM,
  messages: [{ role: 'user', content: `Article:\n\n${text}` }],
});
