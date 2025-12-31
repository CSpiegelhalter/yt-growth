/**
 * API type definitions
 */

export type UsageInfo = {
  used: number;
  limit: number;
};

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
    cancelAtPeriodEnd?: boolean;
    cancelAt?: string | null;
    canceledAt?: string | null;
  };
  /** Daily usage info for feature gating */
  usage?: {
    owned_video_analysis: UsageInfo;
    competitor_video_analysis: UsageInfo;
    idea_generate: UsageInfo;
    channel_sync: UsageInfo;
  };
  /** When usage counters reset (ISO string) */
  resetAt?: string;
};

export type Channel = {
  channel_id: string;
  id: number;
  title: string | null;
  thumbnailUrl: string | null;
  totalVideoCount: number | null; // Total videos on YouTube
  subscriberCount: number | null; // Subscriber count from YouTube
  syncedVideoCount?: number; // Videos synced locally
  connectedAt: string;
  lastSyncedAt: string | null;
  syncStatus: string;
  syncError: string | null;
  videoCount: number; // Synced videos (backwards compat)
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
  // Additional conversion metrics
  playlistAddsPer1k?: number | null;
  engagedRate?: number | null;
  commentsPer1k?: number | null;
  sharesPer1k?: number | null;
  // Conversion strength based on percentile
  conversionTier?: "strong" | "average" | "weak";
  percentileRank?: number;
  // Legacy insight (optional)
  insight?: {
    whyItConverts: string[];
    stealThis: string[];
    hookIdea: string[];
  };
};

export type ConversionPattern = {
  pattern: string;
  evidence: string;
  howToUse: string;
};

export type ConversionRecipe = {
  titleFormulas: string[];
  ctaTiming: string;
  structure: string;
};

export type ConversionVideoIdea = {
  title: string;
  hook: string;
  whyItConverts: string;
  ctaSuggestion: string;
};

export type SubscriberInsights = {
  commonPatterns: ConversionPattern[];
  conversionRecipe: ConversionRecipe;
  nextIdeas: ConversionVideoIdea[];
};

export type PatternAnalysisJson = {
  summary: string;
  commonPatterns: string[];
  ctaPatterns: string[];
  formatPatterns: string[];
  nextExperiments: string[];
  hooksToTry: string[];
  // New structured format
  structuredInsights?: SubscriberInsights;
};

export type SubscriberAuditResponse = {
  channelId: string;
  range: "7d" | "28d" | "90d";
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
    strongSubscriberDriverCount: number;
    avgPlaylistAddsPer1k?: number;
    avgEngagedRate?: number;
  };
  demo?: boolean;
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
  // Usage limit error fields
  featureKey?: string;
  used?: number;
  limit?: number;
  remaining?: number;
  upgrade?: boolean;
  message?: string;
};

/* ============================================
   IDEA BOARD TYPES - Premium Idea Engine
   ============================================ */

export type IdeaHook = {
  text: string;
  typeTags: Array<
    "shock" | "curiosity" | "contrarian" | "story" | "tutorial" | "promise"
  >;
};

export type IdeaTitle = {
  text: string;
  styleTags: Array<
    | "outcome"
    | "timebound"
    | "contrarian"
    | "specific"
    | "authority"
    | "personal"
    | "challenge"
  >;
  basedOnVideoId?: string;
  basedOnChannel?: string;
};

export type ThumbnailConcept = {
  overlayText: string;
  composition: string;
  contrastNote?: string;
  emotionToConvey?: string;
  colorScheme?: string;
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
  howToMakeBetter?: string;
};

export type IdeaKeyword = {
  text: string;
  intent: "search" | "browse" | "suggested";
  fit?: string;
  monthlySearches?: string;
  competition?: "low" | "medium" | "high";
};

export type RemixVariant = {
  hooks: IdeaHook[];
  titles: IdeaTitle[];
};

export type IdeaScriptOutline = {
  hook?: string;
  setup?: string;
  mainPoints?: string[];
  payoff?: string;
  cta?: string;
};

