import { describe, it, expect } from 'vitest';
import { buildDigestPrompt } from './prompt';
import { CATEGORIES } from '../category';

const ARTICLE =
  'The startup shipped new software this week. The app uses a machine learning ' +
  'algorithm to rank content. Engineers said the code base is now faster.';

describe('buildDigestPrompt', () => {
  it('builds a Messages API payload with one user message containing the text', () => {
    const req = buildDigestPrompt(ARTICLE);
    expect(req.model.length).toBeGreaterThan(0);
    expect(req.max_tokens).toBeGreaterThan(0);
    expect(typeof req.system).toBe('string');
    expect(req.messages).toHaveLength(1);
    expect(req.messages[0]?.role).toBe('user');
    expect(req.messages[0]?.content).toContain(ARTICLE);
  });

  it('names every taxonomy category in the system instruction', () => {
    const { system } = buildDigestPrompt(ARTICLE);
    for (const category of CATEGORIES) {
      expect(system).toContain(category);
    }
  });

  it('names all four Digest fields and demands JSON-only output', () => {
    const { system } = buildDigestPrompt(ARTICLE);
    for (const field of ['summary', 'keyPoints', 'tags', 'category']) {
      expect(system).toContain(field);
    }
    expect(system.toLowerCase()).toContain('json');
  });

  it('is deterministic for the same input', () => {
    expect(buildDigestPrompt(ARTICLE)).toEqual(buildDigestPrompt(ARTICLE));
  });

  it('handles empty text without throwing', () => {
    expect(() => buildDigestPrompt('')).not.toThrow();
  });
});
