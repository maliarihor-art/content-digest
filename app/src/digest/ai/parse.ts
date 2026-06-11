import { CATEGORIES } from '../category';
import type { Category } from '../types';
import type { Digest } from '../types';

const MAX_KEY_POINTS = 5;
const MAX_TAGS = 6;

/** Outcome of validating a Claude reply against the Digest contract. */
export type ParseResult =
  | { ok: true; digest: Digest }
  | { ok: false; error: string };

const fail = (error: string): ParseResult => ({ ok: false, error });

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isCategory = (value: unknown): value is Category =>
  typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);

/**
 * Strictly validate Claude's JSON reply (object or JSON string) against the
 * `Digest` shape and the fixed taxonomy. Never throws — malformed input is
 * reported as `{ ok: false, error }`. On success, the returned `Digest` obeys
 * the established invariants (trimmed summary, capped keyPoints, lowercased +
 * unique + capped tags, valid category).
 */
export const parseDigestResponse = (input: unknown): ParseResult => {
  let value: unknown = input;

  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return fail('response is not valid JSON');
    }
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return fail('response is not a JSON object');
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.summary !== 'string' || obj.summary.trim().length === 0) {
    return fail('"summary" must be a non-empty string');
  }
  if (!isStringArray(obj.keyPoints)) {
    return fail('"keyPoints" must be an array of strings');
  }
  if (!isStringArray(obj.tags)) {
    return fail('"tags" must be an array of strings');
  }
  if (!isCategory(obj.category)) {
    return fail('"category" must be one of the taxonomy categories');
  }

  const tags = Array.from(
    new Set(obj.tags.map((tag) => tag.toLowerCase().trim()).filter((tag) => tag.length > 0)),
  ).slice(0, MAX_TAGS);

  return {
    ok: true,
    digest: {
      summary: obj.summary.trim(),
      keyPoints: obj.keyPoints.slice(0, MAX_KEY_POINTS),
      tags,
      category: obj.category,
    },
  };
};
