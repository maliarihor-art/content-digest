import { describe, it, expect } from 'vitest';
import { splitSentences, tokenize, contentWordFrequencies, STOPWORDS } from './text';

describe('splitSentences', () => {
  it('splits on sentence-ending punctuation and trims', () => {
    const out = splitSentences('Hello world. How are you?  Fine!');
    expect(out).toEqual(['Hello world.', 'How are you?', 'Fine!']);
  });

  it('returns an empty array for blank input', () => {
    expect(splitSentences('   ')).toEqual([]);
  });

  it('keeps a single sentence without trailing punctuation', () => {
    expect(splitSentences('just one line')).toEqual(['just one line']);
  });
});

describe('tokenize', () => {
  it('lowercases and strips punctuation', () => {
    expect(tokenize('The Quick, brown FOX!')).toEqual(['the', 'quick', 'brown', 'fox']);
  });
});

describe('contentWordFrequencies', () => {
  it('counts content words, dropping stopwords and short tokens', () => {
    const freqs = contentWordFrequencies('the cat and the cat sat on a mat');
    expect(freqs.get('cat')).toBe(2);
    expect(freqs.get('mat')).toBe(1);
    expect(freqs.has('the')).toBe(false); // stopword
    expect(freqs.has('on')).toBe(false); // too short
  });
});

describe('STOPWORDS', () => {
  it('includes common english stopwords', () => {
    expect(STOPWORDS.has('the')).toBe(true);
    expect(STOPWORDS.has('and')).toBe(true);
  });
});
