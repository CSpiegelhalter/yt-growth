/**
 * POST /api/me/channels/[channelId]/sync
 *
 * Sync last ~25 videos for a channel from YouTube Data API.
 * Also fetches metrics from YouTube Analytics API.
 *
 * Auth: Required
 * Entitlements: channel_sync (3/day FREE, 50/day PRO)
 * Rate limit: 10 per hour per channel
 * Caching: Updates lastSyncedAt, short-circuits if synced within 5 minutes
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { getCurrentUser } from "@/lib/user";
import { getGoogleAccount, fetchChannelVideos, fetchVideoMetrics } from "@/lib/youtube-api";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    // Validate params first (before auth/entitlement to give useful error)
    const paramsObj = await params;
    const parsed = ParamsSchema.safeParse(paramsObj);
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
      // Fetch videos from YouTube (we only need ~25 recent videos)
      const videos = await fetchChannelVideos(ga, channelId, 25);

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

      // Fetch metrics for videos
      const videoIds = videos.map((v) => v.videoId);
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const metrics = await fetchVideoMetrics(ga, channelId, videoIds, startDate, endDate);

      // Get video DB IDs
      const dbVideos = await prisma.video.findMany({
        where: {
          channelId: channel.id,
          youtubeVideoId: { in: videoIds },
        },
        select: { id: true, youtubeVideoId: true },
      });

      const videoIdMap = new Map(dbVideos.map((v) => [v.youtubeVideoId, v.id]));

      // Upsert metrics
      const cachedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
      for (const m of metrics) {
        const videoDbId = videoIdMap.get(m.videoId);
        if (!videoDbId) continue;

        await prisma.videoMetrics.upsert({
          where: { videoId: videoDbId },
          update: {
            views: m.views,
            likes: m.likes,
            comments: m.comments,
            shares: m.shares,
            subscribersGained: m.subscribersGained,
            subscribersLost: m.subscribersLost,
            estimatedMinutesWatched: m.estimatedMinutesWatched,
            averageViewDuration: m.averageViewDuration,
            averageViewPercentage: m.averageViewPercentage,
            fetchedAt: new Date(),
            cachedUntil,
          },
          create: {
            videoId: videoDbId,
            channelId: channel.id,
            views: m.views,
            likes: m.likes,
            comments: m.comments,
            shares: m.shares,
            subscribersGained: m.subscribersGained,
            subscribersLost: m.subscribersLost,
            estimatedMinutesWatched: m.estimatedMinutesWatched,
            averageViewDuration: m.averageViewDuration,
            averageViewPercentage: m.averageViewPercentage,
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
        metricsCount: metrics.length,
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

