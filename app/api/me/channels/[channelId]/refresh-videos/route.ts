import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/prisma";
import { googleFetchWithAutoRefresh } from "@/lib/google-tokens";
import { createApiRoute } from "@/lib/api/route";

type YouTubeVideoDetails = {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
  };
  contentDetails?: {
    duration?: string;
  };
};

/**
 * POST /api/me/channels/[channelId]/refresh-videos
 * Refreshes video metadata (tags, description) for all videos in a channel
 */
async function POSTHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const session = await getServerSession(authOptions);
  const userIdRaw = (session?.user as { id?: string } | undefined)?.id;
  if (!userIdRaw) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(userIdRaw);
  const { channelId } = await params;

  try {
    // Find the channel and verify ownership
    const channel = await prisma.channel.findFirst({
      where: { youtubeChannelId: channelId, userId },
      include: {
        Video: {
          select: { id: true, youtubeVideoId: true },
          orderBy: { publishedAt: "desc" },
          take: 50, // Refresh up to 50 most recent videos
        },
        GoogleAccount: true,
      },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    if (!channel.GoogleAccount) {
      return Response.json(
        { error: "No Google account linked to this channel" },
        { status: 400 }
      );
    }

    const ga = channel.GoogleAccount;
    const videoIds = channel.Video.map((v) => v.youtubeVideoId);

    if (videoIds.length === 0) {
      return Response.json({ message: "No videos to refresh", updated: 0 });
    }

    // Fetch video details in batches of 50 (YouTube API limit)
    let updated = 0;
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      
      const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      detailsUrl.search = new URLSearchParams({
        part: "id,snippet,contentDetails",
        id: batch.join(","),
      }).toString();

      const detailsData = await googleFetchWithAutoRefresh<{
        items: YouTubeVideoDetails[];
      }>(ga, detailsUrl.toString());

      // Update each video with new metadata (tags, description, categoryId)
      for (const item of detailsData.items ?? []) {
        const tags = item.snippet?.tags?.join(",") ?? "";
        const description = item.snippet?.description ?? "";
        const categoryId = item.snippet?.categoryId ?? null;

        await prisma.video.updateMany({
          where: {
            channelId: channel.id,
            youtubeVideoId: item.id,
          },
          data: {
            tags,
            description,
            categoryId,
            title: item.snippet?.title,
          },
        });
        updated++;
      }
    }

    console.log(`[refresh-videos] Updated ${updated} videos for channel ${channelId}`);

    return Response.json({
      message: `Successfully refreshed ${updated} videos`,
      updated,
    });
  } catch (err) {
    console.error("[refresh-videos] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Failed to refresh videos", detail: message },
      { status: 500 }
    );
  }
}

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/refresh-videos" },
  async (req, ctx) => POSTHandler(req, ctx as any)
);

