import { contentWordFrequencies } from './text';

/**
 * Top content words by frequency, as lowercase unique tags.
 * Ties broken alphabetically so output is deterministic.
 */
export const extractTags = (text: string, max = 6): string[] => {
  const freqs = [...contentWordFrequencies(text).entries()];
  freqs.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return freqs.slice(0, Math.max(0, max)).map(([word]) => word);
};
