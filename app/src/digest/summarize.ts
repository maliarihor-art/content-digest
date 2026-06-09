import { splitSentences, contentWordFrequencies, tokenize, STOPWORDS } from './text';

export interface ScoredSentence {
  sentence: string;
  score: number;
  index: number;
}

const isContentWord = (token: string): boolean =>
  token.length >= 3 && !STOPWORDS.has(token);

/**
 * Score each sentence by the summed corpus frequency of its content words.
 * Returned sorted by score desc, ties broken by original position asc.
 */
export const scoreSentences = (text: string): ScoredSentence[] => {
  const freqs = contentWordFrequencies(text);
  const scored = splitSentences(text).map((sentence, index) => {
    const score = tokenize(sentence)
      .filter(isContentWord)
      .reduce((sum, word) => sum + (freqs.get(word) ?? 0), 0);
    return { sentence, score, index };
  });
  return scored.sort((a, b) => b.score - a.score || a.index - b.index);
};

/** Extractive summary: top sentences, re-joined in their original order. */
export const summarize = (text: string, maxSentences = 3): string => {
  const top = scoreSentences(text).slice(0, Math.max(0, maxSentences));
  return top
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence)
    .join(' ');
};

/** Key points: top sentences kept in relevance order (most relevant first). */
export const keyPoints = (text: string, max = 5): string[] =>
  scoreSentences(text)
    .slice(0, Math.max(0, max))
    .map((s) => s.sentence);
