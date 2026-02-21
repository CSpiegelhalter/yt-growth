/**
 * GET /api/competitors/video/[videoId]
 *
 * Deep analysis of a specific competitor video including:
 * - Public stats and derived velocity metrics
 * - Top comments analysis (sentiment, themes, hook inspiration)
 * - LLM-generated insights for remixing
 *
 * Auth: Required
 * Entitlements: competitor_video_analysis (5/day FREE, 100/day PRO)
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";
import {
  VideoParamsSchema,
  VideoQuerySchema,
  analyzeVideo,
} from "@/lib/features/competitors";

export const GET = createApiRoute(
  { route: "/api/competitors/video/[videoId]" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      { operation: "competitorDetail", identifier: (api) => api.userId },
      withValidation(
        { params: VideoParamsSchema, query: VideoQuerySchema },
        async (_req, _ctx, api, { params, query }) => {
          const ent = await checkEntitlement({
            featureKey: "competitor_video_analysis",
            increment: true,
          });
          if (!ent.ok) return entitlementErrorResponse(ent.error);

          const result = await analyzeVideo({
            userId: api.userId!,
            videoId: params!.videoId,
            channelId: query!.channelId,
            includeMoreFromChannel: query!.includeMoreFromChannel !== "0",
          });
          return jsonOk(result, { requestId: api.requestId });
        },
      ),
    ),
  ),
);
