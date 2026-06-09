import { describe, it, expect } from 'vitest';
import { proposeCategory, CATEGORIES } from './category';

describe('proposeCategory', () => {
  it('classifies software/AI text as Technology', () => {
    const text =
      'The startup shipped new software. The app uses an algorithm and machine learning code.';
    expect(proposeCategory(text)).toBe('Technology');
  });

  it('classifies market/revenue text as Business', () => {
    const text = 'The company reported revenue growth. Investors and the market reacted to profit.';
    expect(proposeCategory(text)).toBe('Business');
  });

  it('falls back to Other when no keywords match', () => {
    expect(proposeCategory('the quiet afternoon drifted by slowly')).toBe('Other');
  });
});

describe('CATEGORIES', () => {
  it('lists Other last as the fallback', () => {
    expect(CATEGORIES[CATEGORIES.length - 1]).toBe('Other');
  });
});
