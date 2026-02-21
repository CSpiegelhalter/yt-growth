/**
 * POST /api/me/channels/[channelId]/sync
 *
 * Sync last ~100 videos for a channel from YouTube Data API.
 * Also fetches metrics from YouTube Analytics API.
 *
 * Auth: Required
 * Entitlements: channel_sync (3/day FREE, 50/day PRO)
 * Rate limit: 10 per hour per channel
 * Caching: Updates lastSyncedAt, short-circuits if synced within 5 minutes
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { channelParamsSchema } from "@/lib/competitors/video-detail/validation";
import {
  syncChannel,
  type SyncChannelDeps,
} from "@/lib/features/channels/use-cases/syncChannel";
import type { GoogleAccount } from "@/lib/adapters/youtube/types";
import {
  getGoogleAccount,
  fetchChannelVideos,
  fetchVideoMetrics,
} from "@/lib/adapters/youtube";
import { getSubscriptionStatus } from "@/lib/stripe";
import { getPlanFromSubscription, getLimit } from "@/lib/features/subscriptions/use-cases/checkEntitlement";
import type { FeatureKey } from "@/lib/features/subscriptions/types";
import { checkAndIncrement } from "@/lib/features/subscriptions/use-cases/trackUsage";

const deps: SyncChannelDeps<GoogleAccount> = {
  getGoogleAccount,
  fetchChannelVideos,
  fetchVideoMetrics,
  resolveUsageLimit: async (userId) => {
    const sub = await getSubscriptionStatus(userId);
    const plan = getPlanFromSubscription(sub);
    const limit = getLimit(plan, "channel_sync");
    return { plan, limit };
  },
  checkAndIncrement: (opts) =>
    checkAndIncrement({
      ...opts,
      featureKey: opts.featureKey as FeatureKey,
    }),
};

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/sync" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: channelParamsSchema },
      async (_req, _ctx, api, { params }) => {
        const result = await syncChannel(
          { userId: api.userId!, channelId: params!.channelId },
          deps,
        );

        if (result.status === "skipped") {
          return jsonOk(
            {
              message: "Channel recently synced",
              lastSyncedAt: result.lastSyncedAt,
              nextSyncAvailableAt: result.nextSyncAvailableAt,
            },
            { requestId: api.requestId },
          );
        }

        return jsonOk(
          {
            success: true,
            videosCount: result.videosCount,
            metricsCount: result.metricsCount,
            lastSyncedAt: result.lastSyncedAt,
          },
          { requestId: api.requestId },
        );
      },
    ),
  ),
);
