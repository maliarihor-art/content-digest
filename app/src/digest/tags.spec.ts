import { describe, it, expect } from 'vitest';
import { extractTags } from './tags';

describe('extractTags', () => {
  it('returns the most frequent content words, lowercased and unique', () => {
    const tags = extractTags(
      'Solar power and solar energy. Solar panels store energy efficiently.',
      6,
    );
    expect(tags[0]).toBe('solar');
    expect(tags).toContain('energy');
    expect(new Set(tags).size).toBe(tags.length); // unique
    expect(tags.every((t) => t === t.toLowerCase())).toBe(true);
  });

  it('caps the number of tags at max', () => {
    const tags = extractTags('alpha beta gamma delta epsilon zeta eta theta', 3);
    expect(tags.length).toBeLessThanOrEqual(3);
  });

  it('returns an empty array when there are no content words', () => {
    expect(extractTags('the on a an to of', 6)).toEqual([]);
  });
});
