import { describe, expect, it, vi } from 'vitest';
import { extractArticleText, runDigest, MAX_INPUT_CHARS } from './service';
import { buildDigestPrompt } from './prompt';
import type { Digest } from '../types';

const VALID: Digest = {
  summary: 'A concise recap of the article.',
  keyPoints: ['first point', 'second point'],
  tags: ['alpha', 'beta'],
  category: 'Technology',
};

const validReply = JSON.stringify(VALID);

describe('extractArticleText', () => {
  it('returns the trimmed text for a valid body', () => {
    expect(extractArticleText({ text: '  hello world  ' })).toBe('hello world');
  });

  it('rejects non-objects, arrays, and null', () => {
    expect(extractArticleText(null)).toBeNull();
    expect(extractArticleText('hi')).toBeNull();
    expect(extractArticleText(['hi'])).toBeNull();
  });

  it('rejects a missing or non-string text field', () => {
    expect(extractArticleText({})).toBeNull();
    expect(extractArticleText({ text: 42 })).toBeNull();
  });

  it('rejects empty / whitespace-only text', () => {
    expect(extractArticleText({ text: '' })).toBeNull();
    expect(extractArticleText({ text: '   \n  ' })).toBeNull();
  });
});

describe('runDigest', () => {
  it('returns 200 with a validated Digest and calls Claude with the M1 prompt', async () => {
    const call = vi.fn().mockResolvedValue(validReply);
    const result = await runDigest({ text: 'Some article body.' }, call);

    expect(result).toEqual({ status: 200, body: VALID });
    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith(buildDigestPrompt('Some article body.'));
  });

  it('returns 400 and skips the caller for an invalid body', async () => {
    const call = vi.fn();
    const result = await runDigest({ nope: true }, call);

    expect(result.status).toBe(400);
    expect(call).not.toHaveBeenCalled();
  });

  it('returns 400 and skips the caller for oversized text', async () => {
    const call = vi.fn();
    const result = await runDigest({ text: 'x'.repeat(MAX_INPUT_CHARS + 1) }, call);

    expect(result.status).toBe(400);
    expect(call).not.toHaveBeenCalled();
  });

  it('returns 502 when the caller rejects, without throwing', async () => {
    const call = vi.fn().mockRejectedValue(new Error('network down'));
    const result = await runDigest({ text: 'Some article body.' }, call);

    expect(result.status).toBe(502);
    if (result.status === 502) expect(result.body.error).toMatch(/./);
  });

  it('returns 502 when the reply is malformed JSON', async () => {
    const call = vi.fn().mockResolvedValue('not json at all');
    const result = await runDigest({ text: 'Some article body.' }, call);

    expect(result.status).toBe(502);
  });

  it('returns 502 when the reply is well-formed JSON but not a Digest', async () => {
    const call = vi.fn().mockResolvedValue(JSON.stringify({ summary: 'x' }));
    const result = await runDigest({ text: 'Some article body.' }, call);

    expect(result.status).toBe(502);
  });
});
