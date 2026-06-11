import { describe, it, expect } from 'vitest';
import { parseDigestResponse } from './parse';

const valid = {
  summary: 'A concise summary of the article.',
  keyPoints: ['First point', 'Second point'],
  tags: ['Tech', 'AI', 'tech'],
  category: 'Technology',
};

describe('parseDigestResponse — valid', () => {
  it('accepts a well-formed object and returns a Digest', () => {
    const result = parseDigestResponse(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.digest.summary).toBe('A concise summary of the article.');
      expect(result.digest.category).toBe('Technology');
    }
  });

  it('accepts a JSON string', () => {
    const result = parseDigestResponse(JSON.stringify(valid));
    expect(result.ok).toBe(true);
  });

  it('lowercases and de-duplicates tags within the cap', () => {
    const result = parseDigestResponse(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.digest.tags).toEqual(['tech', 'ai']);
    }
  });

  it('clamps keyPoints to at most 5 and tags to at most 6', () => {
    const result = parseDigestResponse({
      ...valid,
      keyPoints: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      tags: ['t1', 't2', 't3', 't4', 't5', 't6', 't7'],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.digest.keyPoints.length).toBeLessThanOrEqual(5);
      expect(result.digest.tags.length).toBeLessThanOrEqual(6);
    }
  });

  it('trims the summary', () => {
    const result = parseDigestResponse({ ...valid, summary: '  trimmed  ' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.digest.summary).toBe('trimmed');
  });

  it('trims keyPoints and drops empty / whitespace-only ones', () => {
    const result = parseDigestResponse({
      ...valid,
      keyPoints: ['  first  ', '', '   ', 'second'],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.digest.keyPoints).toEqual(['first', 'second']);
  });
});

describe('parseDigestResponse — malformed (rejected, never throws)', () => {
  const cases: Array<[string, unknown]> = [
    ['non-JSON string', 'not json at all {'],
    ['null', null],
    ['array', [1, 2, 3]],
    ['number', 42],
    ['missing summary', { keyPoints: [], tags: [], category: 'Technology' }],
    ['empty summary', { ...valid, summary: '   ' }],
    ['summary wrong type', { ...valid, summary: 123 }],
    ['keyPoints not an array', { ...valid, keyPoints: 'nope' }],
    ['keyPoints with non-string', { ...valid, keyPoints: ['ok', 5] }],
    ['tags not an array', { ...valid, tags: { a: 1 } }],
    ['tags with non-string', { ...valid, tags: ['ok', null] }],
    ['unknown category', { ...valid, category: 'Weather' }],
    ['missing category', { summary: 'x', keyPoints: [], tags: [] }],
  ];

  for (const [name, input] of cases) {
    it(`rejects: ${name}`, () => {
      let result;
      expect(() => {
        result = parseDigestResponse(input);
      }).not.toThrow();
      expect(result).toMatchObject({ ok: false });
    });
  }
});
