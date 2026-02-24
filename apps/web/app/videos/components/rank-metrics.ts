import type { InsightVideoInput, TrendMetric } from "@/lib/features/channel-audit";
import type { VideoWithMetrics } from "@/lib/video-tools";

import type { PillMetric } from "./pill-metric-types";

const MAX_PER_SECTION = 3;

type RankedResult = {
  goingWell: PillMetric[];
  needsWork: PillMetric[];
};

function splitAndRank(pills: PillMetric[]): RankedResult {
  if (pills.length === 0) {
    return { goingWell: [], needsWork: [] };
  }

  pills.sort((a, b) => b.score - a.score);

  const up = pills.filter((p) => p.direction === "up");
  const down = pills.filter((p) => p.direction === "down");

  if (up.length > 0 && down.length === 0) {
    const weakest = up.pop()!;
    down.push({ ...weakest, direction: "down" });
  } else if (down.length > 0 && up.length === 0) {
    const strongest = down.shift()!;
    up.push({ ...strongest, direction: "up" });
  }

  return {
    goingWell: up.slice(0, MAX_PER_SECTION),
    needsWork: down.slice(0, MAX_PER_SECTION),
  };
}

type Benchmark = {
  key: string;
  label: string;
  midpoint: number;
  format: (value: number) => string;
  issue: (formatted: string) => string;
  fix: string;
};

const VIDEO_BENCHMARKS: Benchmark[] = [
  {
    key: "retention",
    label: "Retention",
    midpoint: 42,
    format: (v) => `${v.toFixed(0)}%`,
    issue: (v) => `Only ${v} of viewers watch through`,
    fix: "Tighten your intro and front-load value in the first 30 seconds. Cut anything that doesn't earn the next second.",
  },
  {
    key: "engagement",
    label: "Engagement",
    midpoint: 0.04,
    format: (v) => `${(v * 100).toFixed(1)}%`,
    issue: (v) => `${v} engagement rate is below average`,
    fix: "Add a clear call-to-action mid-video and ask viewers a direct question to spark comments.",
  },
  {
    key: "likeRate",
    label: "Like Rate",
    midpoint: 0.03,
    format: (v) => `${(v * 100).toFixed(1)}%`,
    issue: (v) => `Only ${v} of viewers liked this video`,
    fix: "Ask for likes at a moment of peak value — right after delivering a key insight or payoff.",
  },
  {
    key: "subConversion",
    label: "Subs",
    midpoint: 2,
    format: (v) => `${v.toFixed(1)}/1K`,
    issue: (v) => `${v} views converted to subscribers`,
    fix: "Place a subscribe CTA at a natural high point. Remind viewers what they'll get by subscribing.",
  },
  {
    key: "commentRate",
    label: "Comments",
    midpoint: 2,
    format: (v) => `${v.toFixed(1)}/1K`,
    issue: (v) => `${v} views left a comment`,
    fix: "Ask a specific question (\"What would you do?\") rather than a generic \"leave a comment below.\"",
  },
  {
    key: "ctr",
    label: "CTR",
    midpoint: 4,
    format: (v) => `${v.toFixed(1)}%`,
    issue: (v) => `${v} click-through rate is below average`,
    fix: "Test a new thumbnail with clearer emotion or curiosity gap. A/B test titles with stronger hooks.",
  },
  {
    key: "shareRate",
    label: "Shares",
    midpoint: 1,
    format: (v) => `${v.toFixed(1)}/1K`,
    issue: (v) => `Only ${v} views resulted in a share`,
    fix: "Create a moment worth sharing — a surprising fact, a quotable line, or an emotional peak.",
  },
];

const TREND_ISSUES: Record<string, { issue: (v: string) => string; fix: string }> = {
  views: {
    issue: (v) => `Views dropped ${v} vs. last period`,
    fix: "Focus on packaging — test new thumbnails and title hooks on your next upload.",
  },
  watchTime: {
    issue: (v) => `Watch time fell ${v} vs. last period`,
    fix: "Review retention curves on recent videos. Tighten pacing and cut slow sections.",
  },
  subscribers: {
    issue: (v) => `Subscriber growth dropped ${v} vs. last period`,
    fix: "Add a subscribe CTA earlier in your videos and create content that answers \"why should I follow?\"",
  },
};

function scoreBenchmark(actual: number, midpoint: number): number {
  if (midpoint === 0) {
    return 0;
  }
  return (actual - midpoint) / midpoint;
}

