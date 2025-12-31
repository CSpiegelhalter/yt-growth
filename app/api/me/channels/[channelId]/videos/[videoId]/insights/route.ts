/**
 * GET/POST /api/me/channels/[channelId]/videos/[videoId]/insights
 *
 * Fetch or generate deep insights for an owned video using YouTube Analytics API.
 * Uses LLM to generate structured recommendations.
 *
 * Auth: Required
 * Rate limit: 30 per hour per user
 * Cache: 24h per video + range
 * Entitlements: owned_video_analysis (5/day FREE, 100/day PRO)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import {
  getCurrentUserWithSubscription,
  hasActiveSubscription,
} from "@/lib/user";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { isDemoMode, isYouTubeMockMode } from "@/lib/demo-fixtures";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";
import { getGoogleAccount } from "@/lib/youtube-api";
import {
  fetchVideoAnalyticsDailyWithStatus,
  fetchVideoAnalyticsTotalsWithStatus,
  fetchOwnedVideoMetadata,
  fetchOwnedVideoComments,
  getDateRange,
  type DailyAnalyticsRow,
  type AnalyticsTotals,
  type VideoMetadata,
  type VideoComment,
} from "@/lib/youtube-analytics";
import {
  computeDerivedMetrics,
  computeChannelBaseline,
  compareToBaseline,
  getRetentionGrade,
  getConversionGrade,
  getEngagementGrade,
  type DerivedMetrics,
  type ChannelBaseline,
  type BaselineComparison,
} from "@/lib/owned-video-math";
import { callLLM } from "@/lib/llm";
import { hashVideoContent } from "@/lib/content-hash";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
  videoId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
});

// Import types from shared types file
import type { VideoInsightsResponse, VideoInsightsLLM } from "@/types/api";

class YouTubePermissionDeniedError extends Error {
  code = "youtube_permissions" as const;
  constructor(message: string) {
    super(message);
    this.name = "YouTubePermissionDeniedError";
  }
}

/**
 * GET - Fetch insights (from cache or generate)
 */
