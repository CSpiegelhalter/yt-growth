/**
 * Derived metrics and baseline calculations for owned videos
 *
 * Computes normalized metrics, z-scores, percentiles, and a "Video Health Score"
 * by comparing a video's performance against the channel's baseline.
 */
import type { AnalyticsTotals, DailyAnalyticsRow } from "./youtube-analytics";

/**
 * Derived metrics for a single video
 */
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
  netSubsPer1k: number | null; // (subscribersGained - subscribersLost) per 1K views
  netSavesPer1k: number | null; // Net playlist adds per 1K (important for algorithm)
  likeRatio: number | null; // likes / (likes + dislikes) as 0-100%

  // Retention efficiency
  watchTimePerViewSec: number | null;
  avdRatio: number | null; // averageViewDuration / videoDuration
  avgWatchTimeMin: number | null; // Average watch time in minutes per view

  // Engagement
  engagementPerView: number | null;
  engagedViewRate: number | null;

  // Card & End Screen performance
  cardClickRate: number | null; // cardClicks / cardImpressions as %
  endScreenClickRate: number | null; // annotationClicks / annotationImpressions as %

  // Audience quality
  premiumViewRate: number | null; // redViews / views as % (YouTube Premium viewers)
  watchTimePerSub: number | null; // Minutes watched per subscriber gained (quality indicator)

  // Monetization (may be null)
  rpm: number | null;
  monetizedPlaybackRate: number | null;
  adImpressionsPerView: number | null;
  cpm: number | null; // Cost per 1000 ad impressions

  // Trend metrics from daily series
  velocity24h: number | null;
  velocity7d: number | null;
  acceleration24h: number | null;
};

/**
 * Baseline stats for a channel (computed from multiple videos)
 */
export type ChannelBaseline = {
  sampleSize: number;
  viewsPerDay: { mean: number; std: number };
  avgViewPercentage: { mean: number; std: number };
  watchTimePerViewSec: { mean: number; std: number };
  subsPer1k: { mean: number; std: number };
  engagementPerView: { mean: number; std: number };
  sharesPer1k: { mean: number; std: number };
};

/**
 * Video comparison to baseline
 */
export type BaselineComparison = {
  viewsPerDay: ZScoreResult;
  avgViewPercentage: ZScoreResult;
  watchTimePerViewSec: ZScoreResult;
  subsPer1k: ZScoreResult;
  engagementPerView: ZScoreResult;
  sharesPer1k: ZScoreResult;
  healthScore: number; // 0-100
  healthLabel:
    | "Excellent"
    | "Good"
    | "Average"
    | "Below Average"
    | "Needs Work";
};

export type ZScoreResult = {
  value: number | null;
  zScore: number | null;
  percentile: number | null;
  vsBaseline: "above" | "at" | "below" | "unknown";
  delta: number | null; // Percentage difference from mean
};

/**
 * Compute derived metrics from analytics totals and daily series
 */
