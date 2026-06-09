import { describe, it, expect } from 'vitest';
import { scoreSentences, summarize, keyPoints } from './summarize';

const TEXT =
  'Solar power is clean energy. Solar power and solar energy reduce costs. I had lunch.';

describe('scoreSentences', () => {
  it('ranks the most term-dense sentence first', () => {
    const ranked = scoreSentences(TEXT);
    expect(ranked[0]?.sentence).toBe('Solar power and solar energy reduce costs.');
  });
});

describe('summarize', () => {
  it('returns the single top sentence when maxSentences is 1', () => {
    expect(summarize(TEXT, 1)).toBe('Solar power and solar energy reduce costs.');
  });

  it('keeps selected sentences in original order and drops irrelevant ones', () => {
    const out = summarize(TEXT, 2);
    expect(out).toBe('Solar power is clean energy. Solar power and solar energy reduce costs.');
    expect(out).not.toContain('lunch');
  });

  it('returns empty string for blank input', () => {
    expect(summarize('   ', 3)).toBe('');
  });
});

describe('keyPoints', () => {
  it('returns up to max points ranked by relevance', () => {
    const points = keyPoints(TEXT, 2);
    expect(points).toHaveLength(2);
    expect(points[0]).toBe('Solar power and solar energy reduce costs.');
  });

  it('never returns more points than available sentences', () => {
    expect(keyPoints('Only one sentence here.', 5)).toHaveLength(1);
  });
});
