/**
 * Pure baseline computation functions for channel audits.
 *
 * Extracted from app/api/me/channels/[channelId]/audit/route.ts.
 * These are domain-level calculations with no I/O dependencies.
 */

import type {
  AuditBaseline,
  AuditTrafficSources,
  AuditTrends,
  ChannelMetricsSnapshot,
  RawTrafficSources,
  VideoMetricsRecord,
} from "../types";

/**
 * Compute a simplified channel baseline from video-level metrics.
 * Filters to videos with >100 views for statistical relevance.
 */
export function computeChannelBaseline(
  videoMetrics: VideoMetricsRecord[],
): AuditBaseline {
  if (!videoMetrics.length) return null;

  const withViews = videoMetrics.filter(
    (v) => v.viewCount && v.viewCount > 100,
  );
  if (!withViews.length) return null;

  const avgViewPercentage =
    withViews
      .filter((v) => v.avgViewPercentage != null)
      .reduce(
        (sum, v, _, arr) => sum + (v.avgViewPercentage ?? 0) / arr.length,
        0,
      ) || null;

  const avgSubsPerVideo =
    withViews
      .filter((v) => v.subscribersGained != null)
      .reduce(
        (sum, v, _, arr) => sum + (v.subscribersGained ?? 0) / arr.length,
        0,
      ) || null;

  const avgViewsPerVideo =
    withViews.reduce(
      (sum, v, _, arr) => sum + (v.viewCount ?? 0) / arr.length,
      0,
    ) || null;

  return { avgViewPercentage, avgSubsPerVideo, avgViewsPerVideo };
}

/**
 * Convert raw traffic source view counts into percentages.
 * Returns null if no source data or zero total views.
 */
export function computeTrafficSourcePercentages(
  sources: RawTrafficSources,
): AuditTrafficSources {
  if (!sources || !sources.total) return null;

  const total = sources.total;

  const toPercent = (val: number | null) =>
    val != null
      ? { views: val, percentage: Math.round((val / total) * 100) }
      : null;

  return {
    browse: toPercent(sources.browse),
    suggested: toPercent(sources.suggested),
    search: toPercent(sources.search),
    external: toPercent(sources.external),
    other: toPercent((sources.notifications ?? 0) + (sources.other ?? 0)),
  };
}

/**
 * Derive trend direction from percentage-change values.
 * ±5% threshold separates "up"/"down" from "flat".
 */
export function computeTrends(
  metrics: ChannelMetricsSnapshot | null,
): AuditTrends {
  const getDirection = (val: number | null): "up" | "down" | "flat" => {
    if (val == null) return "flat";
    if (val > 5) return "up";
    if (val < -5) return "down";
    return "flat";
  };

  return {
    views: {
      value: metrics?.viewsTrend ?? null,
      direction: getDirection(metrics?.viewsTrend ?? null),
    },
    watchTime: {
      value: metrics?.watchTimeTrend ?? null,
      direction: getDirection(metrics?.watchTimeTrend ?? null),
    },
    subscribers: {
      value: metrics?.subsTrend ?? null,
      direction: getDirection(metrics?.subsTrend ?? null),
    },
  };
}
