import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import {
  InsightParamsSchema,
  InsightQuerySchema,
  generateSeoAnalysis,
} from "@/lib/features/video-insights";
import { callLLM } from "@/lib/llm";
import { resolveInsightContext } from "@/lib/server/video-insight-context";

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/insights/seo" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: InsightParamsSchema, query: InsightQuerySchema },
      async (_req, _ctx, api, { params, query }) => {
        const { channelId, videoId } = params!;
        const ctx = await resolveInsightContext(api.userId!, channelId, videoId, query!.range);
        if (ctx instanceof Response) return ctx;

        const { derivedData } = ctx;

        const seo = await generateSeoAnalysis(
          {
            video: {
              title: derivedData.video.title,
              description: derivedData.video.description ?? "",
              tags: derivedData.video.tags ?? [],
              durationSec: derivedData.video.durationSec,
            },
            totalViews: derivedData.derived.totalViews,
            trafficSources: derivedData.derived.trafficSources ?? null,
          },
          callLLM,
        );

        return jsonOk(
          { seo },
          { requestId: api.requestId, headers: { "Cache-Control": "private, max-age=43200" } },
        );
      },
    ),
  ),
);
