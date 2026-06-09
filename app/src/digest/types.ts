import type { CATEGORIES } from './category';

/** A topic category. Derived from the taxonomy declared in category.ts. */
export type Category = (typeof CATEGORIES)[number];

/** The result of analyzing one article. Fully serializable. */
export interface Digest {
  summary: string;
  keyPoints: string[];
  tags: string[];
  category: Category;
}
