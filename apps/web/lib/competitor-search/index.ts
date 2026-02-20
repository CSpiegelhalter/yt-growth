/**
 * Competitor Search Module
 *
 * Unified competitor search engine supporting:
 * - Competitor Search: Search by niche text and/or reference video URL
 * - Search My Niche: Search using the user's channel niche
 *
 * Both modes use the same underlying search + filter + refill engine.
 */
import "server-only";

// Export types
export type {
  CompetitorSearchFilters,
  InferredNiche,
  SearchEvent,
  SearchCursor,
} from "./types";

export { DEFAULT_FILTERS } from "./types";

// Export pure utilities (can be used in tests)
export {
  sanitizeNicheText,
  hashNicheForLogging,
  makeCacheKey,
} from "./utils";

// Export server-only niche inference (with API calls)
export { inferNiche } from "./niche-inference";

// Export server-only cache functions
export {
  getCachedSearchResults,
  setCachedSearchResults,
} from "./cache";

// Export server-only search engine
export {
  searchCompetitorsWithCache,
} from "./search-engine";
