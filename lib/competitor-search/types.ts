/**
 * Competitor Search Types
 *
 * Core type definitions for the unified competitor search engine.
 * Used end-to-end: client -> server -> cache keys -> DB.
 */

// ============================================
// FILTER TYPES
// ============================================

/**
 * Content type filter for video duration.
 * - "shorts": Under 60 seconds (YouTube Shorts)
 * - "long": Over 60 seconds (standard videos)
 * - "both": No duration filter
 */
export type ContentTypeFilter = "shorts" | "long" | "both";

/**
 * Date range preset for quick filtering.
 * Custom dates use postedAfter/postedBefore directly.
 */
export type DateRangePreset = "7d" | "30d" | "90d" | "365d" | "custom";

/**
 * Sort options for competitor results.
 */
export type SortOption = "viewsPerDay" | "totalViews" | "newest" | "engagement";

/**
 * Complete filter configuration for competitor search.
 * All fields are optional - defaults are applied server-side.
 */
export type CompetitorSearchFilters = {
  // Content type
  contentType?: ContentTypeFilter;

  // Posted date range
  dateRangePreset?: DateRangePreset;
  postedAfter?: string; // ISO date string (YYYY-MM-DD)
  postedBefore?: string; // ISO date string (YYYY-MM-DD)

  // Channel creation date range (optional)
  channelCreatedAfter?: string; // ISO date string
  channelCreatedBefore?: string; // ISO date string

  // Views per day filter
  minViewsPerDay?: number;
  maxViewsPerDay?: number;

  // Total views filter
  minTotalViews?: number;
  maxTotalViews?: number;

  // Sorting
  sortBy?: SortOption;

  // Target number of results to display
  targetResultCount?: number;
};

/**
 * Default filter values.
 */
export const DEFAULT_FILTERS: Required<
  Pick<
    CompetitorSearchFilters,
    | "contentType"
    | "dateRangePreset"
    | "minViewsPerDay"
    | "sortBy"
    | "targetResultCount"
  >
> = {
  contentType: "both",
  dateRangePreset: "90d",
  minViewsPerDay: 10, // Minimum quality threshold
  sortBy: "viewsPerDay",
  targetResultCount: 24, // Fill the grid nicely
};

// ============================================
// NICHE INFERENCE TYPES
// ============================================

/**
 * Input for niche inference.
 * At least one of nicheText or referenceVideoUrl should be provided.
 */
export type NicheInferenceInput = {
  nicheText?: string;
  referenceVideoUrl?: string;
};

/**
 * Result of niche inference.
 */
export type InferredNiche = {
  /** Human-readable niche description */
  niche: string;

  /** Search queries to use for finding competitors */
  queryTerms: string[];

  /** Optional category hints derived from reference video */
  categoryHints?: {
    categoryId?: string;
    categoryName?: string;
    suggestedContentType?: ContentTypeFilter;
  };

  /** Source of the inference */
  source: "text" | "video" | "combined" | "channel_profile";

  /** Reference video metadata if URL was provided */
  referenceVideo?: {
    videoId: string;
    title: string;
    channelTitle: string;
    description?: string;
    tags?: string[];
  };

  /** Timestamp when this was inferred */
  inferredAt: string;
};

// ============================================
// SEARCH MODE TYPES
// ============================================

/**
 * Search mode determines the source of niche data.
 */
export type SearchMode = "competitor_search" | "search_my_niche";

/**
 * Complete search request combining mode, niche input, and filters.
 */
export type CompetitorSearchRequest = {
  mode: SearchMode;

  // For "competitor_search" mode
  nicheText?: string;
  referenceVideoUrl?: string;

  // For "search_my_niche" mode
  channelId?: string;

  // Filters apply to both modes
  filters: CompetitorSearchFilters;
};

// ============================================
// SEARCH RESULT TYPES
// ============================================

/**
 * Derived metrics for a competitor video.
 * viewsPerDay = totalViews / max(1, daysSincePublished)
 */
export type DerivedMetrics = {
  viewsPerDay: number;
  daysSincePublished: number;
  velocity24h?: number;
  velocity7d?: number;
  engagementPerView?: number;
};

/**
 * A single competitor video result.
 */
export type CompetitorVideoResult = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  channelThumbnailUrl: string | null;
  thumbnailUrl: string | null;
  publishedAt: string;
  durationSec?: number;
  stats: {
    viewCount: number;
    likeCount?: number;
    commentCount?: number;
  };
  derived: DerivedMetrics;
};

// ============================================
// STREAMING EVENT TYPES
// ============================================

/**
 * Status update event during search.
 */
export type SearchStatusEvent = {
  type: "status";
  status: "searching" | "filtering" | "refilling" | "done";
  message: string;
  scannedCount: number;
  matchedCount: number;
};

/**
 * New items found event.
 */
export type SearchItemsEvent = {
  type: "items";
  items: CompetitorVideoResult[];
  totalMatched: number;
};

/**
 * Search completed event with summary.
 */
export type SearchDoneEvent = {
  type: "done";
  summary: {
    scannedCount: number;
    returnedCount: number;
    cacheHit: boolean;
    timeMs: number;
    exhausted: boolean; // true if we ran out of source results
  };
  /** Cursor to continue searching for more results (if not exhausted) */
  nextCursor?: SearchCursor;
};

/**
 * Error event.
 */
export type SearchErrorEvent = {
  type: "error";
  error: string;
  code?: string;
  partial?: boolean; // true if some results were returned before error
};

/**
 * Union of all search events for streaming.
 */
export type SearchEvent =
  | SearchStatusEvent
  | SearchItemsEvent
  | SearchDoneEvent
  | SearchErrorEvent;

// ============================================
// ENGINE CONFIGURATION
// ============================================

/**
 * Configuration for the search engine.
 */
export type SearchEngineConfig = {
  /** Maximum pages to fetch from YouTube (prevent infinite loops) */
  maxPages: number;

  /** Maximum candidates to scan before stopping */
  maxCandidatesScanned: number;

  /** Batch size for YouTube API calls */
  batchSize: number;

  /** Target number of results */
  targetResults: number;
};

export const DEFAULT_ENGINE_CONFIG: SearchEngineConfig = {
  maxPages: 10,
  maxCandidatesScanned: 500,
  batchSize: 50,
  targetResults: 24,
};

// ============================================
// PAGINATION TYPES
// ============================================

/**
 * Cursor for pagination - allows resuming search from where we left off.
 */
export type SearchCursor = {
  /** Index of the query term we're currently on */
  queryIndex: number;
  /** YouTube page token for the current query */
  pageToken?: string;
  /** Video IDs already seen (to dedupe) */
  seenIds: string[];
  /** Total candidates already scanned */
  scannedCount: number;
};

// ============================================
// CACHE TYPES
// ============================================

/**
 * Cache key components for stable key generation.
 */
export type CacheKeyComponents = {
  mode: SearchMode;
  niche: string;
  queryTerms: string[];
  filters: CompetitorSearchFilters;
};

/**
 * Cached search results.
 */
export type CachedSearchResults = {
  results: CompetitorVideoResult[];
  inferredNiche: InferredNiche;
  scannedCount: number;
  exhausted: boolean;
  cachedAt: string;
  expiresAt: string;
};
