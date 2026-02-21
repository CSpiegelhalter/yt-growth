/**
 * DataForSEO Port — contract for SEO keyword research and SERP data access.
 *
 * Ports are pure TypeScript interfaces — no runtime code, no implementations.
 * They define what features need from an SEO data provider without specifying how.
 *
 * Imported by:
 *   - lib/features/ (to declare dependency on SEO research data)
 *   - lib/adapters/dataforseo/ (to implement)
 *   - app/ or lib/server/ (to wire adapter to features)
 */

// ─── Common Types ──────────────────────────────────────────

/** Simplified region code (e.g. "us", "uk", "de"). */
export type SeoRegionCode = string;

// ─── Keyword Metrics ───────────────────────────────────────

export interface MonthlySearchVolume {
  year: number;
  month: number;
  searchVolume: number;
}

export interface KeywordMetrics {
  keyword: string;
  searchVolume: number;
  /** Heuristic difficulty estimate (0–100). Not true SEO difficulty. */
  difficultyEstimate: number;
  cpc: number;
  /** Normalised competition (0–1). */
  competition: number;
  /** Competition index (0–100). */
  competitionIndex: number;
  /** Competition level label (e.g. HIGH, MEDIUM, LOW). */
  competitionLevel: string | null;
  lowTopOfPageBid: number | null;
  highTopOfPageBid: number | null;
  /** Last 12 months of monthly search volumes. */
  trend: number[];
  monthlySearches: MonthlySearchVolume[];
  intent: string | null;
  categories: number[] | null;
  /** Original keyword if the provider spell-corrected the input. */
  spellingCorrectedFrom: string | null;
  /** Always true — difficulty is estimated, not measured. */
  difficultyIsEstimate: true;
}

export interface RelatedKeyword extends KeywordMetrics {
  /** Relevance to the seed keyword (0–1). */
  relevance: number;
}

// ─── Keyword Overview ──────────────────────────────────────

export interface KeywordOverviewInput {
  phrase: string;
  region?: SeoRegionCode;
}

export interface KeywordOverviewResult {
  rows: KeywordMetrics[];
  meta: {
    region: string;
    fetchedAt: string;
    taskId?: string;
  };
  pending?: boolean;
  taskId?: string;
}

// ─── Related Keywords ──────────────────────────────────────

export interface RelatedKeywordsInput {
  phrases: string[];
  region?: SeoRegionCode;
  limit?: number;
}

export interface RelatedKeywordsResult {
  rows: RelatedKeyword[];
  meta: {
    region: string;
    phrases: string[];
    fetchedAt: string;
    taskId?: string;
  };
  pending?: boolean;
  taskId?: string;
}

// ─── Combined Keyword Research ─────────────────────────────

export interface CombinedKeywordInput {
  phrase: string;
  region?: SeoRegionCode;
  limit?: number;
}

export interface CombinedKeywordResult {
  seedMetrics: KeywordMetrics | null;
  relatedKeywords: RelatedKeyword[];
  meta: {
    region: string;
    phrase: string;
    fetchedAt: string;
    seedTaskId?: string;
    relatedTaskId?: string;
  };
  pending?: {
    seed?: boolean;
    related?: boolean;
    seedTaskId?: string;
    relatedTaskId?: string;
  };
}

// ─── Task-Based Operations ─────────────────────────────────

export interface TaskReference {
  taskId: string;
  status: "queued" | "in_queue";
}

export interface TaskResult<T> {
  status: "completed" | "pending" | "error";
  data?: T;
  error?: string;
  taskId: string;
}

// ─── Google Trends ─────────────────────────────────────────

export interface TrendsTimePoint {
  dateFrom: string;
  dateTo: string;
  timestamp: number;
  value: number;
  missingData: boolean;
}

export interface TrendsRisingQuery {
  query: string;
  value: number;
}

export interface TrendsRegion {
  geoId: string;
  geoName: string;
  value: number;
}

export interface TrendsInput {
  keyword: string;
  region?: SeoRegionCode;
  dateFrom?: string;
  dateTo?: string;
}

