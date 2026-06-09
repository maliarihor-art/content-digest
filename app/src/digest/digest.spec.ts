import { describe, it, expect } from 'vitest';
import { buildDigest } from './digest';

const ARTICLE =
  'The startup shipped new software this week. The app uses a machine learning algorithm to rank content. ' +
  'Engineers said the code base is now faster and the data pipeline scales. Users praised the new design.';

describe('buildDigest', () => {
  it('produces a full digest within documented bounds', () => {
    const d = buildDigest(ARTICLE);
    expect(d.summary.length).toBeGreaterThan(0);
    expect(d.keyPoints.length).toBeGreaterThan(0);
    expect(d.keyPoints.length).toBeLessThanOrEqual(5);
    expect(d.tags.length).toBeLessThanOrEqual(6);
    expect(d.category).toBe('Technology');
  });

  it('is deterministic for the same input', () => {
    expect(buildDigest(ARTICLE)).toEqual(buildDigest(ARTICLE));
  });

  it('handles empty input without throwing', () => {
    const d = buildDigest('');
    expect(d.summary).toBe('');
    expect(d.keyPoints).toEqual([]);
    expect(d.tags).toEqual([]);
    expect(d.category).toBe('Other');
  });
});
