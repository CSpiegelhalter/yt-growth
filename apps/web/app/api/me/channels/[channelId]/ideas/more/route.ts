/**
 * POST /api/me/channels/[channelId]/ideas/more
 *
 * Generate more hooks, titles, keywords, and packaging ideas for an existing idea.
 *
 * Auth: Required
 * Entitlements: idea_generate
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";
import {
  MoreIdeasParamsSchema,
  MoreIdeasBodySchema,
  generateMoreIdeas,
} from "@/lib/features/saved-ideas";

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
