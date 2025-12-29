/**
 * POST /api/test/youtube/unlink
 *
 * Test-only route to unlink/remove a YouTube channel for the logged-in user.
 * Only available when APP_TEST_MODE=1.
 *
 * Request body (optional):
 * {
 *   "channelId": "UC_test_channel_123"  // If not provided, removes all channels
 * }
 *
 * Returns:
 * {
 *   "success": true,
 *   "removedCount": 1
 * }
 */
import { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { getCurrentUser } from "@/lib/user";
import { requireTestMode, logTestAction } from "@/lib/test-mode";

export async function POST(req: NextRequest) {
  // Guard: only available in test mode
  const guardResponse = requireTestMode();
  if (guardResponse) return guardResponse;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse optional body
    let body: { channelId?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is fine
    }

    const { channelId } = body;

    logTestAction("youtube/unlink", { userId: user.id, channelId });

    let removedCount = 0;

    if (channelId) {
      // Remove specific channel
      const channel = await prisma.channel.findFirst({
        where: {
          userId: user.id,
          youtubeChannelId: channelId,
        },
      });

      if (channel) {
        // Delete videos first (cascade might handle this, but being explicit)
        await prisma.video.deleteMany({
          where: { channelId: channel.id },
        });

        // Delete the channel
        await prisma.channel.delete({
          where: { id: channel.id },
        });

        removedCount = 1;
      }
    } else {
      // Remove all channels for this user
      const channels = await prisma.channel.findMany({
        where: { userId: user.id },
        select: { id: true },
      });

      for (const channel of channels) {
        await prisma.video.deleteMany({
          where: { channelId: channel.id },
        });
      }

      const result = await prisma.channel.deleteMany({
        where: { userId: user.id },
      });

      removedCount = result.count;
    }

    return Response.json({
      success: true,
      removedCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[TEST] youtube/unlink error:", err);
    return Response.json(
      { error: "Failed to unlink channel", detail: message },
      { status: 500 }
    );
  }
}

