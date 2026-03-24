/**
 * POST /api/me/channels/[channelId]/suggestions/generate
 *
 * On-demand competitor-backed idea generation.
 * Triggered from dashboard or planned ideas tab.
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
  GenerateBodySchema,
  generateSuggestions,
  resolveChannelId,
  SuggestionParamsSchema,
} from "@/lib/features/suggestions";

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/suggestions/generate" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: SuggestionParamsSchema, body: GenerateBodySchema },
      async (_req: NextRequest, _ctx, api, validated) => {
        const userId = api.userId!;
        const channelId = await resolveChannelId(validated.params!.channelId, userId);
        const count = validated.body!.count;

        const context = await buildCompetitorBackedContext({ userId, channelId });
        const suggestions = await generateSuggestions({
          userId,
          channelId,
          count,
          context,
        });

        return jsonOk(
          {
            suggestions,
            generationMode: context.generationMode,
            competitorDataAvailable: context.competitorVideos.length > 0,
          },
          { requestId: api.requestId },
        );
      },
    ),
  ),
);
