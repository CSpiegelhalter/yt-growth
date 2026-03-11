import {
  cacheTranscriptAnalysis,
  getCachedTranscript,
  getYouTubeTranscript,
} from "@/lib/adapters/serpapi/client";
import { fetchRetentionCurve, getGoogleAccount } from "@/lib/adapters/youtube";
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

// T018: In-memory request deduplication — prevent concurrent duplicate generations
const inFlightReports = new Map<string, true>();

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
        const { range, sections: requestedSections } = body!;

        // T018: Reject if generation already in-flight for this video
        if (inFlightReports.has(videoId)) {
          return Response.json(
            { error: "Report generation already in progress" },
            { status: 409 },
          );
        }

        const ctx = await resolveInsightContext(api.userId!, channelId, videoId, range);
        if (ctx instanceof Response) { return ctx; }

        inFlightReports.set(videoId, true);

        const baseGenerator = streamFullReport(
          { userId: api.userId!, channelId, videoId, range, sections: requestedSections },
          ctx,
          {
            callLlm: callLLM,
            transcriptCache: { getCachedTranscript, cacheTranscriptAnalysis },
            getYouTubeTranscript,
            fetchRetentionCurve: async (userId, ytChannelId, vid) => {
              const ga = await getGoogleAccount(userId, ytChannelId);
              if (!ga) { return []; }
              return fetchRetentionCurve(ga, ytChannelId, vid);
            },
            runTranscriptAnalysis,
            generateSeoAnalysis,
            fetchCompetitiveContext,
          },
        );

        // Wrap generator to clean up dedup map when stream ends
        async function* trackedGenerator(): AsyncGenerator<ReportStreamEvent> {
          try {
            yield* baseGenerator;
          } finally {
            inFlightReports.delete(videoId);
          }
        }

        return new Response(createEventStream(trackedGenerator()), {
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
