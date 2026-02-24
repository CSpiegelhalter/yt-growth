/**
 * Domain types for the channel-audit feature.
 *
 * Captures inputs and outputs for channel health auditing:
 * bottleneck detection, traffic analysis, pattern detection,
 * and LLM-powered recommendations.
 */

// ── Bottleneck ──────────────────────────────────────────────

type BottleneckType =
  | "CTR"
  | "RETENTION"
  | "DISTRIBUTION"
  | "CONVERSION"
  | "NONE"
  | "INSUFFICIENT_DATA";

type BottleneckPriority = "high" | "medium" | "low";

export type AuditBottleneck = {
  type: BottleneckType;
  title: string;
  description: string;
  priority: BottleneckPriority;
};

// ── Actions ─────────────────────────────────────────────────

type ActionCategory =
  | "packaging"
  | "content"
  | "strategy"
  | "engagement";

type EffortLevel = "low" | "medium" | "high";

export type AuditAction = {
  title: string;
  description: string;
  category: ActionCategory;
  effort: EffortLevel;
};

// ── Traffic Sources ─────────────────────────────────────────

type TrafficSourcePercentage = {
  views: number;
  percentage: number;
} | null;

export type AuditTrafficSources = {
  browse: TrafficSourcePercentage;
  suggested: TrafficSourcePercentage;
  search: TrafficSourcePercentage;
  external: TrafficSourcePercentage;
  other: TrafficSourcePercentage;
} | null;

/** Raw view counts per traffic source (from YouTube Analytics). */
export type RawTrafficSources = {
  browse: number | null;
  suggested: number | null;
  search: number | null;
  external: number | null;
  notifications: number | null;
  other: number | null;
  total: number | null;
} | null;

// ── Trends ──────────────────────────────────────────────────

type TrendDirection = "up" | "down" | "flat";

type AuditTrend = {
  value: number | null;
  direction: TrendDirection;
};

export type AuditTrends = {
  views: AuditTrend;
  watchTime: AuditTrend;
  subscribers: AuditTrend;
};

// ── Patterns ────────────────────────────────────────────────

type VideoPerformer = {
  videoId: string;
  title: string;
  metric: string;
  value: string;
};

export type FormatInsight = {
  pattern: string;
  impact: "positive" | "negative";
  evidence: string;
};

export type AuditPatterns = {
  topPerformers: VideoPerformer[];
  underperformers: VideoPerformer[];
  formatInsights: FormatInsight[];
};

// ── Baseline ────────────────────────────────────────────────

export type AuditBaseline = {
  avgViewPercentage: number | null;
  avgSubsPerVideo: number | null;
  avgViewsPerVideo: number | null;
} | null;

// ── Range ───────────────────────────────────────────────────

export type AuditRange = "7d" | "28d" | "90d";

// ── Channel Metrics (domain view of adapter data) ───────────

/**
 * Subset of channel-level YouTube Analytics that the audit domain
 * needs for bottleneck detection and trend computation. The full
 * adapter type (ChannelAuditMetrics) structurally satisfies this.
 */
export type ChannelMetricsSnapshot = {
  totalViews: number;
  avgViewPercentage: number | null;
  netSubscribers: number;
  trafficSources: RawTrafficSources;
  viewsTrend: number | null;
  watchTimeTrend: number | null;
  subsTrend: number | null;
};

// ── Audit Result ────────────────────────────────────────────

export type ChannelAuditResult = {
  bottleneck: AuditBottleneck;
  actions: AuditAction[];
  trafficSources: AuditTrafficSources;
  trends: AuditTrends;
  patterns: AuditPatterns;
  metrics: ChannelMetricsSnapshot | null;
  baseline: AuditBaseline;
  range: AuditRange;
  videoCount: number;
  cached: boolean;
};

// ── Use-Case Inputs ─────────────────────────────────────────

export type RunAuditInput = {
  userId: number;
  channelId: string;
  range: AuditRange;
};

export type RunAuditDeps = {
  fetchChannelMetrics: (
    userId: number,
    channelId: string,
    range: AuditRange,
  ) => Promise<ChannelMetricsSnapshot | null>;
};

