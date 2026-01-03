/**
 * Badge Registry
 *
 * All badges defined in code with their criteria and progression chains.
 */

import type {
  BadgeDef,
  BadgeCategory,
  DefaultGoal,
} from "./types";

/** Shorts are typically < 60 seconds */
export const SHORTS_MAX_DURATION_SEC = 60;

/** Category display info */
export const BADGE_CATEGORIES: { id: BadgeCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "consistency", label: "Consistency" },
  { id: "reach", label: "Reach" },
  { id: "growth", label: "Growth" },
  { id: "quality", label: "Quality" },
  { id: "engagement", label: "Engagement" },
  { id: "milestone", label: "Milestones" },
];

/** Rarity display info */
export const BADGE_RARITIES = [
  { id: "all" as const, label: "All Rarities" },
  { id: "common" as const, label: "Common" },
  { id: "rare" as const, label: "Rare" },
  { id: "epic" as const, label: "Epic" },
  { id: "legendary" as const, label: "Legendary" },
];

/**
 * BADGE REGISTRY
 * All badges with their definitions
 */
export const BADGES: BadgeDef[] = [
  // ============================================
  // CONSISTENCY BADGES (progression chains)
  // ============================================
  {
    id: "first-upload",
    name: "First Steps",
    description: "Upload your first video",
    category: "consistency",
    rarity: "common",
    icon: "rocket",
    requiredMetrics: ["upload_count"],
    order: 1,
  },
  {
    id: "consistency-builder",
    name: "Consistency Builder",
    description: "Upload at least 1 video per week for 4 weeks",
    category: "consistency",
    rarity: "common",
    icon: "calendar",
    requiredMetrics: ["posting_streak_weeks"],
    order: 2,
  },
  {
    id: "machine-mode",
    name: "Machine Mode",
    description: "Upload 2+ videos per week for 4 weeks",
    category: "consistency",
    rarity: "rare",
    icon: "zap",
    dependsOn: "consistency-builder",
    requiredMetrics: ["upload_count"],
    order: 3,
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Maintain weekly uploads for 12 consecutive weeks",
    category: "consistency",
    rarity: "epic",
    icon: "flame",
    dependsOn: "machine-mode",
    requiredMetrics: ["posting_streak_weeks"],
    order: 4,
  },
  {
    id: "legendary-streak",
    name: "Legendary Streak",
    description: "Maintain weekly uploads for 26 consecutive weeks",
    category: "consistency",
    rarity: "legendary",
    icon: "crown",
    dependsOn: "unstoppable",
    requiredMetrics: ["posting_streak_weeks"],
    order: 5,
  },
  {
    id: "short-sprint",
    name: "Short Sprint",
    description: "Post 5 Shorts in a single week",
    category: "consistency",
    rarity: "rare",
    icon: "shorts",
    requiredMetrics: ["shorts_count"],
    order: 6,
  },
  {
    id: "schedule-keeper",
    name: "Schedule Keeper",
    description: "Publish within 7 days of your last upload for 8 weeks",
    category: "consistency",
    rarity: "rare",
    icon: "clock",
    requiredMetrics: ["posting_streak_weeks"],
    order: 7,
  },
  {
    id: "the-return",
    name: "The Return",
    description: "Come back and upload after 30+ days inactive",
    category: "consistency",
    rarity: "common",
    icon: "refresh",
    requiredMetrics: ["upload_count"],
    order: 8,
  },
  {
    id: "daily-warrior",
    name: "Daily Warrior",
    description: "Upload every day for 7 consecutive days",
    category: "consistency",
    rarity: "epic",
    icon: "flame",
    requiredMetrics: ["posting_streak_days"],
    order: 9,
  },

  // ============================================
  // REACH BADGES (views, velocity)
  // ============================================
  {
    id: "first-1k-views",
    name: "First Thousand",
    description: "Get 1,000 views on a single video",
    category: "reach",
    rarity: "common",
    icon: "eye",
    requiredMetrics: ["views"],
    order: 1,
  },
  {
    id: "momentum",
    name: "Momentum",
    description: "Hit top 10% views/day vs your last 10 uploads",
    category: "reach",
    rarity: "rare",
    icon: "trending",
    requiredMetrics: ["views_per_day"],
    order: 2,
  },
  {
    id: "breakout",
    name: "Breakout",
    description: "Get 2x your median views/day on a video",
    category: "reach",
    rarity: "epic",
    icon: "lightning",
    requiredMetrics: ["views_per_day"],
    order: 3,
  },
  {
    id: "evergreen-seed",
    name: "Evergreen Seed",
    description: "A video still getting 10+ views/day 30 days after publish",
    category: "reach",
    rarity: "rare",
    icon: "seed",
    requiredMetrics: ["views_per_day"],
    order: 4,
  },
  {
    id: "upward-trend",
    name: "Upward Trend",
    description: "Last 5 videos averaging more views than previous 5",
    category: "reach",
    rarity: "rare",
    icon: "chart",
    requiredMetrics: ["views"],
    order: 5,
  },
  {
    id: "10k-channel-views",
    name: "10K Club",
    description: "Reach 10,000 total channel views",
    category: "reach",
    rarity: "common",
    icon: "eye",
    requiredMetrics: ["views"],
    order: 6,
  },
  {
    id: "100k-channel-views",
    name: "100K Milestone",
    description: "Reach 100,000 total channel views",
    category: "reach",
    rarity: "epic",
    icon: "star",
    dependsOn: "10k-channel-views",
    requiredMetrics: ["views"],
    order: 7,
  },
  {
    id: "1m-channel-views",
    name: "Million Views",
    description: "Reach 1,000,000 total channel views",
    category: "reach",
    rarity: "legendary",
    icon: "trophy",
    dependsOn: "100k-channel-views",
    requiredMetrics: ["views"],
    order: 8,
  },

  // ============================================
  // GROWTH BADGES (subscribers)
  // ============================================
  {
    id: "first-10-subs",
    name: "First Fans",
    description: "Reach 10 subscribers",
    category: "growth",
    rarity: "common",
    icon: "users",
    requiredMetrics: ["subscriber_count"],
    order: 1,
  },
  {
    id: "first-50-subs",
    name: "Growing Community",
    description: "Reach 50 subscribers",
    category: "growth",
    rarity: "common",
    icon: "users",
    dependsOn: "first-10-subs",
    requiredMetrics: ["subscriber_count"],
    order: 2,
  },
  {
    id: "first-100-subs",
    name: "Triple Digits",
    description: "Reach 100 subscribers",
    category: "growth",
    rarity: "rare",
    icon: "medal",
    dependsOn: "first-50-subs",
    requiredMetrics: ["subscriber_count"],
    order: 3,
  },
  {
    id: "first-500-subs",
    name: "Rising Creator",
    description: "Reach 500 subscribers",
    category: "growth",
    rarity: "epic",
    icon: "star",
    dependsOn: "first-100-subs",
    requiredMetrics: ["subscriber_count"],
    order: 4,
  },
  {
    id: "first-1k-subs",
    name: "1K Club",
    description: "Reach 1,000 subscribers",
    category: "growth",
    rarity: "legendary",
    icon: "trophy",
    dependsOn: "first-500-subs",
    requiredMetrics: ["subscriber_count"],
    order: 5,
  },
  {
    id: "converter",
    name: "Converter",
    description: "Get 10+ subscribers per 1,000 views on a video",
    category: "growth",
    rarity: "rare",
    icon: "target",
    requiredMetrics: ["subs_per_view"],
    order: 6,
  },
  {
    id: "steady-growth",
    name: "Steady Growth",
    description: "Net-positive subscribers for 4 consecutive weeks",
    category: "growth",
    rarity: "rare",
    icon: "chart",
    requiredMetrics: ["subscribers_gained", "subscribers_lost"],
    order: 7,
  },
  {
    id: "growth-spurt",
    name: "Growth Spurt",
    description: "Gain 50+ subscribers in a single week",
    category: "growth",
    rarity: "epic",
    icon: "zap",
    requiredMetrics: ["subscribers_gained"],
    order: 8,
  },

  // ============================================
  // QUALITY BADGES (CTR, retention)
  // ============================================
  {
    id: "click-magnet",
    name: "Click Magnet",
    description: "CTR ≥ 5% on a video with 1,000+ impressions",
    category: "quality",
    rarity: "rare",
    icon: "target",
    requiredMetrics: ["ctr", "impressions"],
    order: 1,
  },
  {
    id: "ctr-master",
    name: "CTR Master",
    description: "Average CTR ≥ 6% across your last 10 uploads",
    category: "quality",
    rarity: "epic",
    icon: "target",
    dependsOn: "click-magnet",
    requiredMetrics: ["ctr"],
    order: 2,
  },
  {
    id: "storyteller",
    name: "Storyteller",
    description: "Avg % viewed ≥ 50% on a video longer than 5 minutes",
    category: "quality",
    rarity: "rare",
    icon: "clock",
    requiredMetrics: ["average_view_percentage"],
    order: 3,
  },
  {
    id: "retention-pro",
    name: "Retention Pro",
    description: "Average retention ≥ 45% across last 10 uploads",
    category: "quality",
    rarity: "epic",
    icon: "chart",
    dependsOn: "storyteller",
    requiredMetrics: ["average_view_percentage"],
    order: 4,
  },
  {
    id: "leveling-up",
    name: "Leveling Up",
    description: "Improve CTR or retention for 3 uploads in a row",
    category: "quality",
    rarity: "rare",
    icon: "trending",
    requiredMetrics: ["ctr", "average_view_percentage"],
    order: 5,
  },

  // ============================================
  // ENGAGEMENT BADGES (likes, comments)
  // ============================================
  {
    id: "loved",
    name: "Loved",
    description: "Like rate ≥ 5% on a video with 500+ views",
    category: "engagement",
    rarity: "rare",
    icon: "heart",
    requiredMetrics: ["like_rate", "views"],
    order: 1,
  },
  {
    id: "fan-favorite",
    name: "Fan Favorite",
    description: "Average like rate ≥ 6% across last 10 uploads",
    category: "engagement",
    rarity: "epic",
    icon: "heart",
    dependsOn: "loved",
    requiredMetrics: ["like_rate"],
    order: 2,
  },
  {
    id: "conversation-starter",
    name: "Conversation Starter",
    description: "Get 50+ comments on a single video",
    category: "engagement",
    rarity: "rare",
    icon: "message",
    requiredMetrics: ["comments"],
    order: 3,
  },
  {
    id: "community-builder",
    name: "Community Builder",
    description: "Get 200+ comments on a single video",
    category: "engagement",
    rarity: "epic",
    icon: "message",
    dependsOn: "conversation-starter",
    requiredMetrics: ["comments"],
    order: 4,
  },
  {
    id: "engagement-king",
    name: "Engagement King",
    description: "Like rate ≥ 5% AND 50+ comments on the same video",
    category: "engagement",
    rarity: "legendary",
    icon: "crown",
    requiredMetrics: ["like_rate", "comments"],
    order: 5,
  },

  // ============================================
  // MILESTONE BADGES (video counts, special)
  // ============================================
  {
    id: "videos-10",
    name: "Getting Started",
    description: "Upload 10 videos total",
    category: "milestone",
    rarity: "common",
    icon: "video",
    requiredMetrics: ["upload_count"],
    order: 1,
  },
  {
    id: "videos-25",
    name: "Quarter Century",
    description: "Upload 25 videos total",
    category: "milestone",
    rarity: "common",
    icon: "video",
    dependsOn: "videos-10",
    requiredMetrics: ["upload_count"],
    order: 2,
  },
  {
    id: "videos-50",
    name: "Halfway to 100",
    description: "Upload 50 videos total",
    category: "milestone",
    rarity: "rare",
    icon: "video",
    dependsOn: "videos-25",
    requiredMetrics: ["upload_count"],
    order: 3,
  },
  {
    id: "videos-100",
    name: "Century Club",
    description: "Upload 100 videos total",
    category: "milestone",
    rarity: "epic",
    icon: "trophy",
    dependsOn: "videos-50",
    requiredMetrics: ["upload_count"],
    order: 4,
  },
  {
    id: "videos-250",
    name: "Prolific Creator",
    description: "Upload 250 videos total",
    category: "milestone",
    rarity: "legendary",
    icon: "crown",
    dependsOn: "videos-100",
    requiredMetrics: ["upload_count"],
    order: 5,
  },
];

