/**
 * Badge Collection System
 *
 * A premium badge gallery experience for YouTube creators.
 */

// Types
export type {
  BadgeRarity,
  BadgeCategory,
  BadgeIcon,
  BadgeWithProgress,
  UnlockedBadge,
  GoalWithProgress,
  VideoForBadges,
  ChannelStatsForBadges,
  BadgeSortKey,
  BadgesApiResponse,
} from "./types";

// Registry
export {
  BADGE_CATEGORIES,
  BADGE_RARITIES,
  BADGES,
  DEFAULT_GOALS,
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
  avgRetentionLastN,
  avgLikeRateLastN,
  calculatePostingStreakDays,
  calculatePostingStreakWeeks,
  checkMetricAvailability,
  computeAllBadgesProgress,
  computeAllGoalsProgress,
  getNextBadge,
  sortBadgesByClosest,
  sortBadgesByRecent,
  sortBadgesByRarity,
  getBadgeSummary,
} from "./compute";
