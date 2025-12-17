/**
 * GET /api/me/channels/[channelId]/retention
 *
 * Fetch/cache retention curves and compute cliff analysis for last 10 videos.
 * This is a PAID feature - requires active subscription.
 *
 * Auth: Required
 * Subscription: Required
 * Rate limit: 20 per hour per channel
 * Caching: 12-24 hours
 *
 * Demo mode: Returns fixture data when NEXT_PUBLIC_DEMO_MODE=1 or on API failure
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import {
  getCurrentUserWithSubscription,
  hasActiveSubscription,
} from "@/lib/user";
import { getGoogleAccount, fetchRetentionCurve } from "@/lib/youtube-api";
import { computeRetentionCliff, formatTimestamp } from "@/lib/retention";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { isDemoMode, getDemoData } from "@/lib/demo-fixtures";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  // Return demo data if demo mode is enabled
  if (isDemoMode()) {
    const demoData = getDemoData("retention");
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
    const parsed = ParamsSchema.safeParse(params);
    if (!parsed.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsed.data;

    // Get channel and verify ownership
    const channel = await prisma.channel.findFirst({
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
            durationSec: true,
            publishedAt: true,
          },
        },
      },
    });

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

    // Get Google account
    const ga = await getGoogleAccount(user.id);
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

    // Fetch retention for uncached videos
    const cachedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

    for (const video of videosToFetch) {
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
        // Continue with other videos
      }
    }

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
    });
  } catch (err: any) {
    console.error("Retention error:", err);

    // Return demo data as fallback on error
    const demoData = getDemoData("retention");
    if (demoData) {
      return Response.json({
        ...(demoData as object),
        demo: true,
        error: "Using demo data - actual fetch failed",
      });
    }

    return Response.json(
      { error: "Failed to fetch retention data", detail: err.message },
      { status: 500 }
    );
  }
}
