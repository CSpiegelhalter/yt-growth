/**
 * DELETE /api/me/channels/[channelId]
 *
 * Unlink a YouTube channel from the user's account.
 *
 * Auth: Required
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUser } from "@/lib/user";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

async function DELETEHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  void req;
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

    // Find and verify ownership
    const channel = await prisma.channel.findFirst({
      where: {
        youtubeChannelId: channelId,
        userId: user.id,
      },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Clear all caches related to this channel BEFORE deleting
    // These tables don't have foreign key cascades
    await Promise.all([
      // Similar channels cache
      prisma.similarChannelsCache.deleteMany({
        where: { userId: user.id, channelId: channel.id },
      }),
      // Competitor feed cache
      prisma.competitorFeedCache.deleteMany({
        where: { userId: user.id, channelId: channel.id },
      }),
      // Owned video analytics (daily data)
      prisma.ownedVideoAnalyticsDay.deleteMany({
        where: { userId: user.id, channelId: channel.id },
      }),
      // Owned video insights cache
      prisma.ownedVideoInsightsCache.deleteMany({
        where: { userId: user.id, channelId: channel.id },
      }),
      // Owned video remix cache
      prisma.ownedVideoRemixCache.deleteMany({
        where: { userId: user.id, channelId: channel.id },
      }),
      // Subscriber audit cache
      prisma.subscriberAuditCache.deleteMany({
        where: { userId: user.id, channelId: channel.id },
      }),
      // Saved ideas for this channel (keep user's ideas but clear channel association)
      prisma.savedIdea.updateMany({
        where: { userId: user.id, channelId: channel.id },
        data: { channelId: null },
      }),
    ]);

    console.log(
      `[Channel Delete] Cleared caches for channel ${channel.id} (user ${user.id})`
    );

    // Delete channel (cascades to videos, metrics, retention, plans via FK)
    await prisma.channel.delete({
      where: { id: channel.id },
    });

    return Response.json({ success: true, message: "Channel unlinked" });
  } catch (err: any) {
    console.error("Delete channel error:", err);
    return Response.json(
      { error: "Failed to unlink channel", detail: err.message },
      { status: 500 }
    );
  }
}

export const DELETE = createApiRoute(
  { route: "/api/me/channels/[channelId]" },
  async (req, ctx) => DELETEHandler(req, ctx as any)
);

/**
 * GET /api/me/channels/[channelId]
 *
 * Get details for a specific channel.
 *
 * Auth: Required
 */
async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  void req;
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

    // Find and verify ownership
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
            publishedAt: true,
            thumbnailUrl: true,
          },
        },
        _count: {
          select: {
            Video: true,
            Plan: true,
          },
        },
      },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    return Response.json({
      id: channel.id,
      youtubeChannelId: channel.youtubeChannelId,
      title: channel.title,
      thumbnailUrl: channel.thumbnailUrl,
      connectedAt: channel.connectedAt,
      lastSyncedAt: channel.lastSyncedAt,
      syncStatus: channel.syncStatus,
      syncError: channel.syncError,
      recentVideos: channel.Video,
      stats: {
        videoCount: channel._count.Video,
        planCount: channel._count.Plan,
      },
    });
  } catch (err: any) {
    console.error("Get channel error:", err);
    return Response.json(
      { error: "Failed to get channel", detail: err.message },
      { status: 500 }
    );
  }
}

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]" },
  async (req, ctx) => GETHandler(req, ctx as any)
);
