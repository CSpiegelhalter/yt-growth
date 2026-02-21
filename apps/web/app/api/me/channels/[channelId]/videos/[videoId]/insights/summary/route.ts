import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import {
  InsightParamsSchema,
  InsightQuerySchema,
  getVideoSummary,
  VideoInsightError,
} from "@/lib/features/video-insights";
import { callLLM } from "@/lib/llm";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";
import { fetchCompetitiveContext } from "@/lib/dataforseo";
import { resolveInsightContext } from "@/lib/server/video-insight-context";

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/insights/summary" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: InsightParamsSchema, query: InsightQuerySchema },
      async (_req, _ctx, api, { params, query }) => {
        const { channelId, videoId } = params!;
        const range = query!.range;

        const ctx = await resolveInsightContext(api.userId!, channelId, videoId, range);
        if (ctx instanceof Response) return ctx;

        try {
          const result = await getVideoSummary(
            { userId: api.userId!, videoId, range, context: ctx },
            { fetchCompetitiveContext, callLlm: callLLM, checkEntitlement: checkEntitlement as any },
          );
          return jsonOk(result, { requestId: api.requestId });
        } catch (err) {
          if (err instanceof VideoInsightError && err.code === "LIMIT_REACHED" && err.cause) {
            return entitlementErrorResponse(err.cause as any);
          }
          throw err;
        }
      },
    ),
  ),
);
