/**
 * GET /api/me/channels/[channelId]/videos
 *
 * Returns the list of videos for a channel.
 * This is FREE for all users - no subscription required.
 *
 * Auto-syncs channel data if stale (>24h since last sync).
 * Sync runs synchronously (blocks until complete) to work properly in serverless.
 * Client shows loading skeletons while waiting for response.
 *
 * Auth: Required
 * Subscription: NOT required
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUser } from "@/lib/user";
import {
  isDemoMode,
  getDemoData,
  isYouTubeMockMode,
} from "@/lib/demo-fixtures";
import { getGoogleAccount, fetchChannelVideos } from "@/lib/youtube-api";
import { ensureMockChannelSeeded } from "@/lib/mock-seed";

// 12 hours in milliseconds - data older than this triggers a sync
const STALE_THRESHOLD_MS = 12 * 60 * 60 * 1000;

// 5 minutes - if a sync has been "running" longer than this, consider it stuck
const SYNC_TIMEOUT_MS = 5 * 60 * 1000;

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

// Page size divisible by 6 for even grid layouts (1, 2, or 3 columns)
const DEFAULT_PAGE_SIZE = 24;

// Number of videos to sync (divisible by 6 for grid layout)
const SYNC_VIDEO_COUNT = 96;

/**
 * Sync channel videos from YouTube.
 * Runs synchronously - blocks until complete so serverless functions don't terminate early.
 */
async function syncChannelVideos(
  userId: number,
  youtubeChannelId: string,
  channelDbId: number
): Promise<{ success: boolean; videosCount: number }> {
  const ga = await getGoogleAccount(userId, youtubeChannelId);
  if (!ga) {
    console.warn(`[videos] No Google account for sync: ${youtubeChannelId}`);
    return { success: false, videosCount: 0 };
  }

  // Mark channel as syncing
  await prisma.channel.update({
    where: { id: channelDbId },
    data: { syncStatus: "running" },
  });

  try {
    // Fetch videos from YouTube
    const videos = await fetchChannelVideos(
      ga,
      youtubeChannelId,
      SYNC_VIDEO_COUNT
    );

    // Cache expiration for metrics (12 hours)
    const cachedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000);

    // Upsert videos and metrics
    for (const v of videos) {
      const video = await prisma.video.upsert({
        where: {
          channelId_youtubeVideoId: {
            channelId: channelDbId,
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
          channelId: channelDbId,
          youtubeVideoId: v.videoId,
          title: v.title,
          description: v.description,
          publishedAt: new Date(v.publishedAt),
          durationSec: v.durationSec,
          tags: v.tags,
          thumbnailUrl: v.thumbnailUrl,
        },
      });

      // Upsert VideoMetrics with Data API statistics
      await prisma.videoMetrics.upsert({
        where: { videoId: video.id },
        update: {
          views: v.views,
          likes: v.likes,
          comments: v.comments,
          fetchedAt: new Date(),
          cachedUntil,
        },
        create: {
          videoId: video.id,
          channelId: channelDbId,
          views: v.views,
          likes: v.likes,
          comments: v.comments,
          cachedUntil,
        },
      });
    }

    // Update channel sync status
    await prisma.channel.update({
      where: { id: channelDbId },
      data: {
        lastSyncedAt: new Date(),
        syncStatus: "idle",
        syncError: null,
      },
    });

    console.log(
      `[videos] Sync completed for ${youtubeChannelId}: ${videos.length} videos`
    );
    return { success: true, videosCount: videos.length };
  } catch (err: any) {
    console.error(`[videos] Sync error for ${youtubeChannelId}:`, err);
    await prisma.channel.update({
      where: { id: channelDbId },
      data: {
        syncStatus: "error",
        syncError: err.message,
      },
    });
    return { success: false, videosCount: 0 };
  }
}

async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  // Parse pagination params from URL
  const url = new URL(req.url);
  const offset = Math.max(
    0,
    parseInt(url.searchParams.get("offset") ?? "0", 10) || 0
  );
  const limit = Math.min(
    48,
    Math.max(
      6,
      parseInt(
        url.searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE),
        10
      ) || DEFAULT_PAGE_SIZE
    )
  );

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
        // Extended metrics for Video Tools
        shares: v.shares ?? null,
        subscribersGained: v.subscribersGained ?? null,
        subscribersLost: v.subscribersLost ?? null,
        estimatedMinutesWatched: v.estimatedMinutesWatched ?? null,
        avgViewDuration: v.avgViewDuration ?? null,
        avgViewPercentage: v.avgViewPercentage ?? null,
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
                OR: [{ privacyStatus: "public" }, { privacyStatus: null }],
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
              OR: [{ privacyStatus: "public" }, { privacyStatus: null }],
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
                  OR: [{ privacyStatus: "public" }, { privacyStatus: null }],
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

    // Check if data is stale (>24h) or sync is stuck and needs to be re-run
    const now = Date.now();
    const lastSyncTime = channel.lastSyncedAt?.getTime() ?? 0;
    const isStale = now - lastSyncTime > STALE_THRESHOLD_MS;
    const isSyncRunning = channel.syncStatus === "running";

    // Detect stuck sync: if status is "running" but lastSyncedAt is very old
    // (sync should have updated lastSyncedAt when it completed successfully)
    // If it's been "running" for more than 5 minutes without completing, it's stuck
    const isSyncStuck = isSyncRunning && now - lastSyncTime > SYNC_TIMEOUT_MS;

    // Run sync synchronously if needed - this blocks until complete
    // so we can return fresh data. The client shows loading skeletons while waiting.
    if (isStale || isSyncStuck) {
      if (isSyncStuck) {
        console.log(
          `[videos] Sync stuck for ${channelId} (running for ${Math.round(
            (now - lastSyncTime) / 60000
          )}min), restarting...`
        );
      }

      // Run sync and wait for it to complete
      await syncChannelVideos(user.id, channelId, channel.id);

      // Re-query channel with fresh video data
      channel = await prisma.channel.findFirst({
        where: {
          youtubeChannelId: channelId,
          userId: user.id,
        },
        include: {
          Video: {
            where: {
              OR: [{ privacyStatus: "public" }, { privacyStatus: null }],
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
                  OR: [{ privacyStatus: "public" }, { privacyStatus: null }],
                },
              },
            },
          },
        },
      });

      if (!channel) {
        return Response.json(
          { error: "Channel not found after sync" },
          { status: 404 }
        );
      }
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
        // Extended metrics for Video Tools
        shares: m?.shares ?? null,
        subscribersGained: m?.subscribersGained ?? null,
        subscribersLost: m?.subscribersLost ?? null,
        estimatedMinutesWatched: m?.estimatedMinutesWatched ?? null,
        avgViewDuration: m?.averageViewDuration ?? null,
        avgViewPercentage: m?.averageViewPercentage ?? null,
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
      // Sync always completes before response (no longer fire-and-forget)
      syncing: false,
      lastSyncedAt: channel.lastSyncedAt?.toISOString() ?? null,
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
