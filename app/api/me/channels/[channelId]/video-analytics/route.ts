/**
 * GET /api/me/channels/[channelId]/video-analytics
 *
 * Fetch/cache retention curves and compute cliff analysis for videos.
 * Available to all users with usage limits:
 * - FREE: 5 analyses per day
 * - PRO: 100 analyses per day
 *
 * Auth: Required
 * Entitlement: owned_video_analysis (usage-limited, not locked)
 * Rate limit: 20 per hour per channel
 * Caching: 12-24 hours
 *
 * Demo mode: Returns fixture data when NEXT_PUBLIC_DEMO_MODE=1 or on API failure
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { getGoogleAccount, fetchRetentionCurve } from "@/lib/youtube-api";
import { computeRetentionCliff, formatTimestamp } from "@/lib/retention";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import {
  isDemoMode,
  getDemoData,
  isYouTubeMockMode,
} from "@/lib/demo-fixtures";
import { ensureMockChannelSeeded } from "@/lib/mock-seed";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  // Return demo data if demo mode is enabled
  if (isDemoMode() && !isYouTubeMockMode()) {
    const demoData = getDemoData("retention");
    return Response.json({ ...(demoData as object), demo: true });
  }

  try {
    // Check entitlement (includes auth check and usage limit)
    // Set increment: false initially - we'll only increment if we actually fetch new data
    const entitlementResult = await checkEntitlement({
      featureKey: "owned_video_analysis",
      increment: false, // Don't increment yet - only if we fetch new data
    });

    if (!entitlementResult.ok) {
      return entitlementErrorResponse(entitlementResult.error);
    }

    const { user, plan, usage } = entitlementResult.context;

    // Validate params
    const parsed = ParamsSchema.safeParse(params);
    if (!parsed.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsed.data;

    // Get channel and verify ownership
    let channel = await prisma.channel.findFirst({
      where: {
        youtubeChannelId: channelId,
        userId: user.id,
      },
      include: {
        Video: {
          orderBy: { publishedAt: "desc" },
          take: 10,
          select: {
            id: true,
            youtubeVideoId: true,
            title: true,
            thumbnailUrl: true,
            durationSec: true,
            publishedAt: true,
          },
        },
      },
    });

    // In YT_MOCK_MODE, auto-seed the channel/videos if missing so pages work immediately.
    if (!channel && isYouTubeMockMode()) {
      const ga = await getGoogleAccount(user.id, channelId);
      if (!ga) {
        return Response.json(
          { error: "Google account not connected" },
          { status: 400 }
        );
      }
      await ensureMockChannelSeeded({
        userId: user.id,
        youtubeChannelId: channelId,
        minVideos: 25,
        ga,
      });
      channel = await prisma.channel.findFirst({
        where: { youtubeChannelId: channelId, userId: user.id },
        include: {
          Video: {
            orderBy: { publishedAt: "desc" },
            take: 10,
            select: {
              id: true,
              youtubeVideoId: true,
              title: true,
              thumbnailUrl: true,
              durationSec: true,
              publishedAt: true,
            },
          },
        },
      });
    }

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.Video.length === 0) {
      return Response.json({
        videos: [],
        message: "No videos found. Please sync the channel first.",
      });
    }

    // Rate limit check
    const rateKey = rateLimitKey("retentionFetch", channel.id);
    const rateResult = checkRateLimit(rateKey, RATE_LIMITS.retentionFetch);
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
      return Response.json(
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    // Check for cached retention data
    const existingRetention = await prisma.retentionBlob.findMany({
      where: {
        channelId: channel.id,
        videoId: { in: channel.Video.map((v) => v.id) },
        cachedUntil: { gt: new Date() },
      },
    });

    const cachedVideoIds = new Set(existingRetention.map((r) => r.videoId));
    const videosToFetch = channel.Video.filter(
      (v) => !cachedVideoIds.has(v.id)
    );

    // If we need to fetch new data, check if we have usage remaining and increment
    if (videosToFetch.length > 0) {
      // Re-check with increment to count this usage
      const usageResult = await checkEntitlement({
        featureKey: "owned_video_analysis",
        increment: true,
      });

      if (!usageResult.ok) {
        return entitlementErrorResponse(usageResult.error);
      }
    }

    // Fetch retention for uncached videos IN PARALLEL (much faster)
    const cachedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

    await Promise.allSettled(
      videosToFetch.map(async (video) => {
        try {
          const points = await fetchRetentionCurve(
            ga,
            channelId,
            video.youtubeVideoId
          );

          // Compute cliff
          const cliff = computeRetentionCliff(video.durationSec ?? 0, points);

          await prisma.retentionBlob.upsert({
            where: { videoId: video.id },
            update: {
              dataJson: JSON.stringify(points),
              cliffTimeSec: cliff?.cliffTimeSec ?? null,
              cliffReason: cliff?.cliffReason ?? null,
              cliffSlope: cliff?.slope ?? null,
              fetchedAt: new Date(),
              cachedUntil,
            },
            create: {
              videoId: video.id,
              channelId: channel.id,
              dataJson: JSON.stringify(points),
              cliffTimeSec: cliff?.cliffTimeSec ?? null,
              cliffReason: cliff?.cliffReason ?? null,
              cliffSlope: cliff?.slope ?? null,
              cachedUntil,
            },
          });
        } catch (err) {
          console.error(
            `Failed to fetch retention for video ${video.youtubeVideoId}:`,
            err
          );
          // Continue with other videos (Promise.allSettled handles this)
        }
      })
    );

    // Fetch all retention data (including newly fetched)
    const allRetention = await prisma.retentionBlob.findMany({
      where: {
        channelId: channel.id,
        videoId: { in: channel.Video.map((v) => v.id) },
      },
    });

    // Build response
    const retentionMap = new Map(allRetention.map((r) => [r.videoId, r]));

    const videos = channel.Video.map((v) => {
      const retention = retentionMap.get(v.id);
      return {
        videoId: v.youtubeVideoId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        durationSec: v.durationSec,
        publishedAt: v.publishedAt,
        retention: retention
          ? {
              hasData: true,
              cliffTimeSec: retention.cliffTimeSec,
              cliffTimestamp: retention.cliffTimeSec
                ? formatTimestamp(retention.cliffTimeSec)
                : null,
              cliffReason: retention.cliffReason,
              cliffSlope: retention.cliffSlope,
              fetchedAt: retention.fetchedAt,
              cachedUntil: retention.cachedUntil,
            }
          : {
              hasData: false,
              error: "No retention data available",
            },
      };
    });

    return Response.json({
      channelId,
      videos,
      fetchedAt: new Date(),
      usage: usage
        ? {
            used: usage.used + (videosToFetch.length > 0 ? 1 : 0),
            limit: usage.limit,
            resetAt: usage.resetAt,
          }
        : undefined,
    });
  } catch (err: any) {
    console.error("Video analytics error:", err);
    return Response.json(
      { error: "Failed to fetch video analytics", detail: err.message },
      { status: 500 }
    );
  }
}
