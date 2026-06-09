import type { Category, Digest } from '@/digest/types';

/** One article saved to the board. Time-varying fields are supplied by the caller. */
export interface Card {
  id: string;
  title: string;
  source?: string;
  createdAt: string; // ISO timestamp
  digest: Digest;
}

export interface Board {
  cards: Card[];
}

/** A topic section: a category and the cards filed under it. */
export interface Section {
  category: Category;
  cards: Card[];
}
