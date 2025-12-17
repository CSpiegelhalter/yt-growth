/**
 * API type definitions
 */

export type Me = {
  id: number;
  email: string;
  name: string | null;
  plan: "free" | "pro" | "team" | string;
  status: "active" | "past_due" | "canceled" | "inactive" | string;
  channel_limit: number;
  subscription: {
    isActive: boolean;
    currentPeriodEnd: string | null;
  };
};

export type Channel = {
  channel_id: string;
  id: number;
  title: string | null;
  thumbnailUrl: string | null;
  connectedAt: string;
  lastSyncedAt: string | null;
  syncStatus: string;
  syncError: string | null;
  videoCount: number;
  planCount: number;
};

export type Video = {
  id: number;
  youtubeVideoId: string;
  title: string | null;
  publishedAt: string | null;
  thumbnailUrl: string | null;
};

export type VideoWithRetention = Video & {
  retention: {
    hasData: boolean;
    cliffTimeSec?: number | null;
    cliffTimestamp?: string | null;
    cliffReason?: string | null;
    cliffSlope?: number | null;
    fetchedAt?: string;
    cachedUntil?: string;
    error?: string;
  };
};

export type PlanTopic = {
  id: string;
  title: string;
  why: string;
  confidence: "high" | "medium" | "exploratory";
  angles: string[];
  hooks: string[];
  titles: Array<{ text: string; tags?: string[] }>;
  keywords: string[];
  thumbnail: {
    overlayText?: string;
    layout?: string;
    notes: string[];
    avoid: string[];
  };
};

export type PlanNicheInsights = {
  whatIsWorkingNow: string[];
  formatsToCopy: string[];
  doDont: { do: string[]; dont: string[] };
};

export type PlanSimilarExample = {
  channelId: string;
  channelTitle: string;
  examples: Array<{
    videoId: string;
    title: string;
    thumbnailUrl?: string;
    whyItWorked: string[];
  }>;
};

export type PlanOutputJson = {
  topics: PlanTopic[];
  nicheInsights: PlanNicheInsights;
  similarChannelExamples?: PlanSimilarExample[];
};

export type Plan = {
  id: number;
  outputMarkdown: string;
  outputJson?: PlanOutputJson | null;
  createdAt: string;
  cachedUntil: string;
  fromCache?: boolean;
  isCached?: boolean;
  tokensUsed?: number | null;
  modelVersion?: string | null;
};

export type SubscriberMagnetVideo = {
  videoId: string;
  title: string;
  views: number;
  subscribersGained: number;
  subsPerThousand: number;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  durationSec?: number | null;
  viewsPerDay?: number;
  avdSec?: number | null;
  apv?: number | null;
  insight?: {
    whyItConverts: string[];
    stealThis: string[];
    hookIdea: string[];
  };
};

export type PatternAnalysisJson = {
  summary: string;
  commonPatterns: string[];
  ctaPatterns: string[];
  formatPatterns: string[];
  nextExperiments: string[];
  hooksToTry: string[];
};

export type SubscriberAuditResponse = {
  channelId: string;
  range: "7d" | "28d";
  generatedAt: string;
  cachedUntil: string;
  videos: SubscriberMagnetVideo[];
  patternAnalysis: {
    analysisJson: PatternAnalysisJson | null;
    analysisMarkdownFallback: string | null;
  };
  stats: {
    totalVideosAnalyzed: number;
    avgSubsPerThousand: number;
    totalSubscribersGained: number;
    totalViews: number;
  };
};

export type SimilarChannel = {
  channelId: string;
  channelTitle: string;
  channelThumbnailUrl: string | null;
  similarityScore: number;
  recentWinners: Array<{
    videoId: string;
    title: string;
    publishedAt: string;
    thumbnailUrl: string | null;
    views: number;
    viewsPerDay: number;
  }>;
};

export type SimilarChannelsResponse = {
  channelId: string;
  range: "7d" | "14d";
  generatedAt: string;
  cachedUntil: string;
  similarChannels: SimilarChannel[];
  insights: {
    whatTheyreDoing: string[];
    ideasToSteal: string[];
    formatsToTry: string[];
  };
};

export type RetentionResponse = {
  channelId: string;
  videos: VideoWithRetention[];
  fetchedAt: string;
};

export type PlansResponse = {
  plans: Plan[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type SyncResponse = {
  success: boolean;
  videosCount: number;
  metricsCount: number;
  lastSyncedAt: string;
};

export type ApiError = {
  error: string;
  code?: string;
  detail?: string;
  resetAt?: string;
};
