/**
 * GET/POST /api/me/saved-ideas
 *
 * Manage user's saved video ideas.
 *
 * GET - Fetch all saved ideas for the current user
 * POST - Save a new idea
 *
 * Auth: Required
 */
import type { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import {
  SaveIdeaBodySchema,
  listIdeas,
  saveIdea,
} from "@/lib/features/saved-ideas";

export const GET = createApiRoute(
  { route: "/api/me/saved-ideas" },
  withAuth({ mode: "required" }, async (req: NextRequest, _ctx, api) => {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    const result = await listIdeas({
      userId: api.userId!,
      status,
    });

    return jsonOk(result, { requestId: api.requestId });
  }),
);

export const POST = createApiRoute(
  { route: "/api/me/saved-ideas" },
  withAuth(
    { mode: "required" },
    withValidation(
      { body: SaveIdeaBodySchema },
      async (_req, _ctx, api, validated) => {
        const body = validated.body!;

        const result = await saveIdea({
          userId: api.userId!,
          ideaId: body.ideaId,
          channelId: body.channelId,
          title: body.title,
          angle: body.angle,
          format: body.format,
          difficulty: body.difficulty,
          ideaJson: body.ideaJson,
          notes: body.notes,
        });

        return jsonOk({ success: true, savedIdea: result }, { requestId: api.requestId });
      },
    ),
  ),
);