async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string; videoId: string }> }
) {
  const resolvedParams = await params;

  // Debug logging
  console.log("[VideoInsights] GET request:", {
    videoId: resolvedParams.videoId,
    isDemoMode: isDemoMode(),
    isYouTubeMockMode: isYouTubeMockMode(),
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  });

  // Demo mode OR mock mode without OpenAI - return demo data
  // This ensures users can see the full UI even in development
  if (isDemoMode() || (isYouTubeMockMode() && !process.env.OPENAI_API_KEY)) {
    console.log("[VideoInsights] Returning demo insights");
    return Response.json(getDemoInsights({ videoId: resolvedParams.videoId }));
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

    // Check cache - look for any cached entry (we'll validate hash later)
    const cached = await prisma.ownedVideoInsightsCache.findFirst({
      where: {
        userId: user.id,
        channelId: channel.id,
        videoId,
        range,
      },
    });

    // If cache is fresh (time-based), return it (even if llmJson is null)
    // NOTE: Cached responses don't count against usage limits.
    // This is critical: if the LLM fails (or returns null), we still want to cache/serve
    // the computed analytics+derived metrics so we don't burn multiple daily credits on refresh.
    if (cached?.derivedJson && cached.cachedUntil > new Date()) {
      const derivedData = cached.derivedJson as any;
      const llmData = (cached.llmJson as any) ?? null;
      return Response.json({
        ...derivedData,
        llmInsights: llmData,
        cachedUntil: cached.cachedUntil.toISOString(),
      });
    }

    // Rate limit check (per-hour limit for API protection)
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

    // Fetch fresh data - use the GoogleAccount that owns this channel
    const ga = await getGoogleAccount(user.id, channelId);
    if (!ga) {
      return Response.json(
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    // Fast permission probe (DON'T increment entitlements if user denied scopes)
    // This should return quickly with a 403 instead of hanging / attempting LLM work.
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
        "Google account is missing required YouTube Analytics permissions. Reconnect Google to grant access."
      );
    }

    // Entitlement check - only count fresh analysis (not cached) AND only after we know scopes exist
    const entitlementResult = await checkEntitlement({
      featureKey: "owned_video_analysis",
      increment: true,
    });
    if (!entitlementResult.ok) {
      return entitlementErrorResponse(entitlementResult.error);
    }

    // Pass cached data for content-hash comparison
    const result = await generateInsights(
      ga,
      channel.id,
      channelId,
      videoId,
      range,
      user.id,
      cached?.contentHash ?? null,
      cached?.llmJson ?? null
    );

    // Cache result (handle null for llmJson)
    const llmJsonValue = result.llmInsights ?? Prisma.JsonNull;
    const currentContentHash = hashVideoContent({
      title: result.video.title,
      description: result.video.description,
      tags: result.video.tags,
      durationSec: result.video.durationSec,
      categoryId: result.video.categoryId,
    });

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
        contentHash: currentContentHash,
        derivedJson: {
          video: result.video,
          analytics: result.analytics,
          derived: result.derived,
          baseline: result.baseline,
          comparison: result.comparison,
          levers: result.levers,
          comments: result.comments, // Cache comments for llmOnly reuse
        },
        llmJson: llmJsonValue,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      update: {
        contentHash: currentContentHash,
        derivedJson: {
          video: result.video,
          analytics: result.analytics,
          derived: result.derived,
          baseline: result.baseline,
          comparison: result.comparison,
          levers: result.levers,
          comments: result.comments, // Cache comments for llmOnly reuse
        },
        llmJson: llmJsonValue,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Don't return comments in the API response (they're only for internal caching)
    const { comments: _omitted, ...resultWithoutComments } = result;
    return Response.json(resultWithoutComments);
  } catch (err: unknown) {
    if (err instanceof YouTubePermissionDeniedError) {
      return Response.json(
        { error: err.message, code: err.code },
        { status: 403 }
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Video insights error:", err);
    return Response.json(
      { error: "Failed to fetch video insights", detail: message },
      { status: 500 }
    );
  }
}

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/insights" },
  async (req, ctx) => GETHandler(req, ctx as any)
);

/**
 * POST - Force refresh insights
 */
async function POSTHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string; videoId: string }> }
) {
  // Demo mode OR mock mode without OpenAI - return demo data
  if (isDemoMode() || (isYouTubeMockMode() && !process.env.OPENAI_API_KEY)) {
    const resolvedParams = await params;
    return Response.json(getDemoInsights({ videoId: resolvedParams.videoId }));
  }

  try {
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const parsedParams = ParamsSchema.safeParse(resolvedParams);
    if (!parsedParams.success) {
      return Response.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { channelId, videoId } = parsedParams.data;

    const body = await req.json().catch(() => ({}));
    const range = ["7d", "28d", "90d"].includes(body.range)
      ? body.range
      : "28d";
    const llmOnly = body.llmOnly === true;

    const channel = await prisma.channel.findFirst({
      where: { youtubeChannelId: channelId, userId: user.id },
    });
    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

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

    const ga = await getGoogleAccount(user.id, channelId);
    if (!ga) {
      return Response.json(
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    // If llmOnly, regenerate AI insights using cached derived data (no analytics calls, no daily credit burn)
    if (llmOnly) {
      const cached = await prisma.ownedVideoInsightsCache.findFirst({
        where: {
          userId: user.id,
          channelId: channel.id,
          videoId,
          range,
        },
      });

      if (!cached?.derivedJson || cached.cachedUntil <= new Date()) {
        return Response.json(
          {
            error: "no_cached_analysis",
            message:
              "No cached analysis available to generate AI insights. Run a full analysis first.",
          },
          { status: 400 }
        );
      }

      const derivedData = cached.derivedJson as any;
      const video = derivedData.video as VideoMetadata;
      const derived = derivedData.derived as DerivedMetrics;
      const comparison = derivedData.comparison as BaselineComparison;
      const levers = derivedData.levers as VideoInsightsResponse["levers"];

      // Use cached comments if available, otherwise fetch (fallback for old cache entries)
      const comments: VideoComment[] = derivedData.comments?.length
        ? (derivedData.comments as VideoComment[])
        : await fetchOwnedVideoComments(ga, videoId, 30);

      const llmInsights = await generateLLMInsights(
        video,
        derived,
        comparison,
        levers,
        comments
      );

      // Update just llmJson; keep cachedUntil as-is.
      await prisma.ownedVideoInsightsCache.update({
        where: {
          userId_channelId_videoId_range: {
            userId: user.id,
            channelId: channel.id,
            videoId,
            range,
          },
        },
        data: {
          llmJson: llmInsights ?? Prisma.JsonNull,
        },
      });

      return Response.json({
        ...derivedData,
        llmInsights,
        cachedUntil: cached.cachedUntil.toISOString(),
      });
    }

    // Fast permission probe (don't count as a use if scopes are missing)
    const { startDate: probeStartPost, endDate: probeEndPost } =
      getDateRange("7d");
    const probePost = await fetchVideoAnalyticsTotalsWithStatus(
      ga,
      channelId,
      videoId,
      probeStartPost,
      probeEndPost
    );
    if (
      !probePost.permission.ok &&
      probePost.permission.reason === "permission_denied"
    ) {
      return Response.json(
        {
          error:
            "Google account is missing required YouTube Analytics permissions. Reconnect Google to grant access.",
          code: "youtube_permissions",
        },
        { status: 403 }
      );
    }

    // Entitlement check (POST = force refresh, always counts as a use)
    const entitlementResult = await checkEntitlement({
      featureKey: "owned_video_analysis",
      increment: true,
    });
    if (!entitlementResult.ok) {
      return entitlementErrorResponse(entitlementResult.error);
    }

    // Fetch existing cache for content hash comparison (even on refresh)
    const existingCache = await prisma.ownedVideoInsightsCache.findFirst({
      where: {
        userId: user.id,
        channelId: channel.id,
        videoId,
        range,
      },
    });

    const result = await generateInsights(
      ga,
      channel.id,
      channelId,
      videoId,
      range,
      user.id,
      existingCache?.contentHash ?? null,
      existingCache?.llmJson ?? null
    );

    // Update cache (handle null for llmJson)
    const llmJsonValuePost = result.llmInsights ?? Prisma.JsonNull;
    const currentContentHash = hashVideoContent({
      title: result.video.title,
      description: result.video.description,
      tags: result.video.tags,
      durationSec: result.video.durationSec,
      categoryId: result.video.categoryId,
    });

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
        contentHash: currentContentHash,
        derivedJson: {
          video: result.video,
          analytics: result.analytics,
          derived: result.derived,
          baseline: result.baseline,
          comparison: result.comparison,
          levers: result.levers,
          comments: result.comments, // Cache comments for llmOnly reuse
        },
        llmJson: llmJsonValuePost,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      update: {
        contentHash: currentContentHash,
        derivedJson: {
          video: result.video,
          analytics: result.analytics,
          derived: result.derived,
          baseline: result.baseline,
          comparison: result.comparison,
          levers: result.levers,
          comments: result.comments, // Cache comments for llmOnly reuse
        },
        llmJson: llmJsonValuePost,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Don't return comments in the API response (they're only for internal caching)
    const { comments: _omitted, ...resultWithoutComments } = result;
    return Response.json(resultWithoutComments);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Video insights refresh error:", err);
    return Response.json(
      { error: "Failed to refresh video insights", detail: message },
      { status: 500 }
    );
  }
}

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/insights" },
  async (req, ctx) => POSTHandler(req, ctx as any)
);

// Internal type that includes comments (for caching), extends API response
type InsightsResultInternal = VideoInsightsResponse & {
  comments: VideoComment[];
};

/**
 * Generate insights for a video
 * @param cachedContentHash - Content hash from previous cache (for LLM reuse)
 * @param cachedLlmJson - Cached LLM insights (reused if hash matches)
 */
async function generateInsights(
  ga: {
    id: number;
    refreshTokenEnc: string | null;
    tokenExpiresAt: Date | null;
  },
  dbChannelId: number,
  youtubeChannelId: string,
  videoId: string,
  range: "7d" | "28d" | "90d",
  userId: number,
  cachedContentHash: string | null = null,
  cachedLlmJson: unknown = null
): Promise<InsightsResultInternal> {
  const { startDate, endDate } = getDateRange(range);

  // Fetch video metadata AND analytics in parallel for faster response
  const [videoMeta, totalsResult, dailyResult, comments] = await Promise.all([
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
    fetchOwnedVideoComments(ga, videoId, 30),
  ]);

  if (!videoMeta) {
    throw new Error("Could not fetch video metadata");
  }

  // Check if content has changed - compute hash of current video content
  const currentContentHash = hashVideoContent({
    title: videoMeta.title,
    description: videoMeta.description,
    tags: videoMeta.tags,
    durationSec: videoMeta.durationSec,
    categoryId: videoMeta.categoryId,
  });

  const contentUnchanged =
    cachedContentHash && cachedContentHash === currentContentHash;

  if (
    !totalsResult.permission.ok &&
    totalsResult.permission.reason === "permission_denied"
  ) {
    throw new YouTubePermissionDeniedError(
      "Google account is missing required YouTube Analytics permissions. Reconnect Google to grant access."
    );
  }

  const totals = totalsResult.totals;
  const dailySeries = dailyResult.rows;

  if (!totals) {
    throw new Error("Could not fetch analytics totals");
  }

  // Compute derived metrics
  const derived = computeDerivedMetrics(
    totals,
    dailySeries,
    videoMeta.durationSec
  );

  // Get channel baseline from other videos
  const baseline = await getChannelBaselineFromDB(
    userId,
    dbChannelId,
    videoId,
    range
  );

  // Compare to baseline
  const comparison = compareToBaseline(
    derived,
    totals.averageViewPercentage,
    baseline
  );

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

  // Reuse cached LLM insights if content hasn't changed
  let llmInsights: VideoInsightsLLM | null = null;
  if (contentUnchanged && cachedLlmJson) {
    console.log(
      `[VideoInsights] Reusing cached LLM insights (content hash: ${currentContentHash})`
    );
    llmInsights = cachedLlmJson as VideoInsightsLLM;
  } else {
    // Performance: do NOT block the main insights response on LLM generation.
    // The client will call POST { llmOnly: true } to populate llmInsights asynchronously.
    console.log(
      `[VideoInsights] Skipping LLM generation for fast response (hash changed: ${cachedContentHash} -> ${currentContentHash})`
    );
    llmInsights = null;
  }

  // Store daily data in analytics table for future baseline calculations
  await storeDailyAnalytics(userId, dbChannelId, videoId, dailySeries);

  return {
    video: videoMeta,
    analytics: { totals, dailySeries },
    derived,
    baseline,
    comparison,
    levers,
    llmInsights,
    comments, // Include comments for caching
    cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Get channel baseline from stored analytics
 */
async function getChannelBaselineFromDB(
  userId: number,
  channelId: number,
  excludeVideoId: string,
  range: "7d" | "28d" | "90d"
): Promise<ChannelBaseline> {
  const { startDate, endDate } = getDateRange(range);

  // Get aggregated metrics for other videos
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

  // Compute derived metrics for each video
  const derivedList: DerivedMetrics[] = otherVideos.map((v) => {
    const views = Number(v.totalViews) || 1;
    const viewsPer1k = views / 1000;
    const days = Number(v.daysCount) || 1;

    return {
      viewsPerDay: views / days,
      totalViews: views,
      daysInRange: days,
      subsPer1k:
        v.subsGained != null ? Number(v.subsGained) / viewsPer1k : null,
      sharesPer1k: v.shares != null ? Number(v.shares) / viewsPer1k : null,
      commentsPer1k:
        v.comments != null ? Number(v.comments) / viewsPer1k : null,
      likesPer1k: v.likes != null ? Number(v.likes) / viewsPer1k : null,
      playlistAddsPer1k: null,
      // Advanced engagement metrics
      netSubsPer1k: null,
      netSavesPer1k: null,
      likeRatio: null,
      watchTimePerViewSec:
        v.watchMin != null ? (Number(v.watchMin) * 60) / views : null,
      avdRatio: v.avgViewPct != null ? Number(v.avgViewPct) / 100 : null,
      avgWatchTimeMin: null,
      engagementPerView:
        (Number(v.likes ?? 0) +
          Number(v.comments ?? 0) +
          Number(v.shares ?? 0)) /
        views,
      engagedViewRate: null,
      // Card & End Screen
      cardClickRate: null,
      endScreenClickRate: null,
      // Audience quality
      premiumViewRate: null,
      watchTimePerSub: null,
      // Monetization
      rpm: null,
      monetizedPlaybackRate: null,
      adImpressionsPerView: null,
      cpm: null,
      // Trend metrics
      velocity24h: null,
      velocity7d: null,
      acceleration24h: null,
    };
  });

  return computeChannelBaseline(derivedList);
}

/**
 * Store daily analytics for baseline calculations
 */
async function storeDailyAnalytics(
  userId: number,
  channelId: number,
  videoId: string,
  dailySeries: DailyAnalyticsRow[]
): Promise<void> {
  // Performance: batch upserts instead of sequential awaits.
  // Chunk to avoid huge transactions.
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

/**
 * Generate LLM insights
 */
async function generateLLMInsights(
  video: VideoMetadata,
  derived: DerivedMetrics,
  comparison: BaselineComparison,
  _levers: VideoInsightsResponse["levers"],
  comments: VideoComment[]
): Promise<VideoInsightsLLM | null> {
  const systemPrompt = `You are an elite YouTube growth strategist AND SEO specialist with expertise in:
- Video packaging (titles, thumbnails, hooks)
- YouTube SEO and discoverability
- Writing descriptions that rank AND convert (search intent, keyword placement, scannability)
- Audience retention psychology
- Converting viewers to subscribers
- Data interpretation for YouTube creators

Your job is to analyze THIS SPECIFIC VIDEO's data and provide targeted, actionable insights.

OUTPUT FORMAT: Return ONLY valid JSON (no markdown, no code blocks, no extra text):
{
  "summary": {
    "headline": "One punchy headline about THIS video's performance",
    "oneLiner": "Data-driven summary of what's happening with this video"
  },
  "titleAnalysis": {
    "score": 7,
    "strengths": ["What makes this title work"],
    "weaknesses": ["What could be improved"],
    "suggestions": ["Better title option 1", "Better title option 2", "Better title option 3"]
  },
  "descriptionAnalysis": {
    "score": 7,
    "strengths": ["What is good for SEO + viewers"],
    "weaknesses": ["What is missing / hurting SEO or CTR"],
    "rewrittenOpening": "Rewrite the first ~200 characters to be stronger for search + humans",
    "addTheseLines": ["Copy/paste line 1", "Copy/paste line 2"],
    "targetKeywords": ["keyword phrase 1", "keyword phrase 2"]
  },
  "tagAnalysis": {
    "score": 6,
    "coverage": "good",
    "missing": ["copy-paste tag 1", "copy-paste tag 2"],
    "feedback": "Specific feedback about the tags"
  },
  "visibilityPlan": {
    "bottleneck": "Packaging (CTR)",
    "confidence": "medium",
    "why": "Explain why, using actual metrics/baseline comparisons we provided",
    "doNext": [
      { "action": "Specific next step", "reason": "Metric-backed why", "expectedImpact": "Likely impact", "priority": "high" }
    ],
    "experiments": [
      { "name": "Title test", "variants": ["A", "B"], "successMetric": "CTR", "window": "24-48h" }
    ],
    "promotionChecklist": ["Concrete step 1", "Concrete step 2"],
    "whatToMeasureNext": ["Impressions", "CTR", "Traffic sources", "Search terms"]
  },
  "thumbnailHints": ["What the thumbnail should communicate based on title/data"],
  "keyFindings": [
    {
      "finding": "Specific data-driven finding",
      "dataPoint": "The exact metric that shows this",
      "significance": "positive|negative|neutral",
      "recommendation": "What to do about it"
    }
  ],
  "wins": [{ "label": "Short label", "why": "Data-backed explanation", "metricKey": "metric" }],
  "leaks": [{ "label": "Problem area", "why": "Data-backed explanation", "metricKey": "metric" }],
  "actions": [
    {
      "lever": "Retention|Conversion|Engagement|Discovery",
      "action": "SPECIFIC action for THIS video",
      "reason": "Why based on the data",
      "expectedImpact": "Realistic expected outcome",
      "priority": "high|medium|low"
    }
  ],
  "experiments": [{ "type": "Title|Hook|Structure", "test": ["Option A", "Option B"], "successMetric": "What to measure" }],
  "packaging": {
    "titleAngles": ["Alternative title approach 1", "Alternative title approach 2"],
    "hookSetups": ["Opening hook idea 1", "Opening hook idea 2"],
    "visualMoments": ["Key visual moment to highlight"]
  },
  "commentInsights": {
    "sentiment": { "positive": 0, "neutral": 0, "negative": 0 },
    "themes": [{ "theme": "Theme name", "count": 0, "examples": ["short quote"] }],
    "viewerLoved": ["What viewers explicitly praised"],
    "viewerAskedFor": ["What viewers asked about or requested next"],
    "hookInspiration": ["Short hook-worthy quote under 25 words"]
  },
  "competitorTakeaways": [],
  "remixIdeas": [{ "title": "Spinoff idea", "hook": "Opening line", "keywords": ["kw1"], "inspiredByVideoIds": [] }]
}

CRITICAL RULES:
1. NEVER give generic advice - everything must reference THIS video's actual data
2. Title suggestions MUST be complete, grammatically correct titles that make sense for THIS video's topic and content. Each suggestion should be a full, usable title (not a fragment or template).
   Think like an SEO-minded YouTube growth expert: optimize for real search intent + high CTR (clarity + curiosity), but DO NOT clickbait.
   Understand what the video is ABOUT from the title, description, and tags before suggesting alternatives.
3. Tag suggestions in "missing" must be SPECIFIC tags ready to copy-paste (e.g., "Blue Prince gameplay 2024", not "Add year-specific variations")
3a. Provide 15-25 tags in "missing" when possible. These should be SEO-first, highly relevant to THIS video, and easy to paste into YouTube.
    - Include a mix of: 2-5 broad tags + the rest long-tail phrases
    - Include key variants: synonyms, audience intent ("tutorial", "guide", "how to"), and year/version when relevant
    - Avoid generic filler ("youtube", "viral", "trending") unless the video is literally about that topic
    - No hashtags, no commas inside tag strings, no duplicates
    - Keep tags reasonably short (aim <= 30 characters each)
3b. Description analysis MUST focus on SEO + viewer conversion:
    - The first 2 lines (first ~200 chars) should clearly state the main topic + promise and include the primary keyword naturally.
    - Improve scannability: short paragraphs, bullets, timestamps (if relevant), and a clear CTA.
    - Provide specific copy/paste lines in "addTheseLines" (e.g., keyword-rich summary, resources, related videos, CTAs).
    - Never recommend keyword stuffing.
3c. visibilityPlan MUST be a diagnosis + playbook:
    - Choose ONE bottleneck (Packaging/Retention/Distribution/Topic/Too early to tell)
    - Justify it with the metrics we provided (views/day vs baseline, avg % viewed, engagement %, subs per 1K)
    - If key metrics like impressions/CTR/search terms are missing, say so in whatToMeasureNext and reduce confidence.
4. Key findings must cite ACTUAL metrics from the data
5. Actions must be specific enough that the creator knows exactly what to do. Avoid jargon - say "subscribe reminder" instead of "CTA", "call out viewers to comment" instead of "engagement prompt"
6. Compare to the channel baseline when relevant - if above average, celebrate; if below, diagnose why
7. Be honest - if metrics are poor, say so constructively
8. No emojis, no hashtags, no markdown
9. Use TOP VIEWER COMMENTS to fill commentInsights. If comments are missing/unavailable, set sentiment to {positive:0,neutral:100,negative:0} and use empty arrays.
10. For videos with very few views (<100), focus on title/thumbnail/discoverability improvements rather than engagement metrics which aren't meaningful yet`;

  const topComments = [...comments]
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    .slice(0, 20)
    .map((c) => `[${c.likes ?? 0} likes] "${c.text.slice(0, 200)}"`)
    .join("\n");

  const durationMin = Math.round(video.durationSec / 60);
  const descriptionSnippet =
    video.description?.slice(0, 300) || "No description";

  const userPrompt = `ANALYZE THIS VIDEO:

TITLE: "${video.title}"
DESCRIPTION (first 300 chars): "${descriptionSnippet}"
TAGS: [${video.tags
    .slice(0, 15)
    .map((t) => `"${t}"`)
    .join(", ")}]
DURATION: ${durationMin} minutes
CATEGORY: ${video.categoryId || "Unknown"}

═══════════════════════════════════════════════════════════════
PERFORMANCE DATA (${derived.daysInRange} day period):
═══════════════════════════════════════════════════════════════

VIEWS & REACH:
• Total Views: ${derived.totalViews.toLocaleString()}
• Views/Day: ${derived.viewsPerDay.toFixed(0)} ${
    comparison.viewsPerDay.vsBaseline !== "unknown"
      ? `(${comparison.viewsPerDay.delta?.toFixed(0)}% vs your channel avg)`
      : ""
  }
• 24h Velocity: ${derived.velocity24h ?? "N/A"} views/day change

RETENTION:
• Avg % Viewed: ${
    derived.avdRatio != null ? (derived.avdRatio * 100).toFixed(1) : "N/A"
  }% ${
    comparison.avgViewPercentage.vsBaseline !== "unknown"
      ? `(${comparison.avgViewPercentage.delta?.toFixed(0)}% vs avg)`
      : ""
  }
• Avg Watch Time: ${derived.avgWatchTimeMin?.toFixed(1) ?? "N/A"} min per view
• Watch Time Total: ${Math.round(
    derived.totalViews * (derived.avgWatchTimeMin ?? 0)
  )} minutes

ENGAGEMENT:
• Engagement Rate: ${
    derived.engagementPerView != null
      ? (derived.engagementPerView * 100).toFixed(2)
      : "N/A"
  }% ${
    comparison.engagementPerView.vsBaseline !== "unknown"
      ? `(${comparison.engagementPerView.delta?.toFixed(0)}% vs avg)`
      : ""
  }
• Like Ratio: ${derived.likeRatio?.toFixed(1) ?? "N/A"}%
• Comments/1K: ${derived.commentsPer1k?.toFixed(1) ?? "N/A"}
• Shares/1K: ${derived.sharesPer1k?.toFixed(1) ?? "N/A"}

SUBSCRIBER CONVERSION:
• Net Subs Gained: ${
    derived.netSubsPer1k != null
      ? `${derived.netSubsPer1k.toFixed(2)}/1K views`
      : "N/A"
  } ${
    comparison.subsPer1k.vsBaseline !== "unknown"
      ? `(${comparison.subsPer1k.delta?.toFixed(0)}% vs avg)`
      : ""
  }
• Playlist Saves: ${derived.netSavesPer1k?.toFixed(2) ?? "N/A"}/1K views

${
  derived.cardClickRate != null || derived.endScreenClickRate != null
    ? `CARDS & END SCREENS:
• Card CTR: ${derived.cardClickRate?.toFixed(2) ?? "N/A"}%
• End Screen CTR: ${derived.endScreenClickRate?.toFixed(2) ?? "N/A"}%
`
    : ""
}
OVERALL HEALTH: ${comparison.healthScore.toFixed(0)}/100 (${
    comparison.healthLabel
  })

═══════════════════════════════════════════════════════════════
TOP VIEWER COMMENTS:
═══════════════════════════════════════════════════════════════
${topComments || "No comments available"}

═══════════════════════════════════════════════════════════════
TASK: Provide strategic analysis for this creator to improve this video and learn from it for future content.
═══════════════════════════════════════════════════════════════`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 3000, temperature: 0.3, responseFormat: "json_object" }
    );

    const raw = (result.content ?? "").trim();
    // In json_object mode, we should get a JSON object as the entire response.
    try {
      return JSON.parse(raw) as VideoInsightsLLM;
    } catch {
      // Fallback: if the model ever returns extra text, extract the first {...} block.
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      return JSON.parse(jsonMatch[0]) as VideoInsightsLLM;
    }
  } catch (err) {
    console.error("LLM insights generation failed:", err);
    return null;
  }
}

// Helper functions for lever reasons and actions
function getRetentionReason(
  derived: DerivedMetrics,
  comparison: BaselineComparison
): string {
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

function getConversionReason(
  derived: DerivedMetrics,
  comparison: BaselineComparison
): string {
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

function getEngagementReason(
  derived: DerivedMetrics,
  comparison: BaselineComparison
): string {
  if (derived.engagementPerView == null)
    return "Engagement data not available.";
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

/**
 * Demo fallback data with realistic baseline comparisons
 */
function getDemoInsights(opts?: {
  reason?: string;
  videoId?: string;
}): VideoInsightsResponse {
  // Generate daily series for last 28 days (realistic data)
  const dailySeries: DailyAnalyticsRow[] = [];
  for (let i = 27; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    // Simulate typical YouTube decay curve with some variation
    const dayFactor = Math.exp(-i * 0.08) + 0.1; // Exponential decay
    const randomFactor = 0.8 + Math.random() * 0.4; // ±20% variation
    const baseViews = Math.floor(8000 * dayFactor * randomFactor);

    dailySeries.push({
      date: date.toISOString().split("T")[0],
      views: baseViews,
      engagedViews: Math.floor(baseViews * 0.08),
      likes: Math.floor(baseViews * 0.055),
      dislikes: Math.floor(baseViews * 0.002), // ~3-4% of likes
      comments: Math.floor(baseViews * 0.004),
      shares: Math.floor(baseViews * 0.003),
      estimatedMinutesWatched: Math.floor(baseViews * 1.2),
      averageViewDuration: 275 + Math.floor(Math.random() * 30),
      averageViewPercentage: 38 + Math.floor(Math.random() * 8),
      subscribersGained: Math.floor(baseViews * 0.003),
      subscribersLost: Math.floor(baseViews * 0.0003),
      videosAddedToPlaylists: Math.floor(baseViews * 0.0025),
      videosRemovedFromPlaylists: Math.floor(baseViews * 0.0002),
      // YouTube Premium
      redViews: Math.floor(baseViews * 0.08),
      // Card & End Screen
      cardClicks: Math.floor(baseViews * 0.012),
      cardImpressions: Math.floor(baseViews * 0.6),
      cardClickRate: 2.0,
      annotationClicks: Math.floor(baseViews * 0.025),
      annotationImpressions: Math.floor(baseViews * 0.5),
      annotationClickThroughRate: 3.5,
      // Monetization
      estimatedRevenue: baseViews * 0.003,
      estimatedAdRevenue: baseViews * 0.0028,
      grossRevenue: baseViews * 0.004,
      monetizedPlaybacks: Math.floor(baseViews * 0.55),
      playbackBasedCpm: 4.5,
      adImpressions: Math.floor(baseViews * 0.65),
      cpm: 5.2,
    });
  }

  return {
    video: {
      videoId: opts?.videoId ?? "demo-video-id",
      title: "How I Grew My Channel to 100K Subscribers",
      description:
        "In this video I share my journey to 100K subscribers. I cover the exact strategies that worked, what didn't, and the mindset shifts that made the biggest difference...",
      publishedAt: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      tags: [
        "youtube growth",
        "subscribers",
        "content creation",
        "youtube tips",
        "grow youtube channel",
        "100k subscribers",
      ],
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
        date: new Date().toISOString().split("T")[0],
        startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        daysInRange: 28,
        views: 150000,
        engagedViews: 12000,
        likes: 8500,
        dislikes: 320,
        comments: 650,
        shares: 420,
        estimatedMinutesWatched: 180000,
        averageViewDuration: 280,
        averageViewPercentage: 39,
        subscribersGained: 450,
        subscribersLost: 45,
        videosAddedToPlaylists: 380,
        videosRemovedFromPlaylists: 25,
        // YouTube Premium
        redViews: 12000,
        // Card & End Screen
        cardClicks: 1800,
        cardImpressions: 90000,
        cardClickRate: 2.0,
        annotationClicks: 3750,
        annotationImpressions: 75000,
        annotationClickThroughRate: 5.0,
        // Monetization
        estimatedRevenue: 525.0,
        estimatedAdRevenue: 490.0,
        grossRevenue: 580.0,
        monetizedPlaybacks: 82500,
        playbackBasedCpm: 4.5,
        adImpressions: 97500,
        cpm: 5.2,
      },
      dailySeries,
    },
    derived: {
      viewsPerDay: 5357,
      totalViews: 150000,
      daysInRange: 28,
      subsPer1k: 3.0,
      sharesPer1k: 2.8,
      commentsPer1k: 4.3,
      likesPer1k: 56.7,
      playlistAddsPer1k: 2.53,
      // Advanced engagement metrics
      netSubsPer1k: 2.7, // (450-45)/150
      netSavesPer1k: 2.37, // (380-25)/150
      likeRatio: 96.4, // 8500/(8500+320)*100
      watchTimePerViewSec: 72,
      avdRatio: 0.39,
      avgWatchTimeMin: 1.2,
      engagementPerView: 0.064,
      engagedViewRate: 0.08,
      // Card & End Screen
      cardClickRate: 2.0,
      endScreenClickRate: 5.0,
      // Audience quality
      premiumViewRate: 8.0,
      watchTimePerSub: 400, // 180000/450
      // Monetization
      rpm: 3.5,
      monetizedPlaybackRate: 0.55, // 82500/150000
      adImpressionsPerView: 0.65, // 97500/150000
      cpm: 5.2,
      velocity24h: 200,
      velocity7d: 1500,
      acceleration24h: 50,
    },
    // Realistic baseline from "other channel videos"
    baseline: {
      sampleSize: 24, // Simulating a channel with 24 other videos analyzed
      viewsPerDay: { mean: 4200, std: 1800 },
      avgViewPercentage: { mean: 0.35, std: 0.08 },
      watchTimePerViewSec: { mean: 65, std: 15 },
      subsPer1k: { mean: 2.5, std: 0.8 },
      engagementPerView: { mean: 0.05, std: 0.015 },
      sharesPer1k: { mean: 2.2, std: 0.6 },
    },
    // Comparisons showing this video vs channel baseline
    comparison: {
      viewsPerDay: {
        value: 5357,
        zScore: 0.64,
        percentile: 74,
        vsBaseline: "above",
        delta: 27.5, // +27.5% above channel average
      },
      avgViewPercentage: {
        value: 0.39,
        zScore: 0.5,
        percentile: 69,
        vsBaseline: "at",
        delta: 11.4,
      },
      watchTimePerViewSec: {
        value: 72,
        zScore: 0.47,
        percentile: 68,
        vsBaseline: "at",
        delta: 10.8,
      },
      subsPer1k: {
        value: 3.0,
        zScore: 0.63,
        percentile: 74,
        vsBaseline: "above",
        delta: 20.0,
      },
      engagementPerView: {
        value: 0.064,
        zScore: 0.93,
        percentile: 82,
        vsBaseline: "above",
        delta: 28.0,
      },
      sharesPer1k: {
        value: 2.8,
        zScore: 1.0,
        percentile: 84,
        vsBaseline: "above",
        delta: 27.3,
      },
      healthScore: 72,
      healthLabel: "Good",
    },
    levers: {
      retention: {
        grade: "Good",
        color: "lime",
        reason: "39% avg viewed is +11% above your channel average.",
        action: "Test mid-roll pattern interrupts to push toward 45%+.",
      },
      conversion: {
        grade: "Good",
        color: "lime",
        reason: "3.0 subs per 1K views is +20% above your average.",
        action:
          "Replicate the subscribe reminder style from this video in future content.",
      },
      engagement: {
        grade: "Great",
        color: "green",
        reason: "6.4% engagement is +28% above your channel average.",
        action: "Note the comment prompt that sparked discussion here.",
      },
    },
    llmInsights: {
      summary: {
        headline:
          "Strong performer with 28% higher engagement than your average",
        oneLiner:
          "This video's personal storytelling format is resonating—engagement and subscriber conversion are significantly above your baseline. The 39% retention suggests some mid-video drop-off worth addressing.",
      },
      titleAnalysis: {
        score: 7,
        strengths: [
          "Specific milestone (100K) creates credibility",
          "Promise of actionable content ('Here's How')",
          "Personal framing builds connection",
        ],
        weaknesses: [
          "No curiosity gap or tension",
          "Missing power words or emotional triggers",
          "Could benefit from a timeframe or specificity",
        ],
        suggestions: [
          "I Grew From 0 to 100K Subscribers in 18 Months (Here's What Actually Worked)",
          "100K Subscribers: The 5 Strategies That Changed Everything",
          "How I Hit 100K Subs (And The Mistake That Almost Stopped Me)",
        ],
      },
      tagAnalysis: {
        score: 6,
        coverage: "good",
        missing: [
          "youtube algorithm 2024",
          "small youtuber tips",
          "youtube monetization",
          "how to grow on youtube fast",
        ],
        feedback:
          "Your tags cover the basics but miss high-volume search terms. Adding '2024' to tags can boost discoverability for time-sensitive searches.",
      },
      thumbnailHints: [
        "Show the 100K subscriber count as a visual focal point",
        "Use before/after subscriber counts to show transformation",
        "Your face expressing surprise or celebration would match the emotional hook",
        "Consider showing a graph with dramatic growth curve",
      ],
      keyFindings: [
        {
          finding:
            "Engagement is significantly outperforming your channel average",
          dataPoint: "6.4% engagement rate (+28% vs baseline)",
          significance: "positive",
          recommendation:
            "Document what made this video discussion-worthy—likely the personal vulnerability and specific numbers you shared",
        },
        {
          finding: "Subscribers are converting at above-average rate",
          dataPoint: "3.0 subs per 1K views (+20% vs baseline)",
          significance: "positive",
          recommendation:
            "The topic attracts your ideal audience. Create more 'journey' style content",
        },
        {
          finding: "Watch time drops in the middle section",
          dataPoint: "39% avg viewed (below 45% target for 12min video)",
          significance: "negative",
          recommendation:
            "Add a pattern interrupt or mini-story around the 4-6 minute mark",
        },
        {
          finding: "End screen CTR is strong but could be higher",
          dataPoint: "5.0% click-through on end screens",
          significance: "neutral",
          recommendation:
            "Test pointing to end screen verbally vs relying on visual only",
        },
      ],
      wins: [
        {
          label: "High engagement rate",
          why: "6.4% engagement is +28% above your channel average, likely due to the personal story format",
          metricKey: "engagementPerView",
        },
        {
          label: "Strong subscriber conversion",
          why: "3.0 subs/1K views (+20% vs avg) suggests the topic attracts your ideal audience",
          metricKey: "subsPer1k",
        },
        {
          label: "Above-average shares",
          why: "2.8 shares/1K (+27% vs avg) indicates the content resonates emotionally",
          metricKey: "sharesPer1k",
        },
      ],
      leaks: [
        {
          label: "Retention has room to grow",
          why: "39% is good but below the 45%+ benchmark for longer videos—viewers may be dropping during the middle section",
          metricKey: "avdRatio",
        },
        {
          label: "First 30 seconds could be tighter",
          why: "Consider a stronger hook to reduce early drop-off",
          metricKey: "avdRatio",
        },
      ],
      actions: [
        {
          lever: "Retention",
          action:
            "Add a pattern interrupt at the 2-minute mark with a quick preview of what's coming",
          reason:
            "Your 39% retention shows mid-video drop-off typical for 12-minute videos",
          expectedImpact: "+5-8% average view duration",
          priority: "high",
        },
        {
          lever: "Discovery",
          action:
            "Update tags to include 'youtube algorithm 2024' and 'small youtuber tips'",
          reason:
            "These high-volume terms are missing from your current tag set",
          expectedImpact: "+10-15% search impressions",
          priority: "high",
        },
        {
          lever: "Retention",
          action:
            "Tighten the intro—get to the first valuable insight within 15 seconds",
          reason: "Strong first-30s retention compounds through the video",
          expectedImpact: "+3-5% first 30s retention",
          priority: "medium",
        },
        {
          lever: "Conversion",
          action:
            "Add a subscribe reminder right after sharing your first major milestone",
          reason: "Capitalize on the emotional peak when viewers feel inspired",
          expectedImpact: "+0.3-0.5 subs per 1K views",
          priority: "medium",
        },
        {
          lever: "Engagement",
          action:
            "Pin a comment asking: 'What's your subscriber goal for 2024?'",
          reason: "Creates easy entry point for viewers to engage",
          expectedImpact: "+15-20% comment rate",
          priority: "low",
        },
      ],
      experiments: [
        {
          type: "Hook",
          test: [
            "Start with the end result (100K celebration)",
            "Start with the struggle (my first 100 subs took 6 months)",
            "Start with a bold claim (I'll tell you the ONE thing that mattered)",
          ],
          successMetric: "First 30s retention",
        },
        {
          type: "Title",
          test: [
            "I Hit 100K Subscribers. Here's EXACTLY How.",
            "The 100K Subscriber Blueprint (What Actually Worked)",
            "From 0 to 100K: My YouTube Growth Timeline",
          ],
          successMetric: "CTR improvement",
        },
      ],
      packaging: {
        titleAngles: [
          "Lead with the specific milestone (100K)",
          "Promise the 'how' explicitly",
          "Add a timeframe for context",
        ],
        hookSetups: [
          "Show the celebration moment, then rewind",
          "Display the subscriber counter hitting 100K",
          "State the transformation: 'X months ago I had Y subscribers'",
        ],
        visualMoments: [
          "Analytics dashboard showing growth",
          "Before/after subscriber counts",
          "Timeline graphic of key milestones",
        ],
      },
      competitorTakeaways: [
        {
          channelName: "Ali Abdaal",
          insight:
            "His '0 to 1M' video used chapter timestamps heavily—viewers could skip to relevant sections",
          applicableAction: "Add chapters for each growth phase",
        },
        {
          channelName: "Paddy Galloway",
          insight:
            "Uses specific numbers in titles (e.g., '2.1M views from 1 video')",
          applicableAction:
            "Include a specific number in your next growth video title",
        },
      ],
      remixIdeas: [
        {
          title: "The 5 Mistakes Keeping You Under 10K Subs",
          hook: "If you're stuck under 10K, it's probably one of these five things...",
          keywords: ["youtube mistakes", "subscriber growth", "small youtuber"],
          inspiredByVideoIds: [],
        },
        {
          title: "I Analyzed My Top 10 Videos—Here's What They Have in Common",
          hook: "I pulled the data on my best performers and found 3 surprising patterns...",
          keywords: [
            "youtube analytics",
            "video performance",
            "content strategy",
          ],
          inspiredByVideoIds: [],
        },
        {
          title: "The Exact Posting Schedule That Got Me to 100K",
          hook: "I tested 4 different schedules over 2 years. Here's what actually worked...",
          keywords: ["posting schedule", "youtube algorithm", "consistency"],
          inspiredByVideoIds: [],
        },
      ],
    },
    cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    demo: true,
  };
}
