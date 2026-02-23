import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { fetchCompetitiveContext } from "@/lib/dataforseo";
import type { EntitlementError as EntitlementErrorType } from "@/lib/features/subscriptions";
import {
  getVideoSummary,
  InsightParamsSchema,
  InsightQuerySchema,
  VideoInsightError,
} from "@/lib/features/video-insights";
import { callLLM } from "@/lib/llm";
import { resolveInsightContext } from "@/lib/server/video-insight-context";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";

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
        if (ctx instanceof Response) {return ctx;}

        try {
          const result = await getVideoSummary(
            { userId: api.userId!, videoId, range, context: ctx as unknown as Parameters<typeof getVideoSummary>[0]["context"] },
            { fetchCompetitiveContext, callLlm: callLLM, checkEntitlement: checkEntitlement as Parameters<typeof getVideoSummary>[1]["checkEntitlement"] },
          );
          return jsonOk(result, { requestId: api.requestId });
        } catch (error) {
          if (error instanceof VideoInsightError && error.code === "LIMIT_REACHED" && error.cause) {
            return entitlementErrorResponse(error.cause as EntitlementErrorType);
          }
          throw error;
        }
      },
    ),
  ),
);
