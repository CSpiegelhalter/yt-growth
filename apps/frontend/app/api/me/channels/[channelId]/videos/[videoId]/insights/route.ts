/**
 * GET/POST /api/me/channels/[channelId]/videos/[videoId]/insights
 *
 * Fetch or generate deep insights for an owned video using YouTube Analytics API.
 * Uses LLM to generate structured recommendations.
 *
 * Auth: Required
 * Rate limit: 30 per hour per user
 * Cache: 24h per video + range
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/prisma";
import {
  getCurrentUserWithSubscription,
  hasActiveSubscription,
} from "@/lib/user";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { isDemoMode, isYouTubeMockMode } from "@/lib/demo-fixtures";
import { getGoogleAccount } from "@/lib/youtube-api";
import {
  fetchVideoAnalyticsDaily,
  fetchVideoAnalyticsTotals,
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

const ParamsSchema = z.object({
  channelId: z.string().min(1),
  videoId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
});

// Import types from shared types file
import type { VideoInsightsResponse, VideoInsightsLLM } from "@/types/api";

/**
 * GET - Fetch insights (from cache or generate)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string; videoId: string }> }
) {
  // Demo mode - return demo data
  if (isDemoMode() && !isYouTubeMockMode()) {
    return Response.json(getDemoInsights());
  }

  // Validate params first
  const resolvedParams = await params;
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

    // Check cache
    const cached = await prisma.ownedVideoInsightsCache.findFirst({
      where: {
        userId: user.id,
        channelId: channel.id,
        videoId,
        range,
        cachedUntil: { gt: new Date() },
      },
    });

    if (cached?.derivedJson && cached?.llmJson) {
      const derivedData = cached.derivedJson as any;
      const llmData = cached.llmJson as any;
      return Response.json({
        ...derivedData,
        llmInsights: llmData,
        cachedUntil: cached.cachedUntil.toISOString(),
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

    // Fetch fresh data
    const ga = await getGoogleAccount(user.id);
    if (!ga) {
      return Response.json(
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    const result = await generateInsights(
      ga,
      channel.id,
      channelId,
      videoId,
      range,
      user.id
    );

    // Cache result (handle null for llmJson)
    const llmJsonValue = result.llmInsights ?? Prisma.JsonNull;
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
        derivedJson: {
          video: result.video,
          analytics: result.analytics,
          derived: result.derived,
          baseline: result.baseline,
          comparison: result.comparison,
          levers: result.levers,
        },
        llmJson: llmJsonValue,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      update: {
        derivedJson: {
          video: result.video,
          analytics: result.analytics,
          derived: result.derived,
          baseline: result.baseline,
          comparison: result.comparison,
          levers: result.levers,
        },
        llmJson: llmJsonValue,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return Response.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Video insights error:", err);
    return Response.json(
      { error: "Failed to fetch video insights", detail: message },
      { status: 500 }
    );
  }
}

/**
 * POST - Force refresh insights
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string; videoId: string }> }
) {
  // Same as GET but always regenerates
  if (isDemoMode()) {
    return Response.json(getDemoInsights());
  }

  try {
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasActiveSubscription(user.subscription)) {
      return Response.json(
        { error: "Subscription required", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      );
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

    const ga = await getGoogleAccount(user.id);
    if (!ga) {
      return Response.json(
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    const result = await generateInsights(
      ga,
      channel.id,
      channelId,
      videoId,
      range,
      user.id
    );

    // Update cache (handle null for llmJson)
    const llmJsonValuePost = result.llmInsights ?? Prisma.JsonNull;
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
        derivedJson: {
          video: result.video,
          analytics: result.analytics,
          derived: result.derived,
          baseline: result.baseline,
          comparison: result.comparison,
          levers: result.levers,
        },
        llmJson: llmJsonValuePost,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      update: {
        derivedJson: {
          video: result.video,
          analytics: result.analytics,
          derived: result.derived,
          baseline: result.baseline,
          comparison: result.comparison,
          levers: result.levers,
        },
        llmJson: llmJsonValuePost,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return Response.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Video insights refresh error:", err);
    return Response.json(
      { error: "Failed to refresh video insights", detail: message },
      { status: 500 }
    );
  }
}

/**
 * Generate insights for a video
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
  userId: number
): Promise<VideoInsightsResponse> {
  const { startDate, endDate } = getDateRange(range);

  // Fetch video metadata
  const videoMeta = await fetchOwnedVideoMetadata(ga, videoId);
  if (!videoMeta) {
    throw new Error("Could not fetch video metadata");
  }

  // Fetch analytics
  const [totals, dailySeries, comments] = await Promise.all([
    fetchVideoAnalyticsTotals(
      ga,
      youtubeChannelId,
      videoId,
      startDate,
      endDate
    ),
    fetchVideoAnalyticsDaily(ga, youtubeChannelId, videoId, startDate, endDate),
    fetchOwnedVideoComments(ga, videoId, 30),
  ]);

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

  // Generate LLM insights
  const llmInsights = await generateLLMInsights(
    videoMeta,
    derived,
    comparison,
    levers,
    comments
  );

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
      watchTimePerViewSec:
        v.watchMin != null ? (Number(v.watchMin) * 60) / views : null,
      avdRatio: v.avgViewPct != null ? Number(v.avgViewPct) / 100 : null,
      engagementPerView:
        (Number(v.likes ?? 0) +
          Number(v.comments ?? 0) +
          Number(v.shares ?? 0)) /
        views,
      engagedViewRate: null,
      rpm: null,
      monetizedPlaybackRate: null,
      adImpressionsPerView: null,
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
  for (const day of dailySeries) {
    await prisma.ownedVideoAnalyticsDay.upsert({
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
    });
  }
}

/**
 * Generate LLM insights
 */
