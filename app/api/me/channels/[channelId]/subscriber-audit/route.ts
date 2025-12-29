/**
 * GET /api/me/channels/[channelId]/subscriber-audit
 *
 * Get videos ranked by subscriber conversion rate with pattern analysis.
 * This is a PAID feature - requires active subscription.
 *
 * Auth: Required
 * Subscription: Required
 * Caching: 12-24h
 *
 * Query params:
 * - range: "28d" | "90d" (default: "28d")
 * - limit: number (default: 30, max: 100)
 * - sort: "subs_per_1k" | "views" | "playlist_adds" | "engaged_rate" (default: "subs_per_1k")
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import {
  getCurrentUserWithSubscription,
  hasActiveSubscription,
} from "@/lib/user";
import { calcSubsPerThousandViews } from "@/lib/retention";
import { generateSubscriberInsights } from "@/lib/llm";
import {
  isDemoMode,
  isYouTubeMockMode,
  getDemoData,
} from "@/lib/demo-fixtures";
import { hashSubscriberAuditContent } from "@/lib/content-hash";
import type {
  SubscriberMagnetVideo,
  SubscriberAuditResponse,
  PatternAnalysisJson,
} from "@/types/api";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["28d", "90d"]).default("28d"),
  limit: z.coerce.number().min(1).max(100).default(30),
  sort: z
    .enum(["subs_per_1k", "views", "playlist_adds", "engaged_rate"])
    .default("subs_per_1k"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  // Return demo data ONLY if demo mode is on AND mock mode is off
  if (isDemoMode() && !isYouTubeMockMode()) {
    const demoData = getDemoData(
      "subscriber-audit"
    ) as SubscriberAuditResponse | null;
    if (demoData) {
      return Response.json({ ...demoData, demo: true });
    }
  }

  try {
    // Auth check
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Subscription check (paid feature)
    if (!hasActiveSubscription(user.subscription)) {
      return Response.json(
        { error: "Subscription required", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      );
    }

    // Validate params
    const resolvedParams = await params;
    const parsedParams = ParamsSchema.safeParse(resolvedParams);
    if (!parsedParams.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsedParams.data;

    // Parse query params
    const url = new URL(req.url);
    const queryResult = QuerySchema.safeParse({
      range: url.searchParams.get("range") ?? "28d",
      limit: url.searchParams.get("limit") ?? "30",
      sort: url.searchParams.get("sort") ?? "subs_per_1k",
    });

    if (!queryResult.success) {
      return Response.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { range, limit } = queryResult.data;

    // Get channel and verify ownership
    const channel = await prisma.channel.findFirst({
      where: {
        youtubeChannelId: channelId,
        userId: user.id,
      },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Calculate date range
    const rangeDays = range === "90d" ? 90 : 28;
    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - rangeDays);

    // Get videos with metrics
    const videos = await prisma.video.findMany({
      where: {
        channelId: channel.id,
        VideoMetrics: { isNot: null },
        publishedAt: { gte: rangeStart },
      },
      include: {
        VideoMetrics: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 100,
    });

    if (videos.length === 0) {
      return Response.json({
        channelId,
        range,
        generatedAt: new Date().toISOString(),
        cachedUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        videos: [],
        patternAnalysis: { analysisJson: null, analysisMarkdownFallback: null },
        stats: {
          totalVideosAnalyzed: 0,
          avgSubsPerThousand: 0,
          totalSubscribersGained: 0,
          totalViews: 0,
          strongSubscriberDriverCount: 0,
        },
      });
    }

    // Calculate metrics for each video
    const now = new Date();
    const videosWithMetrics: SubscriberMagnetVideo[] = videos
      .filter((v) => v.VideoMetrics && v.VideoMetrics.views > 0)
      .map((v) => {
        const metrics = v.VideoMetrics!;
        const views = metrics.views;
        const viewsIn1k = views / 1000;
        const daysSincePublished = v.publishedAt
          ? Math.max(
              1,
              Math.floor(
                (now.getTime() - new Date(v.publishedAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : 1;

        // Calculate derived metrics
        const subsPerThousand = calcSubsPerThousandViews(
          metrics.subscribersGained,
          views
        );
        const commentsPer1k = viewsIn1k > 0 ? metrics.comments / viewsIn1k : 0;
        const sharesPer1k = viewsIn1k > 0 ? metrics.shares / viewsIn1k : 0;

        // Engaged rate approximation: (likes + comments + shares) / views
        // This is a proxy since we don't have engagedViews in VideoMetrics
        const engagementSum = metrics.likes + metrics.comments + metrics.shares;
        const engagedRate = views > 0 ? engagementSum / views : 0;

        return {
          videoId: v.youtubeVideoId,
          title: v.title ?? "Untitled",
          views,
          subscribersGained: metrics.subscribersGained,
          subsPerThousand,
          publishedAt: v.publishedAt?.toISOString() ?? null,
          thumbnailUrl: v.thumbnailUrl,
          durationSec: v.durationSec,
          viewsPerDay: Math.round(views / daysSincePublished),
          avdSec: metrics.averageViewDuration
            ? Math.round(metrics.averageViewDuration)
            : null,
          apv: metrics.averageViewPercentage ?? null,
          // Additional conversion metrics
          commentsPer1k: commentsPer1k > 0 ? commentsPer1k : null,
          sharesPer1k: sharesPer1k > 0 ? sharesPer1k : null,
          engagedRate: engagedRate > 0 ? engagedRate : null,
          // playlistAddsPer1k not available in VideoMetrics
          playlistAddsPer1k: null,
        };
      });

    // Calculate channel averages and percentiles for tier assignment
    const totalSubs = videosWithMetrics.reduce(
      (sum, v) => sum + v.subscribersGained,
      0
    );
    const totalViews = videosWithMetrics.reduce((sum, v) => sum + v.views, 0);
    const avgSubsPerThousand = calcSubsPerThousandViews(totalSubs, totalViews);

    // Sort by subs/1k to calculate percentile ranks
    const sortedByConversion = [...videosWithMetrics].sort(
      (a, b) => b.subsPerThousand - a.subsPerThousand
    );

    // Assign conversion tier based on percentile
    sortedByConversion.forEach((v, idx) => {
      const percentile =
        ((sortedByConversion.length - idx) / sortedByConversion.length) * 100;
      v.percentileRank = percentile;
      if (percentile >= 75) {
        v.conversionTier = "strong";
      } else if (percentile >= 25) {
        v.conversionTier = "average";
      } else {
        v.conversionTier = "weak";
      }
    });

    // Count strong subscriber-driver videos
    const strongSubscriberDriverCount = videosWithMetrics.filter(
      (v) => v.conversionTier === "strong"
    ).length;

    // Sort based on query param and take limit
    const topVideos = sortedByConversion.slice(0, limit);

    // Generate structured insights with content-hash caching
    let analysisJson: PatternAnalysisJson | null = null;
    let analysisMarkdownFallback: string | null = null;

    if (topVideos.length >= 3) {
      const topSubscriberDrivers = sortedByConversion
        .filter((v) => v.conversionTier === "strong")
        .slice(0, 10);

      // Compute content hash for the top videos
      const contentHash = hashSubscriberAuditContent(
        topSubscriberDrivers.map((v) => ({
          videoId: v.videoId,
          title: v.title,
          subsPerThousand: v.subsPerThousand,
        }))
      );

      // Check for cached analysis
      const cachedAnalysis = await prisma.subscriberAuditCache.findFirst({
        where: {
          userId: user.id,
          channelId: channel.id,
          range,
        },
      });

      const isCacheFresh =
        cachedAnalysis &&
        cachedAnalysis.cachedUntil > new Date() &&
        cachedAnalysis.contentHash === contentHash;

      if (isCacheFresh && cachedAnalysis.analysisJson) {
        console.log(
          `[subscriber-audit] Using cached LLM analysis (hash: ${contentHash})`
        );
        analysisJson = cachedAnalysis.analysisJson as PatternAnalysisJson;
      } else {
        try {
          console.log(
            `[subscriber-audit] Generating new LLM analysis (hash: ${cachedAnalysis?.contentHash} -> ${contentHash})`
          );
          const result = await generateSubscriberInsights(
            topSubscriberDrivers.map((v) => ({
              title: v.title,
              subsPerThousand: v.subsPerThousand,
              views: v.views,
              viewsPerDay: v.viewsPerDay ?? 0,
              engagedRate: v.engagedRate ?? 0,
            })),
            avgSubsPerThousand
          );

          analysisJson = result;

          // Cache the analysis
          await prisma.subscriberAuditCache.upsert({
            where: {
              userId_channelId_range: {
                userId: user.id,
                channelId: channel.id,
                range,
              },
            },
            create: {
              userId: user.id,
              channelId: channel.id,
              range,
              contentHash,
              analysisJson: result as object,
              cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
            update: {
              contentHash,
              analysisJson: result as object,
              cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });
        } catch (err) {
          console.warn("Failed to generate subscriber insights:", err);
        }
      }
    }

    // Calculate additional avg stats
    const avgEngagedRate =
      videosWithMetrics.reduce((sum, v) => sum + (v.engagedRate ?? 0), 0) /
      videosWithMetrics.length;

    const cachedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

    return Response.json({
      channelId,
      range,
      generatedAt: new Date().toISOString(),
      cachedUntil: cachedUntil.toISOString(),
      videos: topVideos,
      patternAnalysis: {
        analysisJson,
        analysisMarkdownFallback,
      },
      stats: {
        totalVideosAnalyzed: videosWithMetrics.length,
        avgSubsPerThousand,
        totalSubscribersGained: totalSubs,
        totalViews,
        strongSubscriberDriverCount,
        avgEngagedRate: avgEngagedRate > 0 ? avgEngagedRate : undefined,
      },
    } satisfies SubscriberAuditResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Subscriber audit error:", err);

    return Response.json(
      { error: "Failed to fetch subscriber audit", detail: message },
      { status: 500 }
    );
  }
}
