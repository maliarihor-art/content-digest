import { describe, it, expect } from 'vitest';
import {
  emptyBoard,
  addCard,
  groupByCategory,
  serializeBoard,
  deserializeBoard,
  removeCard,
  updateCardTitle,
  recategorize,
} from './store';
import type { Card } from './types';

const makeCard = (id: string, category: Card['digest']['category'], title = 'T'): Card => ({
  id,
  title,
  createdAt: '2026-06-09T00:00:00.000Z',
  digest: { summary: 's', keyPoints: ['k'], tags: ['t'], category },
});

describe('addCard', () => {
  it('returns a new board including the card without mutating the input', () => {
    const board = emptyBoard();
    const next = addCard(board, makeCard('1', 'Technology'));
    expect(next.cards).toHaveLength(1);
    expect(board.cards).toHaveLength(0); // input untouched
  });
});

describe('groupByCategory', () => {
  it('groups cards into taxonomy-ordered sections and omits empty ones', () => {
    let board = emptyBoard();
    board = addCard(board, makeCard('1', 'Business'));
    board = addCard(board, makeCard('2', 'Technology'));
    board = addCard(board, makeCard('3', 'Technology'));
    const sections = groupByCategory(board);
    expect(sections.map((s) => s.category)).toEqual(['Technology', 'Business']);
    expect(sections[0]?.cards).toHaveLength(2);
  });
});

describe('removeCard', () => {
  it('returns a new board without the matched card and leaves the input untouched', () => {
    let board = emptyBoard();
    board = addCard(board, makeCard('1', 'Technology'));
    board = addCard(board, makeCard('2', 'Business'));
    const next = removeCard(board, '1');
    expect(next.cards.map((c) => c.id)).toEqual(['2']);
    expect(board.cards).toHaveLength(2); // input untouched
  });

  it('is a no-op for an unknown id', () => {
    let board = emptyBoard();
    board = addCard(board, makeCard('1', 'Technology'));
    expect(removeCard(board, 'nope').cards.map((c) => c.id)).toEqual(['1']);
  });
});

describe('updateCardTitle', () => {
  it('replaces the matched card title, trimming, without touching others or the digest', () => {
    let board = emptyBoard();
    board = addCard(board, makeCard('1', 'Technology', 'old'));
    board = addCard(board, makeCard('2', 'Business', 'keep'));
    const next = updateCardTitle(board, '1', '  New title  ');
    expect(next.cards[0]?.title).toBe('New title');
    expect(next.cards[0]?.digest).toEqual(board.cards[0]?.digest);
    expect(next.cards[1]?.title).toBe('keep');
    expect(board.cards[0]?.title).toBe('old'); // input untouched
  });

  it('falls back to Untitled for an empty or whitespace title', () => {
    let board = emptyBoard();
    board = addCard(board, makeCard('1', 'Technology', 'old'));
    expect(updateCardTitle(board, '1', '   ').cards[0]?.title).toBe('Untitled');
  });

  it('is a no-op for an unknown id', () => {
    let board = emptyBoard();
    board = addCard(board, makeCard('1', 'Technology', 'old'));
    expect(updateCardTitle(board, 'nope', 'x').cards[0]?.title).toBe('old');
  });
});

describe('recategorize', () => {
  it('sets the matched card category, preserving the rest of the digest and other cards', () => {
    let board = emptyBoard();
    board = addCard(board, makeCard('1', 'Technology'));
    board = addCard(board, makeCard('2', 'Business'));
    const next = recategorize(board, '1', 'Health');
    expect(next.cards[0]?.digest.category).toBe('Health');
    expect(next.cards[0]?.digest.summary).toBe('s');
    expect(next.cards[0]?.digest.tags).toEqual(['t']);
    expect(next.cards[1]?.digest.category).toBe('Business');
    expect(board.cards[0]?.digest.category).toBe('Technology'); // input untouched
  });

  it('is a no-op for an unknown id', () => {
    let board = emptyBoard();
    board = addCard(board, makeCard('1', 'Technology'));
    expect(recategorize(board, 'nope', 'Health').cards[0]?.digest.category).toBe('Technology');
  });
});

describe('serialize/deserialize', () => {
  it('round-trips a board', () => {
    let board = emptyBoard();
    board = addCard(board, makeCard('1', 'Health'));
    expect(deserializeBoard(serializeBoard(board))).toEqual(board);
  });

  it('returns an empty board for null or invalid input instead of throwing', () => {
    expect(deserializeBoard(null)).toEqual(emptyBoard());
    expect(deserializeBoard('not json')).toEqual(emptyBoard());
    expect(deserializeBoard('{"cards":"nope"}')).toEqual(emptyBoard());
  });
});
