/**
 * Badge Progress Computation
 *
 * Calculates progress for all badges based on video/channel metrics.
 */

import type {
  VideoForBadges,
  ChannelStatsForBadges,
  BadgeDef,
  BadgeWithProgress,
  BadgeProgress,
  GoalWithProgress,
  DefaultGoal,
  GoalStatus,
  MetricKey,
  MetricAvailability,
  MetricAvailabilityCheck,
  UnlockedBadge,
} from "./types";
import { BADGES, DEFAULT_GOALS, SHORTS_MAX_DURATION_SEC } from "./registry";
import { daysSince } from "@/lib/youtube/utils";

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
  } else if (window === "monthly" || window === "28d") {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
  return 0;
}

function getWindowStartDate(window: string): Date {
  const now = new Date();
  if (window === "weekly" || window === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (window === "monthly" || window === "28d") {
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
    if (!v.publishedAt) return false;
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
  if (videos.length === 0) return 0;

  const sorted = [...videos]
    .filter((v) => v.publishedAt)
    .map((v) => new Date(v.publishedAt!))
    .sort((a, b) => b.getTime() - a.getTime());

  if (sorted.length === 0) return 0;

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

/** Get median value from an array */
function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Calculate views per day for a video */
function getViewsPerDay(video: VideoForBadges): number {
  if (!video.publishedAt || !video.views) return 0;
  return video.views / daysSince(video.publishedAt);
}

/** Check if video is in top X% of views/day */
function isInTopPercentViewsPerDay(
  videos: VideoForBadges[],
  targetPercentile: number
): boolean {
  const sorted = getLastNUploads(videos, 10);
  if (sorted.length < 5) return false;
  
  const vpds = sorted.map(getViewsPerDay);
  const threshold = vpds.sort((a, b) => b - a)[Math.floor(vpds.length * (targetPercentile / 100))];
  const latest = vpds[0];
  
  return latest >= threshold;
}

/** Check if latest video has 2x median views/day */
function hasBreakoutVideo(videos: VideoForBadges[]): boolean {
  const sorted = getLastNUploads(videos, 10);
  if (sorted.length < 5) return false;
  
  const vpds = sorted.map(getViewsPerDay);
  const med = median(vpds.slice(1)); // Exclude latest
  const latest = vpds[0];
  
  return latest >= med * 2;
}

/** Check if a video is still getting views 30+ days later */
function hasEvergreenVideo(videos: VideoForBadges[]): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return videos.some((v) => {
    if (!v.publishedAt || !v.views) return false;
    const pubDate = new Date(v.publishedAt);
    if (pubDate > thirtyDaysAgo) return false;
    
    const vpd = getViewsPerDay(v);
    return vpd >= 10;
  });
}

/** Check if last 5 videos average more views than previous 5 */
function hasUpwardTrend(videos: VideoForBadges[]): boolean {
  const sorted = getLastNUploads(videos, 10);
  if (sorted.length < 10) return false;
  
  const recent5 = sorted.slice(0, 5).reduce((sum, v) => sum + (v.views ?? 0), 0) / 5;
  const prev5 = sorted.slice(5, 10).reduce((sum, v) => sum + (v.views ?? 0), 0) / 5;
  
  return recent5 > prev5;
}

/** Get max views on any single video */
function getMaxVideoViews(videos: VideoForBadges[]): number {
  return Math.max(0, ...videos.map((v) => v.views ?? 0));
}

/** Get max comments on any single video */
function getMaxVideoComments(videos: VideoForBadges[]): number {
  return Math.max(0, ...videos.map((v) => v.comments ?? 0));
}

/** Get max like rate on any single video */
function getMaxLikeRate(videos: VideoForBadges[]): number {
  let max = 0;
  for (const v of videos) {
    if (v.views && v.views >= 500 && v.likes) {
      const rate = (v.likes / v.views) * 100;
      if (rate > max) max = rate;
    }
  }
  return Math.round(max * 10) / 10;
}

/** Get average like rate across last N uploads */
export function avgLikeRateLastN(videos: VideoForBadges[], n: number): number {
  const lastN = getLastNUploads(videos, n).filter((v) => v.views && v.views > 0);
  if (lastN.length < n) return 0;
  const rates = lastN.map((v) => ((v.likes ?? 0) / v.views!) * 100);
  return Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) / 10;
}

/** Get average CTR across last N uploads */
function avgCtrLastN(videos: VideoForBadges[], n: number): number {
  const lastN = getLastNUploads(videos, n).filter((v) => v.ctr != null);
  if (lastN.length < n) return 0;
  const total = lastN.reduce((sum, v) => sum + (v.ctr ?? 0), 0);
  return Math.round((total / lastN.length) * 10) / 10;
}

/** Get average retention across last N uploads */
export function avgRetentionLastN(videos: VideoForBadges[], n: number): number {
  const lastN = getLastNUploads(videos, n).filter((v) => v.averageViewPercentage != null);
  if (lastN.length < n) return 0;
  const total = lastN.reduce((sum, v) => sum + (v.averageViewPercentage ?? 0), 0);
  return Math.round(total / lastN.length);
}

/** Check for net positive subs for N consecutive weeks */
function hasNetPositiveSubsWeeks(videos: VideoForBadges[], weeks: number): boolean {
  // Group videos by week
  const now = new Date();
  for (let w = 0; w < weeks; w++) {
    const weekStart = new Date(getWeekStart(now));
    weekStart.setDate(weekStart.getDate() - w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const weekVideos = videos.filter((v) => {
      if (!v.publishedAt) return false;
      const d = new Date(v.publishedAt);
      return d >= weekStart && d < weekEnd;
    });
    
    const gained = weekVideos.reduce((sum, v) => sum + (v.subscribersGained ?? 0), 0);
    const lost = weekVideos.reduce((sum, v) => sum + (v.subscribersLost ?? 0), 0);
    
    if (gained <= lost) return false;
  }
  return true;
}

/** Check if came back after 30+ day break */
function hasReturnedAfterBreak(videos: VideoForBadges[]): boolean {
  const sorted = [...videos]
    .filter((v) => v.publishedAt)
    .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());
  
  if (sorted.length < 2) return false;
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = new Date(sorted[i].publishedAt!);
    const prev = new Date(sorted[i + 1].publishedAt!);
    const daysBetween = (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (daysBetween >= 30) return true;
  }
  
  return false;
}

/** Check for 2+ uploads per week for N weeks */
function hasDoubleUploadWeeks(videos: VideoForBadges[], weeks: number): boolean {
  const now = new Date();
  let consecutiveWeeks = 0;
  
  for (let w = 0; w < 52; w++) {
    const weekStart = new Date(getWeekStart(now));
    weekStart.setDate(weekStart.getDate() - w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const count = videos.filter((v) => {
      if (!v.publishedAt) return false;
      const d = new Date(v.publishedAt);
      return d >= weekStart && d < weekEnd;
    }).length;
    
    if (count >= 2) {
      consecutiveWeeks++;
      if (consecutiveWeeks >= weeks) return true;
    } else {
      consecutiveWeeks = 0;
    }
  }
  
  return false;
}

// ============================================
// METRIC AVAILABILITY
// ============================================

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
    subscriber_count: {
      available: channelStats?.subscriberCount != null,
      reason: channelStats?.subscriberCount == null ? "no_data" : undefined,
    },
    subscribers_gained: {
      available: videosWithSubs >= 1,
      reason: videosWithSubs < 1 ? "analytics_not_connected" : undefined,
    },
    subscribers_lost: {
      available: videosWithSubs >= 1,
      reason: videosWithSubs < 1 ? "analytics_not_connected" : undefined,
    },
    views: {
      available: hasVideoMetrics,
      reason: !hasVideoMetrics ? "insufficient_videos" : undefined,
    },
    views_per_day: {
      available: hasVideoMetrics,
      reason: !hasVideoMetrics ? "insufficient_videos" : undefined,
    },
    total_views: {
      available: hasVideoMetrics || channelStats?.totalViews != null,
    },
    average_view_percentage: {
      available: hasRetentionData,
      reason: !hasRetentionData ? "analytics_not_connected" : undefined,
    },
    ctr: {
      available: hasCtrData,
      reason: !hasCtrData ? "analytics_not_connected" : undefined,
    },
    impressions: {
      available: hasCtrData,
      reason: !hasCtrData ? "analytics_not_connected" : undefined,
    },
    likes: {
      available: hasEngagementData,
      reason: !hasEngagementData ? "insufficient_videos" : undefined,
    },
    like_rate: {
      available: hasEngagementData && hasVideoMetrics,
      reason: !hasEngagementData ? "insufficient_videos" : undefined,
    },
    comments: {
      available: hasEngagementData,
      reason: !hasEngagementData ? "insufficient_videos" : undefined,
    },
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
  if (unit === "%") return `${Math.round(value * 10) / 10}%`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

function computeBadgeProgress(
  badge: BadgeDef,
  videos: VideoForBadges[],
  channelStats: ChannelStatsForBadges | undefined,
  metricAvailability: MetricAvailabilityCheck
): BadgeProgress {
  // Check if badge is locked due to missing metrics
  const missingMetric = badge.requiredMetrics.find(
    (m) => !metricAvailability.metrics[m]?.available
  );
  
  if (missingMetric) {
    const reason = metricAvailability.metrics[missingMetric]?.reason;
    let lockedReason = "Requires more data";
    if (reason === "analytics_not_connected") {
      lockedReason = "Requires YouTube Analytics data";
    } else if (reason === "insufficient_videos") {
      lockedReason = "Need more videos with metrics";
    }
    
    return {
      current: 0,
      target: 1,
      percent: 0,
      isUnlocked: false,
      lockedReason,
    };
  }

  const totalVideos = channelStats?.totalVideoCount ?? videos.length;
  const subscriberCount = channelStats?.subscriberCount ?? 0;
  const totalViews = channelStats?.totalViews ?? sumViewsInWindow(videos, "lifetime");

  // Badge-specific progress calculations
  switch (badge.id) {
    // Consistency badges
    case "first-upload":
      return createProgress(totalVideos, 1, "video");
    case "consistency-builder":
      return createProgress(calculatePostingStreakWeeks(videos), 4, "weeks");
    case "machine-mode":
      return createProgress(hasDoubleUploadWeeks(videos, 4) ? 4 : 0, 4, "weeks");
    case "unstoppable":
      return createProgress(calculatePostingStreakWeeks(videos), 12, "weeks");
    case "legendary-streak":
      return createProgress(calculatePostingStreakWeeks(videos), 26, "weeks");
    case "short-sprint":
      return createProgress(countShortsInWindow(videos, "weekly"), 5, "Shorts");
    case "schedule-keeper":
      return createProgress(calculatePostingStreakWeeks(videos), 8, "weeks");
    case "the-return":
      return createProgress(hasReturnedAfterBreak(videos) ? 1 : 0, 1, "");
    case "daily-warrior":
      return createProgress(calculatePostingStreakDays(videos), 7, "days");

    // Reach badges
    case "first-1k-views":
      return createProgress(getMaxVideoViews(videos), 1000, "views");
    case "momentum":
      return createProgress(isInTopPercentViewsPerDay(videos, 10) ? 1 : 0, 1, "");
    case "breakout":
      return createProgress(hasBreakoutVideo(videos) ? 1 : 0, 1, "");
    case "evergreen-seed":
      return createProgress(hasEvergreenVideo(videos) ? 1 : 0, 1, "");
    case "upward-trend":
      return createProgress(hasUpwardTrend(videos) ? 1 : 0, 1, "");
    case "10k-channel-views":
      return createProgress(totalViews, 10000, "views");
    case "100k-channel-views":
      return createProgress(totalViews, 100000, "views");
    case "1m-channel-views":
      return createProgress(totalViews, 1000000, "views");

    // Growth badges
    case "first-10-subs":
      return createProgress(subscriberCount, 10, "subs");
    case "first-50-subs":
      return createProgress(subscriberCount, 50, "subs");
    case "first-100-subs":
      return createProgress(subscriberCount, 100, "subs");
    case "first-500-subs":
      return createProgress(subscriberCount, 500, "subs");
    case "first-1k-subs":
      return createProgress(subscriberCount, 1000, "subs");
    case "converter": {
      const maxSubsPerView = Math.max(0, ...videos
        .filter((v) => v.views && v.views >= 100)
        .map((v) => ((v.subscribersGained ?? 0) / v.views!) * 1000));
      return createProgress(maxSubsPerView, 10, "subs/1K views");
    }
    case "steady-growth":
      return createProgress(hasNetPositiveSubsWeeks(videos, 4) ? 4 : 0, 4, "weeks");
    case "growth-spurt": {
      const weekSubs = sumSubsGainedInWindow(videos, "weekly");
      return createProgress(weekSubs, 50, "subs");
    }

    // Quality badges
    case "click-magnet": {
      const ctrVideos = videos.filter((v) => v.impressions && v.impressions >= 1000 && v.ctr);
      const maxCtr = Math.max(0, ...ctrVideos.map((v) => v.ctr ?? 0));
      return createProgress(maxCtr, 5, "%", true);
    }
    case "ctr-master":
      return createProgress(avgCtrLastN(videos, 10), 6, "%", true);
    case "storyteller": {
      const longVideos = videos.filter((v) => v.durationSec && v.durationSec >= 300 && v.averageViewPercentage);
      const maxRetention = Math.max(0, ...longVideos.map((v) => v.averageViewPercentage ?? 0));
      return createProgress(maxRetention, 50, "%", true);
    }
    case "retention-pro":
      return createProgress(avgRetentionLastN(videos, 10), 45, "%", true);
    case "leveling-up": {
      // Check for 3 consecutive improvements
      const last5 = getLastNUploads(videos, 5).filter((v) => v.ctr != null || v.averageViewPercentage != null);
      let improvements = 0;
      for (let i = 0; i < last5.length - 1; i++) {
        const current = last5[i].ctr ?? last5[i].averageViewPercentage ?? 0;
        const prev = last5[i + 1].ctr ?? last5[i + 1].averageViewPercentage ?? 0;
        if (current > prev) improvements++;
        else improvements = 0;
      }
      return createProgress(improvements, 3, "in a row");
    }

    // Engagement badges
    case "loved":
      return createProgress(getMaxLikeRate(videos), 5, "%", true);
    case "fan-favorite":
      return createProgress(avgLikeRateLastN(videos, 10), 6, "%", true);
    case "conversation-starter":
      return createProgress(getMaxVideoComments(videos), 50, "comments");
    case "community-builder":
      return createProgress(getMaxVideoComments(videos), 200, "comments");
    case "engagement-king": {
      const engagedVideos = videos.filter((v) => {
        if (!v.views || v.views < 500 || !v.likes || !v.comments) return false;
        const likeRate = (v.likes / v.views) * 100;
        return likeRate >= 5 && v.comments >= 50;
      });
      return createProgress(engagedVideos.length > 0 ? 1 : 0, 1, "");
    }

    // Milestone badges
    case "videos-10":
      return createProgress(totalVideos, 10, "videos");
    case "videos-25":
      return createProgress(totalVideos, 25, "videos");
    case "videos-50":
      return createProgress(totalVideos, 50, "videos");
    case "videos-100":
      return createProgress(totalVideos, 100, "videos");
    case "videos-250":
      return createProgress(totalVideos, 250, "videos");

    default:
      return createProgress(0, 1, "");
  }
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

    // If already unlocked, keep that status
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

function computeGoalProgress(
  goal: DefaultGoal,
  videos: VideoForBadges[],
  channelStats: ChannelStatsForBadges | undefined,
  metricAvailability: MetricAvailabilityCheck
): GoalWithProgress {
  // Check if goal is locked
  const missingMetric = goal.requiredMetrics.find(
    (m) => !metricAvailability.metrics[m]?.available
  );

  if (missingMetric) {
    const reason = metricAvailability.metrics[missingMetric]?.reason;
    let lockedReason = "Requires more data";
    if (reason === "analytics_not_connected") {
      lockedReason = "Requires YouTube Analytics";
    } else if (reason === "insufficient_videos") {
      lockedReason = "Need more videos";
    }

    return {
      ...goal,
      progress: 0,
      percentage: 0,
      status: "locked",
      lockedReason,
    };
  }

  // Calculate progress based on metric key
  let progress = 0;
  const subscriberCount = channelStats?.subscriberCount ?? 0;
  const totalViews = channelStats?.totalViews ?? sumViewsInWindow(videos, "lifetime");

  switch (goal.metricKey) {
    case "upload_count":
      progress = countVideosInWindow(videos, goal.window);
      break;
    case "shorts_count":
      progress = countShortsInWindow(videos, goal.window);
      break;
    case "posting_streak_days":
      progress = calculatePostingStreakDays(videos);
      break;
    case "posting_streak_weeks":
      progress = calculatePostingStreakWeeks(videos);
      break;
    case "subscriber_count":
      progress = subscriberCount;
      break;
    case "subscribers_gained":
      progress = sumSubsGainedInWindow(videos, goal.window);
      break;
    case "views":
      if (goal.window === "lifetime") {
        progress = totalViews;
      } else {
        progress = sumViewsInWindow(videos, goal.window);
      }
      break;
    case "comments":
      progress = getMaxVideoComments(videos);
      break;
    case "ctr":
      progress = avgCtrLastN(videos, goal.uploadCount ?? 10);
      break;
    case "average_view_percentage":
      progress = avgRetentionLastN(videos, goal.uploadCount ?? 10);
      break;
    case "like_rate":
      progress = getMaxLikeRate(videos);
      break;
    default:
      progress = 0;
  }

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

/** Get badge closest to unlock */
export function getNextBadge(badges: BadgeWithProgress[]): BadgeWithProgress | null {
  const inProgress = badges
    .filter((b) => !b.unlocked && !b.progress.lockedReason && b.progress.percent > 0)
    .sort((a, b) => b.progress.percent - a.progress.percent);
  
  return inProgress[0] ?? null;
}

/** Sort badges by closest to unlock */
export function sortBadgesByClosest(badges: BadgeWithProgress[]): BadgeWithProgress[] {
  return [...badges].sort((a, b) => {
    // Unlocked first
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    // Then by progress (highest first)
    if (!a.unlocked && !b.unlocked) {
      // Locked (no progress) goes last
      if (a.progress.lockedReason && !b.progress.lockedReason) return 1;
      if (!a.progress.lockedReason && b.progress.lockedReason) return -1;
      return b.progress.percent - a.progress.percent;
    }
    return 0;
  });
}

/** Sort badges by recent unlock */
export function sortBadgesByRecent(badges: BadgeWithProgress[]): BadgeWithProgress[] {
  return [...badges].sort((a, b) => {
    if (a.unlocked && b.unlocked) {
      return new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime();
    }
    if (a.unlocked) return -1;
    if (b.unlocked) return 1;
    return 0;
  });
}

/** Sort badges by rarity */
export function sortBadgesByRarity(badges: BadgeWithProgress[]): BadgeWithProgress[] {
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
  return [...badges].sort((a, b) => {
    const aOrder = rarityOrder[a.rarity];
    const bOrder = rarityOrder[b.rarity];
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

/** Get summary stats */
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
