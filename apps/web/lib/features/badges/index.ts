/**
 * Badge Collection System
 *
 * A premium badge gallery experience for YouTube creators.
 */

// Types
export type {
  BadgeCategory,
  BadgeIcon,
  BadgeRarity,
  BadgesApiResponse,
  BadgeSortKey,
  BadgeWithProgress,
  ChannelStatsForBadges,
  GoalWithProgress,
  UnlockedBadge,
  VideoForBadges,
} from "./types";

// Schemas
export { BadgesQuerySchema, MarkBadgesSeenBodySchema } from "./schemas";

// Registry
export {
  BADGE_CATEGORIES,
  BADGE_RARITIES,
  BADGES,
  DEFAULT_GOALS,
  getBadgeChain,
  getGoalsForBadge,
} from "./registry";

// Computation
export {
  avgLikeRateLastN,
  avgRetentionLastN,
  calculatePostingStreakDays,
  calculatePostingStreakWeeks,
  checkMetricAvailability,
  computeAllBadgesProgress,
  computeAllGoalsProgress,
  countShortsInWindow,
  countVideosInWindow,
  getBadgeSummary,
  getDaysRemaining,
  getMonthStart,
  getNextBadge,
  getWeekStart,
  sortBadgesByClosest,
  sortBadgesByRarity,
  sortBadgesByRecent,
  sumSubsGainedInWindow,
  sumViewsInWindow,
} from "./use-cases/computeBadges";

// Use-cases
export { getBadgesProgress } from "./use-cases/getBadgesProgress";
export { markBadgesSeen } from "./use-cases/markBadgesSeen";
