/**
 * Derived metrics and baseline calculations for owned videos
 *
 * Computes normalized metrics, z-scores, and percentiles
 * by comparing a video's performance against the channel's baseline.
 *
 * Also includes bottleneck detection and confidence scoring.
 */
import type { AnalyticsTotals, DailyAnalyticsRow } from "./youtube-analytics";
import type {
  BottleneckResult,
  ConfidenceLevel,
  SectionConfidence,
  TrafficSourceBreakdown,
} from "@/types/api";

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
  avgViewDuration: number | null; // Average view duration in seconds
  avgViewPercentage: number | null; // Average percentage of video watched

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

  // NEW: Discovery metrics (from YouTube Analytics - may be null if not available)
  impressions: number | null;
  impressionsCtr: number | null;
  first24hViews: number | null;
  first48hViews: number | null;

  // Traffic sources breakdown
  trafficSources: TrafficSourceBreakdown | null;
};

/**
 * Baseline stats for a channel (computed from multiple videos)
 */
export type ChannelBaseline = {
  sampleSize: number;
  viewsPerDay: {
    mean: number;
    std: number;
    median?: number;
    p25?: number;
    p75?: number;
  };
  avgViewPercentage: {
    mean: number;
    std: number;
    median?: number;
    p25?: number;
    p75?: number;
  };
  watchTimePerViewSec: {
    mean: number;
    std: number;
    median?: number;
    p25?: number;
    p75?: number;
  };
  subsPer1k: {
    mean: number;
    std: number;
    median?: number;
    p25?: number;
    p75?: number;
  };
  engagementPerView: {
    mean: number;
    std: number;
    median?: number;
    p25?: number;
    p75?: number;
  };
  sharesPer1k: {
    mean: number;
    std: number;
    median?: number;
    p25?: number;
    p75?: number;
  };
  // Optional extended metrics
  impressionsCtr?: {
    mean: number;
    std: number;
    median?: number;
    p25?: number;
    p75?: number;
  };
  avgViewDuration?: {
    mean: number;
    std: number;
    median?: number;
    p25?: number;
    p75?: number;
  };
  first24hViews?: {
    mean: number;
    std: number;
    median?: number;
    p25?: number;
    p75?: number;
  };
  endScreenCtr?: {
    mean: number;
    std: number;
    median?: number;
    p25?: number;
    p75?: number;
  };
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
};

export type ZScoreResult = {
  value: number | null;
  zScore: number | null;
  percentile: number | null;
  vsBaseline: "above" | "at" | "below" | "unknown";
  delta: number | null; // Percentage difference from mean
};

/**
 * Extended totals that may include impression/CTR data
 */
type ExtendedAnalyticsTotals = AnalyticsTotals & {
  impressions?: number | null;
  impressionsCtr?: number | null;
  trafficSources?: TrafficSourceBreakdown | null;
};

/**
 * Compute derived metrics from analytics totals and daily series
 */
export function computeDerivedMetrics(
  totals: AnalyticsTotals | ExtendedAnalyticsTotals,
  dailySeries: DailyAnalyticsRow[],
  videoDurationSec: number,
  publishedAt?: string | null,
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
  const avgViewDuration = totals.averageViewDuration ?? null;
  const avgViewPercentage = totals.averageViewPercentage ?? null;

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

  // NEW: Discovery metrics (may not be available)
  const extTotals = totals as ExtendedAnalyticsTotals;
  const impressions = extTotals.impressions ?? null;
  const impressionsCtr = extTotals.impressionsCtr ?? null;
  const trafficSources = extTotals.trafficSources ?? null;

  // Compute first 24h/48h views from daily series if available
  const { first24hViews, first48hViews } = computeEarlyViews(
    dailySeries,
    publishedAt,
  );

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
    avgViewDuration,
    avgViewPercentage,
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
    // New discovery metrics
    impressions,
    impressionsCtr,
    first24hViews,
    first48hViews,
    trafficSources,
  };
}

/**
 * Compute first 24h and 48h views from daily series
 */