export type RecommendationsDeps = {
  callLlm: (
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    opts: { maxTokens?: number; temperature?: number },
  ) => Promise<{ content: string }>;
};

export type RecommendationsInput = {
  metrics: RecommendationsMetrics | null;
  trafficSources: AuditTrafficSources;
  trends: AuditTrends;
};

export type LlmRecommendationsResult = {
  recommendations: unknown;
};

/** Lightweight projection of the Prisma VideoMetrics model. */
export type VideoMetricsRecord = {
  youtubeVideoId: string;
  viewCount: number | null;
  avgViewPercentage?: number | null;
  subscribersGained?: number | null;
};

/** Lightweight projection of the Prisma Video model. */
export type VideoRecord = {
  youtubeVideoId: string;
  title: string;
  durationSec?: number | null;
};

// ── Recommendations ─────────────────────────────────────────

export type RecommendationsMetrics = {
  totalViews: number;
  totalWatchTimeMin: number;
  avgViewPercentage: number | null;
  subscribersGained: number;
  subscribersLost: number;
  netSubscribers: number;
  endScreenCtr: number | null;
};

export type ChannelArchetype = {
  id: string;
  logic: string;
  meaning: string;
};

// ── Channel Insights (LLM-powered) ───────────────────────────

export type ChannelInsightsVideoSummary = {
  count: number;
  avgViews: number;
  avgRetention: number | null;
  avgLikeRate: number;
  avgCommentsPer1k: number;
  avgSubsPer1k: number | null;
  avgDurationSec: number | null;
  shortsCount: number;
  longFormCount: number;
  viewsCoeffOfVariation: number | null;
  uploadGapDays: number | null;
};

export type ChannelInsightsInput = {
  channelSubscribers: number | null;
  videoSummary: ChannelInsightsVideoSummary;
  trafficSources: AuditTrafficSources;
  trends: AuditTrends;
  endScreenCtr: number | null;
  totalViews: number;
  netSubscribers: number;
  subscribersGained: number;
  subscribersLost: number;
  channelBaselines?: {
    avgCtr: number | null;
    avgAvdPct: number | null;
    avgSubsPer1kViews: number | null;
  };
};

export type ChannelInsightsDeps = {
  callLlm: (
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    opts: {
      maxTokens?: number;
      temperature?: number;
      responseFormat?: "json_object";
    },
  ) => Promise<{ content: string }>;
};

// ── Actionable Insights ──────────────────────────────────────

export type ActionableInsight = {
  id: string;
  title: string;
  explanation: string;
  fix: string;
  priority: number;
};

/** Lightweight video projection used by computeActionableInsights. */
export type InsightVideoInput = {
  videoId: string;
  title: string | null;
  views: number;
  likes: number;
  comments: number;
  durationSec: number | null;
  publishedAt: string | null;
  avgViewPercentage: number | null;
  subscribersGained: number | null;
  shares: number | null;
};

// ── Channel Overview ─────────────────────────────────────────

export type OverviewDailyRow = {
  date: string;
  views: number;
  shares: number;
  watchTimeMinutes: number;
  subscribersGained: number;
  subscribersLost: number;
};

export type TrendMetric = {
  metric: string;
  label: string;
  percentChange: number;
  direction: "up" | "down" | "flat";
};

export type VideoPublishMarker = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  /** Server-computed YYYY-MM-DD in the same timezone as chart daily rows. */
  chartDate?: string;
};

export type ChannelOverviewResult = {
  daily: OverviewDailyRow[];
  trends: TrendMetric[];
  videos: VideoPublishMarker[];
};

export type OverviewRange = AuditRange | "30d";

export type GetOverviewInput = {
  userId: number;
  channelId: string;
  range: OverviewRange;
};

export type GetOverviewDeps = {
  fetchDailyAnalytics: (
    userId: number,
    channelId: string,
    startDate: string,
    endDate: string,
  ) => Promise<OverviewDailyRow[]>;
  fetchAuditTrends: (
    userId: number,
    channelId: string,
    range: OverviewRange,
  ) => Promise<AuditTrends | null>;
  fetchRecentVideos: (
    userId: number,
    channelId: string,
    limit: number,
  ) => Promise<VideoPublishMarker[]>;
};
