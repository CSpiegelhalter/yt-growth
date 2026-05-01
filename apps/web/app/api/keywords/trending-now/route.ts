/**
 * GET /api/keywords/trending-now
 *
 * Returns today's top trending topics from Google Trends.
 * No auth required — this is public discovery data.
 * Cached in-memory for 1 hour (SerpAPI caches free for 1 hour).
 */

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { getTrendingNow } from "@/lib/adapters/serpapi/client";
import { logger } from "@/lib/shared/logger";

export const GET = createApiRoute(
  { route: "/api/keywords/trending-now" },
  withAuth(
    { mode: "optional" },
    async (_req, _ctx, api) => {
      try {
        const topics = await getTrendingNow("US");
        return jsonOk({ topics }, { requestId: api.requestId });
      } catch (error) {
        logger.error("trending_now.error", {
          error: error instanceof Error ? error.message : String(error),
        });
        return jsonOk({ topics: [], error: "Could not fetch trending topics" }, { requestId: api.requestId });
      }
    },
  ),
);
