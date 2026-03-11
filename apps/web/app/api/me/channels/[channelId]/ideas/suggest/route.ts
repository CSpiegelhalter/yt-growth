/**
 * POST /api/me/channels/[channelId]/ideas/suggest
 *
 * AI-assisted field generation for video ideas.
 */
import type { NextRequest } from "next/server";

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { IdeaParamsSchema, SuggestFieldBodySchema } from "@/lib/features/video-ideas";
import { suggestField } from "@/lib/features/video-ideas/use-cases/suggestField";
import { prisma } from "@/prisma";

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/ideas/suggest" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: IdeaParamsSchema, body: SuggestFieldBodySchema },
      async (_req: NextRequest, _ctx, api, validated) => {
        const userId = api.userId!;
        const channel = await prisma.channel.findFirst({
          where: { youtubeChannelId: validated.params!.channelId, userId },
          select: { id: true },
        });
        if (!channel) {
          throw new Error(`Channel not found: ${validated.params!.channelId}`);
        }
        const { field, currentIdea } = validated.body!;

        const result = await suggestField({
          userId,
          channelId: channel.id,
          field,
          currentIdea,
        });

        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
