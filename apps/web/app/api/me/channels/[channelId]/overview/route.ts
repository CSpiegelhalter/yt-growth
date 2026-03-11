import {
  fetchRecentChannelVideos,
  getGoogleAccount,
} from "@/lib/adapters/youtube";
import {
  fetchChannelAuditMetrics,
  fetchChannelDailyAnalytics,
} from "@/lib/adapters/youtube/owned-analytics";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import type {
  GetOverviewDeps,
  VideoPublishMarker,
} from "@/lib/features/channel-audit";
import {
  AuditParamsSchema,
  ChannelAuditError,
  computeTrends,
  getChannelOverview,
  OverviewQuerySchema,
} from "@/lib/features/channel-audit";
import { toLocalDateStr } from "@/lib/shared/date-range";

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
    if (!metrics) {
      return null;
    }
    return computeTrends(metrics);
  },

  fetchRecentVideos: async (userId, youtubeChannelId, limit) => {
    const ga = await requireGoogleAccount(userId, youtubeChannelId);
    const publishedAfter = new Date();
    publishedAfter.setDate(publishedAfter.getDate() - 30);

    const videos = await fetchRecentChannelVideos(
      ga,
      youtubeChannelId,
      publishedAfter.toISOString(),
      limit,
    );

    return videos.map((v): VideoPublishMarker => ({
      videoId: v.videoId,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      publishedAt: v.publishedAt,
      chartDate: toLocalDateStr(new Date(v.publishedAt)),
    }));
  },
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
