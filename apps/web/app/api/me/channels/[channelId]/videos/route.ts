/**
 * GET /api/me/channels/[channelId]/videos
 *
 * Returns the list of videos for a channel.
 * Reads videos live from YouTube Data API.
 *
 * Auth: Required
 */
import type { NextRequest } from "next/server";
import { z } from "zod";

import { fetchChannelVideos,getGoogleAccount } from "@/lib/adapters/youtube";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import type { ListChannelVideosDeps } from "@/lib/features/channels";
import { listChannelVideos } from "@/lib/features/channels";

const VideosParamsSchema = z.object({
  channelId: z.string().min(1),
});

const deps: ListChannelVideosDeps = {
  getGoogleAccount,
  fetchChannelVideos,
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

        const result = await listChannelVideos(
          {
            userId: api.userId!,
            channelId,
            offset: Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
            limit: Number.parseInt(url.searchParams.get("limit") ?? "24", 10) || 24,
          },
          deps,
        );

        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
