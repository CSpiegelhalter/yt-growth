import { z } from "zod";

export const TranscriptAnalysisParamsSchema = z.object({
  videoId: z.string().min(1),
});

export const TranscriptAnalysisBodySchema = z.object({
  videoTitle: z.string().min(1),
  videoDurationSec: z.number().positive(),
  dropOffTimestamps: z
    .array(
      z.object({
        elapsedRatio: z.number().min(0).max(1),
        audienceWatchRatio: z.number().min(0),
      }),
    )
    .optional(),
});
