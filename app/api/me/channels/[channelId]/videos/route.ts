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
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUser } from "@/lib/user";
import { isDemoMode, getDemoData, isYouTubeMockMode } from "@/lib/demo-fixtures";
import { getGoogleAccount } from "@/lib/youtube-api";
import { ensureMockChannelSeeded } from "@/lib/mock-seed";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

// Page size divisible by 6 for even grid layouts (1, 2, or 3 columns)
const DEFAULT_PAGE_SIZE = 24;

async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  // Parse pagination params from URL
  const url = new URL(req.url);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);
  const limit = Math.min(48, Math.max(6, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE));

  // Return demo data if demo mode is enabled
  if (isDemoMode() && !isYouTubeMockMode()) {
    const demoData = getDemoData("retention"); // Reuse retention fixture for video list
    const allVideos = (demoData as any)?.videos ?? [];
    const paginatedVideos = allVideos.slice(offset, offset + limit);
    return Response.json({
      videos: paginatedVideos.map((v: any) => ({
        videoId: v.videoId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        durationSec: v.durationSec,
        publishedAt: v.publishedAt,
        views: v.views ?? 0,
        likes: v.likes ?? 0,
        comments: v.comments ?? 0,
      })),
      pagination: {
        offset,
        limit,
        total: allVideos.length,
        hasMore: offset + limit < allVideos.length,
      },
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
    // Filter out unlisted videos (only show public videos on the dashboard)
    let channel = await prisma.channel.findFirst({
      where: {
        youtubeChannelId: channelId,
        userId: user.id,
      },
      include: {
        Video: {
          where: {
            OR: [
              { privacyStatus: "public" },
              { privacyStatus: null }, // Include videos synced before we tracked privacy status
            ],
          },
          orderBy: { publishedAt: "desc" },
          skip: offset,
          take: limit,
          select: {
            id: true,
            youtubeVideoId: true,
            title: true,
            thumbnailUrl: true,
            durationSec: true,
            publishedAt: true,
          },
        },
        _count: {
          select: {
            Video: {
              where: {
                OR: [
                  { privacyStatus: "public" },
                  { privacyStatus: null },
                ],
              },
            },
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
            where: {
              OR: [
                { privacyStatus: "public" },
                { privacyStatus: null },
              ],
            },
            orderBy: { publishedAt: "desc" },
            skip: offset,
            take: limit,
            select: {
              id: true,
              youtubeVideoId: true,
              title: true,
              thumbnailUrl: true,
              durationSec: true,
              publishedAt: true,
            },
          },
          _count: {
            select: {
              Video: {
                where: {
                  OR: [
                    { privacyStatus: "public" },
                    { privacyStatus: null },
                  ],
                },
              },
            },
          },
        },
      });
    }

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Get total count for pagination
    const totalSynced = channel._count?.Video ?? channel.Video.length;

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
      pagination: {
        offset,
        limit,
        total: totalSynced,
        hasMore: offset + limit < totalSynced,
      },
    });
  } catch (err: any) {
    console.error("Videos list error:", err);
    return Response.json(
      { error: "Failed to fetch videos", detail: err.message },
      { status: 500 }
    );
  }
}

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos" },
  async (req, ctx) => GETHandler(req, ctx as any)
);