export type Idea = {
  id: string;
  title: string;
  angle: string;
  whyNow?: string;
  estimatedViews?: string;
  format: "shorts" | "long";
  difficulty: "easy" | "medium" | "stretch";
  hooks: IdeaHook[];
  titles: IdeaTitle[];
  thumbnailConcept: ThumbnailConcept;
  scriptOutline?: IdeaScriptOutline;
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
  patternsToCopy?: string[];
  winningPatterns?: string[];
  gapsToExploit?: string[];
  contentGaps?: string[];
  avoidThese?: string[];
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
    velocity24h?: number; // Views gained in last 24h (from snapshots)
    velocity7d?: number; // Views gained in last 7d (from snapshots)
    acceleration24h?: number; // Change in velocity (needs 3+ snapshots)
    engagementPerView?: number; // (likes + comments) / views
    outlierScore?: number; // Z-score vs cohort baseline
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
  /** Description of the competitor channel size range being shown */
  targetSizeDescription?: string;
  /** Current page number (for loading more batches) */
  currentPage?: number;
  /** Whether there are more pages available (either YouTube pages or more queries) */
  hasMorePages?: boolean;
  /** Total number of unique niche queries available */
  totalQueries?: number;
  /** Error/info message */
  message?: string;
  /** Current query index (which niche query we're using) */
  currentQueryIndex?: number;
  /** Next query index to use (if hasMorePages is true) */
  nextQueryIndex?: number;
  /** YouTube pageToken for pagination within current query */
  nextPageToken?: string;
  /** Current query being used */
  currentQuery?: string;
  /** Content format filter applied based on user's typical video duration (short/medium/long/any) */
  contentFormat?: "short" | "medium" | "long" | "any";
};

export type CompetitorCommentsAnalysis = {
  topComments: Array<{
    text: string;
    likeCount: number;
    authorName: string;
    publishedAt: string;
  }>;
  sentiment: {
    positive: number; // 0-100 percentage
    neutral: number;
    negative: number;
  };
  themes: Array<{
    theme: string;
    count: number;
    examples: string[];
  }>;
  viewerLoved: string[]; // What viewers loved
  viewerAskedFor: string[]; // What viewers asked for next
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
  // New strategic insights
  strategicInsights?: {
    // Title breakdown
    titleAnalysis: {
      score: number; // 1-10
      characterCount: number;
      hasNumber: boolean;
      hasPowerWord: boolean;
      hasCuriosityGap: boolean;
      hasTimeframe: boolean;
      strengths: string[];
      weaknesses: string[];
    };
    // How hard is it to compete?
    competitionDifficulty: {
      score: "Easy" | "Medium" | "Hard" | "Very Hard";
      reasons: string[];
      channelSizeRatio?: number; // Their subs vs avg in niche
    };
    // Timing analysis
    postingTiming: {
      dayOfWeek: string;
      hourOfDay: number;
      daysAgo: number;
      isWeekend: boolean;
      timingInsight: string;
    };
    // Video length analysis
    lengthAnalysis: {
      minutes: number;
      category: "Short" | "Medium" | "Long" | "Very Long";
      insight: string;
      optimalForTopic: boolean;
    };
    // Engagement benchmarks
    engagementBenchmarks: {
      likeRate: number; // likes per 100 views
      commentRate: number; // comments per 1000 views
      likeRateVerdict:
        | "Below Average"
        | "Average"
        | "Above Average"
        | "Exceptional";
      commentRateVerdict:
        | "Below Average"
        | "Average"
        | "Above Average"
        | "Exceptional";
    };
    // Opportunity assessment
    opportunityScore: {
      score: number; // 1-10 (10 = huge opportunity)
      verdict: string;
      gaps: string[]; // What's missing that you could do
      angles: string[]; // Fresh angles not covered
    };
    // Beat this video checklist
    beatThisVideo: Array<{
      action: string;
      difficulty: "Easy" | "Medium" | "Hard";
      impact: "Low" | "Medium" | "High";
    }>;
    // Description analysis
    descriptionAnalysis: {
      hasTimestamps: boolean;
      hasLinks: boolean;
      hasCTA: boolean;
      estimatedWordCount: number;
      keyElements: string[];
    };
    // Content format signals
    formatSignals: {
      likelyFormat: string; // "Tutorial", "Vlog", "Review", "Commentary", etc.
      productionLevel: "Low" | "Medium" | "High";
      paceEstimate: "Slow" | "Medium" | "Fast";
    };
  };
  comments?: CompetitorCommentsAnalysis;
  tags: string[];
  derivedKeywords?: string[]; // If tags absent, derived from title/description
  category?: string;
  moreFromChannel: CompetitorVideo[];
  demo?: boolean;
};