/**
 * DEFAULT GOALS
 * Goals that contribute toward badges
 */
export const DEFAULT_GOALS: DefaultGoal[] = [
  // Consistency goals
  {
    id: "upload-1-week",
    title: "Weekly Upload",
    description: "Upload 1 video this week",
    whyItMatters: "Consistency signals to YouTube you're an active creator",
    category: "consistency",
    badgeIds: ["consistency-builder"],
    metricKey: "upload_count",
    target: 1,
    window: "weekly",
    requiredMetrics: ["upload_count"],
    unit: "video",
  },
  {
    id: "upload-3-month",
    title: "Monthly Momentum",
    description: "Upload 3 videos this month",
    whyItMatters: "Regular uploads keep your audience engaged",
    category: "consistency",
    badgeIds: ["consistency-builder", "machine-mode"],
    metricKey: "upload_count",
    target: 3,
    window: "monthly",
    requiredMetrics: ["upload_count"],
    unit: "videos",
  },
  {
    id: "shorts-5-week",
    title: "Shorts Sprint",
    description: "Post 5 Shorts this week",
    whyItMatters: "Shorts drive discovery and subscriber growth",
    category: "consistency",
    badgeIds: ["short-sprint"],
    metricKey: "shorts_count",
    target: 5,
    window: "weekly",
    requiredMetrics: ["shorts_count"],
    unit: "Shorts",
  },
  {
    id: "streak-4-weeks",
    title: "4-Week Streak",
    description: "Upload at least once per week for 4 weeks",
    whyItMatters: "Building habits is the foundation of channel growth",
    category: "consistency",
    badgeIds: ["consistency-builder"],
    metricKey: "posting_streak_weeks",
    target: 4,
    window: "lifetime",
    requiredMetrics: ["upload_count"],
    unit: "weeks",
  },
  {
    id: "streak-12-weeks",
    title: "12-Week Streak",
    description: "Upload at least once per week for 12 weeks",
    whyItMatters: "Long-term consistency separates serious creators",
    category: "consistency",
    badgeIds: ["unstoppable"],
    metricKey: "posting_streak_weeks",
    target: 12,
    window: "lifetime",
    requiredMetrics: ["upload_count"],
    unit: "weeks",
  },
  {
    id: "daily-streak-7",
    title: "7-Day Posting Streak",
    description: "Post every day for 7 consecutive days",
    whyItMatters: "Daily posting maximizes algorithm exposure",
    category: "consistency",
    badgeIds: ["daily-warrior"],
    metricKey: "posting_streak_days",
    target: 7,
    window: "lifetime",
    requiredMetrics: ["upload_count"],
    unit: "days",
  },

  // Reach goals
  {
    id: "views-1k-28d",
    title: "1,000 Views",
    description: "Get 1,000 views in 28 days",
    whyItMatters: "Views show your content is being discovered",
    category: "reach",
    badgeIds: ["first-1k-views"],
    metricKey: "views",
    target: 1000,
    window: "28d",
    requiredMetrics: ["views"],
    unit: "views",
  },
  {
    id: "views-10k-lifetime",
    title: "10K Total Views",
    description: "Reach 10,000 lifetime channel views",
    whyItMatters: "Your first 10K proves your content can reach people",
    category: "reach",
    badgeIds: ["10k-channel-views"],
    metricKey: "views",
    target: 10000,
    window: "lifetime",
    requiredMetrics: ["views"],
    unit: "views",
  },

  // Growth goals
  {
    id: "subs-10-28d",
    title: "Grow Your Audience",
    description: "Gain 10 subscribers in 28 days",
    whyItMatters: "New subscribers mean your content is converting",
    category: "growth",
    badgeIds: ["first-10-subs"],
    metricKey: "subscribers_gained",
    target: 10,
    window: "28d",
    requiredMetrics: ["subscribers_gained"],
    unit: "subs",
  },
  {
    id: "subs-100-lifetime",
    title: "First 100 Subscribers",
    description: "Reach 100 total subscribers",
    whyItMatters: "The first 100 are the hardest - huge milestone!",
    category: "growth",
    badgeIds: ["first-100-subs"],
    metricKey: "subscriber_count",
    target: 100,
    window: "lifetime",
    requiredMetrics: ["subscriber_count"],
    unit: "subs",
  },

  // Quality goals
  {
    id: "ctr-5-percent",
    title: "5% CTR",
    description: "Achieve CTR ≥ 5% on a video with 1K+ impressions",
    whyItMatters: "High CTR means your titles & thumbnails work",
    category: "quality",
    badgeIds: ["click-magnet"],
    metricKey: "ctr",
    target: 5,
    window: "lifetime",
    uploadCount: 10,
    requiredMetrics: ["ctr", "impressions"],
    unit: "%",
  },
  {
    id: "retention-50-percent",
    title: "50% Retention",
    description: "Achieve avg retention ≥ 50% on a video 5+ min long",
    whyItMatters: "Strong retention signals engaging content",
    category: "quality",
    badgeIds: ["storyteller"],
    metricKey: "average_view_percentage",
    target: 50,
    window: "lifetime",
    uploadCount: 10,
    requiredMetrics: ["average_view_percentage"],
    unit: "%",
  },

  // Engagement goals
  {
    id: "comments-50",
    title: "Spark Conversation",
    description: "Get 50 comments on a single video",
    whyItMatters: "Comments signal deep audience engagement",
    category: "engagement",
    badgeIds: ["conversation-starter"],
    metricKey: "comments",
    target: 50,
    window: "lifetime",
    requiredMetrics: ["comments"],
    unit: "comments",
  },
  {
    id: "like-rate-5-percent",
    title: "5% Like Rate",
    description: "Achieve like rate ≥ 5% on a video with 500+ views",
    whyItMatters: "Like rate shows content resonates with viewers",
    category: "engagement",
    badgeIds: ["loved"],
    metricKey: "like_rate",
    target: 5,
    window: "lifetime",
    uploadCount: 10,
    requiredMetrics: ["like_rate"],
    unit: "%",
  },
];

