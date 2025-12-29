/**
 * GET /api/private/cron/competitors-snapshot
 *
 * Periodic job to capture fresh snapshots for tracked competitor videos.
 * Should be called once or twice per day via cron (Vercel, GitHub Actions, etc.)
 *
 * PROTECTED: Requires CRON_SECRET header to match
 *
 * This endpoint:
 * 1. Finds all CompetitorVideo records that haven't been snapshotted recently
 * 2. Batches API calls to YouTube Data API to fetch fresh stats
 * 3. Creates new CompetitorVideoSnapshot records
 *
 * This enables velocity calculations without requiring users to actively browse.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { getGoogleAccount, fetchVideosStatsBatch } from "@/lib/youtube-api";

// Minimum hours between snapshots
const SNAPSHOT_INTERVAL_HOURS = 6;

// Maximum videos to process per cron run (to stay within quota)
const MAX_VIDEOS_PER_RUN = 100;

export async function GET(req: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const snapshotCutoff = new Date(now.getTime() - SNAPSHOT_INTERVAL_HOURS * 60 * 60 * 1000);

    // Find videos that need snapshotting
    // We need videos where:
    // - lastFetchedAt is older than cutoff, OR
    // - there's no snapshot newer than cutoff
    const videosNeedingSnapshot = await prisma.competitorVideo.findMany({
      where: {
        OR: [
          { lastFetchedAt: { lt: snapshotCutoff } },
          {
            Snapshots: {
              none: {
                capturedAt: { gt: snapshotCutoff },
              },
            },
          },
        ],
      },
      orderBy: { lastFetchedAt: "asc" },
      take: MAX_VIDEOS_PER_RUN,
      select: {
        videoId: true,
        channelId: true,
      },
    });

    if (videosNeedingSnapshot.length === 0) {
      return Response.json({
        success: true,
        message: "No videos need snapshotting",
        processed: 0,
      });
    }

    // Get a Google account to make API calls
    // We'll use the first available user's account (admin feature)
    const googleAccount = await prisma.googleAccount.findFirst({
      where: {
        refreshTokenEnc: { not: null },
      },
    });

    if (!googleAccount) {
      return Response.json({
        success: false,
        error: "No Google account available for API calls",
      });
    }

    // Get full GA object
    const ga = await getGoogleAccount(googleAccount.userId);
    if (!ga) {
      return Response.json({
        success: false,
        error: "Failed to load Google account credentials",
      });
    }

    // Batch fetch stats
    const videoIds = videosNeedingSnapshot.map((v) => v.videoId);
    const stats = await fetchVideosStatsBatch(ga, videoIds);

    // Create snapshots
    let created = 0;
    const errors: string[] = [];

    for (const video of videosNeedingSnapshot) {
      const videoStats = stats.get(video.videoId);
      if (!videoStats) {
        errors.push(`No stats for ${video.videoId}`);
        continue;
      }

      try {
        await prisma.competitorVideoSnapshot.create({
          data: {
            videoId: video.videoId,
            viewCount: videoStats.viewCount,
            likeCount: videoStats.likeCount,
            commentCount: videoStats.commentCount,
            capturedAt: now,
          },
        });

        // Update lastFetchedAt
        await prisma.competitorVideo.update({
          where: { videoId: video.videoId },
          data: { lastFetchedAt: now },
        });

        created++;
      } catch (err) {
        errors.push(`Failed to snapshot ${video.videoId}: ${err}`);
      }
    }

    return Response.json({
      success: true,
      processed: videosNeedingSnapshot.length,
      created,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Cron snapshot error:", err);
    return Response.json(
      { error: "Internal error", details: String(err) },
      { status: 500 }
    );
  }
}

