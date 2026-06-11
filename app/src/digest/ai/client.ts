import type { Digest } from '../types';
import { buildDigest } from '../digest';
import { parseDigestResponse } from './parse';

/** The serverless proxy endpoint (M2). Same-origin; M4 wires hosting. */
export const DIGEST_ENDPOINT = '/api/digest';

/** Where a digest came from: the AI proxy, or the local heuristic fallback. */
export type DigestSource = 'ai' | 'local';

/** Result of producing a digest: the digest plus how it was produced. */
export interface DigestOutcome {
  digest: Digest;
  source: DigestSource;
  /** Human-readable reason the fallback was used (only when `source === 'local'`). */
  notice?: string;
}

/** Injected I/O so the decision tree is unit-testable with no real network. */
export interface DigestClientDeps {
  fetch: typeof fetch;
  fallback: (text: string) => Digest;
}

const FALLBACK_NOTICE = 'Used a local summary — AI was unavailable.';

/**
 * Produce a digest for `text`: ask the serverless proxy first, fall back to the
 * local heuristic on any failure (non-OK status, malformed/invalid body, or a
 * network error). Never throws — the worst case is a deterministic local digest.
 *
 * All branching lives here (pure but for the injected `fetch`/`fallback`) so the
 * React layer stays render-only; the AI body is re-validated through M1's
 * `parseDigestResponse` before use — the wire is never trusted blindly.
 */
export const requestDigest = async (
  text: string,
  deps: DigestClientDeps = { fetch: globalThis.fetch, fallback: buildDigest },
): Promise<DigestOutcome> => {
  const local = (): DigestOutcome => ({
    digest: deps.fallback(text),
    source: 'local',
    notice: FALLBACK_NOTICE,
  });

  try {
    const response = await deps.fetch(DIGEST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) return local();

    const body: unknown = await response.json();
    const parsed = parseDigestResponse(body);
    if (!parsed.ok) return local();

    return { digest: parsed.digest, source: 'ai' };
  } catch {
    return local();
  }
};