function computeEarlyViews(
  dailySeries: DailyAnalyticsRow[],
  publishedAt?: string | null,
): { first24hViews: number | null; first48hViews: number | null } {
  if (!publishedAt || dailySeries.length === 0) {
    return { first24hViews: null, first48hViews: null };
  }

  try {
    const pubDate = new Date(publishedAt);

    // Sort by date ascending
    const sorted = [...dailySeries].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    let first24hViews: number | null = null;
    let first48hViews: number | null = null;

    for (const row of sorted) {
      const rowDate = new Date(row.date);
      const dayDiff = Math.floor(
        (rowDate.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (dayDiff === 0) {
        first24hViews = row.views;
        first48hViews = row.views;
      } else if (dayDiff === 1 && first48hViews != null) {
        first48hViews += row.views;
        break; // We have both values
      }
    }

    return { first24hViews, first48hViews };
  } catch {
    return { first24hViews: null, first48hViews: null };
  }
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
  videoMetrics: DerivedMetrics[],
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
      videoMetrics.map((m) => m.avdRatio).filter((v): v is number => v != null),
    ),
    watchTimePerViewSec: computeMeanStd(
      videoMetrics
        .map((m) => m.watchTimePerViewSec)
        .filter((v): v is number => v != null),
    ),
    subsPer1k: computeMeanStd(
      videoMetrics
        .map((m) => m.subsPer1k)
        .filter((v): v is number => v != null),
    ),
    engagementPerView: computeMeanStd(
      videoMetrics
        .map((m) => m.engagementPerView)
        .filter((v): v is number => v != null),
    ),
    sharesPer1k: computeMeanStd(
      videoMetrics
        .map((m) => m.sharesPer1k)
        .filter((v): v is number => v != null),
    ),
  };
}

/**
 * Compare video metrics against channel baseline
 */
