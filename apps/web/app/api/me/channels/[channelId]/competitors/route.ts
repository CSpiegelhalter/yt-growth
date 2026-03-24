/**
 * /api/me/channels/[channelId]/competitors
 *
 * GET  — List active saved competitors
 * POST — Save selected competitor channels (upsert, max 5)
 */
import type { NextRequest } from "next/server";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { resolveChannelId } from "@/lib/features/suggestions";
import { createLogger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

const log = createLogger({ module: "api/competitors" });

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

// ── GET ─────────────────────────────────────────────────────────

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/competitors" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: ParamsSchema },
      async (_req: NextRequest, _ctx, api, validated) => {
        const userId = api.userId!;
        const channelId = await resolveChannelId(validated.params!.channelId, userId);

        const competitors = await prisma.savedCompetitor.findMany({
          where: { userId, channelId, isActive: true },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            ytChannelId: true,
            channelTitle: true,
            thumbnailUrl: true,
            subscriberCount: true,
            type: true,
            source: true,
            matchReason: true,
            nicheOverlap: true,
            createdAt: true,
          },
        });

        return jsonOk(
          { competitors, total: competitors.length },
          { requestId: api.requestId },
        );
      },
    ),
  ),
);

// ── POST ────────────────────────────────────────────────────────

const CompetitorItemSchema = z.object({
  ytChannelId: z.string().min(1).max(64),
  channelTitle: z.string().min(1).max(255),
  thumbnailUrl: z.string().nullish(),
  subscriberCount: z.number().int().nullish(),
  matchReason: z.string().max(255).nullish(),
  nicheOverlap: z.number().min(0).max(1).nullish(),
});

const SaveCompetitorsBodySchema = z.object({
  competitors: z.array(CompetitorItemSchema).min(1).max(5),
  source: z.enum(["auto", "manual", "profile", "analyze"]).default("auto"),
});

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/competitors" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: ParamsSchema, body: SaveCompetitorsBodySchema },
      async (_req: NextRequest, _ctx, api, validated) => {
        const userId = api.userId!;
        const channelId = await resolveChannelId(validated.params!.channelId, userId);
        const { competitors, source } = validated.body!;

        const existingCount = await prisma.savedCompetitor.count({
          where: { userId, channelId, isActive: true },
        });

        const available = 5 - existingCount;
        if (available <= 0) {
          return jsonError({
            status: 400,
            code: "VALIDATION_ERROR",
            message: "Maximum of 5 active competitors reached",
            requestId: api.requestId,
          });
        }

        const toSave = competitors.slice(0, available);

        const results = await Promise.all(
          toSave.map((comp) =>
            prisma.savedCompetitor.upsert({
              where: {
                userId_channelId_ytChannelId: {
                  userId,
                  channelId,
                  ytChannelId: comp.ytChannelId,
                },
              },
              update: {
                isActive: true,
                channelTitle: comp.channelTitle,
                thumbnailUrl: comp.thumbnailUrl ?? undefined,
                subscriberCount: comp.subscriberCount ?? undefined,
                matchReason: comp.matchReason ?? undefined,
                nicheOverlap: comp.nicheOverlap ?? undefined,
              },
              create: {
                userId,
                channelId,
                ytChannelId: comp.ytChannelId,
                channelTitle: comp.channelTitle,
                thumbnailUrl: comp.thumbnailUrl ?? null,
                subscriberCount: comp.subscriberCount ?? null,
                type: "competitor",
                source,
                matchReason: comp.matchReason ?? null,
                nicheOverlap: comp.nicheOverlap ?? null,
              },
            }),
          ),
        );

        log.info("Saved competitors", {
          userId,
          channelId,
          count: results.length,
          source,
        });

        return jsonOk(
          { saved: results.length, total: existingCount + results.length },
          { requestId: api.requestId },
        );
      },
    ),
  ),
);
