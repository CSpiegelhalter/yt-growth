/**
 * GET /api/cron/refresh-youtube-rising
 *
 * Cron job (every 1 hour) that fetches YouTube's most popular videos
 * and computes view velocity for trending video detection.
 *
 * Protected by CRON_SECRET header.
 */

import { fetchTrendingVideos } from "@/lib/adapters/youtube/data-api";
import { trendingCacheExpiresAt } from "@/lib/shared/cache-ttl";
import { createLogger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

const log = createLogger({ module: "cron/refresh-youtube-rising" });

const LOCK_WINDOW_MS = 5 * 60 * 1000;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Lock check
    const existing = await prisma.trendingCache.findUnique({
      where: { key: "youtube-rising" },
      select: { updatedAt: true },
    });
    if (existing && Date.now() - existing.updatedAt.getTime() < LOCK_WINDOW_MS) {
      log.info("Skipped — recently refreshed", { lastUpdate: existing.updatedAt.toISOString() });
      return Response.json({ ok: true, skipped: true, reason: "recently_refreshed" });
    }

    // Fetch YouTube most popular (view velocity + 1-72hr filter applied in adapter)
    const videos = await fetchTrendingVideos({ regionCode: "US" });

    // Upsert cache
    const expiresAt = trendingCacheExpiresAt();
    const cachePayload = structuredClone(videos);
    await prisma.trendingCache.upsert({
      where: { key: "youtube-rising" },
      create: {
        key: "youtube-rising",
        data: cachePayload,
        expiresAt,
      },
      update: {
        data: cachePayload,
        expiresAt,
      },
    });

    const duration = Date.now() - startTime;
    log.info("Cron completed", { videoCount: videos.length, durationMs: duration });

    return Response.json({
      ok: true,
      videoCount: videos.length,
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error("Cron failed", {
      error: error instanceof Error ? error.message : String(error),
      durationMs: duration,
    });

    return Response.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 },
    );
  }
}
