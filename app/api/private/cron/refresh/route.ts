/**
 * POST /api/private/cron/refresh
 *
 * Refresh caches for active users/channels.
 * Secured by X-CRON-SECRET header.
 *
 * This should be called periodically (e.g., every 6 hours) to keep caches fresh.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";

const CRON_SECRET = process.env.CRON_SECRET;

async function POSTHandler(req: NextRequest) {
  try {
    // Verify cron secret
    const secret = req.headers.get("x-cron-secret");
    if (!CRON_SECRET || secret !== CRON_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = {
      channelsProcessed: 0,
      videosRefreshed: 0,
      metricsRefreshed: 0,
      errors: [] as string[],
    };

    // Find active subscribed users with channels
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
        plan: { not: "free" },
      },
      include: {
        User: {
          include: {
            Channel: true,
            GoogleAccount: true,
          },
        },
      },
      take: 100, // Process up to 100 users per cron run
    });

    for (const sub of activeSubscriptions) {
      const user = sub.User;
      if (!user.GoogleAccount.length || !user.Channel.length) continue;

      for (const channel of user.Channel) {
        try {
          results.channelsProcessed++;

          // Check if channel needs refresh (last synced > 6 hours ago)
          if (channel.lastSyncedAt) {
            const hoursSinceSync = (Date.now() - channel.lastSyncedAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceSync < 6) {
              continue; // Skip recently synced channels
            }
          }

          // Mark for refresh - the actual sync happens when user visits dashboard
          // This is a lightweight approach to avoid making too many API calls in cron
          await prisma.channel.update({
            where: { id: channel.id },
            data: { syncStatus: "stale" },
          });

          // Clean up expired caches
          const now = new Date();
          
          // Delete expired retention blobs
          await prisma.retentionBlob.deleteMany({
            where: {
              channelId: channel.id,
              cachedUntil: { lt: now },
            },
          });

          // Delete expired video metrics
          await prisma.videoMetrics.deleteMany({
            where: {
              channelId: channel.id,
              cachedUntil: { lt: now },
            },
          });
        } catch (err: any) {
          results.errors.push(`Channel ${channel.id}: ${err.message}`);
        }
      }
    }

    return Response.json({
      success: true,
      ...results,
      processedAt: new Date(),
    });
  } catch (err: any) {
    console.error("Cron refresh error:", err);
    return Response.json(
      { error: "Cron refresh failed", detail: err.message },
      { status: 500 }
    );
  }
}

export const POST = createApiRoute(
  { route: "/api/private/cron/refresh" },
  async (req) => POSTHandler(req)
);

