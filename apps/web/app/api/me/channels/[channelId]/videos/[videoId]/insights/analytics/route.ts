import { fetchRetentionCurve,getGoogleAccount } from "@/lib/adapters/youtube";
import {
  fetchDemographicBreakdown,
  fetchGeographicBreakdown,
  fetchOwnedVideoMetadata,
  fetchSubscriberBreakdown,
  fetchTrafficSourceDetail,
  fetchVideoAnalyticsDailyWithStatus,
  fetchVideoAnalyticsTotalsWithStatus,
  fetchVideoDiscoveryMetrics,
} from "@/lib/adapters/youtube/owned-analytics";
import { ApiError } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import {
  getVideoAnalytics,
  InsightParamsSchema,
  InsightQuerySchema,
  VideoInsightError,
} from "@/lib/features/video-insights";
import type { AnalyzeRetentionDeps } from "@/lib/features/video-insights/use-cases/analyzeRetention";
import { GoogleTokenRefreshError } from "@/lib/google-tokens";
import { checkRateLimit, RATE_LIMITS,rateLimitKey } from "@/lib/shared/rate-limit";

const retentionDeps: AnalyzeRetentionDeps = {
  fetchVideoMetadata: fetchOwnedVideoMetadata as AnalyzeRetentionDeps["fetchVideoMetadata"],
  fetchTotalsWithStatus: fetchVideoAnalyticsTotalsWithStatus as AnalyzeRetentionDeps["fetchTotalsWithStatus"],
  fetchDailyWithStatus: fetchVideoAnalyticsDailyWithStatus as AnalyzeRetentionDeps["fetchDailyWithStatus"],
  fetchRetentionCurve: fetchRetentionCurve as AnalyzeRetentionDeps["fetchRetentionCurve"],
  fetchDiscoveryMetrics: fetchVideoDiscoveryMetrics as AnalyzeRetentionDeps["fetchDiscoveryMetrics"],
  fetchSubscriberBreakdown: fetchSubscriberBreakdown as AnalyzeRetentionDeps["fetchSubscriberBreakdown"],
  fetchGeoBreakdown: fetchGeographicBreakdown as AnalyzeRetentionDeps["fetchGeoBreakdown"],
  fetchTrafficDetail: fetchTrafficSourceDetail as AnalyzeRetentionDeps["fetchTrafficDetail"],
  fetchDemographicBreakdown: fetchDemographicBreakdown as AnalyzeRetentionDeps["fetchDemographicBreakdown"],
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

        const rateResult = await checkRateLimit(
          rateLimitKey("videoInsights", api.userId!),
          RATE_LIMITS.videoInsights,
        );
        if (!rateResult.success) {
          throw new ApiError({
            code: "RATE_LIMITED",
            status: 429,
            message: "Rate limit exceeded. Please try again later.",
            details: { resetAt: new Date(rateResult.resetAt).toISOString() },
          });
        }

        try {
          const result = await getVideoAnalytics(
            { userId: api.userId!, channelId, videoId, range },
            { getGoogleAccount, retentionDeps },
          );
          return jsonOk(result, { requestId: api.requestId });
        } catch (error) {
          if (error instanceof VideoInsightError && error.code === "FORBIDDEN") {
            return Response.json(
              { error: error.message, code: "youtube_permissions" },
              { status: 403 },
            );
          }
          if (error instanceof GoogleTokenRefreshError) {
            return Response.json(
              { error: error.message, code: "youtube_permissions" },
              { status: 403 },
            );
          }
          throw error;
        }
      },
    ),
  ),
);