export function computeDerivedMetrics(
  totals: AnalyticsTotals,
  dailySeries: DailyAnalyticsRow[],
  videoDurationSec: number
): DerivedMetrics {
  const views = totals.views || 1; // Avoid division by zero
  const viewsPer1k = views / 1000;
  const daysInRange = totals.daysInRange || 1;

  // Basic metrics
  const viewsPerDay = views / daysInRange;

  // Normalized per 1K views
  const subsPer1k =
    totals.subscribersGained != null
      ? totals.subscribersGained / viewsPer1k
      : null;
  const sharesPer1k = totals.shares != null ? totals.shares / viewsPer1k : null;
  const commentsPer1k =
    totals.comments != null ? totals.comments / viewsPer1k : null;
  const likesPer1k = totals.likes != null ? totals.likes / viewsPer1k : null;
  const playlistAddsPer1k =
    totals.videosAddedToPlaylists != null
      ? totals.videosAddedToPlaylists / viewsPer1k
      : null;

  // Advanced engagement metrics
  // Net subs (gained - lost) per 1K views - the TRUE conversion metric
  const netSubsPer1k =
    totals.subscribersGained != null && totals.subscribersLost != null
      ? (totals.subscribersGained - totals.subscribersLost) / viewsPer1k
      : null;

  // Net saves per 1K (added - removed) - critical for algorithm favorability
  const netSavesPer1k =
    totals.videosAddedToPlaylists != null &&
    totals.videosRemovedFromPlaylists != null
      ? (totals.videosAddedToPlaylists - totals.videosRemovedFromPlaylists) /
        viewsPer1k
      : null;

  // Like ratio: likes / (likes + dislikes) as percentage
  const likes = totals.likes ?? 0;
  const dislikes = totals.dislikes ?? 0;
  const likeRatio =
    likes + dislikes > 0 ? (likes / (likes + dislikes)) * 100 : null;

  // Retention efficiency
  const watchTimePerViewSec =
    totals.estimatedMinutesWatched != null
      ? (totals.estimatedMinutesWatched * 60) / views
      : null;
  const avdRatio =
    totals.averageViewDuration != null && videoDurationSec > 0
      ? totals.averageViewDuration / videoDurationSec
      : null;
  const avgWatchTimeMin =
    totals.estimatedMinutesWatched != null
      ? totals.estimatedMinutesWatched / views
      : null;

  // Engagement
  const engagementSum =
    (totals.likes ?? 0) + (totals.comments ?? 0) + (totals.shares ?? 0);
  const engagementPerView = engagementSum / views;
  const engagedViewRate =
    totals.engagedViews != null ? totals.engagedViews / views : null;

  // Card & End Screen performance
  // If cardClickRate is directly available, use it; otherwise compute
  let cardClickRate: number | null = null;
  if (totals.cardClickRate != null) {
    cardClickRate = totals.cardClickRate;
  } else if (
    totals.cardClicks != null &&
    totals.cardImpressions != null &&
    totals.cardImpressions > 0
  ) {
    cardClickRate = (totals.cardClicks / totals.cardImpressions) * 100;
  }

  // End screen CTR
  let endScreenClickRate: number | null = null;
  if (totals.annotationClickThroughRate != null) {
    endScreenClickRate = totals.annotationClickThroughRate;
  } else if (
    totals.annotationClicks != null &&
    totals.annotationImpressions != null &&
    totals.annotationImpressions > 0
  ) {
    endScreenClickRate =
      (totals.annotationClicks / totals.annotationImpressions) * 100;
  }

  // Audience quality metrics
  const premiumViewRate =
    totals.redViews != null ? (totals.redViews / views) * 100 : null;

  // Watch time efficiency: how much watch time does it take to gain 1 subscriber?
  const watchTimePerSub =
    totals.estimatedMinutesWatched != null &&
    totals.subscribersGained != null &&
    totals.subscribersGained > 0
      ? totals.estimatedMinutesWatched / totals.subscribersGained
      : null;

  // Monetization
  const rpm =
    totals.estimatedRevenue != null
      ? totals.estimatedRevenue / viewsPer1k
      : null;
  const monetizedPlaybackRate =
    totals.monetizedPlaybacks != null
      ? totals.monetizedPlaybacks / views
      : null;
  const adImpressionsPerView =
    totals.adImpressions != null ? totals.adImpressions / views : null;
  const cpm = totals.cpm != null ? totals.cpm : null;

  // Trend metrics from daily series
  const { velocity24h, velocity7d, acceleration24h } =
    computeTrendMetrics(dailySeries);

  return {
    viewsPerDay,
    totalViews: views,
    daysInRange,
    subsPer1k,
    sharesPer1k,
    commentsPer1k,
    likesPer1k,
    playlistAddsPer1k,
    netSubsPer1k,
    netSavesPer1k,
    likeRatio,
    watchTimePerViewSec,
    avdRatio,
    avgWatchTimeMin,
    engagementPerView,
    engagedViewRate,
    cardClickRate,
    endScreenClickRate,
    premiumViewRate,
    watchTimePerSub,
    rpm,
    monetizedPlaybackRate,
    adImpressionsPerView,
    cpm,
    velocity24h,
    velocity7d,
    acceleration24h,
  };
}

/**
 * Compute velocity and acceleration from daily series
 */
