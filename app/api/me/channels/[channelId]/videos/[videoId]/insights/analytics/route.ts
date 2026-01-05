import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUserWithSubscription } from "@/lib/user";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { isDemoMode, isYouTubeMockMode } from "@/lib/demo-fixtures";
import { getGoogleAccount, fetchRetentionCurve } from "@/lib/youtube-api";
import { GoogleTokenRefreshError } from "@/lib/google-tokens";
import {
  fetchVideoAnalyticsDailyWithStatus,
  fetchVideoAnalyticsTotalsWithStatus,
  fetchOwnedVideoMetadata,
  getDateRange,
  fetchVideoDiscoveryMetrics,
  type DailyAnalyticsRow,
} from "@/lib/youtube-analytics";
import {
  computeDerivedMetrics,
  computeChannelBaseline,
  compareToBaseline,
  getRetentionGrade,
  getConversionGrade,
  getEngagementGrade,
  detectBottleneck,
  computeSectionConfidence,
  isLowDataMode,
  type DerivedMetrics,
  type ChannelBaseline,
} from "@/lib/owned-video-math";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
  videoId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
});

class YouTubePermissionDeniedError extends Error {
  code = "youtube_permissions" as const;
  constructor(message: string) {
    super(message);
    this.name = "YouTubePermissionDeniedError";
  }
}

/**
 * GET - Fetch analytics data only (no LLM)
 * This is the fast route that returns in ~1-2 seconds
 */
