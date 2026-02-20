/**
 * POST /api/keywords/youtube-serp
 *
 * Fetches YouTube search results for a keyword.
 * Shows which videos/channels rank for a given keyword on YouTube.
 *
 * Auth: Optional (returns needsAuth if not authenticated)
 * Cached: 24 hours
 */

import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { YoutubeSerpBodySchema, getYoutubeSerp } from "@/lib/features/keywords";

export const POST = createApiRoute(
  { route: "/api/keywords/youtube-serp" },
  withAuth(
    { mode: "optional" },
    withValidation({ body: YoutubeSerpBodySchema }, async (_req, _ctx, api: ApiAuthContext, validated) => {
      const user = api.user;

      if (!user) {
        return jsonOk(
          { needsAuth: true, message: "Sign in to see YouTube rankings" },
          { requestId: api.requestId },
        );
      }

      const { keyword, location, limit } = validated.body!;

      const result = await getYoutubeSerp({
        userId: user.id,
        keyword,
        location,
        limit,
      });

      return jsonOk(result.body, { requestId: api.requestId });
    }),
  ),
);

export const runtime = "nodejs";