/** Get badge by ID */
export function getBadge(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

/** Get badges by category */
export function getBadgesByCategory(category: BadgeCategory): BadgeDef[] {
  return BADGES.filter((b) => b.category === category).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** Get badges by rarity */
export function getBadgesByRarity(rarity: string): BadgeDef[] {
  return BADGES.filter((b) => b.rarity === rarity);
}

/** Get goal by ID */
export function getGoal(id: string): DefaultGoal | undefined {
  return DEFAULT_GOALS.find((g) => g.id === id);
}

/** Get goals by category */
export function getGoalsByCategory(category: BadgeCategory): DefaultGoal[] {
  return DEFAULT_GOALS.filter((g) => g.category === category);
}

/** Get goals that contribute to a badge */
export function getGoalsForBadge(badgeId: string): DefaultGoal[] {
  return DEFAULT_GOALS.filter((g) => g.badgeIds.includes(badgeId));
}

/** Get badge chain (progression path) */
export function getBadgeChain(badgeId: string): BadgeDef[] {
  const chain: BadgeDef[] = [];
  let current = getBadge(badgeId);
  
  // Walk up the chain
  while (current) {
    chain.unshift(current);
    if (current.dependsOn) {
      current = getBadge(current.dependsOn);
    } else {
      break;
    }
  }
  
  // Also get children
  const badge = getBadge(badgeId);
  if (badge) {
    const children = BADGES.filter((b) => b.dependsOn === badgeId);
    chain.push(...children);
  }
  
  return chain;
}
