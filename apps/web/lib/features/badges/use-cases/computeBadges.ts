/**
 * Badge Progress Computation
 *
 * Calculates progress for all badges based on video/channel metrics.
 */

import { daysSince } from "@/lib/youtube/utils";

import { BADGES, DEFAULT_GOALS, SHORTS_MAX_DURATION_SEC } from "../registry";
import type {
  BadgeDef,
  BadgeProgress,
  BadgeWithProgress,
  ChannelStatsForBadges,
  DefaultGoal,
  GoalStatus,
  GoalWithProgress,
  MetricAvailability,
  MetricAvailabilityCheck,
  MetricKey,
  UnlockedBadge,
  VideoForBadges,
} from "../types";

// ============================================
// DATE/WINDOW HELPERS
// ============================================

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getMonthStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getDaysRemaining(window: string): number {
  const now = new Date();
  if (window === "weekly" || window === "7d") {
    const weekEnd = new Date(getWeekStart(now));
    weekEnd.setDate(weekEnd.getDate() + 7);
    return Math.ceil((weekEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } if (window === "monthly" || window === "28d") {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
  return 0;
}

function getWindowStartDate(window: string): Date {
  const now = new Date();
  if (window === "weekly" || window === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } if (window === "monthly" || window === "28d") {
    return new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  }
  return new Date(0);
}

// ============================================
// VIDEO HELPERS
// ============================================

function getVideosInWindow(videos: VideoForBadges[], window: string): VideoForBadges[] {
  if (window === "lifetime") {
    return videos.filter((v) => v.publishedAt);
  }
  const startDate = getWindowStartDate(window);
  const now = new Date();
  return videos.filter((v) => {
    if (!v.publishedAt) {return false;}
    const pubDate = new Date(v.publishedAt);
    return pubDate >= startDate && pubDate <= now;
  });
}

function getLastNUploads(videos: VideoForBadges[], n: number): VideoForBadges[] {
  return [...videos]
    .filter((v) => v.publishedAt)
    .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())
    .slice(0, n);
}

export function countVideosInWindow(videos: VideoForBadges[], window: string): number {
  return getVideosInWindow(videos, window).length;
}

export function countShortsInWindow(videos: VideoForBadges[], window: string): number {
  return getVideosInWindow(videos, window).filter(
    (v) => v.durationSec != null && v.durationSec <= SHORTS_MAX_DURATION_SEC
  ).length;
}

export function sumViewsInWindow(videos: VideoForBadges[], window: string): number {
  return getVideosInWindow(videos, window).reduce((sum, v) => sum + (v.views ?? 0), 0);
}

export function sumSubsGainedInWindow(videos: VideoForBadges[], window: string): number {
  return getVideosInWindow(videos, window).reduce((sum, v) => sum + (v.subscribersGained ?? 0), 0);
}

// ============================================
// STREAK CALCULATIONS
// ============================================

/**
 * Count consecutive periods (going backwards from now) that contain
 * at least one published video. `windowDays` controls granularity:
 *   1  → daily streak
 *   7  → weekly streak
 */
function calculatePostingStreak(
  videos: VideoForBadges[],
  windowDays: 1 | 7,
  maxPeriods: number,
): number {
  if (videos.length === 0) {return 0;}

  const sorted = [...videos]
    .filter((v) => v.publishedAt)
    .map((v) => new Date(v.publishedAt!))
    .sort((a, b) => b.getTime() - a.getTime());

  if (sorted.length === 0) {return 0;}

  const alignStart = windowDays === 7 ? getWeekStart(new Date()) : (() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  })();

  let streak = 0;
  let windowStart = new Date(alignStart);

  for (let i = 0; i < maxPeriods; i++) {
    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + windowDays);

    const hasVideo = sorted.some(
      (date) => date >= windowStart && date < windowEnd,
    );

    if (hasVideo) {
      streak++;
      windowStart = new Date(windowStart);
      windowStart.setDate(windowStart.getDate() - windowDays);
    } else {
      break;
    }
  }

  return streak;
}

