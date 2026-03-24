/**
 * /api/me/channels/[channelId]/competitors/[competitorId]
 *
 * PATCH  — Toggle type (competitor/inspiration)
 * DELETE — Soft delete (set isActive=false)
 */
import type { NextRequest } from "next/server";
import { z } from "zod";

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { ApiError } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { resolveChannelId } from "@/lib/features/suggestions";
import { prisma } from "@/prisma";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
  competitorId: z.string().uuid(),
});

const PatchBodySchema = z.object({
  type: z.enum(["competitor", "inspiration"]),
});

export const PATCH = createApiRoute(
  { route: "/api/me/channels/[channelId]/competitors/[competitorId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: ParamsSchema, body: PatchBodySchema },
      async (_req: NextRequest, _ctx, api, validated) => {
        const userId = api.userId!;
        const channelId = await resolveChannelId(validated.params!.channelId, userId);
        const { competitorId } = validated.params!;

        const competitor = await prisma.savedCompetitor.findFirst({
          where: { id: competitorId, userId, channelId, isActive: true },
        });

        if (!competitor) {
          throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Competitor not found" });
        }

        const updated = await prisma.savedCompetitor.update({
          where: { id: competitorId },
          data: { type: validated.body!.type },
          select: { id: true, type: true },
        });

        return jsonOk(updated, { requestId: api.requestId });
      },
    ),
  ),
);

export const DELETE = createApiRoute(
  { route: "/api/me/channels/[channelId]/competitors/[competitorId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: ParamsSchema },
      async (_req: NextRequest, _ctx, api, validated) => {
        const userId = api.userId!;
        const channelId = await resolveChannelId(validated.params!.channelId, userId);
        const { competitorId } = validated.params!;

        const competitor = await prisma.savedCompetitor.findFirst({
          where: { id: competitorId, userId, channelId, isActive: true },
        });

        if (!competitor) {
          throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Competitor not found" });
        }

        await prisma.savedCompetitor.update({
          where: { id: competitorId },
          data: { isActive: false },
        });

        return jsonOk({ deleted: true }, { requestId: api.requestId });
      },
    ),
  ),
);
