/**
 * POST /api/me/channels/[channelId]/sync
 *
 * Sync last ~100 videos for a channel from YouTube Data API.
 * Also fetches metrics from YouTube Analytics API.
 *
 * Auth: Required
 * Entitlements: channel_sync (3/day FREE, 50/day PRO)
 * Rate limit: 10 per hour per channel
 * Caching: Updates lastSyncedAt, short-circuits if synced within 5 minutes
 */

// Number of videos to sync (divisible by 6 for grid layout)
const SYNC_VIDEO_COUNT = 96;
import { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { getGoogleAccount, fetchChannelVideos, fetchVideoMetrics } from "@/lib/youtube-api";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";
import { createApiRoute } from "@/lib/api/route";
import { channelParamsSchema } from "@/lib/competitors/video-detail/validation";

async function POSTHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  void req;
  try {
    // Validate params first (before auth/entitlement to give useful error)
    const paramsObj = await params;
    const parsed = channelParamsSchema.safeParse(paramsObj);
    if (!parsed.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }
    const { channelId } = parsed.data;

    // Entitlement check - channel sync is a usage-limited feature
    const entitlementResult = await checkEntitlement({
      featureKey: "channel_sync",
      increment: false, // We'll increment only if not recently synced
    });
    if (!entitlementResult.ok) {
      return entitlementErrorResponse(entitlementResult.error);
    }
    const user = entitlementResult.context.user;

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

    // Check if recently synced (within 5 minutes) - this doesn't count against limit
    if (channel.lastSyncedAt) {
      const minsSinceSync = (Date.now() - channel.lastSyncedAt.getTime()) / 60000;
      if (minsSinceSync < 5) {
        return Response.json({
          message: "Channel recently synced",
          lastSyncedAt: channel.lastSyncedAt,
          nextSyncAvailableAt: new Date(channel.lastSyncedAt.getTime() + 5 * 60000),
        });
      }
    }

    // Now increment usage since we're actually going to sync
    const { checkAndIncrement } = await import("@/lib/usage");
    const { getLimit, getPlanFromSubscription } = await import("@/lib/entitlements");
    const { getSubscriptionStatus } = await import("@/lib/stripe");
    
    const subscription = await getSubscriptionStatus(user.id);
    const plan = getPlanFromSubscription(subscription);
    const limit = getLimit(plan, "channel_sync");
    
    const usageResult = await checkAndIncrement({
      userId: user.id,
      featureKey: "channel_sync",
      limit,
    });
    
    if (!usageResult.allowed) {
      return Response.json(
        {
          error: "limit_reached",
          featureKey: "channel_sync",
          used: usageResult.used,
          limit: usageResult.limit,
          remaining: usageResult.remaining,
          resetAt: usageResult.resetAt,
          upgrade: plan === "FREE",
        },
        { status: 403 }
      );
    }

    // Rate limit check (per-hour limit for API protection)
    const rateKey = rateLimitKey("videoSync", channel.id);
    const rateResult = checkRateLimit(rateKey, RATE_LIMITS.videoSync);
    if (!rateResult.success) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          resetAt: new Date(rateResult.resetAt),
        },
        { status: 429 }
      );
    }

    // Get Google account for this channel
    const ga = await getGoogleAccount(user.id, channelId);
    if (!ga) {
      return Response.json({ error: "Google account not connected" }, { status: 400 });
    }

    // Update sync status
    await prisma.channel.update({
      where: { id: channel.id },
      data: { syncStatus: "running" },
    });

    try {
      // Fetch videos from YouTube
      const videos = await fetchChannelVideos(ga, channelId, SYNC_VIDEO_COUNT);

      // Upsert videos
      for (const v of videos) {
        await prisma.video.upsert({
          where: {
            channelId_youtubeVideoId: {
              channelId: channel.id,
              youtubeVideoId: v.videoId,
            },
          },
          update: {
            title: v.title,
            description: v.description,
            publishedAt: new Date(v.publishedAt),
            durationSec: v.durationSec,
            tags: v.tags,
            thumbnailUrl: v.thumbnailUrl,
          },
          create: {
            channelId: channel.id,
            youtubeVideoId: v.videoId,
            title: v.title,
            description: v.description,
            publishedAt: new Date(v.publishedAt),
            durationSec: v.durationSec,
            tags: v.tags,
            thumbnailUrl: v.thumbnailUrl,
          },
        });
      }

      // Fetch analytics metrics for videos (for engagement metrics like watch time)
      const videoIds = videos.map((v) => v.videoId);
      const endDate = new Date().toISOString().split("T")[0];
      // Use lifetime date range for subscriber data (YouTube Analytics supports back to 2015)
      // This ensures subscribersGained reflects all-time, not just recent 28 days
      const lifetimeStartDate = "2015-01-01";

      const analyticsMetrics = await fetchVideoMetrics(ga, channelId, videoIds, lifetimeStartDate, endDate);
      const analyticsMap = new Map(analyticsMetrics.map((m) => [m.videoId, m]));

      // Create a map of Data API statistics (total lifetime views, likes, comments)
      const dataApiStatsMap = new Map(videos.map((v) => [v.videoId, { views: v.views, likes: v.likes, comments: v.comments }]));

      // Get video DB IDs
      const dbVideos = await prisma.video.findMany({
        where: {
          channelId: channel.id,
          youtubeVideoId: { in: videoIds },
        },
        select: { id: true, youtubeVideoId: true },
      });

      const videoIdMap = new Map(dbVideos.map((v) => [v.youtubeVideoId, v.id]));

      // Upsert metrics - use Data API for views/likes/comments (total), Analytics API for engagement metrics
      const cachedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
      for (const videoId of videoIds) {
        const videoDbId = videoIdMap.get(videoId);
        if (!videoDbId) continue;

        const dataStats = dataApiStatsMap.get(videoId) ?? { views: 0, likes: 0, comments: 0 };
        const analytics = analyticsMap.get(videoId);

        await prisma.videoMetrics.upsert({
          where: { videoId: videoDbId },
          update: {
            // Use Data API statistics for total counts (what users see on YouTube)
            views: dataStats.views,
            likes: dataStats.likes,
            comments: dataStats.comments,
            // Use Analytics API for engagement metrics
            shares: analytics?.shares ?? 0,
            subscribersGained: analytics?.subscribersGained ?? 0,
            subscribersLost: analytics?.subscribersLost ?? 0,
            estimatedMinutesWatched: analytics?.estimatedMinutesWatched ?? 0,
            averageViewDuration: analytics?.averageViewDuration ?? 0,
            averageViewPercentage: analytics?.averageViewPercentage ?? 0,
            fetchedAt: new Date(),
            cachedUntil,
          },
          create: {
            videoId: videoDbId,
            channelId: channel.id,
            views: dataStats.views,
            likes: dataStats.likes,
            comments: dataStats.comments,
            shares: analytics?.shares ?? 0,
            subscribersGained: analytics?.subscribersGained ?? 0,
            subscribersLost: analytics?.subscribersLost ?? 0,
            estimatedMinutesWatched: analytics?.estimatedMinutesWatched ?? 0,
            averageViewDuration: analytics?.averageViewDuration ?? 0,
            averageViewPercentage: analytics?.averageViewPercentage ?? 0,
            cachedUntil,
          },
        });
      }

      // Update channel sync status
      await prisma.channel.update({
        where: { id: channel.id },
        data: {
          lastSyncedAt: new Date(),
          syncStatus: "idle",
          syncError: null,
        },
      });

      return Response.json({
        success: true,
        videosCount: videos.length,
        metricsCount: videoIds.length,
        lastSyncedAt: new Date(),
      });
    } catch (err: any) {
      // Update channel with error
      await prisma.channel.update({
        where: { id: channel.id },
        data: {
          syncStatus: "error",
          syncError: err.message,
        },
      });
      throw err;
    }
  } catch (err: any) {
    console.error("Sync error:", err);
    return Response.json(
      { error: "Sync failed", detail: err.message },
      { status: 500 }
    );
  }
}

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/sync" },
  async (req, ctx) => POSTHandler(req, ctx as any)
);