function extractVideoValue(video: VideoWithMetrics, key: string): number | null {
  switch (key) {
    case "retention": {
      return video.computed.retentionPercent;
    }
    case "engagement": {
      return video.computed.engagementRate;
    }
    case "likeRate": {
      return video.computed.likeRate;
    }
    case "subConversion": {
      return video.computed.subsPerThousandViews;
    }
    case "commentRate": {
      return video.computed.commentRate;
    }
    case "ctr": {
      return video.ctr ?? null;
    }
    case "shareRate": {
      if (video.shares == null || video.views === 0) {
        return null;
      }
      return (video.shares / video.views) * 1000;
    }
    default: {
      return null;
    }
  }
}

/**
 * Rank a single video's metrics against benchmarks.
 * Returns top positives and top negatives by magnitude.
 * Guarantees at least one pill per section when data exists.
 */
export function rankVideoMetrics(video: VideoWithMetrics): RankedResult {
  if (video.views === 0) {
    return { goingWell: [], needsWork: [] };
  }

  const pills: PillMetric[] = [];

  for (const bench of VIDEO_BENCHMARKS) {
    const value = extractVideoValue(video, bench.key);
    if (value == null) {
      continue;
    }

    const score = scoreBenchmark(value, bench.midpoint);
    const formatted = bench.format(value);
    const isDown = score < 0 || value === 0;

    pills.push({
      key: bench.key,
      label: bench.label,
      displayValue: formatted,
      direction: isDown ? "down" : "up",
      score: Math.abs(score),
      issue: bench.issue(formatted),
      fix: bench.fix,
    });
  }

  return splitAndRank(pills);
}

/**
 * Rank channel-wide metrics by combining period-over-period trends
 * with aggregate video performance against benchmarks.
 * Guarantees at least one pill per section when data exists.
 */
export function rankChannelMetrics(
  trends: TrendMetric[],
  videos: InsightVideoInput[],
): RankedResult {
  const pills: PillMetric[] = [];

  for (const trend of trends) {
    if (trend.direction === "flat" || Math.round(trend.percentChange) === 0) {
      continue;
    }

    const formatted = `${trend.percentChange.toFixed(0)}%`;
    const isDown = trend.direction === "down" || trend.percentChange === 0;
    const trendInfo = TREND_ISSUES[trend.metric];

    pills.push({
      key: trend.metric,
      label: trend.label,
      displayValue: formatted,
      direction: isDown ? "down" : "up",
      score: trend.percentChange,
      issue: trendInfo?.issue(formatted),
      fix: trendInfo?.fix,
    });
  }

  const withViews = videos.filter((v) => v.views > 0);
  if (withViews.length >= 2) {
    const channelAverages = computeChannelAverages(withViews);
    for (const bench of VIDEO_BENCHMARKS) {
      if (pills.some((p) => p.key === bench.key)) {
        continue;
      }
      const value = channelAverages[bench.key];
      if (value == null) {
        continue;
      }

      const score = scoreBenchmark(value, bench.midpoint);
      const formatted = bench.format(value);
      const isDown = score < 0 || value === 0;

      pills.push({
        key: bench.key,
        label: `Avg ${bench.label}`,
        displayValue: formatted,
        direction: isDown ? "down" : "up",
        score: Math.abs(score),
        issue: bench.issue(formatted),
        fix: bench.fix,
      });
    }
  }

  return splitAndRank(pills);
}

function computeChannelAverages(
  videos: InsightVideoInput[],
): Record<string, number | null> {
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let sharesAvailable = false;
  let retSum = 0;
  let retCount = 0;
  let subSum = 0;
  let subCount = 0;

  for (const v of videos) {
    totalViews += v.views;
    totalLikes += v.likes;
    totalComments += v.comments;
    if (v.shares != null) {
      totalShares += v.shares;
      sharesAvailable = true;
    }
    if (v.avgViewPercentage != null) {
      retSum += v.avgViewPercentage;
      retCount++;
    }
    if (v.subscribersGained != null && v.views > 0) {
      subSum += (v.subscribersGained / v.views) * 1000;
      subCount++;
    }
  }

  const engagement = totalViews > 0 ? (totalLikes + totalComments) / totalViews : null;
  const likeRate = totalViews > 0 ? totalLikes / totalViews : null;
  const commentRate = totalViews > 0 ? (totalComments / totalViews) * 1000 : null;
  const shareRate = sharesAvailable && totalViews > 0 ? (totalShares / totalViews) * 1000 : null;
  const retention = retCount > 0 ? retSum / retCount : null;
  const subConversion = subCount > 0 ? subSum / subCount : null;

  return { retention, engagement, likeRate, subConversion, commentRate, shareRate };
}
