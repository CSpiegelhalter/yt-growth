/**
 * GET /api/me/channels
 *
 * Get all channels for the current user.
 * Also returns subscription info (channel limit, plan) for UI gating.
 *
 * Auth: Required
 */
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { jsonOk } from "@/lib/api/response";
import { getSubscriptionStatus } from "@/lib/stripe";
import { CHANNEL_LIST_SELECT, CHANNEL_LIST_ORDER_BY } from "@/lib/server/channel-query";

export const GET = createApiRoute(
  { route: "/api/me/channels" },
  withAuth({ mode: "required" }, async (_req, _ctx, api: ApiAuthContext) => {
    const user = api.user!;
    const channels = await prisma.channel.findMany({
      where: { userId: user.id },
      orderBy: CHANNEL_LIST_ORDER_BY,
      select: CHANNEL_LIST_SELECT,
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

    return jsonOk(
      {
        channels: transformed,
        channelLimit: subscription.channelLimit,
        plan: subscription.plan,
      },
      {
        headers: { "cache-control": "no-store" },
        requestId: api.requestId,
      }
    );
  })
);

