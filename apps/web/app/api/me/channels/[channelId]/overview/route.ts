import { getGoogleAccount } from "@/lib/adapters/youtube";
import {
  fetchChannelAuditMetrics,
  fetchChannelDailyAnalytics,
} from "@/lib/adapters/youtube/owned-analytics";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import type { GetOverviewDeps } from "@/lib/features/channel-audit";
import {
  AuditParamsSchema,
  ChannelAuditError,
  computeTrends,
  getChannelOverview,
  OverviewQuerySchema,
} from "@/lib/features/channel-audit";

export const dynamic = "force-dynamic";

async function requireGoogleAccount(userId: number, channelId: string) {
  const ga = await getGoogleAccount(userId, channelId);
  if (!ga) {
    throw new ChannelAuditError(
      "EXTERNAL_FAILURE",
      "Google account not connected",
    );
  }
  return ga;
}

const overviewDeps: GetOverviewDeps = {
  fetchDailyAnalytics: async (userId, channelId, startDate, endDate) => {
    const ga = await requireGoogleAccount(userId, channelId);
    const rows = await fetchChannelDailyAnalytics(
      ga,
      channelId,
      startDate,
      endDate,
    );
    return rows.map((r) => ({
      date: r.date,
      views: r.views,
      shares: r.shares,
      watchTimeMinutes: r.estimatedMinutesWatched,
      subscribersGained: r.subscribersGained,
      subscribersLost: r.subscribersLost,
    }));
  },

  fetchAuditTrends: async (userId, channelId, range) => {
    const ga = await requireGoogleAccount(userId, channelId);
    const metrics = await fetchChannelAuditMetrics(ga, channelId, range);
    if (!metrics) {return null;}
    return computeTrends(metrics);
  },

  fetchRecentVideos: async () => [],
};

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/overview" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: AuditParamsSchema, query: OverviewQuerySchema },
      async (_req, _ctx, api, { params, query }) => {
        const result = await getChannelOverview(
          {
            userId: api.userId!,
            channelId: params!.channelId,
            range: query!.range,
          },
          overviewDeps,
        );
        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
