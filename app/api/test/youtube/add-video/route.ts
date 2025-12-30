/**
 * POST /api/test/youtube/add-video
 *
 * Test-only route to add a fake video to a channel.
 * Simulates a user uploading a new video to YouTube.
 * Only available when APP_TEST_MODE=1.
 *
 * Request body:
 * {
 *   "channelId": "UC_test_channel_123",  // Required: channel to add video to
 *   "videoId": "vid_new_123",            // Optional: custom video ID
 *   "title": "My New Video"              // Optional: video title
 * }
 */
import { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { getCurrentUser } from "@/lib/user";
import { requireTestMode, logTestAction } from "@/lib/test-mode";
import { createApiRoute } from "@/lib/api/route";

async function POSTHandler(req: NextRequest) {
  // Guard: only available in test mode
  const guardResponse = requireTestMode();
  if (guardResponse) return guardResponse;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { channelId } = body;

    if (!channelId) {
      return Response.json(
        { error: "channelId is required" },
        { status: 400 }
      );
    }

    // Find the channel
    const channel = await prisma.channel.findFirst({
      where: {
        userId: user.id,
        youtubeChannelId: channelId,
      },
    });

    if (!channel) {
      return Response.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    const videoId = body.videoId || `vid_${channelId}_${Date.now()}`;
    const title = body.title || `New Video ${new Date().toISOString()}`;

    logTestAction("youtube/add-video", { userId: user.id, channelId, videoId, title });

    // Create the video
    const video = await prisma.video.create({
      data: {
        channelId: channel.id,
        youtubeVideoId: videoId,
        title,
        description: `This is a test video created at ${new Date().toISOString()}`,
        publishedAt: new Date(),
        durationSec: 300 + Math.floor(Math.random() * 600),
        tags: "test,new,upload",
        categoryId: "22",
        thumbnailUrl: `https://picsum.photos/seed/${videoId}/320/180`,
      },
    });

    // Update channel video count
    await prisma.channel.update({
      where: { id: channel.id },
      data: {
        totalVideoCount: { increment: 1 },
      },
    });

    return Response.json({
      success: true,
      videoId,
      video: {
        id: video.id,
        youtubeVideoId: videoId,
        title: video.title,
        publishedAt: video.publishedAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[TEST] youtube/add-video error:", err);
    return Response.json(
      { error: "Failed to add video", detail: message },
      { status: 500 }
    );
  }
}

export const POST = createApiRoute(
  { route: "/api/test/youtube/add-video" },
  async (req) => POSTHandler(req)
);

