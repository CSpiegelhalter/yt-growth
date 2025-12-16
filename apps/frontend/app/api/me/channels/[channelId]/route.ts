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
import { getCurrentUser } from "@/lib/user";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate params
    const parsed = ParamsSchema.safeParse(params);
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

    // Delete channel (cascades to videos, metrics, retention, plans)
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

/**
 * GET /api/me/channels/[channelId]
 *
 * Get details for a specific channel.
 *
 * Auth: Required
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate params
    const parsed = ParamsSchema.safeParse(params);
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