function computeTrendMetrics(dailySeries: DailyAnalyticsRow[]): {
  velocity24h: number | null;
  velocity7d: number | null;
  acceleration24h: number | null;
} {
  if (dailySeries.length < 2) {
    return { velocity24h: null, velocity7d: null, acceleration24h: null };
  }

  // Sort by date descending (most recent first)
  const sorted = [...dailySeries].sort((a, b) => b.date.localeCompare(a.date));

  // velocity24h = today - yesterday
  const todayViews = sorted[0]?.views ?? 0;
  const yesterdayViews = sorted[1]?.views ?? 0;
  const velocity24h = todayViews - yesterdayViews;

  // velocity7d = sum(last7days) - sum(prev7days)
  let velocity7d: number | null = null;
  if (sorted.length >= 14) {
    const last7 = sorted.slice(0, 7).reduce((sum, d) => sum + d.views, 0);
    const prev7 = sorted.slice(7, 14).reduce((sum, d) => sum + d.views, 0);
    velocity7d = last7 - prev7;
  }

  // acceleration24h = velocity24h - previousVelocity24h (needs 3 days)
  let acceleration24h: number | null = null;
  if (sorted.length >= 3) {
    const dayBeforeYesterdayViews = sorted[2]?.views ?? 0;
    const previousVelocity24h = yesterdayViews - dayBeforeYesterdayViews;
    acceleration24h = velocity24h - previousVelocity24h;
  }

  return { velocity24h, velocity7d, acceleration24h };
}

/**
 * Compute channel baseline from multiple videos' derived metrics
 */
export function computeChannelBaseline(
  videoMetrics: DerivedMetrics[]
): ChannelBaseline {
  const sampleSize = videoMetrics.length;
  if (sampleSize === 0) {
    return {
      sampleSize: 0,
      viewsPerDay: { mean: 0, std: 0 },
      avgViewPercentage: { mean: 0, std: 0 },
      watchTimePerViewSec: { mean: 0, std: 0 },
      subsPer1k: { mean: 0, std: 0 },
      engagementPerView: { mean: 0, std: 0 },
      sharesPer1k: { mean: 0, std: 0 },
    };
  }

  return {
    sampleSize,
    viewsPerDay: computeMeanStd(videoMetrics.map((m) => m.viewsPerDay)),
    avgViewPercentage: computeMeanStd(
      videoMetrics.map((m) => m.avdRatio).filter((v): v is number => v != null)
    ),
    watchTimePerViewSec: computeMeanStd(
      videoMetrics
        .map((m) => m.watchTimePerViewSec)
        .filter((v): v is number => v != null)
    ),
    subsPer1k: computeMeanStd(
      videoMetrics.map((m) => m.subsPer1k).filter((v): v is number => v != null)
    ),
    engagementPerView: computeMeanStd(
      videoMetrics
        .map((m) => m.engagementPerView)
        .filter((v): v is number => v != null)
    ),
    sharesPer1k: computeMeanStd(
      videoMetrics
        .map((m) => m.sharesPer1k)
        .filter((v): v is number => v != null)
    ),
  };
}

/**
 * Compare video metrics against channel baseline
 */
export function compareToBaseline(
  metrics: DerivedMetrics,
  avgViewPercentage: number | null,
  baseline: ChannelBaseline
): BaselineComparison {
  const comparison: BaselineComparison = {
    viewsPerDay: computeZScore(metrics.viewsPerDay, baseline.viewsPerDay),
    avgViewPercentage: computeZScore(
      avgViewPercentage,
      baseline.avgViewPercentage
    ),
    watchTimePerViewSec: computeZScore(
      metrics.watchTimePerViewSec,
      baseline.watchTimePerViewSec
    ),
    subsPer1k: computeZScore(metrics.subsPer1k, baseline.subsPer1k),
    engagementPerView: computeZScore(
      metrics.engagementPerView,
      baseline.engagementPerView
    ),
    sharesPer1k: computeZScore(metrics.sharesPer1k, baseline.sharesPer1k),
    healthScore: 0,
    healthLabel: "Average",
  };

  // Compute Health Score: 50 + 15 * weighted sum of z-scores
  // Weights: viewsPerDay=0.30, avgViewPercentage=0.25, subsPer1k=0.20, engagementPerView=0.15, sharesPer1k=0.10
  const weightedZ =
    0.3 * (comparison.viewsPerDay.zScore ?? 0) +
    0.25 * (comparison.avgViewPercentage.zScore ?? 0) +
    0.2 * (comparison.subsPer1k.zScore ?? 0) +
    0.15 * (comparison.engagementPerView.zScore ?? 0) +
    0.1 * (comparison.sharesPer1k.zScore ?? 0);

  comparison.healthScore = Math.min(100, Math.max(0, 50 + 15 * weightedZ));

  // Assign health label
  if (comparison.healthScore >= 75) {
    comparison.healthLabel = "Excellent";
  } else if (comparison.healthScore >= 60) {
    comparison.healthLabel = "Good";
  } else if (comparison.healthScore >= 40) {
    comparison.healthLabel = "Average";
  } else if (comparison.healthScore >= 25) {
    comparison.healthLabel = "Below Average";
  } else {
    comparison.healthLabel = "Needs Work";
  }

  return comparison;
}

