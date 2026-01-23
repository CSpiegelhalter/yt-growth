/**
 * GET /api/competitors/video/[videoId]/more
 *
 * Lightweight helper endpoint for the competitor video detail page.
 * Fetches "More from this channel" in a separate request so the initial analysis
 * can render faster.
 *
 * Auth: Required (must own the provided channelId)
 * Entitlements: None (this does not run the competitor analysis)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUserWithSubscription } from "@/lib/user";
import {
  fetchRecentChannelVideos,
  fetchVideoDetails,
  getGoogleAccount,
} from "@/lib/youtube-api";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import type { CompetitorVideo } from "@/types/api";

const ParamsSchema = z.object({
  videoId: z.string().min(1),
});

const QuerySchema = z.object({
  channelId: z.string().min(1),
});

async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const paramsObj = await params;
  const parsedParams = ParamsSchema.safeParse(paramsObj);
  if (!parsedParams.success) {
    return Response.json({ error: "Invalid video ID" }, { status: 400 });
  }

  const url = new URL(req.url);
  const queryResult = QuerySchema.safeParse({
    channelId: url.searchParams.get("channelId") ?? "",
  });
  if (!queryResult.success) {
    return Response.json(
      { error: "channelId query parameter required" },
      { status: 400 }
    );
  }

  try {
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: same bucket as competitor detail (this still hits YouTube APIs)
    const rlKey = rateLimitKey("competitorDetail", user.id);
    const rlResult = checkRateLimit(rlKey, RATE_LIMITS.competitorDetail);
    if (!rlResult.success) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          resetAt: new Date(rlResult.resetAt).toISOString(),
        },
        { status: 429 }
      );
    }

    const { videoId } = parsedParams.data;
    const { channelId } = queryResult.data;

    // Verify the user owns the provided channelId (same semantics as the detail endpoint)
    const channel = await prisma.channel.findFirst({
      where: { youtubeChannelId: channelId, userId: user.id },
    });
    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Use channelId to get the correct GoogleAccount for this channel
    const ga = await getGoogleAccount(user.id, channelId);
    if (!ga) {
      return Response.json(
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    // Resolve the competitor's channel ID (prefer DB, fallback to YouTube)
    let competitorChannelId: string | null = null;
    let competitorChannelTitle: string | null = null;

    const dbVideo = await prisma.competitorVideo.findUnique({
      where: { videoId },
      select: { channelId: true, channelTitle: true },
    });
    if (dbVideo) {
      competitorChannelId = dbVideo.channelId;
      competitorChannelTitle = dbVideo.channelTitle;
    } else {
      const details = await fetchVideoDetails(ga, videoId);
      if (!details) {
        return Response.json({ error: "Video not found" }, { status: 404 });
      }
      competitorChannelId = details.channelId;
      competitorChannelTitle = details.channelTitle;
    }

    const now = new Date();
    const rangeDays = 28;
    const publishedAfter = new Date(
      now.getTime() - rangeDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const channelVideos = await fetchRecentChannelVideos(
      ga,
      competitorChannelId,
      publishedAfter,
      6
    );

    const moreFromChannel: CompetitorVideo[] = channelVideos
      .filter((v) => v.videoId !== videoId)
      .slice(0, 4)
      .map((v) => ({
        videoId: v.videoId,
        title: v.title,
        channelId: competitorChannelId!,
        channelTitle: competitorChannelTitle ?? "Channel",
        channelThumbnailUrl: null,
        videoUrl: `https://youtube.com/watch?v=${v.videoId}`,
        channelUrl: `https://youtube.com/channel/${competitorChannelId}`,
        thumbnailUrl: v.thumbnailUrl,
        publishedAt: v.publishedAt,
        stats: { viewCount: v.views },
        derived: { viewsPerDay: v.viewsPerDay },
      }));

    return Response.json(moreFromChannel);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Competitor more-from-channel error:", err);
    return Response.json(
      { error: "Failed to fetch more videos", detail: message },
      { status: 500 }
    );
  }
}

export const GET = createApiRoute(
  { route: "/api/competitors/video/[videoId]/more" },
  async (req, ctx) => GETHandler(req, ctx as any)
);


