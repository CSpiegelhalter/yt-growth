/**
 * POST /api/ideas/from-gap
 *
 * Generate video ideas from an opportunity gap keyword.
 * Auth required. Rate limited via idea_generate feature key.
 */

import { z } from "zod";

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { generateIdeaFromGap } from "@/lib/llm";
import { logger } from "@/lib/shared/logger";

const BodySchema = z.object({
  keyword: z.string().min(1).max(200),
  gapScore: z.number().min(0).max(100),
  trendMomentum: z.enum(["hot", "rising", "steady"]),
  category: z.string().min(1).max(100),
});

export const POST = createApiRoute(
  { route: "/api/ideas/from-gap" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      {
        operation: "gapIdeas",
        identifier: (api) => String(api.userId),
      },
      withValidation(
        { body: BodySchema },
        async (_req, _ctx, api, { body }) => {
          try {
            const ideas = await generateIdeaFromGap({
              keyword: body!.keyword,
              gapScore: body!.gapScore,
              trendMomentum: body!.trendMomentum,
              category: body!.category,
              count: 3,
            });

            return jsonOk({ ideas }, { requestId: api.requestId });
          } catch (error) {
            logger.error("ideas_from_gap.error", {
              userId: api.userId,
              keyword: body!.keyword,
              error: error instanceof Error ? error.message : String(error),
            });
            return jsonOk({ ideas: [], error: "Could not generate ideas" }, { requestId: api.requestId });
          }
        },
      ),
    ),
  ),
);
