import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import {
  InsightParamsSchema,
  InsightQuerySchema,
  getVideoIdeasWithProfile,
} from "@/lib/features/video-insights";
import { callLLM } from "@/lib/llm";
import { resolveInsightContext } from "@/lib/server/video-insight-context";

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/insights/ideas" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: InsightParamsSchema, query: InsightQuerySchema },
      async (_req, _ctx, api, { params, query }) => {
        const { channelId, videoId } = params!;
        const ctx = await resolveInsightContext(api.userId!, channelId, videoId, query!.range);
        if (ctx instanceof Response) return ctx;

        const ideas = await getVideoIdeasWithProfile(
          { context: ctx },
          { callLlm: callLLM },
        );

        return jsonOk(
          { ideas },
          { requestId: api.requestId, headers: { "Cache-Control": "private, max-age=43200" } },
        );
      },
    ),
  ),
);