// ============================================
// OWNED VIDEO INSIGHTS (YouTube Analytics-powered)
// ============================================

export type OwnedVideoMetadata = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
  categoryId: string | null;
  thumbnailUrl: string | null;
  durationSec: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  topicCategories: string[];
};

export type DailyAnalyticsRow = {
  date: string;
  views: number;
  engagedViews: number | null;
  likes: number | null;
  dislikes: number | null;
  comments: number | null;
  shares: number | null;
  estimatedMinutesWatched: number | null;
  averageViewDuration: number | null;
  averageViewPercentage: number | null;
  subscribersGained: number | null;
  subscribersLost: number | null;
  videosAddedToPlaylists: number | null;
  videosRemovedFromPlaylists: number | null;
  // YouTube Premium
  redViews: number | null;
  // Card & End Screen
  cardClicks: number | null;
  cardImpressions: number | null;
  cardClickRate: number | null;
  annotationClicks: number | null;
  annotationImpressions: number | null;
  annotationClickThroughRate: number | null;
  // Monetization
  estimatedRevenue: number | null;
  estimatedAdRevenue: number | null;
  grossRevenue: number | null;
  monetizedPlaybacks: number | null;
  playbackBasedCpm: number | null;
  adImpressions: number | null;
  cpm: number | null;
};

export type AnalyticsTotals = DailyAnalyticsRow & {
  startDate: string;
  endDate: string;
  daysInRange: number;
};

export type DerivedMetrics = {
  // Basic
  viewsPerDay: number;
  totalViews: number;
  daysInRange: number;
  // Normalized per 1K views
  subsPer1k: number | null;
  sharesPer1k: number | null;
  commentsPer1k: number | null;
  likesPer1k: number | null;
  playlistAddsPer1k: number | null;
  // Advanced engagement metrics
  netSubsPer1k: number | null;
  netSavesPer1k: number | null;
  likeRatio: number | null;
  // Retention efficiency
  watchTimePerViewSec: number | null;
  avdRatio: number | null;
  avgWatchTimeMin: number | null;
  // Engagement
  engagementPerView: number | null;
  engagedViewRate: number | null;
  // Card & End Screen performance
  cardClickRate: number | null;
  endScreenClickRate: number | null;
  // Audience quality
  premiumViewRate: number | null;
  watchTimePerSub: number | null;
  // Monetization
  rpm: number | null;
  monetizedPlaybackRate: number | null;
  adImpressionsPerView: number | null;
  cpm: number | null;
  // Trend metrics
  velocity24h: number | null;
  velocity7d: number | null;
  acceleration24h: number | null;
};

export type ChannelBaseline = {
  sampleSize: number;
  viewsPerDay: { mean: number; std: number };
  avgViewPercentage: { mean: number; std: number };
  watchTimePerViewSec: { mean: number; std: number };
  subsPer1k: { mean: number; std: number };
  engagementPerView: { mean: number; std: number };
  sharesPer1k: { mean: number; std: number };
};

export type ZScoreResult = {
  value: number | null;
  zScore: number | null;
  percentile: number | null;
  vsBaseline: "above" | "at" | "below" | "unknown";
  delta: number | null;
};

export type BaselineComparison = {
  viewsPerDay: ZScoreResult;
  avgViewPercentage: ZScoreResult;
  watchTimePerViewSec: ZScoreResult;
  subsPer1k: ZScoreResult;
  engagementPerView: ZScoreResult;
  sharesPer1k: ZScoreResult;
  healthScore: number;
  healthLabel:
    | "Excellent"
    | "Good"
    | "Average"
    | "Below Average"
    | "Needs Work";
};

