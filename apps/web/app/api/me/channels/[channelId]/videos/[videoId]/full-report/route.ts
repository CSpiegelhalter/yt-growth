import { getYouTubeTranscript } from "@/lib/adapters/serpapi/client";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { fetchCompetitiveContext } from "@/lib/dataforseo";
import type { ReportStreamEvent } from "@/lib/features/full-report";
import {
  FullReportBodySchema,
  FullReportParamsSchema,
  streamFullReport,
} from "@/lib/features/full-report";
import { runTranscriptAnalysis } from "@/lib/features/transcript-analysis";
import { generateSeoAnalysis } from "@/lib/features/video-insights";
import { callLLM } from "@/lib/llm";
import { resolveInsightContext } from "@/lib/server/video-insight-context";

export const dynamic = "force-dynamic";

function createEventStream(
  generator: AsyncGenerator<ReportStreamEvent, void, unknown>,
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of generator) {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        }
        controller.close();
      } catch (error) {
        const errorEvent: ReportStreamEvent = {
          type: "error",
          key: "videoAudit",
          error: error instanceof Error ? error.message : "Stream error",
        };
        controller.enqueue(encoder.encode(`${JSON.stringify(errorEvent)}\n`));
        controller.close();
      }
    },
  });
}

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/full-report" },
  withAuth(
    { mode: "required" },
    withValidation(
      {
        params: FullReportParamsSchema,
        body: FullReportBodySchema,
      },
      async (_req, _ctx, api, { params, body }) => {
        const { channelId, videoId } = params!;
        const { range } = body!;

        const ctx = await resolveInsightContext(api.userId!, channelId, videoId, range);
        if (ctx instanceof Response) { return ctx; }

        const generator = streamFullReport(
          { userId: api.userId!, channelId, videoId, range },
          ctx,
          {
            callLlm: callLLM,
            getYouTubeTranscript,
            runTranscriptAnalysis,
            generateSeoAnalysis,
            fetchCompetitiveContext,
          },
        );

        return new Response(createEventStream(generator), {
          headers: {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-cache",
            "Transfer-Encoding": "chunked",
          },
        });
      },
    ),
  ),
);
