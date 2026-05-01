/**
 * Maps the dashboard's niche labels to YouTube Data API category IDs.
 *
 * The category ID list is at `lib/adapters/youtube/constants.ts`. Several
 * dashboard niches collapse onto the same YouTube category (Cooking, Fitness,
 * Beauty, and DIY all sit under Howto & Style) because YouTube's taxonomy is
 * coarser than what creators think in.
 */
export const NICHE_TO_YOUTUBE_CATEGORY: Record<string, string> = {
  Cooking: "26",   // Howto & Style
  Gaming: "20",    // Gaming
  Tech: "28",      // Science & Technology
  Fitness: "26",   // Howto & Style
  Beauty: "26",    // Howto & Style
  Education: "27", // Education
  Finance: "27",   // Education
  Travel: "19",    // Travel & Events
  Music: "10",     // Music
  Comedy: "23",    // Comedy
  Science: "28",   // Science & Technology
  DIY: "26",       // Howto & Style
  Vlogging: "22",  // People & Blogs
  News: "25",      // News & Politics
};

export function getYouTubeCategoryForNiche(niche: string): string | null {
  return NICHE_TO_YOUTUBE_CATEGORY[niche] ?? null;
}

/**
 * Seed search phrase for the per-niche related-keyword fetch. The DataForSEO
 * `keywords_for_keywords` endpoint returns 50+ semantically related queries
 * given a seed term; we use that seed to scope the brief's anchor pool to
 * the user's niche. Single-word seeds work well for most niches; richer
 * niches use a 2-word phrase that better disambiguates.
 */
export const NICHE_TO_SEED_PHRASE: Record<string, string> = {
  Cooking: "cooking",
  Gaming: "gaming",
  Tech: "tech review",
  Fitness: "fitness",
  Beauty: "beauty",
  Education: "tutorial",
  Finance: "personal finance",
  Travel: "travel vlog",
  Music: "music",
  Comedy: "comedy",
  Science: "science",
  DIY: "diy projects",
  Vlogging: "vlog",
  News: "news",
};

export function getSeedPhraseForNiche(niche: string): string | null {
  return NICHE_TO_SEED_PHRASE[niche] ?? null;
}
