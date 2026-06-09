import { tokenize } from './text';

/** Fixed topic taxonomy. `Other` is the fallback and MUST stay last. */
export const CATEGORIES = [
  'Technology',
  'Science',
  'Business',
  'Health',
  'Politics',
  'Sports',
  'Culture',
  'Other',
] as const;

type Topic = Exclude<(typeof CATEGORIES)[number], 'Other'>;

/** Keyword signals per topic. Matching is whole-token, case-insensitive. */
const KEYWORDS: Record<Topic, readonly string[]> = {
  Technology: [
    'software', 'hardware', 'app', 'application', 'algorithm', 'code', 'coding',
    'programming', 'computer', 'internet', 'digital', 'startup', 'machine', 'learning',
    'data', 'cloud', 'device', 'robot', 'chip', 'tech', 'technology', 'web', 'platform',
  ],
  Science: [
    'research', 'study', 'scientists', 'experiment', 'physics', 'chemistry', 'biology',
    'space', 'climate', 'molecule', 'genome', 'quantum', 'theory', 'discovery', 'particle',
  ],
  Business: [
    'company', 'market', 'revenue', 'profit', 'investors', 'investor', 'startup',
    'economy', 'stocks', 'shares', 'growth', 'sales', 'finance', 'merger', 'earnings',
    'customers', 'pricing',
  ],
  Health: [
    'health', 'disease', 'patients', 'doctor', 'hospital', 'medical', 'medicine',
    'vaccine', 'symptoms', 'treatment', 'diet', 'fitness', 'mental', 'wellness', 'virus',
  ],
  Politics: [
    'government', 'election', 'policy', 'senate', 'congress', 'president', 'vote',
    'voters', 'parliament', 'campaign', 'legislation', 'minister', 'diplomacy', 'party',
  ],
  Sports: [
    'game', 'match', 'team', 'player', 'players', 'coach', 'league', 'tournament',
    'score', 'championship', 'season', 'goal', 'athletes', 'stadium', 'olympics',
  ],
  Culture: [
    'film', 'movie', 'music', 'album', 'artist', 'book', 'novel', 'theatre', 'theater',
    'painting', 'museum', 'festival', 'culture', 'design', 'fashion', 'concert',
  ],
};

const TOPICS = CATEGORIES.filter((c): c is Topic => c !== 'Other');

/**
 * Propose a category by counting keyword hits per topic.
 * Highest count wins; ties break by taxonomy order; no hits → 'Other'.
 */
export const proposeCategory = (text: string): (typeof CATEGORIES)[number] => {
  const tokens = new Set(tokenize(text));
  let best: Topic | null = null;
  let bestScore = 0;
  for (const topic of TOPICS) {
    const score = KEYWORDS[topic].reduce((sum, kw) => sum + (tokens.has(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  }
  return best ?? 'Other';
};
