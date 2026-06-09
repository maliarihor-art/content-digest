/**
 * Pure text helpers shared by the digest pipeline. No I/O, no randomness.
 */

export const STOPWORDS: ReadonlySet<string> = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'her', 'was',
  'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now',
  'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she',
  'too', 'use', 'that', 'this', 'with', 'have', 'from', 'they', 'will', 'would', 'there',
  'their', 'what', 'about', 'which', 'when', 'were', 'been', 'into', 'than', 'them',
  'then', 'some', 'just', 'over', 'also', 'such', 'only', 'very', 'your', 'more', 'most',
  'other', 'these', 'those', 'because', 'while', 'where', 'after', 'before', 'between',
]);

/** Split text into trimmed sentences. Keeps terminal punctuation on each sentence. */
export const splitSentences = (text: string): string[] => {
  const matches = text.match(/[^.!?]+[.!?]*/g);
  if (!matches) return [];
  return matches.map((s) => s.trim()).filter((s) => s.length > 0);
};

/** Lowercase word tokens (letters/digits only), punctuation stripped. */
export const tokenize = (text: string): string[] => {
  const matches = text.toLowerCase().match(/[a-z0-9]+/g);
  return matches ?? [];
};

/** Frequency map of content words: length >= 3 and not a stopword. */
export const contentWordFrequencies = (text: string): Map<string, number> => {
  const freqs = new Map<string, number>();
  for (const token of tokenize(text)) {
    if (token.length < 3 || STOPWORDS.has(token)) continue;
    freqs.set(token, (freqs.get(token) ?? 0) + 1);
  }
  return freqs;
};
