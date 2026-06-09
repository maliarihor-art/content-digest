import { summarize, keyPoints } from './summarize';
import { extractTags } from './tags';
import { proposeCategory } from './category';
import type { Digest } from './types';

/**
 * Build a full digest from raw article text. Pure and deterministic:
 * the same input always yields the same Digest. No I/O, no time, no randomness.
 */
export const buildDigest = (text: string): Digest => ({
  summary: summarize(text, 3),
  keyPoints: keyPoints(text, 5),
  tags: extractTags(text, 6),
  category: proposeCategory(text),
});
