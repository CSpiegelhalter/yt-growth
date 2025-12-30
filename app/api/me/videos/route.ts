/**
 * GET /api/me/videos
 *
 * List recent videos across all of the current user's channels.
 *
 * Auth: Required
 * Caching: no-store (user-specific)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";

const QuerySchema = z.object({
  channelId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const GET = createApiRoute(
  { route: "/api/me/videos" },
  withAuth({ mode: "required" }, (req, ctx, api: ApiAuthContext) =>
    withValidation({ query: QuerySchema }, async (_req: NextRequest, _ctx, _api, validated) => {
      const user = api.user!;
      const q = validated.query ?? {};
      const limit = q.limit ?? 50;

      const videos = await prisma.video.findMany({
        where: {
          Channel: {
            userId: user.id,
            ...(q.channelId ? { youtubeChannelId: q.channelId } : {}),
          },
        },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: limit,
        select: {
          youtubeVideoId: true,
          title: true,
          thumbnailUrl: true,
          durationSec: true,
          publishedAt: true,
          Channel: { select: { youtubeChannelId: true, title: true } },
          VideoMetrics: {
            select: {
              views: true,
              likes: true,
              comments: true,
              fetchedAt: true,
              cachedUntil: true,
            },
          },
        },
      });

      return jsonOk(
        {
          videos: videos.map((v) => ({
            videoId: v.youtubeVideoId,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            durationSec: v.durationSec,
            publishedAt: v.publishedAt,
            channel: {
              channelId: v.Channel.youtubeChannelId,
              title: v.Channel.title,
            },
            metrics: v.VideoMetrics
              ? {
                  views: v.VideoMetrics.views,
                  likes: v.VideoMetrics.likes,
                  comments: v.VideoMetrics.comments,
                  fetchedAt: v.VideoMetrics.fetchedAt.toISOString(),
                  cachedUntil: v.VideoMetrics.cachedUntil.toISOString(),
                }
              : null,
          })),
        },
        { headers: { "cache-control": "no-store" }, requestId: api.requestId }
      );
    })(req, ctx, api)
  )
);


