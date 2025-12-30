/**
 * POST /api/test/youtube/link-empty
 *
 * Test-only route to link a fake YouTube channel WITHOUT any videos.
 * Used to test the "no videos → upload → refresh → see videos" flow.
 * Only available when APP_TEST_MODE=1.
 *
 * Request body (optional):
 * {
 *   "channelId": "UC_test_channel_123",  // Optional custom channel ID
 *   "title": "Test Channel"              // Optional custom title
 * }
 */
import { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { getCurrentUser } from "@/lib/user";
import { requireTestMode, logTestAction } from "@/lib/test-mode";
import { checkChannelLimit } from "@/lib/with-entitlements";
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

    // Parse optional body
    let body: { channelId?: string; title?: string; bypassLimit?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is fine
    }

    const channelId =
      body.channelId ||
      `UC_empty_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const title = body.title || "Empty Test Channel";
    const bypassLimit = body.bypassLimit === true;

    logTestAction("youtube/link-empty", { userId: user.id, channelId, title });

    // Check channel limit (unless bypassed)
    if (!bypassLimit) {
      const limitCheck = await checkChannelLimit(user.id);
      if (!limitCheck.allowed) {
        return Response.json(
          {
            error: "channel_limit_reached",
            current: limitCheck.current,
            limit: limitCheck.limit,
            plan: limitCheck.plan,
          },
          { status: 403 }
        );
      }
    }

    // Create or find GoogleAccount for this user
    let googleAccount = await prisma.googleAccount.findFirst({
      where: { userId: user.id },
    });

    if (!googleAccount) {
      googleAccount = await prisma.googleAccount.create({
        data: {
          userId: user.id,
          provider: "google",
          providerAccountId: `test_${user.id}_${Date.now()}`,
          refreshTokenEnc: "fake_refresh_token_for_testing",
          scopes: "https://www.googleapis.com/auth/youtube.readonly",
          tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Create the channel WITHOUT any videos
    const channel = await prisma.channel.upsert({
      where: {
        userId_youtubeChannelId: {
          userId: user.id,
          youtubeChannelId: channelId,
        },
      },
      update: {
        title,
        thumbnailUrl: `https://picsum.photos/seed/${channelId}/88/88`,
        totalVideoCount: 0, // No videos
        subscriberCount: 100, // Small channel
        lastSyncedAt: new Date(),
        syncStatus: "idle",
        syncError: null,
        googleAccountId: googleAccount.id,
      },
      create: {
        userId: user.id,
        youtubeChannelId: channelId,
        title,
        thumbnailUrl: `https://picsum.photos/seed/${channelId}/88/88`,
        totalVideoCount: 0,
        subscriberCount: 100,
        lastSyncedAt: new Date(),
        syncStatus: "idle",
        googleAccountId: googleAccount.id,
      },
    });

    return Response.json({
      success: true,
      channelId,
      channel: {
        id: channel.id,
        youtubeChannelId: channelId,
        title: channel.title,
        thumbnailUrl: channel.thumbnailUrl,
        totalVideoCount: 0,
        subscriberCount: channel.subscriberCount,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[TEST] youtube/link-empty error:", err);
    return Response.json(
      { error: "Failed to link channel", detail: message },
      { status: 500 }
    );
  }
}

export const POST = createApiRoute(
  { route: "/api/test/youtube/link-empty" },
  async (req) => POSTHandler(req)
);

