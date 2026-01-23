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
  ContentTypeFilter,
  DateRangePreset,
  SortOption,
  CompetitorSearchFilters,
  NicheInferenceInput,
  InferredNiche,
  SearchMode,
  CompetitorSearchRequest,
  DerivedMetrics,
  CompetitorVideoResult,
  SearchStatusEvent,
  SearchItemsEvent,
  SearchDoneEvent,
  SearchErrorEvent,
  SearchEvent,
  SearchEngineConfig,
  SearchCursor,
  CacheKeyComponents,
  CachedSearchResults,
} from "./types";

export { DEFAULT_FILTERS, DEFAULT_ENGINE_CONFIG } from "./types";

// Export pure utilities (can be used in tests)
export {
  sanitizeNicheText,
  inferNicheFromText,
  validateAndExtractVideoId,
  hashNicheForLogging,
  normalizeFilters,
  makeCacheKey,
  calculateDerivedMetrics,
  passesFilters,
  sortVideos,
} from "./utils";

// Export server-only niche inference (with API calls)
export { inferNiche } from "./niche-inference";

// Export server-only cache functions
export {
  makeInferenceCacheKey,
  getCachedInference,
  setCachedInference,
  getCachedSearchResults,
  setCachedSearchResults,
  invalidateCachedSearchResults,
  cleanupExpiredCache,
  getCacheStats,
} from "./cache";

// Export server-only search engine
export {
  searchCompetitors,
  searchCompetitorsWithCache,
} from "./search-engine";
