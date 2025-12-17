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
 * - range: "7d" | "28d" (default: "28d")
 * - limit: number (default: 20, max: 50)
 * - sort: "subs_per_1k" | "views_per_day" | "apv" | "avd" (default: "subs_per_1k")
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { getCurrentUserWithSubscription, hasActiveSubscription } from "@/lib/user";
import { calcSubsPerThousandViews } from "@/lib/retention";
import { generateSubscriberMagnetAnalysisJson } from "@/lib/llm";
import { isDemoMode, getDemoData } from "@/lib/demo-fixtures";
import type { PatternAnalysisJson, SubscriberMagnetVideo } from "@/types/api";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["7d", "28d"]).default("28d"),
  limit: z.coerce.number().min(1).max(50).default(20),
  sort: z.enum(["subs_per_1k", "views_per_day", "apv", "avd"]).default("subs_per_1k"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  // Return demo data if demo mode is enabled
  if (isDemoMode()) {
    const demoData = getDemoData("subscriber-audit");
    return Response.json({ ...(demoData as object), demo: true });
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
    const parsedParams = ParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsedParams.data;

    // Parse query params
    const url = new URL(req.url);
    const queryResult = QuerySchema.safeParse({
      range: url.searchParams.get("range") ?? "28d",
      limit: url.searchParams.get("limit") ?? "20",
      sort: url.searchParams.get("sort") ?? "subs_per_1k",
    });

    if (!queryResult.success) {
      return Response.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { range, limit, sort } = queryResult.data;

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
    const rangeDays = range === "7d" ? 7 : 28;
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
      take: 50,
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
        },
      });
    }

    // Calculate metrics for each video
    const now = new Date();
    const videosWithMetrics: SubscriberMagnetVideo[] = videos
      .filter((v) => v.VideoMetrics && v.VideoMetrics.views > 0)
      .map((v) => {
        const metrics = v.VideoMetrics!;
        const daysSincePublished = v.publishedAt
          ? Math.max(1, Math.floor((now.getTime() - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24)))
          : 1;

        return {
          videoId: v.youtubeVideoId,
          title: v.title ?? "Untitled",
          views: metrics.views,
          subscribersGained: metrics.subscribersGained,
          subsPerThousand: calcSubsPerThousandViews(metrics.subscribersGained, metrics.views),
          publishedAt: v.publishedAt?.toISOString() ?? null,
          thumbnailUrl: v.thumbnailUrl,
          durationSec: v.durationSec,
          viewsPerDay: Math.round(metrics.views / daysSincePublished),
          avdSec: metrics.averageViewDuration ? Math.round(metrics.averageViewDuration) : null,
          apv: metrics.averageViewPercentage ?? null,
        };
      });

    // Sort based on query param
    const sortFn = {
      subs_per_1k: (a: SubscriberMagnetVideo, b: SubscriberMagnetVideo) => b.subsPerThousand - a.subsPerThousand,
      views_per_day: (a: SubscriberMagnetVideo, b: SubscriberMagnetVideo) => (b.viewsPerDay ?? 0) - (a.viewsPerDay ?? 0),
      apv: (a: SubscriberMagnetVideo, b: SubscriberMagnetVideo) => (b.apv ?? 0) - (a.apv ?? 0),
      avd: (a: SubscriberMagnetVideo, b: SubscriberMagnetVideo) => (b.avdSec ?? 0) - (a.avdSec ?? 0),
    }[sort];

    videosWithMetrics.sort(sortFn);
    const topVideos = videosWithMetrics.slice(0, limit);

    // Generate pattern analysis (JSON format)
    let analysisJson: PatternAnalysisJson | null = null;
    let analysisMarkdownFallback: string | null = null;

    if (topVideos.length >= 3) {
      try {
        const llmResult = await generateSubscriberMagnetAnalysisJson(
          topVideos.slice(0, 10).map((v) => ({
            title: v.title,
            subsPerThousand: v.subsPerThousand,
            views: v.views,
            viewsPerDay: v.viewsPerDay ?? 0,
          }))
        );
        analysisJson = llmResult.json;
        analysisMarkdownFallback = llmResult.markdown;
      } catch (err) {
        console.warn("Failed to generate subscriber analysis:", err);
      }
    }

    // Calculate channel averages
    const totalSubs = videosWithMetrics.reduce((sum, v) => sum + v.subscribersGained, 0);
    const totalViews = videosWithMetrics.reduce((sum, v) => sum + v.views, 0);
    const avgSubsPerThousand = calcSubsPerThousandViews(totalSubs, totalViews);

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
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Subscriber audit error:", err);
    
    // Return demo data as fallback on error
    const demoData = getDemoData("subscriber-audit");
    if (demoData) {
      return Response.json({
        ...(demoData as object),
        demo: true,
        error: "Using demo data - actual fetch failed",
      });
    }
    
    return Response.json(
      { error: "Failed to fetch subscriber audit", detail: message },
      { status: 500 }
    );
  }
}
