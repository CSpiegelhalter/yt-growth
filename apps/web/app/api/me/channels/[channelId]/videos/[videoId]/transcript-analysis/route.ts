import { getYouTubeTranscript } from "@/lib/adapters/serpapi/client";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import type { RunTranscriptAnalysisDeps } from "@/lib/features/transcript-analysis";
import {
  extractDropOffPoints,
  runTranscriptAnalysis,
  TranscriptAnalysisBodySchema,
  TranscriptAnalysisParamsSchema,
} from "@/lib/features/transcript-analysis";
import { TranscriptAnalysisError } from "@/lib/features/transcript-analysis/errors";
import { callLLM } from "@/lib/llm";

export const dynamic = "force-dynamic";

const deps: RunTranscriptAnalysisDeps = {
  callLlm: callLLM,
};

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/transcript-analysis" },
  withAuth(
    { mode: "required" },
    withValidation(
      {
        params: TranscriptAnalysisParamsSchema,
        body: TranscriptAnalysisBodySchema,
      },
      async (_req, _ctx, api, { params, body }) => {
        const { videoId } = params!;
        const { videoTitle, videoDurationSec, dropOffTimestamps } = body!;

        const transcript = await getYouTubeTranscript({ videoId });

        if (transcript.segments.length === 0) {
          throw new TranscriptAnalysisError(
            "INVALID_INPUT",
            `No transcript available for video ${videoId}. The video may not have captions enabled.`,
          );
        }

        const dropOffPoints = dropOffTimestamps
          ? extractDropOffPoints(dropOffTimestamps, videoDurationSec)
          : undefined;

        const report = await runTranscriptAnalysis(
          {
            videoId,
            videoTitle,
            videoDurationSec,
            segments: transcript.segments,
            dropOffPoints,
          },
          deps,
        );

        return jsonOk(report, { requestId: api.requestId });
      },
    ),
  ),
);
