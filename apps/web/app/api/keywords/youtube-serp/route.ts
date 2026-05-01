/**
 * POST /api/keywords/youtube-serp
 *
 * Fetches YouTube search results for a keyword.
 * Shows which videos/channels rank for a given keyword on YouTube.
 *
 * Auth: Optional — guests get real results, rate limited by IP
 * Cached: 24 hours
 */

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { type ApiAuthContext,withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { getYoutubeSerp,YoutubeSerpBodySchema } from "@/lib/features/keywords";

export const POST = createApiRoute(
  { route: "/api/keywords/youtube-serp" },
  withAuth(
    { mode: "optional" },
    withRateLimit(
      {
        operation: "guestTrending",
        identifier: (api) => api.userId ?? api.ip,
      },
      withValidation({ body: YoutubeSerpBodySchema }, async (_req, _ctx, api: ApiAuthContext, validated) => {
        const user = api.user;
        const { keyword, location, limit } = validated.body!;

        const result = await getYoutubeSerp({
          userId: user?.id ?? null,
          keyword,
          location,
          limit,
        });

        return jsonOk(result.body, { requestId: api.requestId });
      }),
    ),
  ),
);

export const runtime = "nodejs";
