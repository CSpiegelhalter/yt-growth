import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import {
  InsightParamsSchema,
  InsightQuerySchema,
  getCommentInsights,
} from "@/lib/features/video-insights";
import { callLLM } from "@/lib/llm";
import { getGoogleAccount } from "@/lib/adapters/youtube";
import { GoogleTokenRefreshError } from "@/lib/google-tokens";
import { fetchOwnedVideoComments } from "@/lib/adapters/youtube/owned-analytics";
import { resolveInsightContext } from "@/lib/server/video-insight-context";

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/insights/comments" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: InsightParamsSchema, query: InsightQuerySchema },
      async (_req, _ctx, api, { params, query }) => {
        const { channelId, videoId } = params!;
        const ctx = await resolveInsightContext(api.userId!, channelId, videoId, query!.range);
        if (ctx instanceof Response) return ctx;

        try {
          const result = await getCommentInsights(
            { userId: api.userId!, channelId, videoId, videoTitle: ctx.derivedData.video.title },
            { getGoogleAccount, fetchComments: fetchOwnedVideoComments, callLlm: callLLM },
          );
          return jsonOk(
            { comments: result },
            { requestId: api.requestId, headers: { "Cache-Control": "private, max-age=43200" } },
          );
        } catch (err) {
          if (err instanceof GoogleTokenRefreshError) {
            return Response.json(
              { error: err.message, code: "youtube_permissions" },
              { status: 403 },
            );
          }
          throw err;
        }
      },
    ),
  ),
);