export interface TrendsResult {
  keyword: string;
  interestOverTime: TrendsTimePoint[];
  risingQueries: TrendsRisingQuery[];
  topQueries: Array<{ query: string; value: number }>;
  regionBreakdown: TrendsRegion[];
  averageInterest: number;
  meta: {
    region: string;
    dateFrom: string;
    dateTo: string;
    fetchedAt: string;
    taskId?: string;
  };
  pending?: boolean;
  taskId?: string;
}

// ─── YouTube SERP ──────────────────────────────────────────

export interface YouTubeRanking {
  position: number;
  title: string;
  channelName: string;
  channelUrl: string;
  videoUrl: string;
  videoId: string;
  views: number | null;
  publishedDate: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  description: string | null;
}

export interface YouTubeSerpInput {
  keyword: string;
  region?: SeoRegionCode;
  limit?: number;
}

export interface YouTubeSerpResult {
  keyword: string;
  region: string;
  results: YouTubeRanking[];
  totalResults: number;
  fetchedAt: string;
}

// ─── Competitive Context ───────────────────────────────────

export interface SearchRanking {
  term: string;
  position: number | null;
  expectedCtr: number;
  actualCtr: number;
}

export interface TopicTrend {
  trend: "rising" | "falling" | "stable";
  recentInterest: number;
}

export interface SimilarVideo {
  videoId: string;
  title: string;
  views: number | null;
  publishedDate: string | null;
}

export interface CompetitiveContextInput {
  videoId: string;
  title: string;
  tags: string[];
  searchTerms: Array<{ term: string; views: number }>;
  totalViews: number;
}

export interface CompetitiveContextResult {
  searchRankings: SearchRanking[] | null;
  topicTrends: TopicTrend | null;
  similarVideos: SimilarVideo[] | null;
}

// ─── Keyword Suggestions ──────────────────────────────────

export interface KeywordSuggestionsInput {
  seedKeywords: string[];
  region?: SeoRegionCode;
  limit?: number;
}

export interface KeywordSuggestionsResult {
  suggestions: RelatedKeyword[];
  meta: {
    region: string;
    seedKeywords: string[];
    fetchedAt: string;
  };
}

// ─── Port Interface ────────────────────────────────────────

export interface DataForSeoPort {
  // ── Keyword Research (synchronous wait) ──────────────────

  /** Fetch search volume and keyword metrics for a phrase. */
  getKeywordOverview(
    input: KeywordOverviewInput,
  ): Promise<KeywordOverviewResult>;

  /** Fetch keywords related to one or more seed phrases. */
  getRelatedKeywords(
    input: RelatedKeywordsInput,
  ): Promise<RelatedKeywordsResult>;

  /** Fetch seed metrics and related keywords in a single call. */
  getCombinedKeywordData(
    input: CombinedKeywordInput,
  ): Promise<CombinedKeywordResult>;

  /** Fetch keyword suggestions/ideas for seed keywords. */
  getKeywordSuggestions(
    input: KeywordSuggestionsInput,
  ): Promise<KeywordSuggestionsResult>;

  // ── Task-Based Keyword Research (async) ──────────────────

  /** Submit a search volume task for deferred processing. */
  submitSearchVolumeTask(
    keywords: string[],
    region?: SeoRegionCode,
  ): Promise<TaskReference>;

  /** Poll for search volume task results. */
  getSearchVolumeTaskResult(
    taskId: string,
  ): Promise<TaskResult<KeywordMetrics[]>>;

  /** Submit a related-keywords task for deferred processing. */
  submitRelatedKeywordsTask(
    keywords: string[],
    region?: SeoRegionCode,
    limit?: number,
  ): Promise<TaskReference>;

  /** Poll for related-keywords task results. */
  getRelatedKeywordsTaskResult(
    taskId: string,
  ): Promise<TaskResult<RelatedKeyword[]>>;

  // ── Google Trends ────────────────────────────────────────

  /** Fetch Google Trends interest-over-time and related queries. */
  getTrends(input: TrendsInput): Promise<TrendsResult>;

  // ── YouTube SERP ─────────────────────────────────────────

  /** Fetch YouTube organic search results for a keyword. */
  getYouTubeSerp(input: YouTubeSerpInput): Promise<YouTubeSerpResult>;

  // ── Competitive Context ──────────────────────────────────

  /** Fetch competitive landscape for a video (rankings, trends, similar videos). */
  getCompetitiveContext(
    input: CompetitiveContextInput,
  ): Promise<CompetitiveContextResult>;
}
