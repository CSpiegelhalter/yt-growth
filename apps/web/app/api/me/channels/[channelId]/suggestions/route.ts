/**
 * GET /api/me/channels/[channelId]/suggestions
 *
 * Fetch active video suggestions for a channel.
 * Auto-generates suggestions if none exist.
 * Uses competitor-backed context when cached competitor data is available.
 *
 * Auth: Required
 */
import type { NextRequest } from "next/server";

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import {
  buildCompetitorBackedContext,
  generateSuggestions,
  getSuggestions,
  resolveChannelId,
  SuggestionParamsSchema,
} from "@/lib/features/suggestions";

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/suggestions" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: SuggestionParamsSchema },
      async (_req: NextRequest, _ctx, api, validated) => {
        const userId = api.userId!;
        const channelId = await resolveChannelId(validated.params!.channelId, userId);

        let result = await getSuggestions({ userId, channelId });

        if (result.suggestions.length < 3) {
          const needed = 3 - result.suggestions.length;
          const context = await buildCompetitorBackedContext({ userId, channelId });
          await generateSuggestions({
            userId,
            channelId,
            count: needed,
            context,
          });
          result = await getSuggestions({ userId, channelId });
        }

        return jsonOk(
          { suggestions: result.suggestions, total: result.suggestions.length },
          { requestId: api.requestId },
        );
      },
    ),
  ),
);
