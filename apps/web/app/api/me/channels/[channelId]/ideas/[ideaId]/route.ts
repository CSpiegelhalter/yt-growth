/**
 * GET    /api/me/channels/[channelId]/ideas/[ideaId] — Get a single idea
 * PATCH  /api/me/channels/[channelId]/ideas/[ideaId] — Update an idea
 * DELETE /api/me/channels/[channelId]/ideas/[ideaId] — Delete an idea
 */
import type { NextRequest } from "next/server";

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import {
  deleteIdea,
  getIdea,
  IdeaDetailParamsSchema,
  updateIdea,
  UpdateIdeaBodySchema,
} from "@/lib/features/video-ideas";

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/ideas/[ideaId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: IdeaDetailParamsSchema },
      async (_req: NextRequest, _ctx, api, validated) => {
        const userId = api.userId!;
        const ideaId = validated.params!.ideaId;

        const idea = await getIdea({ userId, ideaId });

        return jsonOk({ idea }, { requestId: api.requestId });
      },
    ),
  ),
);

export const PATCH = createApiRoute(
  { route: "/api/me/channels/[channelId]/ideas/[ideaId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: IdeaDetailParamsSchema, body: UpdateIdeaBodySchema },
      async (_req: NextRequest, _ctx, api, validated) => {
        const userId = api.userId!;
        const ideaId = validated.params!.ideaId;
        const body = validated.body!;

        const idea = await updateIdea({ userId, ideaId, input: body });

        return jsonOk({ idea }, { requestId: api.requestId });
      },
    ),
  ),
);

export const DELETE = createApiRoute(
  { route: "/api/me/channels/[channelId]/ideas/[ideaId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: IdeaDetailParamsSchema },
      async (_req: NextRequest, _ctx, api, validated) => {
        const userId = api.userId!;
        const ideaId = validated.params!.ideaId;

        await deleteIdea({ userId, ideaId });

        return jsonOk({ success: true }, { requestId: api.requestId });
      },
    ),
  ),
);
