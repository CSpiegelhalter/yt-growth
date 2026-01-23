/**
 * Badge Collection System Types
 *
 * A premium badge collection experience - no coins, just beautiful badges.
 */

/** Badge rarity tiers - affects visuals and prestige */
export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

/** Badge category for filtering */
export type BadgeCategory =
  | "consistency"
  | "reach"
  | "growth"
  | "quality"
  | "engagement"
  | "milestone";

/** Goal window/period types */
export type GoalWindow =
  | "7d"
  | "28d"
  | "weekly"
  | "monthly"
  | "lifetime";

/** Goal status */
export type GoalStatus = "in_progress" | "completed" | "locked";

/** Progress result from a badge's progress function */
export type BadgeProgress = {
  current: number;
  target: number;
  percent: number;
  isUnlocked: boolean;
  /** If locked due to missing data */
  lockedReason?: string;
  /** Formatted display strings */
  currentLabel?: string;
  targetLabel?: string;
};

/** Badge definition in the registry */
export type BadgeDef = {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  /** Icon key for rendering */
  icon: BadgeIcon;
  /** Optional: badge this depends on (progression chains) */
  dependsOn?: string;
  /** Which metrics are required for this badge */
  requiredMetrics: MetricKey[];
  /** Display order within category */
  order?: number;
};

/** Badge icon types */
export type BadgeIcon =
  | "flame"
  | "calendar"
  | "rocket"
  | "video"
  | "shorts"
  | "eye"
  | "users"
  | "heart"
  | "message"
  | "chart"
  | "target"
  | "star"
  | "trophy"
  | "crown"
  | "zap"
  | "clock"
  | "trending"
  | "sparkle"
  | "seed"
  | "medal"
  | "lightning"
  | "refresh";

/** Badge with computed progress */
export type BadgeWithProgress = BadgeDef & {
  progress: BadgeProgress;
  unlocked: boolean;
  unlockedAt?: string;
  /** Has user viewed this since unlock? */
  seen?: boolean;
};

/** User's unlocked badge record */
export type UnlockedBadge = {
  badgeId: string;
  unlockedAt: string;
  seen: boolean;
};

/** Metrics that badges can track */
export type MetricKey =
  | "upload_count"
  | "shorts_count"
  | "posting_streak_days"
  | "posting_streak_weeks"
  | "subscriber_count"
  | "subscribers_gained"
  | "subscribers_lost"
  | "views"
  | "views_per_day"
  | "total_views"
  | "watch_time_minutes"
  | "average_view_duration"
  | "average_view_percentage"
  | "ctr"
  | "impressions"
  | "likes"
  | "like_rate"
  | "comments"
  | "comments_per_view"
  | "subs_per_view"
  | "manual";

/** Metric availability check */
export type MetricAvailability = {
  available: boolean;
  reason?: "no_data" | "insufficient_videos" | "analytics_not_connected";
};

export type MetricAvailabilityCheck = {
  metrics: Partial<Record<MetricKey, MetricAvailability>>;
  hasVideoMetrics: boolean;
  hasRetentionData: boolean;
  hasEngagementData: boolean;
  hasCtrData: boolean;
  videosWithMetrics: number;
};

/** Default goal definition */
export type DefaultGoal = {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  category: BadgeCategory;
  /** Which badge(s) this goal contributes to */
  badgeIds: string[];
  metricKey: MetricKey;
  target: number;
  window: GoalWindow;
  /** For "last N uploads" style goals */
  uploadCount?: number;
  requiredMetrics: MetricKey[];
  unit?: string;
};

/** Goal with computed progress */
export type GoalWithProgress = DefaultGoal & {
  progress: number;
  percentage: number;
  status: GoalStatus;
  lockedReason?: string;
  daysRemaining?: number;
  progressLabel?: string;
  targetLabel?: string;
};

/** Video data for computations */
export type VideoForBadges = {
  publishedAt: string | null;
  durationSec?: number | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  subscribersGained?: number | null;
  subscribersLost?: number | null;
  estimatedMinutesWatched?: number | null;
  averageViewDuration?: number | null;
  averageViewPercentage?: number | null;
  impressions?: number | null;
  ctr?: number | null;
};

/** Channel stats for computations */
export type ChannelStatsForBadges = {
  subscriberCount: number | null;
  totalVideoCount: number | null;
  totalViews?: number | null;
};

/** Sort options for badge gallery */
export type BadgeSortKey =
  | "closest"
  | "recent"
  | "rarity"
  | "alphabetical"
  | "category";

/** Filter options for badge gallery */
export type BadgeFilters = {
  category: BadgeCategory | "all";
  rarity: BadgeRarity | "all";
  status: "all" | "unlocked" | "locked";
  searchQuery: string;
};

/** API Response */
export type BadgesApiResponse = {
  badges: BadgeWithProgress[];
  goals: GoalWithProgress[];
  unlockedBadges: UnlockedBadge[];
  recentUnlocks: UnlockedBadge[];
  metricAvailability: MetricAvailabilityCheck;
  summary: {
    totalBadges: number;
    unlockedCount: number;
    weeklyStreak: number;
    nextBadge: BadgeWithProgress | null;
  };
};
