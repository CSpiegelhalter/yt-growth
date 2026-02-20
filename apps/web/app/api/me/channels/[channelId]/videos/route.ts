/**
 * GET /api/me/channels/[channelId]/videos
 *
 * Returns the list of videos for a channel.
 * This route is optimized for dashboard responsiveness:
 * - Reads videos live from YouTube Data API
 * - Avoids heavy DB write/sync loops in the request path
 * - Uses offset/limit compatibility for existing client pagination
 *
 * Auth: Required
 * Subscription: NOT required
 */
import { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUser } from "@/lib/user";
import { getGoogleAccount, fetchChannelVideos } from "@/lib/youtube-api";
import { channelParamsSchema } from "@/lib/competitors/video-detail/validation";

// Page size divisible by 6 for even grid layouts (1, 2, or 3 columns)
const DEFAULT_PAGE_SIZE = 24;

async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  // Parse pagination params from URL
  const url = new URL(req.url);
  const offset = Math.max(
    0,
    parseInt(url.searchParams.get("offset") ?? "0", 10) || 0
  );
  const limit = Math.min(
    100,
    Math.max(
      6,
      parseInt(
        url.searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE),
        10
      ) || DEFAULT_PAGE_SIZE
    )
  );

  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate params
    const paramsObj = await params;
    const parsed = channelParamsSchema.safeParse(paramsObj);
    if (!parsed.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsed.data;

    // Verify channel ownership.
    const channel = await prisma.channel.findFirst({
      where: {
        youtubeChannelId: channelId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    const ga = await getGoogleAccount(user.id, channelId);
    if (!ga) {
      return Response.json(
        { error: "Google account not found for this channel" },
        { status: 400 },
      );
    }

    // Fetch one extra item to detect whether a next page exists.
    const maxNeededWithSentinel = offset + limit + 1;
    const allVideos = await fetchChannelVideos(
      ga,
      channelId,
      maxNeededWithSentinel,
    );
    const pageVideos = allVideos.slice(offset, offset + limit);

    const videos = pageVideos.map((v) => {
      return {
        videoId: v.videoId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        durationSec: v.durationSec,
        publishedAt: v.publishedAt,
        views: v.views ?? 0,
        likes: v.likes ?? 0,
        comments: v.comments ?? 0,
        // Extended metrics for Video Tools
        shares: null,
        subscribersGained: null,
        subscribersLost: null,
        estimatedMinutesWatched: null,
        avgViewDuration: null,
        avgViewPercentage: null,
      };
    });

    const hasMore = allVideos.length > offset + limit;

    return Response.json({
      channelId,
      videos,
      pagination: {
        offset,
        limit,
        hasMore,
      },
    });
  } catch (err: any) {
    console.error("Videos list error:", err);
    return Response.json(
      { error: "Failed to fetch videos", detail: err.message },
      { status: 500 }
    );
  }
}

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos" },
  async (req, ctx) => GETHandler(req, ctx as any)
);