async function generateLLMInsights(
  video: VideoMetadata,
  derived: DerivedMetrics,
  comparison: BaselineComparison,
  levers: VideoInsightsResponse["levers"],
  comments: VideoComment[]
): Promise<VideoInsightsLLM | null> {
  const systemPrompt = `You are an elite YouTube analytics consultant. Generate actionable insights for a creator's video.

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure (no markdown, no extra text):
{
  "summary": { "headline": "One punchy headline", "oneLiner": "One sentence summary" },
  "wins": [{ "label": "What's working", "why": "Explanation", "metricKey": "viewsPerDay" }],
  "leaks": [{ "label": "What's underperforming", "why": "Explanation", "metricKey": "subsPer1k" }],
  "actions": [
    { "lever": "Retention", "action": "Specific action", "reason": "Why this helps", "expectedImpact": "Expected outcome" }
  ],
  "experiments": [
    { "type": "Title", "test": ["Option A", "Option B"], "successMetric": "CTR improvement" }
  ],
  "packaging": {
    "titleAngles": ["Angle 1", "Angle 2", "Angle 3"],
    "hookSetups": ["Setup 1", "Setup 2", "Setup 3"],
    "visualMoments": ["Moment 1", "Moment 2", "Moment 3"]
  },
  "competitorTakeaways": [],
  "remixIdeas": [
    { "title": "Remix title", "hook": "Opening line", "keywords": ["kw1", "kw2"], "inspiredByVideoIds": [] }
  ]
}

RULES:
- Be specific and actionable
- Reference actual metrics from the data
- No generic advice
- Focus on the 3 levers: Retention, Conversion, Engagement
- Max 3-4 items per array
- No emojis, hashtags, or markdown`;

  const topComments = comments
    .slice(0, 10)
    .map((c) => `"${c.text.slice(0, 100)}"`)
    .join("\n");

  const userPrompt = `VIDEO: "${video.title}"
Duration: ${Math.round(video.durationSec / 60)} min
Tags: ${video.tags.slice(0, 10).join(", ")}

METRICS (vs channel baseline):
- Views/day: ${derived.viewsPerDay.toFixed(0)} (${
    comparison.viewsPerDay.vsBaseline
  } average, ${comparison.viewsPerDay.delta?.toFixed(1) ?? "N/A"}%)
- Avg % viewed: ${
    derived.avdRatio != null ? (derived.avdRatio * 100).toFixed(1) : "N/A"
  }% (${comparison.avgViewPercentage.vsBaseline} average)
- Subs per 1K: ${derived.subsPer1k?.toFixed(2) ?? "N/A"} (${
    comparison.subsPer1k.vsBaseline
  } average)
- Engagement rate: ${
    derived.engagementPerView != null
      ? (derived.engagementPerView * 100).toFixed(2)
      : "N/A"
  }% (${comparison.engagementPerView.vsBaseline} average)
- Shares per 1K: ${derived.sharesPer1k?.toFixed(2) ?? "N/A"}

HEALTH SCORE: ${comparison.healthScore.toFixed(0)}/100 (${
    comparison.healthLabel
  })

LEVER GRADES:
- Retention: ${levers.retention.grade} - ${levers.retention.reason}
- Conversion: ${levers.conversion.grade} - ${levers.conversion.reason}
- Engagement: ${levers.engagement.grade} - ${levers.engagement.reason}

TOP VIEWER COMMENTS:
${topComments || "No comments available"}

Generate insights to help improve this video's performance.`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 2000, temperature: 0.7 }
    );

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as VideoInsightsLLM;
    return parsed;
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
      return "Add a clear subscribe CTA after delivering value.";
    case "OK":
      return "Test different CTA placements in the video.";
    case "Good":
      return "Experiment with end screen timing.";
    default:
      return "Your CTAs are working well.";
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
 * Demo fallback data
 */
