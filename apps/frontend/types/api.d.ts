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

/* ============================================
   IDEA BOARD TYPES - Premium Idea Engine
   ============================================ */

export type IdeaHook = {
  text: string;
  typeTags: Array<"shock" | "curiosity" | "contrarian" | "story" | "tutorial" | "promise">;
};

export type IdeaTitle = {
  text: string;
  styleTags: Array<"outcome" | "timebound" | "contrarian" | "specific" | "authority" | "personal" | "challenge">;
  basedOnVideoId?: string;
  basedOnChannel?: string;
};

export type ThumbnailConcept = {
  overlayText: string;
  composition: string;
  contrastNote: string;
  avoid: string[];
  moodboardRefs?: Array<{
    videoId: string;
    thumbnailUrl: string;
    channelTitle: string;
  }>;
};

export type ProofVideo = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  metrics: {
    views: number;
    viewsPerDay: number;
  };
  whyItWorked?: string[];
  patternToSteal?: string[];
  remixIdea?: string;
};

export type IdeaKeyword = {
  text: string;
  intent: "search" | "browse" | "suggested";
  fit?: string;
};

export type RemixVariant = {
  hooks: IdeaHook[];
  titles: IdeaTitle[];
};

export type Idea = {
  id: string;
  title: string;
  angle: string;
  format: "shorts" | "long";
  difficulty: "easy" | "medium" | "stretch";
  hooks: IdeaHook[];
  titles: IdeaTitle[];
  thumbnailConcept: ThumbnailConcept;
  keywords: IdeaKeyword[];
  proof: {
    basedOn: ProofVideo[];
  };
  remixVariants?: {
    emotional?: RemixVariant;
    contrarian?: RemixVariant;
    beginner?: RemixVariant;
    advanced?: RemixVariant;
    shortsFirst?: RemixVariant;
  };
};

export type IdeaBoardNicheInsights = {
  momentumNow: string[];
  patternsToCopy: string[];
  gapsToExploit: string[];
};

export type IdeaBoardSimilarChannel = {
  channelId: string;
  channelTitle: string;
  channelThumbnailUrl: string | null;
  similarityScore: number;
};

export type IdeaBoardData = {
  channelId: string;
  channelTitle?: string;
  range: "7d" | "28d";
  generatedAt: string;
  cachedUntil: string;
  ideas: Idea[];
  nicheInsights: IdeaBoardNicheInsights;
  similarChannels: IdeaBoardSimilarChannel[];
  demo?: boolean;
};

/* ============================================
   TRENDING TYPES - Video-first trending analysis
   ============================================ */

export type TrendingVideo = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  channelThumbnailUrl: string | null;
  videoUrl: string;
  channelUrl: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  viewsPerDay: number;
  durationSec?: number;
  topicKeywords?: string[];
  isUserVideo?: boolean;
};

export type TrendingListResponse = {
  channelId: string;
  range: "7d" | "14d" | "28d";
  generatedAt: string;
  cachedUntil: string;
  nextCursor?: string;
  videos: TrendingVideo[];
  demo?: boolean;
};

export type TrendingVideoAnalysis = {
  video: TrendingVideo;
  metrics: {
    viewCount: number;
    viewsPerDay: number;
    likeRate?: number;
    commentRate?: number;
    subscriberGain?: number; // Only for user's videos
    subsPer1k?: number; // Only for user's videos
  };
  analysis: {
    whatItsAbout: string;
    whyTrending: string[];
    whatTheyDidWell: string[];
    themesToRemix: Array<{ theme: string; why: string }>;
    titlePatterns: string[];
    hookPatterns: string[];
    thumbnailPatterns: string[];
    remixIdeasForYou: Array<{
      title: string;
      hook: string;
      overlayText: string;
      angle: string;
    }>;
  };
  tags?: string[];
  category?: string;
};

/* ============================================
   IDEA MASHUP TYPES - Cross-niche creativity
   ============================================ */

export type IdeaMashup = Idea & {
  isMashup: true;
  mashupSources: Array<{
    channelTitle: string;
    niche: string;
    videoTitle: string;
    thumbnailUrl: string;
  }>;
};

export type IdeaWithDescription = Idea & {
  description?: string;
  isMashup?: boolean;
  mashupSources?: Array<{
    channelTitle: string;
    niche: string;
    videoTitle: string;
    thumbnailUrl: string;
  }>;
};

/* ============================================
   COMPETITOR WINNERS TYPES - Video-first competitor feed
   ============================================ */

export type CompetitorVideo = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  channelThumbnailUrl: string | null;
  videoUrl: string;
  channelUrl: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  durationSec?: number;
  stats: {
    viewCount: number;
    likeCount?: number;
    commentCount?: number;
  };
  derived: {
    viewsPerDay: number;
    velocity24h?: number;       // Views gained in last 24h (from snapshots)
    velocity7d?: number;        // Views gained in last 7d (from snapshots)
    acceleration24h?: number;   // Change in velocity (needs 3+ snapshots)
    engagementPerView?: number; // (likes + comments) / views
    outlierScore?: number;      // Z-score vs cohort baseline
    dataStatus?: "ready" | "building"; // "building" if insufficient snapshots
  };
  similarityScore?: number;
};

export type CompetitorFeedResponse = {
  channelId: string;
  range: "7d" | "28d";
  sort: "velocity" | "engagement" | "newest" | "outliers";
  generatedAt: string;
  cachedUntil: string;
  nextCursor?: string;
  videos: CompetitorVideo[];
  demo?: boolean;
};

export type CompetitorCommentsAnalysis = {
  topComments: Array<{
    text: string;
    likeCount: number;
    authorName: string;
    publishedAt: string;
  }>;
  sentiment: {
    positive: number;  // 0-100 percentage
    neutral: number;
    negative: number;
  };
  themes: Array<{
    theme: string;
    count: number;
    examples: string[];
  }>;
  viewerLoved: string[];     // What viewers loved
  viewerAskedFor: string[];  // What viewers asked for next
  hookInspiration: string[]; // Short quotes to use as hook inspiration
  commentsDisabled?: boolean;
  error?: string;
};

export type CompetitorVideoAnalysis = {
  video: CompetitorVideo;
  analysis: {
    whatItsAbout: string;
    whyItsWorking: string[];
    themesToRemix: Array<{ theme: string; why: string }>;
    titlePatterns: string[];
    packagingNotes: string[];
    remixIdeasForYou: Array<{
      title: string;
      hook: string;
      overlayText: string;
      angle: string;
    }>;
  };
  comments?: CompetitorCommentsAnalysis;
  tags: string[];
  derivedKeywords?: string[]; // If tags absent, derived from title/description
  category?: string;
  moreFromChannel: CompetitorVideo[];
  demo?: boolean;
};
