/**
 * Channel Audit API - Comprehensive channel analysis
 *
 * Returns:
 * - Primary bottleneck detection
 * - Traffic source analysis
 * - Pattern detection across videos
 * - Actionable recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { getCurrentUserWithSubscription } from "@/lib/user";
import { getGoogleAccount } from "@/lib/youtube-api";
import {
  fetchChannelAuditMetrics,
  type ChannelAuditMetrics,
} from "@/lib/youtube-analytics";
import { channelParamsSchema } from "@/lib/competitors/video-detail/validation";

export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
});

// Channel audit result type
type ChannelAuditResult = {
  // Primary bottleneck
  bottleneck: {
    type:
      | "CTR"
      | "RETENTION"
      | "DISTRIBUTION"
      | "CONVERSION"
      | "NONE"
      | "INSUFFICIENT_DATA";
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  };

  // Top 3 actions
  actions: Array<{
    title: string;
    description: string;
    category: "packaging" | "content" | "strategy" | "engagement";
    effort: "low" | "medium" | "high";
  }>;

  // Traffic source breakdown
  trafficSources: {
    browse: { views: number; percentage: number } | null;
    suggested: { views: number; percentage: number } | null;
    search: { views: number; percentage: number } | null;
    external: { views: number; percentage: number } | null;
    other: { views: number; percentage: number } | null;
  } | null;

  // Trends
  trends: {
    views: { value: number | null; direction: "up" | "down" | "flat" };
    watchTime: { value: number | null; direction: "up" | "down" | "flat" };
    subscribers: { value: number | null; direction: "up" | "down" | "flat" };
  };

  // Pattern detection
  patterns: {
    topPerformers: Array<{
      videoId: string;
      title: string;
      metric: string;
      value: string;
    }>;
    underperformers: Array<{
      videoId: string;
      title: string;
      metric: string;
      value: string;
    }>;
    formatInsights: Array<{
      pattern: string;
      impact: "positive" | "negative";
      evidence: string;
    }>;
  };

  // Raw metrics
  metrics: ChannelAuditMetrics | null;

  // Baseline comparison
  baseline: {
    avgViewPercentage: number | null;
    avgSubsPerVideo: number | null;
    avgViewsPerVideo: number | null;
  } | null;

  // Metadata
  range: "7d" | "28d" | "90d";
  videoCount: number;
  cached: boolean;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const resolvedParams = await params;
    const parsedParams = channelParamsSchema.safeParse(resolvedParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 },
      );
    }

    const { channelId } = parsedParams.data;

    // Parse query
    const url = new URL(req.url);
    const queryResult = QuerySchema.safeParse({
      range: url.searchParams.get("range") ?? "28d",
    });
    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 },
      );
    }
    const { range } = queryResult.data;

    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify channel ownership
    const channel = await prisma.channel.findFirst({
      where: { youtubeChannelId: channelId, userId: user.id },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Get Google account for API calls
    const ga = await getGoogleAccount(user.id, channelId);
    if (!ga) {
      return NextResponse.json(
        { error: "Google account not connected" },
        { status: 400 },
      );
    }

    // Fetch channel audit metrics from YouTube Analytics
    const metrics = await fetchChannelAuditMetrics(ga, channelId, range);

    // Get video data for pattern detection
    const daysAgo = range === "7d" ? 7 : range === "28d" ? 28 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const videos = await prisma.video.findMany({
      where: {
        channelId: channel.id,
        publishedAt: { gte: startDate },
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });

    // Get video metrics for baseline
    const videoMetrics = await prisma.videoMetrics.findMany({
      where: { channelId: channel.id },
      orderBy: { fetchedAt: "desc" },
      take: 50,
    });

    // Compute baseline from video metrics
    const baseline = computeChannelBaseline(videoMetrics);

    // Detect bottleneck
    const bottleneck = detectChannelBottleneck(metrics, baseline);

    // Generate actions
    const actions = generateActions(bottleneck);

    // Compute traffic source percentages
    const trafficSources = computeTrafficSourcePercentages(
      metrics?.trafficSources ?? null,
    );

    // Compute trends
    const trends = computeTrends(metrics);

    // Pattern detection
    const patterns = detectPatterns(videos, videoMetrics);

    const result: ChannelAuditResult = {
      bottleneck,
      actions,
      trafficSources,
      trends,
      patterns,
      metrics,
      baseline,
      range,
      videoCount: videos.length,
      cached: false,
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[ChannelAudit] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch audit" },
      { status: 500 },
    );
  }
}

// Helper functions

function computeChannelBaseline(videoMetrics: any[]): {
  avgViewPercentage: number | null;
  avgSubsPerVideo: number | null;
  avgViewsPerVideo: number | null;
} | null {
  if (!videoMetrics.length) return null;

  const withViews = videoMetrics.filter(
    (v) => v.viewCount && v.viewCount > 100,
  );
  if (!withViews.length) return null;

  const avgViewPercentage =
    withViews
      .filter((v) => v.avgViewPercentage != null)
      .reduce((sum, v, _, arr) => sum + v.avgViewPercentage / arr.length, 0) ||
    null;

  const avgSubsPerVideo =
    withViews
      .filter((v) => v.subscribersGained != null)
      .reduce((sum, v, _, arr) => sum + v.subscribersGained / arr.length, 0) ||
    null;

  const avgViewsPerVideo =
    withViews.reduce((sum, v, _, arr) => sum + v.viewCount / arr.length, 0) ||
    null;

  return { avgViewPercentage, avgSubsPerVideo, avgViewsPerVideo };
}

function detectChannelBottleneck(
  metrics: ChannelAuditMetrics | null,
  _baseline: {
    avgViewPercentage: number | null;
    avgSubsPerVideo: number | null;
    avgViewsPerVideo: number | null;
  } | null,
): {
  type:
    | "CTR"
    | "RETENTION"
    | "DISTRIBUTION"
    | "CONVERSION"
    | "NONE"
    | "INSUFFICIENT_DATA";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
} {
  if (!metrics || metrics.totalViews < 100) {
    return {
      type: "INSUFFICIENT_DATA",
      title: "Not enough data yet",
      description:
        "Your channel needs more views before we can provide reliable analysis. Keep uploading and check back soon.",
      priority: "low",
    };
  }

  // Check if browse and suggested traffic are both zero (distribution issue)
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

  // Check retention (based on avgViewPercentage)
  if (metrics.avgViewPercentage != null && metrics.avgViewPercentage < 30) {
    return {
      type: "RETENTION",
      title: "Viewers are leaving too early",
      description:
        "People click but don't stay. Focus on stronger hooks in the first 30 seconds and better pacing throughout.",
      priority: "high",
    };
  }

  // Check CTR proxy (low browse + suggested views relative to total)
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

  // Check conversion (subscriber growth)
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

function generateActions(bottleneck: { type: string }): Array<{
  title: string;
  description: string;
  category: "packaging" | "content" | "strategy" | "engagement";
  effort: "low" | "medium" | "high";
}> {
  const actions: Array<{
    title: string;
    description: string;
    category: "packaging" | "content" | "strategy" | "engagement";
    effort: "low" | "medium" | "high";
  }> = [];

  switch (bottleneck.type) {
    case "CTR":
      actions.push(
        {
          title: "Simplify your thumbnails",
          description:
            "Use 2-3 words max, high contrast, and one clear focal point. Test different styles.",
          category: "packaging",
          effort: "low",
        },
        {
          title: "Rewrite titles for clarity + curiosity",
          description:
            "Make sure title and thumbnail express the same promise from two angles.",
          category: "packaging",
          effort: "low",
        },
        {
          title: "A/B test your next 3 thumbnails",
          description:
            "Prepare 2 thumbnail options for each video and swap if CTR is below 4% after 24 hours.",
          category: "packaging",
          effort: "medium",
        },
      );
      break;

    case "RETENTION":
      actions.push(
        {
          title: "Strengthen your first 15 seconds",
          description:
            "Start with a hook that creates tension or promises specific value. Skip long intros.",
          category: "content",
          effort: "medium",
        },
        {
          title: "Add pattern interrupts every 30-45 seconds",
          description:
            "Change visuals, add b-roll, zoom in/out, or add text overlays to maintain attention.",
          category: "content",
          effort: "medium",
        },
        {
          title: "Use the YouTube trim tool on underperformers",
          description:
            "For videos with weak intros, trim the first 10-15 seconds to start where value begins.",
          category: "content",
          effort: "low",
        },
      );
      break;

    case "DISTRIBUTION":
      actions.push(
        {
          title: "Create topic clusters",
          description:
            "Make 3-5 videos on related topics to help YouTube understand what your channel is about.",
          category: "strategy",
          effort: "high",
        },
        {
          title: "Optimize for suggested traffic",
          description:
            "Reference popular videos in your niche and create content that naturally follows them.",
          category: "strategy",
          effort: "medium",
        },
        {
          title: "Improve early engagement signals",
          description:
            "Ask a question in the first minute to drive comments. Pin a comment to spark discussion.",
          category: "engagement",
          effort: "low",
        },
      );
      break;

    case "CONVERSION":
      actions.push(
        {
          title: "Add a clear subscribe CTA",
          description:
            "Verbally ask viewers to subscribe at a natural point (after delivering value, not at the start).",
          category: "engagement",
          effort: "low",
        },
        {
          title: "Optimize your end screens",
          description:
            "Link to your best-performing video and verbally pitch why they should watch it.",
          category: "engagement",
          effort: "low",
        },
        {
          title: "Clarify your channel promise",
          description:
            "Make sure viewers know what they'll get if they subscribe. Update your channel banner and about section.",
          category: "strategy",
          effort: "medium",
        },
      );
      break;

    default:
      actions.push(
        {
          title: "Experiment with a new format",
          description:
            "Try a different video length, style, or topic to discover what resonates most.",
          category: "strategy",
          effort: "medium",
        },
        {
          title: "Double down on top performers",
          description:
            "Look at your best videos and create follow-up content on similar topics.",
          category: "strategy",
          effort: "medium",
        },
        {
          title: "Engage more with comments",
          description:
            "Reply to comments in the first hour after upload to boost engagement signals.",
          category: "engagement",
          effort: "low",
        },
      );
  }

  return actions.slice(0, 3);
}

function computeTrafficSourcePercentages(
  sources: ChannelAuditMetrics["trafficSources"],
): ChannelAuditResult["trafficSources"] {
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

function computeTrends(
  metrics: ChannelAuditMetrics | null,
): ChannelAuditResult["trends"] {
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

function detectPatterns(
  videos: any[],
  videoMetrics: any[],
): ChannelAuditResult["patterns"] {
  const metricsMap = new Map(videoMetrics.map((m) => [m.youtubeVideoId, m]));

  // Sort videos by performance
  const videosWithMetrics = videos
    .map((v) => ({
      video: v,
      metrics: metricsMap.get(v.youtubeVideoId),
    }))
    .filter((v) => v.metrics?.viewCount && v.metrics.viewCount > 50);

  // Top performers by views
  const topPerformers = [...videosWithMetrics]
    .sort((a, b) => (b.metrics?.viewCount ?? 0) - (a.metrics?.viewCount ?? 0))
    .slice(0, 3)
    .map((v) => ({
      videoId: v.video.youtubeVideoId,
      title: v.video.title,
      metric: "Views",
      value: `${(v.metrics?.viewCount ?? 0).toLocaleString()} views`,
    }));

  // Underperformers
  const avgViews =
    videosWithMetrics.reduce((sum, v) => sum + (v.metrics?.viewCount ?? 0), 0) /
      videosWithMetrics.length || 1;
  const underperformers = [...videosWithMetrics]
    .filter((v) => (v.metrics?.viewCount ?? 0) < avgViews * 0.5)
    .sort((a, b) => (a.metrics?.viewCount ?? 0) - (b.metrics?.viewCount ?? 0))
    .slice(0, 3)
    .map((v) => ({
      videoId: v.video.youtubeVideoId,
      title: v.video.title,
      metric: "Views",
      value: `${(v.metrics?.viewCount ?? 0).toLocaleString()} views (${Math.round(((v.metrics?.viewCount ?? 0) / avgViews) * 100)}% of average)`,
    }));

  // Format insights
  const formatInsights: Array<{
    pattern: string;
    impact: "positive" | "negative";
    evidence: string;
  }> = [];

  // Analyze video length patterns
  const shortVideos = videosWithMetrics.filter(
    (v) => (v.video.durationSec ?? 0) < 300,
  );
  const longVideos = videosWithMetrics.filter(
    (v) => (v.video.durationSec ?? 0) >= 600,
  );

  if (shortVideos.length >= 3 && longVideos.length >= 3) {
    const shortAvg =
      shortVideos.reduce((sum, v) => sum + (v.metrics?.viewCount ?? 0), 0) /
      shortVideos.length;
    const longAvg =
      longVideos.reduce((sum, v) => sum + (v.metrics?.viewCount ?? 0), 0) /
      longVideos.length;

    if (shortAvg > longAvg * 1.3) {
      formatInsights.push({
        pattern: "Shorter videos perform better",
        impact: "positive",
        evidence: `Videos under 5 minutes average ${Math.round(shortAvg).toLocaleString()} views vs ${Math.round(longAvg).toLocaleString()} for longer videos.`,
      });
    } else if (longAvg > shortAvg * 1.3) {
      formatInsights.push({
        pattern: "Longer videos perform better",
        impact: "positive",
        evidence: `Videos over 10 minutes average ${Math.round(longAvg).toLocaleString()} views vs ${Math.round(shortAvg).toLocaleString()} for shorter videos.`,
      });
    }
  }

  return {
    topPerformers,
    underperformers,
    formatInsights,
  };
}
