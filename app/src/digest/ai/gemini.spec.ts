import { describe, expect, it } from 'vitest';
import { buildGeminiBody, extractGeminiText } from './gemini';
import { buildDigestPrompt } from './prompt';
import { CATEGORIES } from '../category';

describe('buildGeminiBody', () => {
  const body = buildGeminiBody(buildDigestPrompt('Some article text.'));

  it('maps the system prompt to system_instruction', () => {
    expect(body.system_instruction.parts[0]?.text).toContain('structured digest');
  });

  it('maps the user message(s) into a single user content part', () => {
    expect(body.contents).toHaveLength(1);
    expect(body.contents[0]?.role).toBe('user');
    expect(body.contents[0]?.parts[0]?.text).toContain('Some article text.');
  });

  it('joins multiple messages with a blank line', () => {
    const multi = buildGeminiBody({
      model: 'm',
      max_tokens: 10,
      system: 's',
      messages: [
        { role: 'user', content: 'one' },
        { role: 'user', content: 'two' },
      ],
    });
    expect(multi.contents[0]?.parts[0]?.text).toBe('one\n\ntwo');
  });

  it('forwards the token budget and forces JSON output', () => {
    expect(body.generationConfig.maxOutputTokens).toBe(1024);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
  });

  it('constrains the response with a Digest schema (#2): required fields + category enum', () => {
    const schema = body.generationConfig.responseSchema;
    expect(schema.required).toEqual(['summary', 'keyPoints', 'tags', 'category']);
    expect(schema.properties.category.enum).toEqual([...CATEGORIES]);
    expect(schema.properties.keyPoints.items.type).toBe('string');
  });
});

describe('extractGeminiText', () => {
  it('returns the first text part', () => {
    const data = { candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] };
    expect(extractGeminiText(data)).toBe('{"ok":true}');
  });

  it('returns null for missing / empty / malformed shapes', () => {
    expect(extractGeminiText(null)).toBeNull();
    expect(extractGeminiText({})).toBeNull();
    expect(extractGeminiText({ candidates: [] })).toBeNull();
    expect(extractGeminiText({ candidates: [{ content: { parts: [] } }] })).toBeNull();
    expect(extractGeminiText({ candidates: [{ content: { parts: [{ text: '' }] } }] })).toBeNull();
    expect(extractGeminiText({ candidates: [{ content: { parts: [{ text: 5 }] } }] })).toBeNull();
  });
});
