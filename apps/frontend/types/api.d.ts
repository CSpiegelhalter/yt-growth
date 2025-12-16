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

export type Plan = {
  id: number;
  outputMarkdown: string;
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
};

export type SubscriberAuditResponse = {
  channelId: string;
  topVideos: SubscriberMagnetVideo[];
  analysis: string | null;
  stats: {
    totalVideosAnalyzed: number;
    avgSubsPerThousand: number;
    totalSubscribersGained: number;
    totalViews: number;
  };
  fetchedAt: string;
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
