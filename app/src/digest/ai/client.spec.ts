import { describe, expect, it, vi } from 'vitest';
import { requestDigest, DIGEST_ENDPOINT } from './client';
import { buildDigest } from '../digest';
import type { Digest } from '../types';

const AI_DIGEST: Digest = {
  summary: 'A real AI summary of the article.',
  keyPoints: ['ai point one', 'ai point two'],
  tags: ['alpha', 'beta'],
  category: 'Technology',
};

/** Build a fetch stub resolving a Response-like object. */
const okResponse = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

const errResponse = (status: number, body: unknown = { error: 'nope' }): Response =>
  ({ ok: false, status, json: async () => body }) as unknown as Response;

const ARTICLE = 'Some article body about software and computers.';

describe('requestDigest — AI success path', () => {
  it('returns the validated AI digest and does not call the fallback', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse(AI_DIGEST));
    const fallback = vi.fn();

    const outcome = await requestDigest(ARTICLE, { fetch: fetchImpl, fallback });

    expect(outcome.source).toBe('ai');
    expect(outcome.digest).toEqual(AI_DIGEST);
    expect(outcome.notice).toBeUndefined();
    expect(fallback).not.toHaveBeenCalled();
  });

  it('POSTs JSON { text } to the digest endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse(AI_DIGEST));

    await requestDigest(ARTICLE, { fetch: fetchImpl, fallback: buildDigest });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(DIGEST_ENDPOINT);
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body as string)).toEqual({ text: ARTICLE });
  });

  it('normalises the AI body through parseDigestResponse (defence in depth)', async () => {
    // Server returns extra/dirty data; client must trim + cap + lowercase via M1 parse.
    const dirty = {
      summary: '  spaced summary  ',
      keyPoints: ['  a  ', '', 'b'],
      tags: ['Alpha', 'ALPHA', 'beta'],
      category: 'Science',
    };
    const fetchImpl = vi.fn().mockResolvedValue(okResponse(dirty));

    const outcome = await requestDigest(ARTICLE, { fetch: fetchImpl, fallback: buildDigest });

    expect(outcome.source).toBe('ai');
    expect(outcome.digest.summary).toBe('spaced summary');
    expect(outcome.digest.keyPoints).toEqual(['a', 'b']);
    expect(outcome.digest.tags).toEqual(['alpha', 'beta']);
  });
});

describe('requestDigest — fallback paths', () => {
  it('falls back to the local digest on a non-OK status', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(errResponse(502));

    const outcome = await requestDigest(ARTICLE, { fetch: fetchImpl, fallback: buildDigest });

    expect(outcome.source).toBe('local');
    expect(outcome.digest).toEqual(buildDigest(ARTICLE));
    expect(outcome.notice).toMatch(/./);
  });

  it('falls back when a 200 body fails Digest validation', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ summary: 'x' }));

    const outcome = await requestDigest(ARTICLE, { fetch: fetchImpl, fallback: buildDigest });

    expect(outcome.source).toBe('local');
    expect(outcome.digest).toEqual(buildDigest(ARTICLE));
  });

  it('falls back when fetch rejects (network/offline) and never throws', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));

    const outcome = await requestDigest(ARTICLE, { fetch: fetchImpl, fallback: buildDigest });

    expect(outcome.source).toBe('local');
    expect(outcome.digest).toEqual(buildDigest(ARTICLE));
    expect(outcome.notice).toMatch(/./);
  });

  it('falls back when response.json() itself throws', async () => {
    const broken = { ok: true, status: 200, json: async () => { throw new Error('bad'); } };
    const fetchImpl = vi.fn().mockResolvedValue(broken as unknown as Response);

    const outcome = await requestDigest(ARTICLE, { fetch: fetchImpl, fallback: buildDigest });

    expect(outcome.source).toBe('local');
    expect(outcome.digest).toEqual(buildDigest(ARTICLE));
  });
});
