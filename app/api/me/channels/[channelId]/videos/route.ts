/**
 * GET /api/me/channels/[channelId]/videos
 *
 * Returns the list of videos for a channel.
 * This is FREE for all users - no subscription required.
 *
 * Auth: Required
 * Subscription: NOT required
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { getCurrentUser } from "@/lib/user";
import { isDemoMode, getDemoData, isYouTubeMockMode } from "@/lib/demo-fixtures";
import { getGoogleAccount } from "@/lib/youtube-api";
import { ensureMockChannelSeeded } from "@/lib/mock-seed";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  // Return demo data if demo mode is enabled
  if (isDemoMode() && !isYouTubeMockMode()) {
    const demoData = getDemoData("retention"); // Reuse retention fixture for video list
    const videos = (demoData as any)?.videos ?? [];
    return Response.json({
      videos: videos.map((v: any) => ({
        videoId: v.videoId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        durationSec: v.durationSec,
        publishedAt: v.publishedAt,
        views: v.views ?? 0,
        likes: v.likes ?? 0,
        comments: v.comments ?? 0,
      })),
      demo: true,
    });
  }

  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate params
    const paramsObj = await params;
    const parsed = ParamsSchema.safeParse(paramsObj);
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
          take: 50,
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

    // In YT_MOCK_MODE, auto-seed the channel/videos if missing
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
            take: 50,
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

    // Get video metrics from VideoMetrics table for additional data
    const videoIds = channel.Video.map((v) => v.id);
    const metrics = await prisma.videoMetrics.findMany({
      where: { videoId: { in: videoIds } },
      orderBy: { fetchedAt: "desc" },
      distinct: ["videoId"],
    });

    const metricsMap = new Map(metrics.map((m) => [m.videoId, m]));

    const videos = channel.Video.map((v) => {
      const m = metricsMap.get(v.id);
      return {
        videoId: v.youtubeVideoId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        durationSec: v.durationSec,
        publishedAt: v.publishedAt,
        views: m?.views ?? 0,
        likes: m?.likes ?? 0,
        comments: m?.comments ?? 0,
      };
    });

    return Response.json({
      channelId,
      videos,
      total: videos.length,
    });
  } catch (err: any) {
    console.error("Videos list error:", err);
    return Response.json(
      { error: "Failed to fetch videos", detail: err.message },
      { status: 500 }
    );
  }
}