export function compareToBaseline(
  metrics: DerivedMetrics,
  avgViewPercentage: number | null,
  baseline: ChannelBaseline,
): BaselineComparison {
  const comparison: BaselineComparison = {
    viewsPerDay: computeZScore(metrics.viewsPerDay, baseline.viewsPerDay),
    avgViewPercentage: computeZScore(
      avgViewPercentage,
      baseline.avgViewPercentage,
    ),
    watchTimePerViewSec: computeZScore(
      metrics.watchTimePerViewSec,
      baseline.watchTimePerViewSec,
    ),
    subsPer1k: computeZScore(metrics.subsPer1k, baseline.subsPer1k),
    engagementPerView: computeZScore(
      metrics.engagementPerView,
      baseline.engagementPerView,
    ),
    sharesPer1k: computeZScore(metrics.sharesPer1k, baseline.sharesPer1k),
  };

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
  baseline: { mean: number; std: number },
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


// ============================================
// BOTTLENECK DETECTION
// ============================================

/**
 * Detect the primary bottleneck limiting video performance
 * Uses evidence-based rules comparing video metrics to baseline
 */
export function detectBottleneck(
  derived: DerivedMetrics,
  comparison: BaselineComparison,
  baseline: ChannelBaseline,
): BottleneckResult {
  const metrics: Array<{ label: string; value: string; comparison?: string }> =
    [];

  // Check if we have enough data
  const hasEnoughViews = derived.totalViews >= 100;
  const hasEnoughImpressions = (derived.impressions ?? 0) >= 500;

  if (!hasEnoughViews && !hasEnoughImpressions) {
    return {
      bottleneck: "NOT_ENOUGH_DATA",
      evidence: `Only ${derived.totalViews} views and ${derived.impressions ?? 0} impressions. Need ~100 views or ~500 impressions for reliable analysis.`,
      metrics: [
        { label: "Views", value: derived.totalViews.toLocaleString() },
        {
          label: "Impressions",
          value: derived.impressions?.toLocaleString() ?? "N/A",
        },
      ],
    };
  }

  // 1. DISCOVERY_IMPRESSIONS: Low impressions relative to baseline
  if (derived.impressions != null && baseline.sampleSize > 0) {
    // If impressions are significantly below what we'd expect for this channel
    const expectedDailyImpressions =
      (baseline.viewsPerDay.mean / (baseline.viewsPerDay.mean * 0.05 || 1)) *
      100;
    if (
      derived.impressions < expectedDailyImpressions * 0.5 &&
      derived.daysInRange > 3
    ) {
      metrics.push({
        label: "Impressions",
        value: derived.impressions.toLocaleString(),
        comparison: "Below expected for your channel",
      });
      return {
        bottleneck: "DISCOVERY_IMPRESSIONS",
        evidence: `Impressions (${derived.impressions.toLocaleString()}) are low. YouTube isn't showing this video to many people. Focus on discoverability: title, thumbnail, and initial engagement.`,
        metrics,
      };
    }
  }

  // 2. DISCOVERY_CTR: Impressions exist but CTR is low vs baseline
  if (
    derived.impressionsCtr != null &&
    baseline.impressionsCtr?.mean != null &&
    baseline.impressionsCtr.mean > 0
  ) {
    const ctrRatio = derived.impressionsCtr / baseline.impressionsCtr.mean;
    if (ctrRatio < 0.7) {
      // CTR is 30%+ below baseline
      metrics.push({
        label: "CTR",
        value: `${derived.impressionsCtr.toFixed(1)}%`,
        comparison: `${((1 - ctrRatio) * 100).toFixed(0)}% below your median`,
      });
      return {
        bottleneck: "DISCOVERY_CTR",
        evidence: `CTR (${derived.impressionsCtr.toFixed(1)}%) is ${((1 - ctrRatio) * 100).toFixed(0)}% below your channel median. People see the video but don't click. Improve title/thumbnail packaging.`,
        metrics,
      };
    }
  }

  // 3. RETENTION: CTR is okay but avg view duration/percentage is low
  const avdPct = derived.avgViewPercentage ?? (derived.avdRatio ?? 0) * 100;
  if (
    avdPct > 0 &&
    baseline.avgViewPercentage.mean > 0 &&
    comparison.avgViewPercentage.vsBaseline === "below"
  ) {
    const retentionDelta = comparison.avgViewPercentage.delta ?? 0;
    if (retentionDelta < -15) {
      // More than 15% below baseline
      metrics.push({
        label: "Avg % Viewed",
        value: `${avdPct.toFixed(1)}%`,
        comparison: `${Math.abs(retentionDelta).toFixed(0)}% below your median`,
      });
      return {
        bottleneck: "RETENTION",
        evidence: `Retention (${avdPct.toFixed(1)}% avg viewed) is ${Math.abs(retentionDelta).toFixed(0)}% below your channel median. Viewers click but don't stay. Check hook, pacing, and content delivery.`,
        metrics,
      };
    }
  }

  // 4. CONVERSION: Views/watch are decent but subs per 1K and end screen CTR are weak
  if (
    derived.subsPer1k != null &&
    baseline.subsPer1k.mean > 0 &&
    comparison.subsPer1k.vsBaseline === "below"
  ) {
    const subsDelta = comparison.subsPer1k.delta ?? 0;
    const endScreenWeak =
      derived.endScreenClickRate != null &&
      baseline.endScreenCtr?.mean != null &&
      derived.endScreenClickRate < baseline.endScreenCtr.mean * 0.7;

    if (subsDelta < -20 || endScreenWeak) {
      metrics.push({
        label: "Subs/1K Views",
        value: derived.subsPer1k.toFixed(2),
        comparison:
          subsDelta < 0
            ? `${Math.abs(subsDelta).toFixed(0)}% below your median`
            : undefined,
      });
      if (derived.endScreenClickRate != null) {
        metrics.push({
          label: "End Screen CTR",
          value: `${derived.endScreenClickRate.toFixed(1)}%`,
          comparison: endScreenWeak ? "Below baseline" : undefined,
        });
      }
      return {
        bottleneck: "CONVERSION",
        evidence: `Subscriber conversion (${derived.subsPer1k.toFixed(2)}/1K) is below your channel average. Viewers watch but don't subscribe. Add/improve CTAs and end screens.`,
        metrics,
      };
    }
  }

  // Default: Not enough data to determine bottleneck with confidence
  return {
    bottleneck: "NOT_ENOUGH_DATA",
    evidence:
      "Metrics are within normal range or insufficient data for clear diagnosis.",
    metrics: [
      { label: "Views", value: derived.totalViews.toLocaleString() },
      {
        label: "Avg % Viewed",
        value: avdPct > 0 ? `${avdPct.toFixed(1)}%` : "N/A",
      },
      {
        label: "Subs/1K",
        value: derived.subsPer1k?.toFixed(2) ?? "N/A",
      },
    ],
  };
}

// ============================================
// CONFIDENCE SCORING
// ============================================

/**
 * Compute confidence levels for each insight section
 * Based on sample size, availability of metrics, and data quality
 *
 * DETERMINISTIC RULES:
 * - views < 10 OR impressions unavailable -> Low confidence
 * - Only allow Medium when impressions exist and exceed minimum threshold (200-500)
 */
export function computeSectionConfidence(
  derived: DerivedMetrics,
  hasImpressions: boolean,
  hasTrafficSources: boolean,
): SectionConfidence {
  const views = derived.totalViews;
  const impressions = derived.impressions ?? 0;
  const hasRetention =
    derived.avgViewPercentage != null || derived.avdRatio != null;
  const hasConversion = derived.subsPer1k != null;
  const hasEndScreen = derived.endScreenClickRate != null;

  return {
    discovery: getDiscoveryConfidence(
      views,
      impressions,
      hasImpressions,
      hasTrafficSources,
    ),
    retention: getRetentionConfidenceLevel(views, hasRetention),
    conversion: getConversionConfidenceLevel(
      views,
      hasConversion,
      hasEndScreen,
    ),
    packaging: getPackagingConfidence(views, impressions, hasImpressions),
    promotion: views < 10 ? "Low" : ("Medium" as ConfidenceLevel),
  };
}

function getDiscoveryConfidence(
  views: number,
  impressions: number,
  hasImpressions: boolean,
  hasTrafficSources: boolean,
): ConfidenceLevel {
  // No impressions data at all -> always Low
  if (!hasImpressions) return "Low";
  // Very low views -> Low regardless of impressions
  if (views < 10) return "Low";
  // High confidence requires significant sample
  if (impressions >= 10000 && hasTrafficSources) return "High";
  // Medium requires meaningful impressions (200+)
  if (impressions >= 200) return "Medium";
  return "Low";
}

function getRetentionConfidenceLevel(
  views: number,
  hasRetention: boolean,
): ConfidenceLevel {
  // No retention data -> Low
  if (!hasRetention) return "Low";
  // Very low views -> Low (retention % is not meaningful)
  if (views < 10) return "Low";
  // High confidence requires significant sample
  if (views >= 1000) return "High";
  // Medium requires some meaningful data
  if (views >= 100) return "Medium";
  return "Low";
}

function getConversionConfidenceLevel(
  views: number,
  hasConversion: boolean,
  hasEndScreen: boolean,
): ConfidenceLevel {
  // No conversion data -> Low
  if (!hasConversion) return "Low";
  // Very low views -> Low (conversion % is not meaningful)
  if (views < 10) return "Low";
  // High confidence requires significant sample
  if (views >= 1000 && hasEndScreen) return "High";
  // Medium requires meaningful data
  if (views >= 500) return "Medium";
  return "Low";
}

function getPackagingConfidence(
  views: number,
  impressions: number,
  hasImpressions: boolean,
): ConfidenceLevel {
  // CTR-based confidence requires impressions
  // Without impressions, packaging analysis is based on content only -> Low
  if (!hasImpressions) return "Low";
  // Very low views -> Low
  if (views < 10) return "Low";
  // High confidence requires significant CTR data
  if (impressions >= 5000) return "High";
  // Medium requires some impressions (200+)
  if (impressions >= 200) return "Medium";
  return "Low";
}

/**
 * Determine if we're in low-data mode
 * Low-data mode means we can't provide high-confidence insights but can still help
 */
export function isLowDataMode(derived: DerivedMetrics): boolean {
  return derived.totalViews < 100 && (derived.impressions ?? 0) < 500;
}
