/**
 * Channel-level bottleneck detection.
 *
 * Extracted from app/api/me/channels/[channelId]/audit/route.ts.
 * Uses aggregate channel metrics to identify the primary growth
 * bottleneck (CTR, retention, distribution, or conversion).
 */

import type {
  AuditBaseline,
  AuditBottleneck,
  ChannelMetricsSnapshot,
} from "../types";

/**
 * Identify the single biggest bottleneck limiting channel growth.
 *
 * Priority order:
 * 1. Insufficient data (< 100 views)
 * 2. Distribution (zero browse + suggested traffic)
 * 3. Retention (avg view % < 30)
 * 4. CTR (browse+suggested < 30% of total)
 * 5. Conversion (low subs despite views)
 */
export function detectChannelBottleneck(
  metrics: ChannelMetricsSnapshot | null,
  _baseline: AuditBaseline,
): AuditBottleneck {
  if (!metrics || metrics.totalViews < 100) {
    return {
      type: "INSUFFICIENT_DATA",
      title: "Not enough data yet",
      description:
        "Your channel needs more views before we can provide reliable analysis. Keep uploading and check back soon.",
      priority: "low",
    };
  }

  if (
    metrics.trafficSources?.browse === 0 &&
    metrics.trafficSources?.suggested === 0
  ) {
    return {
      type: "DISTRIBUTION",
      title: "YouTube isn't recommending your videos",
      description:
        "Most of your views come from search or external sources. Improve early retention and engagement to unlock algorithmic distribution.",
      priority: "high",
    };
  }

  if (metrics.avgViewPercentage != null && metrics.avgViewPercentage < 30) {
    return {
      type: "RETENTION",
      title: "Viewers are leaving too early",
      description:
        "People click but don't stay. Focus on stronger hooks in the first 30 seconds and better pacing throughout.",
      priority: "high",
    };
  }

  if (metrics.trafficSources?.total) {
    const total = metrics.trafficSources.total;
    const browseAndSuggested =
      (metrics.trafficSources.browse ?? 0) +
      (metrics.trafficSources.suggested ?? 0);
    const ratio = browseAndSuggested / total;

    if (ratio < 0.3) {
      return {
        type: "CTR",
        title: "Packaging needs improvement",
        description:
          "Your videos aren't getting clicked when shown. Focus on making thumbnails and titles more compelling and clear.",
        priority: "high",
      };
    }
  }

  if (
    metrics.netSubscribers != null &&
    metrics.netSubscribers < 10 &&
    metrics.totalViews > 1000
  ) {
    return {
      type: "CONVERSION",
      title: "Viewers aren't subscribing",
      description:
        "You're getting views but not converting them to subscribers. Add clearer calls-to-action and ensure content matches channel promise.",
      priority: "medium",
    };
  }

  return {
    type: "NONE",
    title: "No major bottleneck detected",
    description:
      "Your channel metrics are in a healthy range. Focus on consistency and experimenting with new content formats.",
    priority: "low",
  };
}
