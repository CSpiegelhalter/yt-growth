/**
 * GET /api/me/channels
 *
 * Get all channels for the current user.
 * Also returns subscription info (channel limit, plan) for UI gating.
 *
 * Auth: Required
 */
import { prisma } from "@/prisma";
import { getCurrentUserWithSubscription } from "@/lib/user";
import { getSubscriptionStatus } from "@/lib/stripe";

export async function GET() {
  try {
    const user = await getCurrentUserWithSubscription();

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
        totalVideoCount: true,
        subscriberCount: true,
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

    // Get subscription info for channel limit gating
    const subscription = await getSubscriptionStatus(user.id);

    // Transform to expected format
    const transformed = channels.map((ch) => ({
      channel_id: ch.youtubeChannelId,
      id: ch.id,
      title: ch.title,
      thumbnailUrl: ch.thumbnailUrl,
      totalVideoCount: ch.totalVideoCount,    // Total videos on YouTube
      subscriberCount: ch.subscriberCount,    // Subscriber count
      syncedVideoCount: ch._count.Video,      // Videos we've synced locally
      connectedAt: ch.connectedAt,
      lastSyncedAt: ch.lastSyncedAt,
      syncStatus: ch.syncStatus,
      syncError: ch.syncError,
      videoCount: ch._count.Video,            // Keep for backwards compat
      planCount: ch._count.Plan,
    }));

    return Response.json({
      channels: transformed,
      channelLimit: subscription.channelLimit,
      plan: subscription.plan,
    }, {
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
