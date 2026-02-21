/**
 * GET /api/me/channels
 *
 * Get all channels for the current user.
 * Also returns subscription info (channel limit, plan) for UI gating.
 *
 * Auth: Required
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { jsonOk } from "@/lib/api/response";
import { listChannels } from "@/lib/features/channels";
import { resolveSubscription } from "@/lib/features/subscriptions/use-cases/resolveSubscription";

export const GET = createApiRoute(
  { route: "/api/me/channels" },
  withAuth({ mode: "required" }, async (_req, _ctx, api: ApiAuthContext) => {
    const user = api.user!;
    const channels = await listChannels({ userId: user.id });
    const subscription = await resolveSubscription(user.id);

    const transformed = channels.map((ch) => ({
      channel_id: ch.youtubeChannelId,
      id: ch.id,
      title: ch.title,
      thumbnailUrl: ch.thumbnailUrl,
      totalVideoCount: ch.totalVideoCount,
      subscriberCount: ch.subscriberCount,
      syncedVideoCount: ch._count.Video,
      connectedAt: ch.connectedAt,
      lastSyncedAt: ch.lastSyncedAt,
      syncStatus: ch.syncStatus,
      syncError: ch.syncError,
      videoCount: ch._count.Video,
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
      },
    );
  }),
);
