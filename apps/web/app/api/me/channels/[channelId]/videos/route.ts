/**
 * GET /api/me/channels/[channelId]/videos
 *
 * Returns the list of videos for a channel, enriched with analytics-based
 * baselines and per-video performance signals when available.
 *
 * Auth: Required
 */
import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  fetchBatchVideoAnalytics,
  fetchChannelVideos,
  getGoogleAccount,
} from "@/lib/adapters/youtube";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import type { EnrichVideosDeps, ListChannelVideosDeps } from "@/lib/features/channels";
import { enrichVideosWithAnalytics, listChannelVideos } from "@/lib/features/channels";

const VideosParamsSchema = z.object({
  channelId: z.string().min(1),
});

const listDeps: ListChannelVideosDeps = {
  getGoogleAccount,
  fetchChannelVideos,
};

const enrichDeps: EnrichVideosDeps = {
  fetchBatchAnalytics: fetchBatchVideoAnalytics,
};

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: VideosParamsSchema },
      async (req: NextRequest, _ctx, api, validated) => {
        const { channelId } = validated.params!;
        const url = new URL(req.url);

        const publishedAfter = url.searchParams.get("publishedAfter") ?? undefined;

        const result = await listChannelVideos(
          {
            userId: api.userId!,
            channelId,
            offset: Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
            limit: Number.parseInt(url.searchParams.get("limit") ?? "24", 10) || 24,
            publishedAfter,
          },
          listDeps,
        );

        const ga = await getGoogleAccount(api.userId!, channelId);
        if (!ga || result.videos.length === 0) {
          return jsonOk(result, { requestId: api.requestId });
        }

        const { baselines, analytics } = await enrichVideosWithAnalytics(
          {
            channelId,
            videos: result.videos.map((v) => ({
              videoId: v.videoId,
              views: v.views,
              publishedAt: v.publishedAt,
            })),
            googleAccount: ga,
          },
          enrichDeps,
        );

        const enrichedVideos = result.videos.map((v) => {
          const enrichment = analytics.get(v.videoId);
          if (!enrichment) { return v; }
          return {
            ...v,
            avgViewPercentage: enrichment.avgViewPercentage,
            subscribersGained: enrichment.subscribersGained,
            healthStatus: enrichment.healthStatus,
            performanceSignals: enrichment.performanceSignals,
          };
        });

        return jsonOk(
          { ...result, videos: enrichedVideos, baselines },
          { requestId: api.requestId },
        );
      },
    ),
  ),
);
