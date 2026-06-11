import { CATEGORIES } from '../category';

/** Default model for digest summarization (cost-optimized; see ADR 003). */
export const DIGEST_MODEL = 'claude-haiku-4-5';

/** Token budget for one digest response. */
export const DIGEST_MAX_TOKENS = 1024;

/** A single Claude Messages API message. */
export interface ClaudeMessage {
  role: 'user';
  content: string;
}

/** A ready-to-send Claude Messages API request payload. */
export interface DigestRequest {
  model: string;
  max_tokens: number;
  system: string;
  messages: ClaudeMessage[];
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
 * Build the Claude Messages API request payload for summarizing `text`.
 * Pure and deterministic: same input → deeply-equal payload. Sends nothing.
 */
export const buildDigestPrompt = (text: string): DigestRequest => ({
  model: DIGEST_MODEL,
  max_tokens: DIGEST_MAX_TOKENS,
  system: SYSTEM,
  messages: [{ role: 'user', content: `Article:\n\n${text}` }],
});
