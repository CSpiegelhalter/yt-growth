/**
 * DELETE/PATCH /api/me/saved-ideas/[ideaId]
 *
 * Manage individual saved ideas.
 *
 * DELETE - Remove a saved idea
 * PATCH - Update notes/status of a saved idea
 *
 * Auth: Required
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import {
  IdeaParamsSchema,
  UpdateIdeaBodySchema,
  deleteIdea,
  updateIdea,
} from "@/lib/features/saved-ideas";

export const DELETE = createApiRoute(
  { route: "/api/me/saved-ideas/[ideaId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: IdeaParamsSchema },
      async (_req, _ctx, api, validated) => {
        const { ideaId } = validated.params!;

        const result = await deleteIdea({
          userId: api.userId!,
          ideaId,
        });

        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);

export const PATCH = createApiRoute(
  { route: "/api/me/saved-ideas/[ideaId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: IdeaParamsSchema, body: UpdateIdeaBodySchema },
      async (_req, _ctx, api, validated) => {
        const { ideaId } = validated.params!;
        const body = validated.body!;

        const result = await updateIdea({
          userId: api.userId!,
          ideaId,
          notes: body.notes,
          status: body.status,
          ideaJson: body.ideaJson,
        });

        return jsonOk({ success: true, savedIdea: result }, { requestId: api.requestId });
      },
    ),
  ),
);