export function calculatePostingStreakDays(videos: VideoForBadges[]): number {
  return calculatePostingStreak(videos, 1, 365);
}

export function calculatePostingStreakWeeks(videos: VideoForBadges[]): number {
  return calculatePostingStreak(videos, 7, 52);
}

// ============================================
// ADVANCED METRIC CALCULATIONS
// ============================================

function median(arr: number[]): number {
  if (arr.length === 0) {return 0;}
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function getViewsPerDay(video: VideoForBadges): number {
  if (!video.publishedAt || !video.views) {return 0;}
  return video.views / daysSince(video.publishedAt);
}

function isInTopPercentViewsPerDay(
  videos: VideoForBadges[],
  targetPercentile: number
): boolean {
  const sorted = getLastNUploads(videos, 10);
  if (sorted.length < 5) {return false;}
  
  const vpds = sorted.map(getViewsPerDay);
  const threshold = vpds.sort((a, b) => b - a)[Math.floor(vpds.length * (targetPercentile / 100))];
  const latest = vpds[0];
  
  return latest >= threshold;
}

function hasBreakoutVideo(videos: VideoForBadges[]): boolean {
  const sorted = getLastNUploads(videos, 10);
  if (sorted.length < 5) {return false;}
  
  const vpds = sorted.map(getViewsPerDay);
  const med = median(vpds.slice(1));
  const latest = vpds[0];
  
  return latest >= med * 2;
}

function hasEvergreenVideo(videos: VideoForBadges[]): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return videos.some((v) => {
    if (!v.publishedAt || !v.views) {return false;}
    const pubDate = new Date(v.publishedAt);
    if (pubDate > thirtyDaysAgo) {return false;}
    
    const vpd = getViewsPerDay(v);
    return vpd >= 10;
  });
}

function hasUpwardTrend(videos: VideoForBadges[]): boolean {
  const sorted = getLastNUploads(videos, 10);
  if (sorted.length < 10) {return false;}
  
  const recent5 = sorted.slice(0, 5).reduce((sum, v) => sum + (v.views ?? 0), 0) / 5;
  const prev5 = sorted.slice(5, 10).reduce((sum, v) => sum + (v.views ?? 0), 0) / 5;
  
  return recent5 > prev5;
}

function getMaxVideoViews(videos: VideoForBadges[]): number {
  return Math.max(0, ...videos.map((v) => v.views ?? 0));
}

function getMaxVideoComments(videos: VideoForBadges[]): number {
  return Math.max(0, ...videos.map((v) => v.comments ?? 0));
}

function getMaxLikeRate(videos: VideoForBadges[]): number {
  let max = 0;
  for (const v of videos) {
    if (v.views && v.views >= 500 && v.likes) {
      const rate = (v.likes / v.views) * 100;
      if (rate > max) {max = rate;}
    }
  }
  return Math.round(max * 10) / 10;
}

export function avgLikeRateLastN(videos: VideoForBadges[], n: number): number {
  const lastN = getLastNUploads(videos, n).filter((v) => v.views && v.views > 0);
  if (lastN.length < n) {return 0;}
  const rates = lastN.map((v) => ((v.likes ?? 0) / v.views!) * 100);
  return Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) / 10;
}

function avgCtrLastN(videos: VideoForBadges[], n: number): number {
  const lastN = getLastNUploads(videos, n).filter((v) => v.ctr != null);
  if (lastN.length < n) {return 0;}
  const total = lastN.reduce((sum, v) => sum + (v.ctr ?? 0), 0);
  return Math.round((total / lastN.length) * 10) / 10;
}

export function avgRetentionLastN(videos: VideoForBadges[], n: number): number {
  const lastN = getLastNUploads(videos, n).filter((v) => v.averageViewPercentage != null);
  if (lastN.length < n) {return 0;}
  const total = lastN.reduce((sum, v) => sum + (v.averageViewPercentage ?? 0), 0);
  return Math.round(total / lastN.length);
}