export type VideoInsightsLLM = {
  summary: { headline: string; oneLiner: string };
  // Title & Packaging Analysis
  titleAnalysis: {
    score: number; // 1-10
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  descriptionAnalysis?: {
    score: number; // 1-10
    strengths: string[];
    weaknesses: string[];
    // A rewritten first ~200 chars (high signal for SEO + viewers)
    rewrittenOpening: string;
    // Specific lines/blocks the creator can paste into the description
    addTheseLines: string[];
    // Optional keyword list to include naturally (no stuffing)
    targetKeywords?: string[];
  };
  tagAnalysis: {
    score: number; // 1-10
    coverage: "excellent" | "good" | "fair" | "poor";
    missing: string[]; // Suggested tags to add
    feedback: string;
  };
  /**
   * A practical, prioritized playbook to increase reach for THIS video.
   * Should be tied to the available metrics (views/day vs baseline, retention, engagement, subs).
   */
  visibilityPlan?: {
    bottleneck:
      | "Packaging (CTR)"
      | "Retention"
      | "Distribution"
      | "Topic/Intent"
      | "Too early to tell";
    confidence: "high" | "medium" | "low";
    why: string; // tie to metrics + baseline comparison when possible
    doNext: Array<{
      action: string; // very specific
      reason: string; // metric-backed
      expectedImpact: string;
      priority: "high" | "medium" | "low";
    }>;
    experiments: Array<{
      name: string;
      variants: string[]; // e.g. titles, hook options
      successMetric: string; // e.g. CTR, avg view duration, views/day
      window: string; // e.g. "24-48h"
    }>;
    promotionChecklist: string[]; // 5-10 concrete distribution steps (non-spammy)
    whatToMeasureNext: string[]; // metrics we should fetch or the user should check in YT Studio
  };
  thumbnailHints: string[]; // What thumbnail should convey based on title/performance
  // Data-driven insights
  keyFindings: Array<{
    finding: string;
    dataPoint: string;
    significance: "positive" | "negative" | "neutral";
    recommendation: string;
  }>;
  wins: Array<{ label: string; why: string; metricKey: string }>;
  leaks: Array<{ label: string; why: string; metricKey: string }>;
  actions: Array<{
    lever: "Retention" | "Conversion" | "Engagement" | "Discovery";
    action: string;
    reason: string;
    expectedImpact: string;
    priority: "high" | "medium" | "low";
  }>;
  experiments: Array<{
    type: "Title" | "Hook" | "Structure";
    test: string[];
    successMetric: string;
  }>;
  packaging: {
    titleAngles: string[];
    hookSetups: string[];
    visualMoments: string[];
  };
  competitorTakeaways: Array<{
    channelName?: string;
    pattern?: string;
    insight?: string;
    evidence?: Array<{ videoId: string; title: string; channelTitle: string }>;
    howToUse?: string;
    applicableAction?: string;
  }>;
  remixIdeas: Array<{
    title: string;
    hook: string;
    keywords: string[];
    inspiredByVideoIds: string[];
  }>;
  /**
   * Viewer voice, derived from the video's top comments (when available).
   */
  commentInsights?: {
    sentiment: { positive: number; neutral: number; negative: number };
    themes: Array<{ theme: string; count: number; examples: string[] }>;
    viewerLoved: string[];
    viewerAskedFor: string[];
    hookInspiration: string[];
  };
};

export type VideoInsightsResponse = {
  video: OwnedVideoMetadata;
  analytics: {
    totals: AnalyticsTotals;
    dailySeries: DailyAnalyticsRow[];
  };
  derived: DerivedMetrics;
  baseline: ChannelBaseline;
  comparison: BaselineComparison;
  levers: {
    retention: { grade: string; color: string; reason: string; action: string };
    conversion: {
      grade: string;
      color: string;
      reason: string;
      action: string;
    };
    engagement: {
      grade: string;
      color: string;
      reason: string;
      action: string;
    };
  };
  llmInsights: VideoInsightsLLM | null;
  cachedUntil: string;
  demo?: boolean;
};
