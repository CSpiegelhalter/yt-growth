import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import type { RecommendationsDeps } from "@/lib/features/channel-audit";
import {
  AuditParamsSchema,
  generateLlmRecommendations,
  RecommendationsBodySchema,
} from "@/lib/features/channel-audit";
import { callLLM } from "@/lib/llm";

export const dynamic = "force-dynamic";

const llmDeps: RecommendationsDeps = {
  callLlm: callLLM,
};

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/audit/recommendations" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: AuditParamsSchema, body: RecommendationsBodySchema },
      async (_req, _ctx, api, { body }) => {
        const result = await generateLlmRecommendations(
          {
            metrics: body!.metrics,
            trafficSources: body!.trafficSources ?? null,
            trends: body!.trends,
          },
          llmDeps,
        );
        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
