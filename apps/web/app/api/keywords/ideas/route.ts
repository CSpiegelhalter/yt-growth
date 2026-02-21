/**
 * POST /api/keywords/ideas
 *
 * Orchestrated endpoint for generating video ideas from a topic description.
 *
 * Auth: auth-on-action (handled by the use-case internally)
 * Caching: 7-day TTL on full results (cache hits don't consume quota)
 */

import { createApiRoute } from "@/lib/api/route";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import {
  KeywordIdeasBodySchema,
  generateKeywordIdeas,
} from "@/lib/features/keywords";
import type { AudienceLevel, FormatPreference } from "@/lib/features/keywords";

export const POST = createApiRoute(
  { route: "/api/keywords/ideas" },
  withValidation({ body: KeywordIdeasBodySchema }, async (_req, _ctx, api, validated) => {
    const { topicDescription, locationCode, audienceLevel, formatPreference } =
      validated.body!;

    const result = await generateKeywordIdeas({
      topicDescription,
      locationCode,
      audienceLevel: audienceLevel as AudienceLevel,
      formatPreference: formatPreference as FormatPreference,
    });

    switch (result.type) {
      case "needs_auth":
        return jsonOk(
          { needsAuth: true },
          { requestId: api.requestId },
        );

      case "entitlement_error":
        return result.response;

      case "needs_upgrade":
        return jsonOk(result.body, { requestId: api.requestId });

      case "success":
        return jsonOk(result.body, { requestId: api.requestId });
    }
  }),
);

export const runtime = "nodejs";
