/**
 * POST /api/me/channels/[channelId]/profile/generate
 *
 * Generate or regenerate the AI-structured profile from user input.
 * Uses caching with 3-day TTL and hash-based invalidation.
 *
 * Auth: Required
 * Subscription: NOT required (free feature)
 * Rate limit: 10 per hour per user (enforced in use-case)
 */

import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { channelParamsSchema } from "@/lib/competitors/video-detail/validation";
import {
  generateProfile,
  GenerateProfileBodySchema,
} from "@/lib/features/channels";

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/profile/generate" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: channelParamsSchema, body: GenerateProfileBodySchema },
      async (_req, _ctx, api, { params, body }) => {
        const result = await generateProfile({
          userId: api.userId!,
          channelId: params!.channelId,
          force: body!.force,
        });
        return jsonOk(
          {
            aiProfile: result.aiProfile,
            cached: result.cached,
            message: result.cached
              ? "Using cached AI profile"
              : "AI profile generated successfully",
          },
          { requestId: api.requestId },
        );
      },
    ),
  ),
);
