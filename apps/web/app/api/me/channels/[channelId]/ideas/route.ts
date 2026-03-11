/**
 * GET  /api/me/channels/[channelId]/ideas — List ideas for a channel
 * POST /api/me/channels/[channelId]/ideas — Create a new idea
 */
import type { NextRequest } from "next/server";

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import {
  createIdea,
  CreateIdeaBodySchema,
  IdeaParamsSchema,
  listIdeas,
} from "@/lib/features/video-ideas";
import { prisma } from "@/prisma";

async function resolveChannelId(youtubeChannelId: string, userId: number): Promise<number> {
  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId, userId },
    select: { id: true },
  });
  if (!channel) {
    throw new Error(`Channel not found: ${youtubeChannelId}`);
  }
  return channel.id;
}

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/ideas" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: IdeaParamsSchema },
      async (_req: NextRequest, _ctx, api, validated) => {
        const userId = api.userId!;
        const channelId = await resolveChannelId(validated.params!.channelId, userId);

        const ideas = await listIdeas({ userId, channelId });

        return jsonOk({ ideas }, { requestId: api.requestId });
      },
    ),
  ),
);

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/ideas" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: IdeaParamsSchema, body: CreateIdeaBodySchema },
      async (_req: NextRequest, _ctx, api, validated) => {
        const userId = api.userId!;
        const channelId = await resolveChannelId(validated.params!.channelId, userId);
        const body = validated.body!;

        const idea = await createIdea({
          userId,
          channelId,
          ...body,
        });

        return jsonOk({ idea }, { requestId: api.requestId });
      },
    ),
  ),
);
