/**
 * POST /api/test/youtube/link
 *
 * Test-only route to link a fake YouTube channel for the logged-in user.
 * Only available when APP_TEST_MODE=1.
 *
 * Request body (optional):
 * {
 *   "channelId": "UC_test_channel_123",  // Optional custom channel ID
 *   "title": "Test Channel",             // Optional custom title
 *   "bypassLimit": false                 // Optional: bypass channel limit check (for setup)
 * }
 *
 * Returns:
 * {
 *   "success": true,
 *   "channelId": "UC_test_channel_123",
 *   "channel": { ... }
 * }
 *
 * Or if limit reached:
 * {
 *   "error": "channel_limit_reached",
 *   "current": 1,
 *   "limit": 1,
 *   "plan": "FREE"
 * }
 */
import { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { getCurrentUser } from "@/lib/user";
import { requireTestMode, logTestAction } from "@/lib/test-mode";
import { checkChannelLimit } from "@/lib/with-entitlements";

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
    let body: { channelId?: string; title?: string; bypassLimit?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is fine
    }

    const channelId = body.channelId || `UC_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const title = body.title || "Test Channel";
    const bypassLimit = body.bypassLimit === true;

    logTestAction("youtube/link", { userId: user.id, channelId, title, bypassLimit });

    // Check channel limit (unless bypassed for test setup)
    if (!bypassLimit) {
      const limitCheck = await checkChannelLimit(user.id);
      if (!limitCheck.allowed) {
        return Response.json(
          {
            error: "channel_limit_reached",
            current: limitCheck.current,
            limit: limitCheck.limit,
            plan: limitCheck.plan,
            message: `You have reached the maximum of ${limitCheck.limit} channel(s) for your plan.`,
          },
          { status: 403 }
        );
      }
    }

    // Create or find GoogleAccount for this user (test mode doesn't need real tokens)
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
          tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
    }

    // Create the channel
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
        totalVideoCount: 25,
        subscriberCount: 10000,
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
        totalVideoCount: 25,
        subscriberCount: 10000,
        lastSyncedAt: new Date(),
        syncStatus: "idle",
        googleAccountId: googleAccount.id,
      },
    });

    // Create some fake videos for this channel
    const videoPromises = [];
    for (let i = 0; i < 10; i++) {
      const videoId = `vid_${channelId}_${i}`;
      const daysAgo = i * 3; // Each video ~3 days apart
      videoPromises.push(
        prisma.video.upsert({
          where: {
            channelId_youtubeVideoId: {
              channelId: channel.id,
              youtubeVideoId: videoId,
            },
          },
          update: {},
          create: {
            channelId: channel.id,
            youtubeVideoId: videoId,
            title: `Test Video ${i + 1}: How to Grow Your Channel`,
            description: `This is test video ${i + 1}. Lorem ipsum dolor sit amet.`,
            publishedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
            durationSec: 300 + Math.floor(Math.random() * 600), // 5-15 min
            tags: "test,youtube,growth,tutorial",
            categoryId: "22", // People & Blogs
            thumbnailUrl: `https://picsum.photos/seed/${videoId}/320/180`,
          },
        })
      );
    }
    await Promise.all(videoPromises);

    return Response.json({
      success: true,
      channelId,
      channel: {
        id: channel.id,
        youtubeChannelId: channelId,
        title: channel.title,
        thumbnailUrl: channel.thumbnailUrl,
        totalVideoCount: channel.totalVideoCount,
        subscriberCount: channel.subscriberCount,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[TEST] youtube/link error:", err);
    return Response.json(
      { error: "Failed to link channel", detail: message },
      { status: 500 }
    );
  }
}

