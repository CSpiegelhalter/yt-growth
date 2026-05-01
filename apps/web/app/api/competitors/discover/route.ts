/**
 * Niche Discovery API Route (DB-backed)
 *
 * POST /api/competitors/discover
 * Body: { listType?, filters?, queryText?, cursor?, limit? }
 *
 * Auth: Optional — guests get IP-based rate limiting (guestTrending: 5/day),
 * authenticated users get userId-based rate limiting (competitorFeed: 10/hr).
 */

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { DiscoverBodySchema, discoverCompetitors } from "@/lib/features/competitors";

export const POST = createApiRoute(
  { route: "/api/competitors/discover" },
  withAuth(
    { mode: "optional" },
    withRateLimit(
      {
        operation: "guestTrending",
        identifier: (api) => api.userId ?? api.ip,
      },
      withValidation({ body: DiscoverBodySchema }, async (_req, _ctx, api, { body }) => {
        const result = await discoverCompetitors({
          userId: api.userId ?? null,
          ...body,
        });

        const headers: Record<string, string> = {};
        if (!api.userId && api.rateLimitResult) {
          headers["X-RateLimit-Remaining"] = String(api.rateLimitResult.remaining);
          headers["X-RateLimit-Reset"] = new Date(api.rateLimitResult.resetAt).toISOString();
        }

        return jsonOk(result, { requestId: api.requestId, headers });
      }),
    ),
  ),
);
