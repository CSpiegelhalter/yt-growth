/**
 * POST /api/ideas/public
 *
 * Public idea generation endpoint — no authentication required.
 * Generates category-based video ideas from trending topics.
 *
 * Rate limits:
 *   - Per-IP: 2 per day (anonymous)
 *   - Per-user: standard idea_generate limit (authenticated)
 *
 * Auth: Optional (authenticated users get user-based rate limits)
 */
import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { generateIdeas } from "@/lib/llm";

const BodySchema = z.object({
  category: z.string().min(1).max(50),
});

export const POST = createApiRoute(
  { route: "/api/ideas/public" },
  withAuth(
    { mode: "optional" },
    withRateLimit(
      {
        operation: "guestIdeas",
        identifier: (api) => api.userId ?? api.ip,
      },
      withValidation(
        { body: BodySchema },
        async (_req, _ctx, api, { body }) => {
          const isAnonymous = !api.userId;

          if (isAnonymous && !api.ip) {
            throw new ApiError({
              code: "VALIDATION_ERROR",
              status: 400,
              message: "Unable to verify request origin.",
            });
          }

          const ideas = await generateIdeas({
            category: body!.category,
            count: 6,
          });

          const headers: Record<string, string> = {};
          if (api.rateLimitResult) {
            headers["X-RateLimit-Remaining"] = String(api.rateLimitResult.remaining);
            headers["X-RateLimit-Reset"] = new Date(api.rateLimitResult.resetAt).toISOString();
          }

          return jsonOk({ ideas }, { requestId: api.requestId, headers });
        },
      ),
    ),
  ),
);
