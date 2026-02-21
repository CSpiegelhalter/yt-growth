/**
 * GET /api/competitors/video/[videoId]/more
 *
 * Lightweight helper for the competitor video detail page.
 * Fetches "More from this channel" in a separate request so the initial
 * analysis can render faster.
 *
 * Auth: Required
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import {
  MoreFromChannelParamsSchema,
  MoreFromChannelQuerySchema,
  getMoreFromChannel,
} from "@/lib/features/competitors";
import type { GetMoreFromChannelDeps } from "@/lib/features/competitors";
import {
  getGoogleAccount,
  fetchVideoDetails,
  fetchRecentChannelVideos,
} from "@/lib/adapters/youtube";

const deps: GetMoreFromChannelDeps = {
  getGoogleAccount,
  fetchVideoDetails,
  fetchRecentChannelVideos,
};

export const GET = createApiRoute(
  { route: "/api/competitors/video/[videoId]/more" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      { operation: "competitorDetail", identifier: (api) => api.userId },
      withValidation(
        { params: MoreFromChannelParamsSchema, query: MoreFromChannelQuerySchema },
        async (_req, _ctx, api, { params, query }) => {
          const result = await getMoreFromChannel(
            {
              userId: api.userId!,
              videoId: params!.videoId,
              channelId: query!.channelId,
            },
            deps,
          );
          return jsonOk(result, { requestId: api.requestId });
        },
      ),
    ),
  ),
);
