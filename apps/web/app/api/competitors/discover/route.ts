/**
 * Niche Discovery API Route (DB-backed)
 *
 * POST /api/competitors/discover
 * Body: { listType?, filters?, queryText?, cursor?, limit? }
 */

import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { DiscoverBodySchema, discoverCompetitors } from "@/lib/features/competitors";

export const POST = createApiRoute(
  { route: "/api/competitors/discover" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      { operation: "competitorFeed", identifier: (api) => api.userId },
      withValidation({ body: DiscoverBodySchema }, async (_req, _ctx, api, { body }) => {
        const result = await discoverCompetitors({
          userId: api.userId!,
          ...body,
        });
        return jsonOk(result, { requestId: api.requestId });
      }),
    ),
  ),
);
