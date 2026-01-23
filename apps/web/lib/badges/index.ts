/**
 * Badge Collection System
 *
 * A premium badge gallery experience for YouTube creators.
 */

// Types
export type {
  BadgeRarity,
  BadgeCategory,
  GoalWindow,
  GoalStatus,
  BadgeProgress,
  BadgeDef,
  BadgeIcon,
  BadgeWithProgress,
  UnlockedBadge,
  MetricKey,
  MetricAvailability,
  MetricAvailabilityCheck,
  DefaultGoal,
  GoalWithProgress,
  VideoForBadges,
  ChannelStatsForBadges,
  BadgeSortKey,
  BadgeFilters,
  BadgesApiResponse,
} from "./types";

// Registry
export {
  SHORTS_MAX_DURATION_SEC,
  BADGE_CATEGORIES,
  BADGE_RARITIES,
  BADGES,
  DEFAULT_GOALS,
  getBadge,
  getBadgesByCategory,
  getBadgesByRarity,
  getGoal,
  getGoalsByCategory,
  getGoalsForBadge,
  getBadgeChain,
} from "./registry";

// Computation
export {
  getWeekStart,
  getMonthStart,
  getDaysRemaining,
  countVideosInWindow,
  countShortsInWindow,
  sumViewsInWindow,
  sumSubsGainedInWindow,
  sumCommentsInWindow,
  avgRetentionLastN,
  avgCtrLastN,
  avgLikeRateLastN,
  calculatePostingStreakDays,
  calculatePostingStreakWeeks,
  checkMetricAvailability,
  computeBadgeProgress,
  computeAllBadgesProgress,
  computeGoalProgress,
  computeAllGoalsProgress,
  getNextBadge,
  sortBadgesByClosest,
  sortBadgesByRecent,
  sortBadgesByRarity,
  getBadgeSummary,
} from "./compute";
