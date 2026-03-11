/**
 * POST /api/me/channels/[channelId]/profile/suggest
 *
 * AI-assisted field generation for channel profile fields.
 */
import type { NextRequest } from "next/server";

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { SuggestProfileFieldBodySchema } from "@/lib/features/channels/schemas";
import { suggestProfileField } from "@/lib/features/channels/use-cases/suggestProfileField";
import { IdeaParamsSchema } from "@/lib/features/video-ideas";
import { prisma } from "@/prisma";

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/profile/suggest" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: IdeaParamsSchema, body: SuggestProfileFieldBodySchema },
      async (_req: NextRequest, _ctx, api, validated) => {
        const { channelId: ytChannelId } = validated.params!;
        const { field, section, currentInput } = validated.body!;
        const userId = api.userId!;

        const channel = await prisma.channel.findFirstOrThrow({
          where: { youtubeChannelId: ytChannelId, userId },
          select: { id: true },
        });

        const result = await suggestProfileField({
          userId,
          channelId: channel.id,
          field,
          section,
          currentInput,
        });

        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
