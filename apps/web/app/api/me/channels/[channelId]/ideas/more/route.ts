/**
 * POST /api/me/channels/[channelId]/ideas/more
 *
 * Generate more hooks, titles, keywords, and packaging ideas for an existing idea.
 *
 * Auth: Required
 * Entitlements: idea_generate
 */
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { type ApiAuthContext,withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import {
  generateMoreIdeas,
  MoreIdeasBodySchema,
  MoreIdeasParamsSchema,
} from "@/lib/features/saved-ideas";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/ideas/more" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: MoreIdeasParamsSchema, body: MoreIdeasBodySchema },
      async (_req, _ctx, api: ApiAuthContext, validated) => {
        const entitlementResult = await checkEntitlement({
          featureKey: "idea_generate",
          increment: true,
        });
        if (!entitlementResult.ok) {
          return entitlementErrorResponse(entitlementResult.error);
        }

        const { channelId } = validated.params!;
        const { seed } = validated.body!;

        const result = await generateMoreIdeas({
          userId: api.userId!,
          channelId,
          seed,
        });

        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