function hasNetPositiveSubsWeeks(videos: VideoForBadges[], weeks: number): boolean {
  const now = new Date();
  for (let w = 0; w < weeks; w++) {
    const weekStart = new Date(getWeekStart(now));
    weekStart.setDate(weekStart.getDate() - w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const weekVideos = videos.filter((v) => {
      if (!v.publishedAt) {return false;}
      const d = new Date(v.publishedAt);
      return d >= weekStart && d < weekEnd;
    });
    
    const gained = weekVideos.reduce((sum, v) => sum + (v.subscribersGained ?? 0), 0);
    const lost = weekVideos.reduce((sum, v) => sum + (v.subscribersLost ?? 0), 0);
    
    if (gained <= lost) {return false;}
  }
  return true;
}

function hasReturnedAfterBreak(videos: VideoForBadges[]): boolean {
  const sorted = [...videos]
    .filter((v) => v.publishedAt)
    .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());
  
  if (sorted.length < 2) {return false;}
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = new Date(sorted[i].publishedAt!);
    const prev = new Date(sorted[i + 1].publishedAt!);
    const daysBetween = (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (daysBetween >= 30) {return true;}
  }
  
  return false;
}

function hasDoubleUploadWeeks(videos: VideoForBadges[], weeks: number): boolean {
  const now = new Date();
  let consecutiveWeeks = 0;
  
  for (let w = 0; w < 52; w++) {
    const weekStart = new Date(getWeekStart(now));
    weekStart.setDate(weekStart.getDate() - w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const count = videos.filter((v) => {
      if (!v.publishedAt) {return false;}
      const d = new Date(v.publishedAt);
      return d >= weekStart && d < weekEnd;
    }).length;
    
    if (count >= 2) {
      consecutiveWeeks++;
      if (consecutiveWeeks >= weeks) {return true;}
    } else {
      consecutiveWeeks = 0;
    }
  }
  
  return false;
}

// ============================================
// METRIC AVAILABILITY
// ============================================

function metricEntry(available: boolean, reason?: MetricAvailability["reason"]): MetricAvailability {
  return available ? { available: true } : { available: false, reason };
}

export function checkMetricAvailability(
  videos: VideoForBadges[],
  channelStats?: ChannelStatsForBadges
): MetricAvailabilityCheck {
  const videosWithViews = videos.filter((v) => v.views != null).length;
  const videosWithRetention = videos.filter((v) => v.averageViewPercentage != null).length;
  const videosWithEngagement = videos.filter((v) => v.likes != null).length;
  const videosWithCtr = videos.filter((v) => v.ctr != null).length;
  const videosWithSubs = videos.filter((v) => v.subscribersGained != null).length;

  const hasVideoMetrics = videosWithViews >= 3;
  const hasRetentionData = videosWithRetention >= 3;
  const hasEngagementData = videosWithEngagement >= 3;
  const hasCtrData = videosWithCtr >= 3;

  const metrics: Partial<Record<MetricKey, MetricAvailability>> = {
    upload_count: { available: true },
    shorts_count: { available: true },
    posting_streak_days: { available: true },
    posting_streak_weeks: { available: true },
    subscriber_count: metricEntry(channelStats?.subscriberCount != null, "no_data"),
    subscribers_gained: metricEntry(videosWithSubs >= 1, "analytics_not_connected"),
    subscribers_lost: metricEntry(videosWithSubs >= 1, "analytics_not_connected"),
    views: metricEntry(hasVideoMetrics, "insufficient_videos"),
    views_per_day: metricEntry(hasVideoMetrics, "insufficient_videos"),
    total_views: { available: hasVideoMetrics || channelStats?.totalViews != null },
    average_view_percentage: metricEntry(hasRetentionData, "analytics_not_connected"),
    ctr: metricEntry(hasCtrData, "analytics_not_connected"),
    impressions: metricEntry(hasCtrData, "analytics_not_connected"),
    likes: metricEntry(hasEngagementData, "insufficient_videos"),
    like_rate: metricEntry(hasEngagementData && hasVideoMetrics, "insufficient_videos"),
    comments: metricEntry(hasEngagementData, "insufficient_videos"),
  };

  return {
    metrics,
    hasVideoMetrics,
    hasRetentionData,
    hasEngagementData,
    hasCtrData,
    videosWithMetrics: videosWithViews,
  };
}

// ============================================
// BADGE PROGRESS
// ============================================

function formatValue(value: number, unit?: string): string {
  if (unit === "%") {return `${Math.round(value * 10) / 10}%`;}
  if (value >= 1_000_000) {return `${(value / 1_000_000).toFixed(1)}M`;}
  if (value >= 1000) {return `${(value / 1000).toFixed(1)}K`;}
  return value.toString();
}

function resolveLockedReason(reason?: string): string {
  if (reason === "analytics_not_connected") {return "Requires YouTube Analytics data";}
  if (reason === "insufficient_videos") {return "Need more videos with metrics";}
  return "Requires more data";
}

function buildLockedProgress(reason?: string): BadgeProgress {
  return {
    current: 0,
    target: 1,
    percent: 0,
    isUnlocked: false,
    lockedReason: resolveLockedReason(reason),
  };
}

type BadgeComputeContext = {
  videos: VideoForBadges[];
  totalVideos: number;
  subscriberCount: number;
  totalViews: number;
};

function computeConverterProgress(ctx: BadgeComputeContext): BadgeProgress {
  const maxSubsPerView = Math.max(0, ...ctx.videos
    .filter((v) => v.views && v.views >= 100)
    .map((v) => ((v.subscribersGained ?? 0) / v.views!) * 1000));
  return createProgress(maxSubsPerView, 10, "subs/1K views");
}

function computeClickMagnetProgress(ctx: BadgeComputeContext): BadgeProgress {
  const ctrVideos = ctx.videos.filter((v) => v.impressions && v.impressions >= 1000 && v.ctr);
  const maxCtr = Math.max(0, ...ctrVideos.map((v) => v.ctr ?? 0));
  return createProgress(maxCtr, 5, "%", true);
}

function computeStorytellerProgress(ctx: BadgeComputeContext): BadgeProgress {
  const longVideos = ctx.videos.filter((v) => v.durationSec && v.durationSec >= 300 && v.averageViewPercentage);
  const maxRetention = Math.max(0, ...longVideos.map((v) => v.averageViewPercentage ?? 0));
  return createProgress(maxRetention, 50, "%", true);
}

function computeLevelingUpProgress(ctx: BadgeComputeContext): BadgeProgress {
  const last5 = getLastNUploads(ctx.videos, 5).filter((v) => v.ctr != null || v.averageViewPercentage != null);
  let improvements = 0;
  for (let i = 0; i < last5.length - 1; i++) {
    const current = last5[i].ctr ?? last5[i].averageViewPercentage ?? 0;
    const prev = last5[i + 1].ctr ?? last5[i + 1].averageViewPercentage ?? 0;
    if (current > prev) {improvements++;}
    else {improvements = 0;}
  }
  return createProgress(improvements, 3, "in a row");
}

function computeEngagementKingProgress(ctx: BadgeComputeContext): BadgeProgress {
  const hasEngaged = ctx.videos.some((v) => {
    if (!v.views || v.views < 500 || !v.likes || !v.comments) {return false;}
    const likeRate = (v.likes / v.views) * 100;
    return likeRate >= 5 && v.comments >= 50;
  });
  return createProgress(hasEngaged ? 1 : 0, 1, "");
}

const BADGE_PROGRESS_MAP: Record<string, (ctx: BadgeComputeContext) => BadgeProgress> = {
  "first-upload": (ctx) => createProgress(ctx.totalVideos, 1, "video"),
  "consistency-builder": (ctx) => createProgress(calculatePostingStreakWeeks(ctx.videos), 4, "weeks"),
  "machine-mode": (ctx) => createProgress(hasDoubleUploadWeeks(ctx.videos, 4) ? 4 : 0, 4, "weeks"),
  "unstoppable": (ctx) => createProgress(calculatePostingStreakWeeks(ctx.videos), 12, "weeks"),
  "legendary-streak": (ctx) => createProgress(calculatePostingStreakWeeks(ctx.videos), 26, "weeks"),
  "short-sprint": (ctx) => createProgress(countShortsInWindow(ctx.videos, "weekly"), 5, "Shorts"),
  "schedule-keeper": (ctx) => createProgress(calculatePostingStreakWeeks(ctx.videos), 8, "weeks"),
  "the-return": (ctx) => createProgress(hasReturnedAfterBreak(ctx.videos) ? 1 : 0, 1, ""),
  "daily-warrior": (ctx) => createProgress(calculatePostingStreakDays(ctx.videos), 7, "days"),
  "first-1k-views": (ctx) => createProgress(getMaxVideoViews(ctx.videos), 1000, "views"),
  "momentum": (ctx) => createProgress(isInTopPercentViewsPerDay(ctx.videos, 10) ? 1 : 0, 1, ""),
  "breakout": (ctx) => createProgress(hasBreakoutVideo(ctx.videos) ? 1 : 0, 1, ""),
  "evergreen-seed": (ctx) => createProgress(hasEvergreenVideo(ctx.videos) ? 1 : 0, 1, ""),
  "upward-trend": (ctx) => createProgress(hasUpwardTrend(ctx.videos) ? 1 : 0, 1, ""),
  "10k-channel-views": (ctx) => createProgress(ctx.totalViews, 10_000, "views"),
  "100k-channel-views": (ctx) => createProgress(ctx.totalViews, 100_000, "views"),
  "1m-channel-views": (ctx) => createProgress(ctx.totalViews, 1_000_000, "views"),
  "first-10-subs": (ctx) => createProgress(ctx.subscriberCount, 10, "subs"),
  "first-50-subs": (ctx) => createProgress(ctx.subscriberCount, 50, "subs"),
  "first-100-subs": (ctx) => createProgress(ctx.subscriberCount, 100, "subs"),
  "first-500-subs": (ctx) => createProgress(ctx.subscriberCount, 500, "subs"),
  "first-1k-subs": (ctx) => createProgress(ctx.subscriberCount, 1000, "subs"),
  "converter": computeConverterProgress,
  "steady-growth": (ctx) => createProgress(hasNetPositiveSubsWeeks(ctx.videos, 4) ? 4 : 0, 4, "weeks"),
  "growth-spurt": (ctx) => createProgress(sumSubsGainedInWindow(ctx.videos, "weekly"), 50, "subs"),
  "click-magnet": computeClickMagnetProgress,
  "ctr-master": (ctx) => createProgress(avgCtrLastN(ctx.videos, 10), 6, "%", true),
  "storyteller": computeStorytellerProgress,
  "retention-pro": (ctx) => createProgress(avgRetentionLastN(ctx.videos, 10), 45, "%", true),
  "leveling-up": computeLevelingUpProgress,
  "loved": (ctx) => createProgress(getMaxLikeRate(ctx.videos), 5, "%", true),
  "fan-favorite": (ctx) => createProgress(avgLikeRateLastN(ctx.videos, 10), 6, "%", true),
  "conversation-starter": (ctx) => createProgress(getMaxVideoComments(ctx.videos), 50, "comments"),
  "community-builder": (ctx) => createProgress(getMaxVideoComments(ctx.videos), 200, "comments"),
  "engagement-king": computeEngagementKingProgress,
  "videos-10": (ctx) => createProgress(ctx.totalVideos, 10, "videos"),
  "videos-25": (ctx) => createProgress(ctx.totalVideos, 25, "videos"),
  "videos-50": (ctx) => createProgress(ctx.totalVideos, 50, "videos"),
  "videos-100": (ctx) => createProgress(ctx.totalVideos, 100, "videos"),
  "videos-250": (ctx) => createProgress(ctx.totalVideos, 250, "videos"),
};

function computeBadgeProgress(
  badge: BadgeDef,
  videos: VideoForBadges[],
  channelStats: ChannelStatsForBadges | undefined,
  metricAvailability: MetricAvailabilityCheck
): BadgeProgress {
  const missingMetric = badge.requiredMetrics.find(
    (m) => !metricAvailability.metrics[m]?.available
  );

  if (missingMetric) {
    return buildLockedProgress(metricAvailability.metrics[missingMetric]?.reason);
  }

  const ctx: BadgeComputeContext = {
    videos,
    totalVideos: channelStats?.totalVideoCount ?? videos.length,
    subscriberCount: channelStats?.subscriberCount ?? 0,
    totalViews: channelStats?.totalViews ?? sumViewsInWindow(videos, "lifetime"),
  };

  const compute = BADGE_PROGRESS_MAP[badge.id];
  return compute ? compute(ctx) : createProgress(0, 1, "");
}

function createProgress(current: number, target: number, unit: string, isPercent = false): BadgeProgress {
  const percent = Math.min(100, Math.round((current / target) * 100));
  return {
    current,
    target,
    percent,
    isUnlocked: current >= target,
    currentLabel: isPercent ? `${Math.round(current * 10) / 10}%` : formatValue(current),
    targetLabel: isPercent ? `${target}%` : formatValue(target) + (unit ? ` ${unit}` : ""),
  };
}

export function computeAllBadgesProgress(
  videos: VideoForBadges[],
  channelStats: ChannelStatsForBadges | undefined,
  unlockedBadges: UnlockedBadge[]
): BadgeWithProgress[] {
  const metricAvailability = checkMetricAvailability(videos, channelStats);
  const unlockedMap = new Map(unlockedBadges.map((b) => [b.badgeId, b]));

  return BADGES.map((badge) => {
    const existingUnlock = unlockedMap.get(badge.id);
    const progress = computeBadgeProgress(badge, videos, channelStats, metricAvailability);

    if (existingUnlock) {
      return {
        ...badge,
        progress: { ...progress, isUnlocked: true, percent: 100 },
        unlocked: true,
        unlockedAt: existingUnlock.unlockedAt,
        seen: existingUnlock.seen,
      };
    }

    return {
      ...badge,
      progress,
      unlocked: progress.isUnlocked,
      unlockedAt: progress.isUnlocked ? new Date().toISOString() : undefined,
    };
  });
}

// ============================================
// GOAL PROGRESS
// ============================================

function buildLockedGoal(goal: DefaultGoal, reason?: string): GoalWithProgress {
  return {
    ...goal,
    progress: 0,
    percentage: 0,
    status: "locked",
    lockedReason: resolveLockedReason(reason),
  };
}

type GoalComputeContext = {
  subscriberCount: number;
  totalViews: number;
};

const GOAL_METRIC_MAP: Record<
  string,
  (videos: VideoForBadges[], goal: DefaultGoal, ctx: GoalComputeContext) => number
> = {
  upload_count: (videos, goal) => countVideosInWindow(videos, goal.window),
  shorts_count: (videos, goal) => countShortsInWindow(videos, goal.window),
  posting_streak_days: (videos) => calculatePostingStreakDays(videos),
  posting_streak_weeks: (videos) => calculatePostingStreakWeeks(videos),
  subscriber_count: (_v, _g, ctx) => ctx.subscriberCount,
  subscribers_gained: (videos, goal) => sumSubsGainedInWindow(videos, goal.window),
  views: (videos, goal, ctx) =>
    goal.window === "lifetime" ? ctx.totalViews : sumViewsInWindow(videos, goal.window),
  comments: (videos) => getMaxVideoComments(videos),
  ctr: (videos, goal) => avgCtrLastN(videos, goal.uploadCount ?? 10),
  average_view_percentage: (videos, goal) => avgRetentionLastN(videos, goal.uploadCount ?? 10),
  like_rate: (videos) => getMaxLikeRate(videos),
};

function computeGoalProgress(
  goal: DefaultGoal,
  videos: VideoForBadges[],
  channelStats: ChannelStatsForBadges | undefined,
  metricAvailability: MetricAvailabilityCheck
): GoalWithProgress {
  const missingMetric = goal.requiredMetrics.find(
    (m) => !metricAvailability.metrics[m]?.available
  );

  if (missingMetric) {
    return buildLockedGoal(goal, metricAvailability.metrics[missingMetric]?.reason);
  }

  const ctx: GoalComputeContext = {
    subscriberCount: channelStats?.subscriberCount ?? 0,
    totalViews: channelStats?.totalViews ?? sumViewsInWindow(videos, "lifetime"),
  };

  const compute = GOAL_METRIC_MAP[goal.metricKey];
  const progress = compute ? compute(videos, goal, ctx) : 0;

  const percentage = Math.min(100, Math.round((progress / goal.target) * 100));
  const isCompleted = progress >= goal.target;
  const daysRemaining = goal.window !== "lifetime" ? getDaysRemaining(goal.window) : undefined;
  const status: GoalStatus = isCompleted ? "completed" : "in_progress";

  return {
    ...goal,
    progress,
    percentage,
    status,
    daysRemaining,
    progressLabel: formatValue(progress, goal.unit),
    targetLabel: formatValue(goal.target, goal.unit),
  };
}

export function computeAllGoalsProgress(
  videos: VideoForBadges[],
  channelStats: ChannelStatsForBadges | undefined
): GoalWithProgress[] {
  const metricAvailability = checkMetricAvailability(videos, channelStats);

  return DEFAULT_GOALS.map((goal) =>
    computeGoalProgress(goal, videos, channelStats, metricAvailability)
  );
}

// ============================================
// HELPERS
// ============================================

export function getNextBadge(badges: BadgeWithProgress[]): BadgeWithProgress | null {
  const inProgress = badges
    .filter((b) => !b.unlocked && !b.progress.lockedReason && b.progress.percent > 0)
    .sort((a, b) => b.progress.percent - a.progress.percent);
  
  return inProgress[0] ?? null;
}

export function sortBadgesByClosest(badges: BadgeWithProgress[]): BadgeWithProgress[] {
  return [...badges].sort((a, b) => {
    if (a.unlocked && !b.unlocked) {return -1;}
    if (!a.unlocked && b.unlocked) {return 1;}
    if (!a.unlocked && !b.unlocked) {
      if (a.progress.lockedReason && !b.progress.lockedReason) {return 1;}
      if (!a.progress.lockedReason && b.progress.lockedReason) {return -1;}
      return b.progress.percent - a.progress.percent;
    }
    return 0;
  });
}

export function sortBadgesByRecent(badges: BadgeWithProgress[]): BadgeWithProgress[] {
  return [...badges].sort((a, b) => {
    if (a.unlocked && b.unlocked) {
      return new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime();
    }
    if (a.unlocked) {return -1;}
    if (b.unlocked) {return 1;}
    return 0;
  });
}

export function sortBadgesByRarity(badges: BadgeWithProgress[]): BadgeWithProgress[] {
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
  return [...badges].sort((a, b) => {
    const aOrder = rarityOrder[a.rarity];
    const bOrder = rarityOrder[b.rarity];
    if (aOrder !== bOrder) {return aOrder - bOrder;}
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

export function getBadgeSummary(badges: BadgeWithProgress[]): {
  total: number;
  unlocked: number;
  locked: number;
  inProgress: number;
} {
  const unlocked = badges.filter((b) => b.unlocked).length;
  const locked = badges.filter((b) => !b.unlocked && b.progress.lockedReason).length;
  const inProgress = badges.filter((b) => !b.unlocked && !b.progress.lockedReason).length;
  
  return {
    total: badges.length,
    unlocked,
    locked,
    inProgress,
  };
}