/**
 * Compute mean and standard deviation
 */
function computeMeanStd(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 0 };

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

  if (values.length === 1) return { mean, std: 0 };

  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1);
  const std = Math.sqrt(variance);

  return { mean, std };
}

/**
 * Compute z-score and percentile for a value against baseline
 */
function computeZScore(
  value: number | null,
  baseline: { mean: number; std: number }
): ZScoreResult {
  if (value == null || (baseline.mean === 0 && baseline.std === 0)) {
    return {
      value,
      zScore: null,
      percentile: null,
      vsBaseline: "unknown",
      delta: null,
    };
  }

  // Handle zero std (all values same)
  if (baseline.std === 0) {
    return {
      value,
      zScore: value === baseline.mean ? 0 : value > baseline.mean ? 1 : -1,
      percentile:
        value === baseline.mean ? 50 : value > baseline.mean ? 84 : 16,
      vsBaseline:
        value > baseline.mean
          ? "above"
          : value < baseline.mean
          ? "below"
          : "at",
      delta:
        baseline.mean !== 0
          ? ((value - baseline.mean) / baseline.mean) * 100
          : null,
    };
  }

  const zScore = (value - baseline.mean) / baseline.std;
  const percentile = normalCDF(zScore) * 100;
  const delta =
    baseline.mean !== 0
      ? ((value - baseline.mean) / baseline.mean) * 100
      : null;

  let vsBaseline: "above" | "at" | "below";
  if (zScore > 0.5) {
    vsBaseline = "above";
  } else if (zScore < -0.5) {
    vsBaseline = "below";
  } else {
    vsBaseline = "at";
  }

  return {
    value,
    zScore: Math.round(zScore * 100) / 100,
    percentile: Math.round(percentile),
    vsBaseline,
    delta: delta != null ? Math.round(delta * 10) / 10 : null,
  };
}

/**
 * Cumulative distribution function for standard normal distribution
 * Uses approximation for efficiency
 */
function normalCDF(z: number): number {
  // Constants for approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * z);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Get retention grade based on avg view percentage
 */
export function getRetentionGrade(avdRatio: number | null): {
  grade: "Great" | "Good" | "OK" | "Needs Work";
  color: "green" | "lime" | "yellow" | "red";
} {
  if (avdRatio == null) return { grade: "OK", color: "yellow" };
  if (avdRatio >= 0.5) return { grade: "Great", color: "green" };
  if (avdRatio >= 0.35) return { grade: "Good", color: "lime" };
  if (avdRatio >= 0.2) return { grade: "OK", color: "yellow" };
  return { grade: "Needs Work", color: "red" };
}

/**
 * Get conversion grade based on subs per 1k views
 */
export function getConversionGrade(subsPer1k: number | null): {
  grade: "Great" | "Good" | "OK" | "Needs Work";
  color: "green" | "lime" | "yellow" | "red";
} {
  if (subsPer1k == null) return { grade: "OK", color: "yellow" };
  if (subsPer1k >= 5) return { grade: "Great", color: "green" };
  if (subsPer1k >= 2) return { grade: "Good", color: "lime" };
  if (subsPer1k >= 0.5) return { grade: "OK", color: "yellow" };
  return { grade: "Needs Work", color: "red" };
}

/**
 * Get engagement grade based on engagement per view
 */
export function getEngagementGrade(engagementPerView: number | null): {
  grade: "Great" | "Good" | "OK" | "Needs Work";
  color: "green" | "lime" | "yellow" | "red";
} {
  if (engagementPerView == null) return { grade: "OK", color: "yellow" };
  if (engagementPerView >= 0.05) return { grade: "Great", color: "green" };
  if (engagementPerView >= 0.02) return { grade: "Good", color: "lime" };
  if (engagementPerView >= 0.01) return { grade: "OK", color: "yellow" };
  return { grade: "Needs Work", color: "red" };
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

// Re-export formatCompact from lib/format for backwards compat
export { formatCompact } from "@/lib/format";

/**
 * Format percentage
 */
export function formatPercent(
  value: number | null,
  decimals: number = 1
): string {
  if (value == null) return "-";
  return `${(value * 100).toFixed(decimals)}%`;
}
