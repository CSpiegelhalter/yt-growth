/**
 * POST /api/me/channels/[channelId]/suggestions/[suggestionId]/action
 *
 * Act on a video suggestion (save, dismiss, or use).
 *
 * Auth: Required
 */
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import {
  actOnSuggestion,
  SuggestionActionBodySchema,
  SuggestionActionParamsSchema,
} from "@/lib/features/suggestions";

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/suggestions/[suggestionId]/action" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: SuggestionActionParamsSchema, body: SuggestionActionBodySchema },
      async (_req, _ctx, api, validated) => {
        const channelId = Number(validated.params!.channelId);
        const suggestionId = validated.params!.suggestionId;
        const { action } = validated.body!;

        const result = await actOnSuggestion({
          userId: api.userId!,
          channelId,
          suggestionId,
          action,
        });

        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
