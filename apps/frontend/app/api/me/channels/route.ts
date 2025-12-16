/**
 * GET /api/me/channels
 *
 * Get all channels for the current user.
 *
 * Auth: Required
 */
import { prisma } from "@/prisma";
import { getCurrentUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const channels = await prisma.channel.findMany({
      where: { userId: user.id },
      orderBy: [{ connectedAt: "desc" }],
      select: {
        id: true,
        youtubeChannelId: true,
        title: true,
        thumbnailUrl: true,
        connectedAt: true,
        lastSyncedAt: true,
        syncStatus: true,
        syncError: true,
        _count: {
          select: {
            Video: true,
            Plan: true,
          },
        },
      },
    });

    // Transform to expected format
    const transformed = channels.map((ch) => ({
      channel_id: ch.youtubeChannelId,
      id: ch.id,
      title: ch.title,
      thumbnailUrl: ch.thumbnailUrl,
      connectedAt: ch.connectedAt,
      lastSyncedAt: ch.lastSyncedAt,
      syncStatus: ch.syncStatus,
      syncError: ch.syncError,
      videoCount: ch._count.Video,
      planCount: ch._count.Plan,
    }));

    return Response.json(transformed, {
      headers: { "cache-control": "no-store" },
    });
  } catch (err: any) {
    console.error("Get channels error:", err);
    return Response.json(
      { error: "Server error", detail: String(err) },
      { status: 500 }
    );
  }
}
