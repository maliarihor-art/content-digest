import { describe, it, expect } from 'vitest';
import {
  emptyBoard,
  addCard,
  groupByCategory,
  serializeBoard,
  deserializeBoard,
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
