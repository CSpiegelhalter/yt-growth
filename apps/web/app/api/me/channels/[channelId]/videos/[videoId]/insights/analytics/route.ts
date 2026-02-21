import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/shared/rate-limit";
import { getGoogleAccount, fetchRetentionCurve } from "@/lib/adapters/youtube";
import { GoogleTokenRefreshError } from "@/lib/google-tokens";
import {
  fetchVideoAnalyticsDailyWithStatus,
  fetchVideoAnalyticsTotalsWithStatus,
  fetchOwnedVideoMetadata,
  fetchVideoDiscoveryMetrics,
  fetchSubscriberBreakdown,
  fetchGeographicBreakdown,
  fetchTrafficSourceDetail,
  fetchDemographicBreakdown,
} from "@/lib/adapters/youtube/owned-analytics";
import {
  InsightParamsSchema,
  InsightQuerySchema,
  getVideoAnalytics,
  VideoInsightError,
} from "@/lib/features/video-insights";

const retentionDeps = {
  fetchVideoMetadata: fetchOwnedVideoMetadata as any,
  fetchTotalsWithStatus: fetchVideoAnalyticsTotalsWithStatus as any,
  fetchDailyWithStatus: fetchVideoAnalyticsDailyWithStatus as any,
  fetchRetentionCurve: fetchRetentionCurve as any,
  fetchDiscoveryMetrics: fetchVideoDiscoveryMetrics as any,
  fetchSubscriberBreakdown: fetchSubscriberBreakdown as any,
  fetchGeoBreakdown: fetchGeographicBreakdown as any,
  fetchTrafficDetail: fetchTrafficSourceDetail as any,
  fetchDemographicBreakdown: fetchDemographicBreakdown as any,
};

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/insights/analytics" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: InsightParamsSchema, query: InsightQuerySchema },
      async (_req, _ctx, api, { params, query }) => {
        const { channelId, videoId } = params!;
        const range = query!.range;

        const rateResult = checkRateLimit(
          rateLimitKey("videoInsights", api.userId!),
          RATE_LIMITS.videoInsights,
        );
        if (!rateResult.success) {
          return Response.json(
            { error: "Rate limit exceeded", retryAfter: rateResult.resetAt },
            { status: 429 },
          );
        }

        try {
          const result = await getVideoAnalytics(
            { userId: api.userId!, channelId, videoId, range },
            { getGoogleAccount, retentionDeps },
          );
          return jsonOk(result, { requestId: api.requestId });
        } catch (err) {
          if (err instanceof VideoInsightError && err.code === "FORBIDDEN") {
            return Response.json(
              { error: err.message, code: "youtube_permissions" },
              { status: 403 },
            );
          }
          if (err instanceof GoogleTokenRefreshError) {
            return Response.json(
              { error: err.message, code: "youtube_permissions" },
              { status: 403 },
            );
          }
          throw err;
        }
      },
    ),
  ),
);
