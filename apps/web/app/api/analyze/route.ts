/**
 * POST /api/analyze
 *
 * Accepts a YouTube video URL, extracts the video ID, and returns
 * a full video analysis. Wraps the existing competitor video
 * analysis pipeline for use by the Analyze page.
 *
 * Auth: Required
 * Entitlements: competitor_video_analysis (shared daily quota)
 */
import { ApiError } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { AnalyzeUrlSchema, analyzeVideo } from "@/lib/features/competitors";
import { extractVideoId } from "@/lib/shared/youtube-url";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";
import { prisma } from "@/prisma";

export const POST = createApiRoute(
  { route: "/api/analyze" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      { operation: "competitorDetail", identifier: (api) => api.userId },
      withValidation(
        { body: AnalyzeUrlSchema },
        async (_req, _ctx, api, { body }) => {
          const ent = await checkEntitlement({
            featureKey: "competitor_video_analysis",
            increment: true,
          });
          if (!ent.ok) {
            return entitlementErrorResponse(ent.error);
          }

          const videoId = extractVideoId(body!.url);
          if (!videoId) {
            throw new ApiError({
              code: "VALIDATION_ERROR",
              status: 400,
              message: "Could not extract video ID from URL",
            });
          }

          // Get user's first channel for context
          const channel = await prisma.channel.findFirst({
            where: { userId: api.userId },
            select: { youtubeChannelId: true },
            orderBy: { id: "asc" },
          });

          if (!channel) {
            throw new ApiError({
              code: "VALIDATION_ERROR",
              status: 400,
              message: "Please connect a YouTube channel first",
            });
          }

          const result = await analyzeVideo({
            userId: api.userId!,
            channelId: channel.youtubeChannelId,
            videoId,
            includeMoreFromChannel: false,
          });

          return jsonOk(result, { requestId: api.requestId });
        },
      ),
    ),
  ),
);
