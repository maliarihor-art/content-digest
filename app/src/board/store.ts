import { CATEGORIES } from '@/digest/category';
import type { Board, Card, Section } from './types';

const STORAGE_KEY = 'content-digest.board.v1';

export const emptyBoard = (): Board => ({ cards: [] });

/** Pure: returns a new board with the card appended; never mutates the input. */
export const addCard = (board: Board, card: Card): Board => ({
  cards: [...board.cards, card],
});

/** Group cards into taxonomy-ordered sections, omitting empty categories. */
export const groupByCategory = (board: Board): Section[] => {
  const sections: Section[] = [];
  for (const category of CATEGORIES) {
    const cards = board.cards.filter((c) => c.digest.category === category);
    if (cards.length > 0) sections.push({ category, cards });
  }
  return sections;
};

export const serializeBoard = (board: Board): string => JSON.stringify(board);

const CATEGORY_SET: ReadonlySet<string> = new Set(CATEGORIES);

const isCard = (value: unknown): value is Card => {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Record<string, unknown>;
  const d = c.digest as Record<string, unknown> | undefined;
  return (
    typeof c.id === 'string' &&
    typeof c.title === 'string' &&
    typeof c.createdAt === 'string' &&
    (c.source === undefined || typeof c.source === 'string') &&
    typeof d === 'object' &&
    d !== null &&
    typeof d.summary === 'string' &&
    Array.isArray(d.keyPoints) &&
    Array.isArray(d.tags) &&
    typeof d.category === 'string' &&
    CATEGORY_SET.has(d.category)
  );
};

/** Parse a stored board. Returns an empty board for null/invalid input — never throws. */
export const deserializeBoard = (raw: string | null): Board => {
  if (raw === null) return emptyBoard();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return emptyBoard();
    const cards = (parsed as Record<string, unknown>).cards;
    if (!Array.isArray(cards) || !cards.every(isCard)) return emptyBoard();
    return { cards };
  } catch {
    return emptyBoard();
  }
};

// --- Impure localStorage wrappers (used only by the React layer) ---

export const loadBoard = (): Board => {
  if (typeof localStorage === 'undefined') return emptyBoard();
  return deserializeBoard(localStorage.getItem(STORAGE_KEY));
};

export const saveBoard = (board: Board): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, serializeBoard(board));
};
