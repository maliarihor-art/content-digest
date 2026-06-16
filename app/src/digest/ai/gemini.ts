import { CATEGORIES } from '../category';
import type { DigestRequest } from './prompt';

/**
 * Pure mapping between the provider-neutral `DigestRequest` and Google Gemini's
 * `generateContent` REST contract (ADR 004). Kept out of `api/digest.ts` so the
 * boundary stays a thin I/O shell and this provider logic is unit-tested.
 */

interface GeminiPart {
  text: string;
}

interface GeminiStringArraySchema {
  type: 'array';
  items: { type: 'string' };
}

/** Digest-shaped response schema (#2): forces Gemini to emit the exact shape. */
interface GeminiSchema {
  type: 'object';
  properties: {
    summary: { type: 'string' };
    keyPoints: GeminiStringArraySchema;
    tags: GeminiStringArraySchema;
    category: { type: 'string'; enum: string[] };
  };
  required: string[];
}

export interface GeminiBody {
  system_instruction: { parts: GeminiPart[] };
  contents: { role: 'user'; parts: GeminiPart[] }[];
  generationConfig: {
    maxOutputTokens: number;
    responseMimeType: 'application/json';
    responseSchema: GeminiSchema;
  };
}

/**
 * Map a neutral digest request onto Gemini's request body, forcing JSON output
 * constrained to the `Digest` schema.
 *
 * NOTE: `responseSchema` uses lowercase JSON-Schema `type` values per the Gemini
 * structured-output docs. Live-verified against `gemini-2.5-flash` during M4
 * (HTTP 200, well-formed `Digest` JSON) — the lowercase casing is correct.
 */
export const buildGeminiBody = (request: DigestRequest): GeminiBody => ({
  system_instruction: { parts: [{ text: request.system }] },
  contents: [
    { role: 'user', parts: [{ text: request.messages.map((m) => m.content).join('\n\n') }] },
  ],
  generationConfig: {
    maxOutputTokens: request.max_tokens,
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        keyPoints: { type: 'array', items: { type: 'string' } },
        tags: { type: 'array', items: { type: 'string' } },
        category: { type: 'string', enum: [...CATEGORIES] },
      },
      required: ['summary', 'keyPoints', 'tags', 'category'],
    },
  },
});

/**
 * Extract the first text part from a Gemini `generateContent` response.
 * Returns `null` for any missing / empty / wrong-typed shape (never throws);
 * the caller turns `null` into an error so `runDigest` maps it to a 502.
 */
export const extractGeminiText = (data: unknown): string | null => {
  const text = (
    data as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] } | null
  )?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === 'string' && text.length > 0 ? text : null;
};