function getDemoInsights(opts?: {
  reason?: string;
  videoId?: string;
}): VideoInsightsResponse {
  return {
    video: {
      videoId: opts?.videoId ?? "demo-video-id",
      title: "How I Grew My Channel to 100K Subscribers",
      description: "In this video I share my journey...",
      publishedAt: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      tags: ["youtube growth", "subscribers", "content creation"],
      categoryId: "22",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      durationSec: 720,
      viewCount: 150000,
      likeCount: 8500,
      commentCount: 650,
      topicCategories: [],
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
        comments: 650,
        shares: 420,
        estimatedMinutesWatched: 180000,
        averageViewDuration: 280,
        averageViewPercentage: 39,
        subscribersGained: 450,
        subscribersLost: 45,
        videosAddedToPlaylists: 380,
        videosRemovedFromPlaylists: 25,
        estimatedRevenue: null,
        estimatedAdRevenue: null,
        grossRevenue: null,
        monetizedPlaybacks: null,
        playbackBasedCpm: null,
        adImpressions: null,
        cpm: null,
      },
      dailySeries: [],
    },
    derived: {
      viewsPerDay: 5357,
      totalViews: 150000,
      daysInRange: 28,
      subsPer1k: 3.0,
      sharesPer1k: 2.8,
      commentsPer1k: 4.3,
      likesPer1k: 56.7,
      playlistAddsPer1k: 2.5,
      watchTimePerViewSec: 72,
      avdRatio: 0.39,
      engagementPerView: 0.064,
      engagedViewRate: 0.08,
      rpm: null,
      monetizedPlaybackRate: null,
      adImpressionsPerView: null,
      velocity24h: 200,
      velocity7d: 1500,
      acceleration24h: 50,
    },
    baseline: {
      sampleSize: 0,
      viewsPerDay: { mean: 0, std: 0 },
      avgViewPercentage: { mean: 0, std: 0 },
      watchTimePerViewSec: { mean: 0, std: 0 },
      subsPer1k: { mean: 0, std: 0 },
      engagementPerView: { mean: 0, std: 0 },
      sharesPer1k: { mean: 0, std: 0 },
    },
    comparison: {
      viewsPerDay: {
        value: 5357,
        zScore: null,
        percentile: null,
        vsBaseline: "unknown",
        delta: null,
      },
      avgViewPercentage: {
        value: 0.39,
        zScore: null,
        percentile: null,
        vsBaseline: "unknown",
        delta: null,
      },
      watchTimePerViewSec: {
        value: 72,
        zScore: null,
        percentile: null,
        vsBaseline: "unknown",
        delta: null,
      },
      subsPer1k: {
        value: 3.0,
        zScore: null,
        percentile: null,
        vsBaseline: "unknown",
        delta: null,
      },
      engagementPerView: {
        value: 0.064,
        zScore: null,
        percentile: null,
        vsBaseline: "unknown",
        delta: null,
      },
      sharesPer1k: {
        value: 2.8,
        zScore: null,
        percentile: null,
        vsBaseline: "unknown",
        delta: null,
      },
      healthScore: 65,
      healthLabel: "Good",
    },
    levers: {
      retention: {
        grade: "Good",
        color: "lime",
        reason: "39% avg viewed is solid for this length.",
        action: "Test mid-roll pattern interrupts.",
      },
      conversion: {
        grade: "Good",
        color: "lime",
        reason: "3 subs per 1K views shows good conversion.",
        action: "Experiment with CTA timing.",
      },
      engagement: {
        grade: "Great",
        color: "green",
        reason: "6.4% engagement is excellent.",
        action: "Keep sparking discussions.",
      },
    },
    llmInsights: {
      summary: {
        headline: "Strong video with room to grow retention",
        oneLiner:
          "Solid engagement and conversion, focus on keeping viewers watching longer.",
      },
      wins: [
        {
          label: "High engagement rate",
          why: "6.4% is well above average for this niche",
          metricKey: "engagementPerView",
        },
        {
          label: "Good subscriber conversion",
          why: "3 subs per 1K is healthy",
          metricKey: "subsPer1k",
        },
      ],
      leaks: [
        {
          label: "Retention could be higher",
          why: "39% suggests room for improvement in pacing",
          metricKey: "avdRatio",
        },
      ],
      actions: [
        {
          lever: "Retention",
          action: "Add a pattern interrupt at the 2-minute mark",
          reason: "Break up longer segments to maintain attention",
          expectedImpact: "5-10% improvement in avg view duration",
        },
        {
          lever: "Conversion",
          action: "Move subscribe CTA earlier after first value delivery",
          reason: "Capitalize on engaged viewers before drop-off",
          expectedImpact: "10-15% more subscribers",
        },
      ],
      experiments: [
        {
          type: "Hook",
          test: [
            "Start with the result",
            "Start with a question",
            "Start with a bold claim",
          ],
          successMetric: "First 30s retention",
        },
      ],
      packaging: {
        titleAngles: [
          "Lead with the specific outcome",
          "Use a timeframe for urgency",
          "Include social proof numbers",
        ],
        hookSetups: [
          "Show the end result first",
          "Ask a provocative question",
          "Challenge a common belief",
        ],
        visualMoments: [
          "Quick montage of key moments",
          "Text overlay of main promise",
          "Before/after comparison",
        ],
      },
      competitorTakeaways: [],
      remixIdeas: [
        {
          title: "The 5 Mistakes Keeping You Under 10K Subs",
          hook: "If you're stuck, it's probably one of these...",
          keywords: ["youtube mistakes", "subscriber growth"],
          inspiredByVideoIds: [],
        },
      ],
    },
    cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    demo: true,
  };
}
