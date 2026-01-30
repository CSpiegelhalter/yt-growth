// Re-export from client (server-only)
export {
  // High-level API methods
  fetchKeywordOverview,
  fetchRelatedKeywords,
  fetchCombinedKeywordData,
  fetchGoogleTrends,
  // Standard task-based methods
  postSearchVolumeTask,
  getSearchVolumeTask,
  postKeywordsForKeywordsTask,
  getKeywordsForKeywordsTask,
  postGoogleTrendsTask,
  getGoogleTrendsTask,
  parseGoogleTrendsResult,
  // Types
  type KeywordMetrics,
  type KeywordOverviewRow,
  type RelatedKeywordRow,
  type KeywordOverviewResponse,
  type KeywordRelatedResponse,
  type KeywordCombinedResponse,
  type GoogleTrendsResponse,
  type GoogleTrendsTimePoint,
  type GoogleTrendsRisingQuery,
  type GoogleTrendsRegion,
  type TaskPostResult,
  type TaskGetResult,
} from "./client";

// Re-export YouTube SERP client (server-only)
export {
  fetchYouTubeSerp,
  formatViews,
  type YouTubeRankingResult,
  type YouTubeSerpResponse,
} from "./youtube-serp";

// Re-export competitive context (server-only)
export {
  fetchCompetitiveContext,
  type CompetitiveContext,
} from "./competitive-context";

// Re-export utilities (can be used in tests)
export {
  validatePhrase,
  validateLocation,
  validateKeywords,
  generateRequestHash,
  calculateDifficultyHeuristic,
  parseNumeric,
  parseInteger,
  parseMonthlyTrend,
  parseCompetitionLevel,
  isRestrictedCategoryError,
  DataForSEOError,
  SUPPORTED_LOCATIONS,
  LOCATION_MAP,
  RateLimiter,
  tasksReadyRateLimiter,
  type LocationCode,
  type DataForSEOErrorCode,
} from "./utils";

// Re-export cache functions (server-only)
export {
  getCachedResponse,
  setCachedResponse,
  setPendingTask,
  getPendingTask,
  completePendingTask,
  cleanupExpiredCache,
  getCacheStats,
} from "./cache";
