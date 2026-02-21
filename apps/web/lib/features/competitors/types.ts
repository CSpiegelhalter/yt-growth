/**
 * Domain types for the competitors feature.
 *
 * These are the input/output DTOs used by use-cases. They capture the domain
 * concepts for competitor discovery, search, and video analysis.
 *
 * Note: CompetitorVideo and CompetitorVideoAnalysis are re-exported from
 * @/types/api where they are currently defined. In a future phase these
 * will be moved here as the canonical source.
 */

// Re-export canonical API types that this feature domain owns
export type {
  CompetitorVideo,
  CompetitorVideoAnalysis,
  CompetitorCommentsAnalysis,
  CompetitorFeedResponse,
} from "@/types/api";

// ── Search filter types ─────────────────────────────────────────

export type ContentTypeFilter = "shorts" | "long" | "both";

export type DateRangePreset = "7d" | "30d" | "90d" | "365d" | "custom";

export type SortOption = "viewsPerDay" | "totalViews" | "newest" | "engagement";

export type CompetitorSearchFilters = {
  contentType?: ContentTypeFilter;
  dateRangePreset?: DateRangePreset;
  postedAfter?: string;
  postedBefore?: string;
  channelCreatedAfter?: string;
  channelCreatedBefore?: string;
  minViewsPerDay?: number;
  maxViewsPerDay?: number;
  minTotalViews?: number;
  maxTotalViews?: number;
  sortBy?: SortOption;
  targetResultCount?: number;
};

// ── Niche inference ─────────────────────────────────────────────

export type NicheInferenceInput = {
  nicheText?: string;
  referenceVideoUrl?: string;
};

export type InferredNiche = {
  niche: string;
  queryTerms: string[];
  categoryHints?: {
    categoryId?: string;
    categoryName?: string;
    suggestedContentType?: ContentTypeFilter;
  };
  source: "text" | "video" | "combined" | "channel_profile";
  referenceVideo?: {
    videoId: string;
    title: string;
    channelTitle: string;
    description?: string;
    tags?: string[];
  };
  inferredAt: string;
};

// ── Search result types ─────────────────────────────────────────

export type SearchDerivedMetrics = {
  viewsPerDay: number;
  daysSincePublished: number;
  velocity24h?: number;
  velocity7d?: number;
  engagementPerView?: number;
};

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
  derived: SearchDerivedMetrics;
};

// ── Streaming event types ───────────────────────────────────────

export type SearchStatusEvent = {
  type: "status";
  status: "searching" | "filtering" | "refilling" | "done";
  message: string;
  scannedCount: number;
  matchedCount: number;
};

export type SearchItemsEvent = {
  type: "items";
  items: CompetitorVideoResult[];
  totalMatched: number;
};

export type SearchDoneEvent = {
  type: "done";
  summary: {
    scannedCount: number;
    returnedCount: number;
    cacheHit: boolean;
    timeMs: number;
    exhausted: boolean;
  };
  nextCursor?: SearchCursor;
};

export type SearchErrorEvent = {
  type: "error";
  error: string;
  code?: string;
  partial?: boolean;
};

export type SearchEvent =
  | SearchStatusEvent
  | SearchItemsEvent
  | SearchDoneEvent
  | SearchErrorEvent;

// ── Pagination ──────────────────────────────────────────────────

export type SearchCursor = {
  queryIndex: number;
  pageToken?: string;
  seenIds: string[];
  scannedCount: number;
};

// ── Discovery types ─────────────────────────────────────────────

export type DiscoveryListType =
  | "fastest_growing"
  | "breakouts"
  | "emerging_niches"
  | "low_competition";

export type DiscoveryChannelSize =
  | "micro"
  | "small"
  | "medium"
  | "large"
  | "any";

export type DiscoveryChannelAge =
  | "new"
  | "growing"
  | "established"
  | "any";

export type DiscoveryTimeWindow = "24h" | "7d" | "30d" | "90d";

export type DiscoverySortBy =
  | "velocity"
  | "breakout"
  | "recent"
  | "engagement"
  | "opportunity";

export type DiscoveryCategory =
  | "all"
  | "howto"
  | "entertainment"
  | "education"
  | "gaming"
  | "tech"
  | "lifestyle"
  | "business"
  | "creative"
  | "sports"
  | "news";

export type DiscoveryFilters = {
  channelSize: DiscoveryChannelSize;
  channelAge: DiscoveryChannelAge;
  contentType: ContentTypeFilter;
  timeWindow: DiscoveryTimeWindow;
  minViewsPerDay: number;
  category: DiscoveryCategory;
  sortBy: DiscoverySortBy;
};

export type SampleVideo = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  channelId: string;
  channelTitle: string;
  channelSubscribers?: number;
  viewCount: number;
  viewsPerDay: number;
  publishedAt: string;
  velocity24h?: number;
  breakoutScore?: number;
};

export type DiscoveredNiche = {
  id: string;
  nicheLabel: string;
  rationaleBullets: string[];
  sampleVideos: SampleVideo[];
  metrics: {
    medianViewsPerDay: number;
    totalVideos: number;
    uniqueChannels: number;
    avgDaysOld: number;
    opportunityScore?: number;
  };
  queryTerms: string[];
  tags: string[];
};

// ── discoverCompetitors use-case I/O ────────────────────────────

export type DiscoverCompetitorsInput = {
  userId: number;
  listType?: DiscoveryListType;
  filters?: Partial<DiscoveryFilters>;
  queryText?: string;
  cursor?: string | null;
  limit?: number;
};

export type DiscoverCompetitorsResult = {
  niches: DiscoveredNiche[];
  totalFound: number;
  filters: DiscoveryFilters;
  listType: string;
  generatedAt: string;
  nextCursor: undefined;
  hasMore: false;
  source: "database";
};

// ── searchCompetitors use-case I/O ──────────────────────────────

export type SearchMode = "competitor_search" | "search_my_niche";

export type SearchCompetitorsInput = {
  userId: number;
  mode: SearchMode;
  nicheText?: string;
  referenceVideoUrl?: string;
  channelId?: string;
  filters?: CompetitorSearchFilters;
  cursor?: SearchCursor;
};

// ── analyzeVideo use-case I/O ───────────────────────────────────

export type AnalyzeVideoInput = {
  userId: number;
  channelId: string;
  videoId: string;
  includeMoreFromChannel?: boolean;
};

// Returns CompetitorVideoAnalysis (re-exported above)

// ── getMoreFromChannel use-case I/O ─────────────────────────────

export type GetMoreFromChannelInput = {
  userId: number;
  channelId: string;
  videoId: string;
};

// Returns CompetitorVideo[] (re-exported above)
