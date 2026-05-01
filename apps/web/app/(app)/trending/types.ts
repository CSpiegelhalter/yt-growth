/**
 * Trending Command Center — Shared Types
 */

export type TrendMomentum = "hot" | "rising" | "steady";

export type CompetitorMatch = {
  videoId: string;
  title: string;
  channelTitle: string;
};

export type OpportunityGap = {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  competition: number;
  gapScore: number;
  trendMomentum: TrendMomentum;
  category: string;
  trendData: number[];
  articles: Array<{ title: string; source: string; url: string }>;
  competitorMatches: {
    count: number;
    videos: CompetitorMatch[];
  };
};

export type RisingVideo = {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  thumbnailUrl: string;
  duration: string;
  publishedAt: string;
  viewCount: number;
  viewVelocity: number;
  categoryId: string;
};

export type CappedBy = "tier" | "data" | null;

export type OpportunitiesResponse = {
  opportunities: OpportunityGap[];
  teasers?: OpportunityGap[];
  meta: {
    totalFound: number;
    tier: string;
    tierMax?: number;
    offset?: number;
    limit?: number;
    returned?: number;
    hasMore?: boolean;
    cappedBy?: CappedBy;
    stale?: boolean;
    updatedAt?: string;
    status?: string;
  };
};

export type YouTubeRisingResponse = {
  videos: RisingVideo[];
  meta: {
    totalFound: number;
    tier: string;
    stale?: boolean;
    updatedAt?: string;
    status?: string;
    category?: string | null;
  };
};

export type GeneratedIdea = {
  title: string;
  hook: string;
  angle: string;
  suggestedTags: string[];
};