async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string; videoId: string }> }
) {
  const resolvedParams = await params;

  // Demo mode - return demo analytics
  if (isDemoMode() || (isYouTubeMockMode() && !process.env.OPENAI_API_KEY)) {
    return Response.json(getDemoAnalytics({ videoId: resolvedParams.videoId }));
  }

  // Validate params
  const parsedParams = ParamsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { channelId, videoId } = parsedParams.data;

  // Parse query
  const url = new URL(req.url);
  const queryResult = QuerySchema.safeParse({
    range: url.searchParams.get("range") ?? "28d",
  });
  if (!queryResult.success) {
    return Response.json(
      { error: "Invalid query parameters" },
      { status: 400 }
    );
  }
  const { range } = queryResult.data;

  try {
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify channel ownership
    const channel = await prisma.channel.findFirst({
      where: { youtubeChannelId: channelId, userId: user.id },
    });
    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Check for cached analytics
    const cached = await prisma.ownedVideoInsightsCache.findFirst({
      where: {
        userId: user.id,
        channelId: channel.id,
        videoId,
        range,
      },
    });

    // If we have fresh cached analytics, return immediately
    if (cached?.derivedJson && cached.cachedUntil > new Date()) {
      const derivedData = cached.derivedJson as any;
      return Response.json({
        video: derivedData.video,
        analytics: derivedData.analytics,
        derived: derivedData.derived,
        baseline: derivedData.baseline,
        comparison: derivedData.comparison,
        levers: derivedData.levers,
        retention: derivedData.retention,
        bottleneck: derivedData.bottleneck,
        confidence: derivedData.confidence,
        isLowDataMode: derivedData.isLowDataMode,
        analyticsAvailability: derivedData.analyticsAvailability,
        cached: true,
        hasSummary: !!cached.llmJson,
      });
    }

    // Rate limit check
    const rateResult = checkRateLimit(
      rateLimitKey("videoInsights", user.id),
      RATE_LIMITS.videoInsights
    );
    if (!rateResult.success) {
      return Response.json(
        { error: "Rate limit exceeded", retryAfter: rateResult.resetAt },
        { status: 429 }
      );
    }

    // Fetch Google account
    const ga = await getGoogleAccount(user.id, channelId);
    if (!ga) {
      return Response.json(
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    // Fast permission probe
    const { startDate: probeStart, endDate: probeEnd } = getDateRange("7d");
    const probe = await fetchVideoAnalyticsTotalsWithStatus(
      ga,
      channelId,
      videoId,
      probeStart,
      probeEnd
    );
    if (
      !probe.permission.ok &&
      probe.permission.reason === "permission_denied"
    ) {
      throw new YouTubePermissionDeniedError(
        "Google account is missing required YouTube Analytics permissions."
      );
    }

    // Fetch all analytics data in parallel
    const result = await fetchAnalyticsData(
      ga,
      channel.id,
      channelId,
      videoId,
      range,
      user.id
    );

    // Cache the analytics data
    await prisma.ownedVideoInsightsCache.upsert({
      where: {
        userId_channelId_videoId_range: {
          userId: user.id,
          channelId: channel.id,
          videoId,
          range,
        },
      },
      create: {
        userId: user.id,
        channelId: channel.id,
        videoId,
        range,
        contentHash: "",
        derivedJson: result as unknown as Prisma.JsonObject,
        llmJson: Prisma.JsonNull,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      update: {
        derivedJson: result as unknown as Prisma.JsonObject,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return Response.json({
      ...result,
      cached: false,
      hasSummary: false,
    });
  } catch (err: unknown) {
    if (
      err instanceof YouTubePermissionDeniedError ||
      err instanceof GoogleTokenRefreshError
    ) {
      return Response.json(
        { error: err.message, code: "youtube_permissions" },
        { status: 403 }
      );
    }

    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Analytics fetch error:", err);
    return Response.json(
      { error: "Failed to fetch analytics", detail: message },
      { status: 500 }
    );
  }
}

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/insights/analytics" },
  async (req, ctx) => GETHandler(req, ctx as any)
);

/**
 * Fetch analytics data without LLM
 */
async function fetchAnalyticsData(
  ga: {
    id: number;
    refreshTokenEnc: string | null;
    tokenExpiresAt: Date | null;
  },
  dbChannelId: number,
  youtubeChannelId: string,
  videoId: string,
  range: "7d" | "28d" | "90d",
  userId: number
) {
  const { startDate, endDate } = getDateRange(range);

  // Fetch everything in parallel
  const [videoMeta, totalsResult, dailyResult, baseline, retentionPoints] =
    await Promise.all([
      fetchOwnedVideoMetadata(ga, videoId),
      fetchVideoAnalyticsTotalsWithStatus(
        ga,
        youtubeChannelId,
        videoId,
        startDate,
        endDate
      ),
      fetchVideoAnalyticsDailyWithStatus(
        ga,
        youtubeChannelId,
        videoId,
        startDate,
        endDate
      ),
      getChannelBaselineFromDB(userId, dbChannelId, videoId, range),
      fetchRetentionCurve(ga, youtubeChannelId, videoId).catch(() => []),
    ]);

  if (!videoMeta) {
    throw new Error("Could not fetch video metadata");
  }

  if (
    !totalsResult.permission.ok &&
    totalsResult.permission.reason === "permission_denied"
  ) {
    throw new YouTubePermissionDeniedError(
      "Missing YouTube Analytics permissions."
    );
  }

  const totals = totalsResult.totals;
  const dailySeries = dailyResult.rows;

  if (!totals) {
    throw new Error("Could not fetch analytics totals");
  }

  // Fetch discovery metrics
  const discoveryMetrics = await fetchVideoDiscoveryMetrics(
    ga,
    youtubeChannelId,
    videoId,
    startDate,
    endDate
  ).catch(() => ({
    impressions: null,
    impressionsCtr: null,
    trafficSources: null,
    hasData: false,
    reason: "connect_analytics" as const,
  }));

  // Compute derived metrics
  const derived = computeDerivedMetrics(
    {
      ...totals,
      impressions: discoveryMetrics.impressions,
      impressionsCtr: discoveryMetrics.impressionsCtr,
      trafficSources: discoveryMetrics.trafficSources,
    },
    dailySeries,
    videoMeta.durationSec,
    videoMeta.publishedAt
  );

  // Use Data API viewCount for total views
  derived.totalViews = videoMeta.viewCount;

  // Compare to baseline
  const comparison = compareToBaseline(
    derived,
    totals.averageViewPercentage,
    baseline
  );

  // Detect bottleneck and compute confidence
  const bottleneck = detectBottleneck(derived, comparison, baseline);
  const confidence = computeSectionConfidence(
    derived,
    discoveryMetrics.hasData,
    discoveryMetrics.trafficSources != null
  );
  const lowDataMode = isLowDataMode(derived);

  // Analytics availability flags
  const analyticsAvailability = {
    hasImpressions: discoveryMetrics.impressions != null,
    hasCtr: discoveryMetrics.impressionsCtr != null,
    hasTrafficSources: discoveryMetrics.trafficSources != null,
    hasEndScreenCtr: derived.endScreenClickRate != null,
    hasCardCtr: derived.cardClickRate != null,
    reason: discoveryMetrics.hasData ? undefined : discoveryMetrics.reason,
  };

  // Compute lever grades
  const retentionGrade = getRetentionGrade(derived.avdRatio);
  const conversionGrade = getConversionGrade(derived.subsPer1k);
  const engagementGrade = getEngagementGrade(derived.engagementPerView);

  const levers = {
    retention: {
      grade: retentionGrade.grade,
      color: retentionGrade.color,
      reason: getRetentionReason(derived, comparison),
      action: getRetentionAction(retentionGrade.grade),
    },
    conversion: {
      grade: conversionGrade.grade,
      color: conversionGrade.color,
      reason: getConversionReason(derived, comparison),
      action: getConversionAction(conversionGrade.grade),
    },
    engagement: {
      grade: engagementGrade.grade,
      color: engagementGrade.color,
      reason: getEngagementReason(derived, comparison),
      action: getEngagementAction(engagementGrade.grade),
    },
  };

  // Build retention object
  const retention =
    retentionPoints.length > 0
      ? { points: retentionPoints, cliffTimeSec: null, cliffReason: null }
      : undefined;

  // Store daily analytics in background
  storeDailyAnalytics(userId, dbChannelId, videoId, dailySeries).catch(() => {});

  return {
    video: videoMeta,
    analytics: { totals, dailySeries },
    derived,
    baseline,
    comparison,
    levers,
    retention,
    bottleneck,
    confidence,
    isLowDataMode: lowDataMode,
    analyticsAvailability,
  };
}

// Helper functions
async function getChannelBaselineFromDB(
  userId: number,
  channelId: number,
  excludeVideoId: string,
  range: "7d" | "28d" | "90d"
): Promise<ChannelBaseline> {
  const { startDate, endDate } = getDateRange(range);

  const otherVideos = await prisma.$queryRaw<
    Array<{
      videoId: string;
      totalViews: number;
      avgViewPct: number | null;
      subsGained: number | null;
      watchMin: number | null;
      shares: number | null;
      likes: number | null;
      comments: number | null;
      daysCount: number;
    }>
  >`
    SELECT 
      "videoId",
      SUM(views) as "totalViews",
      AVG("averageViewPercentage") as "avgViewPct",
      SUM("subscribersGained") as "subsGained",
      SUM("estimatedMinutesWatched") as "watchMin",
      SUM(shares) as shares,
      SUM(likes) as likes,
      SUM(comments) as comments,
      COUNT(*) as "daysCount"
    FROM "OwnedVideoAnalyticsDay"
    WHERE "userId" = ${userId}
      AND "channelId" = ${channelId}
      AND "videoId" != ${excludeVideoId}
      AND date >= ${new Date(startDate)}::date
      AND date <= ${new Date(endDate)}::date
    GROUP BY "videoId"
    HAVING SUM(views) > 0
    LIMIT 50
  `;

  if (otherVideos.length === 0) {
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

  const derivedList: DerivedMetrics[] = otherVideos.map((v) => {
    const views = Number(v.totalViews) || 1;
    const viewsPer1k = views / 1000;
    const days = Number(v.daysCount) || 1;

    return {
      viewsPerDay: views / days,
      totalViews: views,
      daysInRange: days,
      subsPer1k: v.subsGained != null ? Number(v.subsGained) / viewsPer1k : null,
      sharesPer1k: v.shares != null ? Number(v.shares) / viewsPer1k : null,
      commentsPer1k: v.comments != null ? Number(v.comments) / viewsPer1k : null,
      likesPer1k: v.likes != null ? Number(v.likes) / viewsPer1k : null,
      playlistAddsPer1k: null,
      netSubsPer1k: null,
      netSavesPer1k: null,
      likeRatio: null,
      watchTimePerViewSec:
        v.watchMin != null ? (Number(v.watchMin) * 60) / views : null,
      avdRatio: v.avgViewPct != null ? Number(v.avgViewPct) / 100 : null,
      avgWatchTimeMin: null,
      avgViewDuration: null,
      avgViewPercentage: v.avgViewPct != null ? Number(v.avgViewPct) : null,
      engagementPerView:
        (Number(v.likes ?? 0) + Number(v.comments ?? 0) + Number(v.shares ?? 0)) / views,
      engagedViewRate: null,
      cardClickRate: null,
      endScreenClickRate: null,
      premiumViewRate: null,
      watchTimePerSub: null,
      rpm: null,
      monetizedPlaybackRate: null,
      adImpressionsPerView: null,
      cpm: null,
      impressions: null,
      impressionsCtr: null,
      first24hViews: null,
      first48hViews: null,
      trafficSources: null,
      velocity24h: null,
      velocity7d: null,
      acceleration24h: null,
    };
  });

  return computeChannelBaseline(derivedList);
}

async function storeDailyAnalytics(
  userId: number,
  channelId: number,
  videoId: string,
  dailySeries: DailyAnalyticsRow[]
): Promise<void> {
  const chunkSize = 25;
  for (let i = 0; i < dailySeries.length; i += chunkSize) {
    const chunk = dailySeries.slice(i, i + chunkSize);
    await prisma.$transaction(
      chunk.map((day) =>
        prisma.ownedVideoAnalyticsDay.upsert({
          where: {
            userId_channelId_videoId_date: {
              userId,
              channelId,
              videoId,
              date: new Date(day.date),
            },
          },
          create: {
            userId,
            channelId,
            videoId,
            date: new Date(day.date),
            views: day.views,
            engagedViews: day.engagedViews,
            comments: day.comments,
            likes: day.likes,
            shares: day.shares,
            estimatedMinutesWatched: day.estimatedMinutesWatched,
            averageViewDuration: day.averageViewDuration,
            averageViewPercentage: day.averageViewPercentage,
            subscribersGained: day.subscribersGained,
            subscribersLost: day.subscribersLost,
            videosAddedToPlaylists: day.videosAddedToPlaylists,
            videosRemovedFromPlaylists: day.videosRemovedFromPlaylists,
            estimatedRevenue: day.estimatedRevenue,
            estimatedAdRevenue: day.estimatedAdRevenue,
            grossRevenue: day.grossRevenue,
            monetizedPlaybacks: day.monetizedPlaybacks,
            playbackBasedCpm: day.playbackBasedCpm,
            adImpressions: day.adImpressions,
            cpm: day.cpm,
          },
          update: {
            views: day.views,
            engagedViews: day.engagedViews,
            comments: day.comments,
            likes: day.likes,
            shares: day.shares,
            estimatedMinutesWatched: day.estimatedMinutesWatched,
            averageViewDuration: day.averageViewDuration,
            averageViewPercentage: day.averageViewPercentage,
            subscribersGained: day.subscribersGained,
            subscribersLost: day.subscribersLost,
            videosAddedToPlaylists: day.videosAddedToPlaylists,
            videosRemovedFromPlaylists: day.videosRemovedFromPlaylists,
            estimatedRevenue: day.estimatedRevenue,
            estimatedAdRevenue: day.estimatedAdRevenue,
            grossRevenue: day.grossRevenue,
            monetizedPlaybacks: day.monetizedPlaybacks,
            playbackBasedCpm: day.playbackBasedCpm,
            adImpressions: day.adImpressions,
            cpm: day.cpm,
          },
        })
      )
    );
  }
}

function getRetentionReason(derived: DerivedMetrics, comparison: any): string {
  if (derived.avdRatio == null) return "Retention data not available yet.";
  const pct = (derived.avdRatio * 100).toFixed(1);
  if (comparison.avgViewPercentage.vsBaseline === "above") {
    return `${pct}% avg viewed is above your channel average.`;
  }
  if (comparison.avgViewPercentage.vsBaseline === "below") {
    return `${pct}% avg viewed is below your channel average.`;
  }
  return `${pct}% avg viewed is around your channel average.`;
}

function getRetentionAction(grade: string): string {
  switch (grade) {
    case "Needs Work":
      return "Add a pattern interrupt in the first 30 seconds.";
    case "OK":
      return "Tighten the intro and get to value faster.";
    case "Good":
      return "Maintain pacing; test mid-roll hooks.";
    default:
      return "Keep doing what you're doing.";
  }
}

function getConversionReason(derived: DerivedMetrics, comparison: any): string {
  if (derived.subsPer1k == null) return "Subscriber data not available.";
  const subs = derived.subsPer1k.toFixed(2);
  if (comparison.subsPer1k.vsBaseline === "above") {
    return `${subs} subs/1K views is above your channel average.`;
  }
  if (comparison.subsPer1k.vsBaseline === "below") {
    return `${subs} subs/1K views is below your channel average.`;
  }
  return `${subs} subs/1K views is around your channel average.`;
}

function getConversionAction(grade: string): string {
  switch (grade) {
    case "Needs Work":
      return "Add a subscribe reminder after delivering value.";
    case "OK":
      return "Test different subscribe reminder placements.";
    case "Good":
      return "Experiment with end screen timing.";
    default:
      return "Your subscribe prompts are working well.";
  }
}

function getEngagementReason(derived: DerivedMetrics, comparison: any): string {
  if (derived.engagementPerView == null) return "Engagement data not available.";
  const eng = (derived.engagementPerView * 100).toFixed(2);
  if (comparison.engagementPerView.vsBaseline === "above") {
    return `${eng}% engagement rate is above your channel average.`;
  }
  if (comparison.engagementPerView.vsBaseline === "below") {
    return `${eng}% engagement rate is below your channel average.`;
  }
  return `${eng}% engagement rate is around your channel average.`;
}

function getEngagementAction(grade: string): string {
  switch (grade) {
    case "Needs Work":
      return "Ask a specific question to prompt comments.";
    case "OK":
      return "Pin a comment to spark discussion.";
    case "Good":
      return "Reply to comments to boost engagement.";
    default:
      return "Your engagement is strong.";
  }
}

function getDemoAnalytics(opts?: { videoId?: string }) {
  // Return minimal demo analytics for fast display
  return {
    video: {
      videoId: opts?.videoId ?? "demo-video-id",
      title: "How I Grew My Channel to 100K Subscribers",
      description: "In this video I share my journey...",
      publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ["youtube growth", "subscribers", "content creation"],
      categoryId: "22",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      durationSec: 720,
      viewCount: 150000,
      likeCount: 8500,
      commentCount: 650,
      topicCategories: ["Entertainment", "Education"],
    },
    analytics: {
      totals: {
        views: 150000,
        likes: 8500,
        comments: 650,
        shares: 420,
        subscribersGained: 450,
        subscribersLost: 45,
        averageViewPercentage: 39,
        estimatedMinutesWatched: 180000,
      },
      dailySeries: [],
    },
    derived: {
      viewsPerDay: 5357,
      totalViews: 150000,
      daysInRange: 28,
      subsPer1k: 3.0,
      sharesPer1k: 2.8,
      engagementPerView: 0.064,
      avdRatio: 0.39,
    },
    baseline: {
      sampleSize: 24,
      viewsPerDay: { mean: 4200, std: 1800 },
      avgViewPercentage: { mean: 0.35, std: 0.08 },
      subsPer1k: { mean: 2.5, std: 0.8 },
      engagementPerView: { mean: 0.05, std: 0.015 },
    },
    comparison: {
      viewsPerDay: { value: 5357, vsBaseline: "above", delta: 27.5 },
      avgViewPercentage: { value: 0.39, vsBaseline: "at", delta: 11.4 },
      subsPer1k: { value: 3.0, vsBaseline: "above", delta: 20.0 },
      engagementPerView: { value: 0.064, vsBaseline: "above", delta: 28.0 },
      healthScore: 72,
      healthLabel: "Good",
    },
    levers: {
      retention: { grade: "Good", color: "lime", reason: "39% avg viewed is above average.", action: "Test mid-roll pattern interrupts." },
      conversion: { grade: "Good", color: "lime", reason: "3.0 subs per 1K views is strong.", action: "Replicate this subscribe prompt style." },
      engagement: { grade: "Great", color: "green", reason: "6.4% engagement is excellent.", action: "Note what sparked discussion here." },
    },
    // No bottleneck for this well-performing demo video
    confidence: { retention: "High", discovery: "Medium", conversion: "High" },
    isLowDataMode: false,
    analyticsAvailability: { hasImpressions: true, hasCtr: true, hasTrafficSources: true },
    retention: {
      points: Array.from({ length: 100 }, (_, i) => ({
        elapsedRatio: i / 100,
        audienceWatchRatio: Math.max(0.1, 1 - (i / 100) * 0.7 + Math.random() * 0.05),
      })),
    },
    cached: false,
    hasSummary: false,
    demo: true,
  };
}
