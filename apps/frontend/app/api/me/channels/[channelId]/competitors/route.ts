/**
 * GET /api/me/channels/[channelId]/competitors
 *
 * Get competitor videos "working right now" in the user's niche.
 * VIDEO-FIRST feed with pagination, sorting, and derived velocity metrics.
 *
 * Features:
 * - Fetches videos from similar channels via YouTube Data API
 * - Stores snapshots to track velocity over time
 * - Computes derived metrics: velocity24h, velocity7d, acceleration, outlierScore
 *
 * Auth: Required
 * Subscription: Required
 * Caching: 12h for discovery, snapshots captured every 6h minimum
 *
 * Query params:
 * - range: "7d" | "28d" (default: "7d")
 * - sort: "velocity" | "engagement" | "newest" | "outliers" (default: "velocity")
 * - cursor: string (for pagination)
 * - limit: number (default: 12, max: 50)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { getCurrentUserWithSubscription, hasActiveSubscription } from "@/lib/user";
import {
  getGoogleAccount,
  searchSimilarChannels,
  fetchRecentChannelVideos,
  fetchVideosStatsBatch,
} from "@/lib/youtube-api";
import { isDemoMode } from "@/lib/demo-fixtures";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import type { CompetitorFeedResponse, CompetitorVideo } from "@/types/api";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["7d", "28d"]).default("7d"),
  sort: z.enum(["velocity", "engagement", "newest", "outliers"]).default("velocity"),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(12),
});

// Minimum hours between snapshots for a video
const SNAPSHOT_INTERVAL_HOURS = 6;

export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  // Return demo data if demo mode is enabled
  if (isDemoMode()) {
    const demoData = generateDemoCompetitorFeed();
    return Response.json({ ...demoData, demo: true });
  }

  try {
    // Auth check
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit check
    const rlKey = rateLimitKey("competitorFeed", user.id);
    const rlResult = checkRateLimit(rlKey, RATE_LIMITS.competitorFeed);
    if (!rlResult.success) {
      return Response.json(
        { error: "Rate limit exceeded", resetAt: new Date(rlResult.resetAt).toISOString() },
        { status: 429 }
      );
    }

    // Subscription check (paid feature)
    if (!hasActiveSubscription(user.subscription)) {
      return Response.json(
        { error: "Subscription required", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      );
    }

    // Validate params
    const parsedParams = ParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsedParams.data;

    // Parse query params
    const url = new URL(req.url);
    const queryResult = QuerySchema.safeParse({
      range: url.searchParams.get("range") ?? "7d",
      sort: url.searchParams.get("sort") ?? "velocity",
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? "12",
    });

    if (!queryResult.success) {
      return Response.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { range, sort, cursor, limit } = queryResult.data;

    // Get channel and verify ownership
    const channel = await prisma.channel.findFirst({
      where: {
        youtubeChannelId: channelId,
        userId: user.id,
      },
      include: {
        Video: {
          orderBy: { publishedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Get Google account for API calls
    const ga = await getGoogleAccount(user.id);
    if (!ga) {
      return Response.json({ error: "Google account not connected" }, { status: 400 });
    }

    // Extract keywords from recent video titles and tags for niche matching
    const userKeywords = extractKeywords(
      channel.Video.map((v) => ({
        title: v.title ?? "",
        tags: v.tags ?? "",
      }))
    );

    if (userKeywords.length === 0) {
      return Response.json({
        channelId,
        range,
        sort,
        generatedAt: new Date().toISOString(),
        cachedUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        videos: [],
      } as CompetitorFeedResponse);
    }

    // Search for similar channels
    const similarChannelResults = await searchSimilarChannels(ga, userKeywords, 8);

    // Filter out the user's own channel
    const filteredChannels = similarChannelResults
      .filter((c) => c.channelId !== channelId)
      .slice(0, 6);

    // Calculate date range
    const rangeDays = range === "7d" ? 7 : 28;
    const publishedAfter = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();

    // Fetch recent videos from all competitor channels
    const rawVideos: Array<{
      videoId: string;
      title: string;
      channelId: string;
      channelTitle: string;
      channelThumbnailUrl: string | null;
      thumbnailUrl: string | null;
      publishedAt: string;
      views: number;
      viewsPerDay: number;
    }> = [];

    await Promise.all(
      filteredChannels.map(async (sc) => {
        try {
          const recentVideos = await fetchRecentChannelVideos(
            ga,
            sc.channelId,
            publishedAfter,
            10
          );

          recentVideos.forEach((v) => {
            rawVideos.push({
              videoId: v.videoId,
              title: v.title,
              channelId: sc.channelId,
              channelTitle: sc.channelTitle,
              channelThumbnailUrl: sc.thumbnailUrl,
              thumbnailUrl: v.thumbnailUrl,
              publishedAt: v.publishedAt,
              views: v.views,
              viewsPerDay: v.viewsPerDay,
            });
          });
        } catch (err) {
          console.warn(`Failed to fetch videos for channel ${sc.channelId}:`, err);
        }
      })
    );

    // Upsert videos to CompetitorVideo table and get/create snapshots
    const videoIds = rawVideos.map((v) => v.videoId);

    // Get existing videos from DB
    const existingVideos = await prisma.competitorVideo.findMany({
      where: { videoId: { in: videoIds } },
      include: {
        Snapshots: {
          orderBy: { capturedAt: "desc" },
          take: 10, // Get recent snapshots for velocity calculation
        },
      },
    });

    const existingVideoMap = new Map(existingVideos.map((v) => [v.videoId, v]));

    // Determine which videos need fresh stats (for snapshotting)
    const now = new Date();
    const snapshotCutoff = new Date(now.getTime() - SNAPSHOT_INTERVAL_HOURS * 60 * 60 * 1000);

    const videosNeedingSnapshot = rawVideos.filter((v) => {
      const existing = existingVideoMap.get(v.videoId);
      if (!existing) return true; // New video, needs snapshot
      const lastSnapshot = existing.Snapshots[0];
      if (!lastSnapshot) return true;
      return lastSnapshot.capturedAt < snapshotCutoff;
    });

    // Fetch fresh stats for videos needing snapshots (batched API call)
    let freshStats = new Map<string, { viewCount: number; likeCount?: number; commentCount?: number }>();
    if (videosNeedingSnapshot.length > 0) {
      freshStats = await fetchVideosStatsBatch(
        ga,
        videosNeedingSnapshot.map((v) => v.videoId)
      );
    }

    // Upsert videos and create snapshots
    for (const v of rawVideos) {
      const existing = existingVideoMap.get(v.videoId);
      const stats = freshStats.get(v.videoId);

      if (!existing) {
        // Create new video record
        try {
          await prisma.competitorVideo.create({
            data: {
              videoId: v.videoId,
              channelId: v.channelId,
              channelTitle: v.channelTitle,
              title: v.title,
              publishedAt: new Date(v.publishedAt),
              thumbnailUrl: v.thumbnailUrl,
              lastFetchedAt: now,
            },
          });
        } catch {
          // Ignore duplicate key errors (race condition)
        }
      } else {
        // Update existing video metadata
        await prisma.competitorVideo.update({
          where: { videoId: v.videoId },
          data: {
            title: v.title,
            lastFetchedAt: now,
          },
        });
      }

      // Create snapshot if we have fresh stats
      if (stats && videosNeedingSnapshot.some((vn) => vn.videoId === v.videoId)) {
        try {
          await prisma.competitorVideoSnapshot.create({
            data: {
              videoId: v.videoId,
              viewCount: stats.viewCount,
              likeCount: stats.likeCount,
              commentCount: stats.commentCount,
              capturedAt: now,
            },
          });
        } catch {
          // Ignore errors
        }
      }
    }

    // Reload videos with snapshots for derived metrics
    const videosWithSnapshots = await prisma.competitorVideo.findMany({
      where: { videoId: { in: videoIds } },
      include: {
        Snapshots: {
          orderBy: { capturedAt: "desc" },
          take: 10,
        },
      },
    });

    const videoDataMap = new Map(videosWithSnapshots.map((v) => [v.videoId, v]));

    // Build response with derived metrics
    const allVideos: CompetitorVideo[] = rawVideos.map((v) => {
      const dbVideo = videoDataMap.get(v.videoId);
      const snapshots = dbVideo?.Snapshots ?? [];

      // Calculate derived metrics from snapshots
      const derived = calculateDerivedMetrics(snapshots, v.viewsPerDay);

      // Calculate similarity score
      const titleWords = v.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const matchCount = titleWords.filter((w) => userKeywords.includes(w)).length;
      const similarityScore = Math.min(1, matchCount / Math.max(userKeywords.length, 1));

      // Get latest stats
      const latestSnapshot = snapshots[0];

      return {
        videoId: v.videoId,
        title: v.title,
        channelId: v.channelId,
        channelTitle: v.channelTitle,
        channelThumbnailUrl: v.channelThumbnailUrl,
        videoUrl: `https://youtube.com/watch?v=${v.videoId}`,
        channelUrl: `https://youtube.com/channel/${v.channelId}`,
        thumbnailUrl: v.thumbnailUrl,
        publishedAt: v.publishedAt,
        stats: {
          viewCount: latestSnapshot?.viewCount ?? v.views,
          likeCount: latestSnapshot?.likeCount ?? undefined,
          commentCount: latestSnapshot?.commentCount ?? undefined,
        },
        derived,
        similarityScore,
      };
    });

    // Calculate outlier scores (z-score within cohort)
    calculateOutlierScores(allVideos);

    // Sort based on requested sort type
    sortVideos(allVideos, sort);

    // Apply pagination
    const cursorOffset = cursor ? parseInt(cursor, 10) : 0;
    const paginatedVideos = allVideos.slice(cursorOffset, cursorOffset + limit);
    const hasMore = cursorOffset + limit < allVideos.length;
    const nextCursor = hasMore ? String(cursorOffset + limit) : undefined;

    const cachedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

    return Response.json({
      channelId,
      range,
      sort,
      generatedAt: new Date().toISOString(),
      cachedUntil: cachedUntil.toISOString(),
      nextCursor,
      videos: paginatedVideos,
    } as CompetitorFeedResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Competitor feed error:", err);

    // Return demo data as fallback on error
    const demoData = generateDemoCompetitorFeed();
    return Response.json({
      ...demoData,
      demo: true,
      error: "Using demo data - actual fetch failed",
    });
  }
}

// Calculate derived metrics from snapshots
function calculateDerivedMetrics(
  snapshots: Array<{ capturedAt: Date; viewCount: number; likeCount: number | null; commentCount: number | null }>,
  fallbackViewsPerDay: number
): CompetitorVideo["derived"] {
  const now = Date.now();

  // If no snapshots, return basic metrics with "building" status
  if (snapshots.length === 0) {
    return {
      viewsPerDay: fallbackViewsPerDay,
      dataStatus: "building",
    };
  }

  const latest = snapshots[0];
  const latestViews = latest.viewCount;

  // Calculate engagement per view
  let engagementPerView: number | undefined;
  if (latest.likeCount != null && latest.commentCount != null && latestViews > 0) {
    engagementPerView = (latest.likeCount + latest.commentCount) / latestViews;
  }

  // Find snapshot closest to 24h ago
  const snapshot24hAgo = snapshots.find((s) => {
    const age = now - s.capturedAt.getTime();
    return age >= 20 * 60 * 60 * 1000 && age <= 28 * 60 * 60 * 1000;
  });

  // Find snapshot closest to 7d ago
  const snapshot7dAgo = snapshots.find((s) => {
    const age = now - s.capturedAt.getTime();
    return age >= 6 * 24 * 60 * 60 * 1000 && age <= 8 * 24 * 60 * 60 * 1000;
  });

  const velocity24h = snapshot24hAgo ? latestViews - snapshot24hAgo.viewCount : undefined;
  const velocity7d = snapshot7dAgo ? latestViews - snapshot7dAgo.viewCount : undefined;

  // Calculate acceleration (needs at least 3 snapshots spanning 48h)
  let acceleration24h: number | undefined;
  if (snapshots.length >= 3 && snapshot24hAgo) {
    // Find snapshot ~48h ago
    const snapshot48hAgo = snapshots.find((s) => {
      const age = now - s.capturedAt.getTime();
      return age >= 44 * 60 * 60 * 1000 && age <= 52 * 60 * 60 * 1000;
    });

    if (snapshot48hAgo) {
      const prevVelocity24h = snapshot24hAgo.viewCount - snapshot48hAgo.viewCount;
      acceleration24h = (velocity24h ?? 0) - prevVelocity24h;
    }
  }

  const hasEnoughData = velocity24h !== undefined || velocity7d !== undefined;

  return {
    viewsPerDay: fallbackViewsPerDay,
    velocity24h,
    velocity7d,
    acceleration24h,
    engagementPerView,
    dataStatus: hasEnoughData ? "ready" : "building",
  };
}

// Calculate outlier scores using z-score
function calculateOutlierScores(videos: CompetitorVideo[]): void {
  // Use velocity24h if available, otherwise viewsPerDay
  const values = videos.map((v) => v.derived.velocity24h ?? v.derived.viewsPerDay);

  if (values.length < 3) return; // Need at least 3 for meaningful z-score

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return; // All values identical

  videos.forEach((v, i) => {
    const value = values[i];
    v.derived.outlierScore = (value - mean) / stdDev;
  });
}

// Sort videos based on sort type
function sortVideos(videos: CompetitorVideo[], sort: string): void {
  switch (sort) {
    case "velocity":
      videos.sort((a, b) => {
        const vA = a.derived.velocity24h ?? a.derived.viewsPerDay;
        const vB = b.derived.velocity24h ?? b.derived.viewsPerDay;
        return vB - vA;
      });
      break;
    case "engagement":
      videos.sort((a, b) => {
        const eA = a.derived.engagementPerView ?? 0;
        const eB = b.derived.engagementPerView ?? 0;
        return eB - eA;
      });
      break;
    case "newest":
      videos.sort((a, b) => {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
      break;
    case "outliers":
      videos.sort((a, b) => {
        const oA = a.derived.outlierScore ?? 0;
        const oB = b.derived.outlierScore ?? 0;
        return oB - oA;
      });
      break;
  }
}

// Extract keywords from video titles and tags
function extractKeywords(videos: Array<{ title: string; tags: string }>): string[] {
  const titleWords = videos
    .flatMap((v) => v.title.toLowerCase().split(/\s+/))
    .filter((w) => w.length > 3 && !commonWords.has(w));

  const tagWords = videos
    .flatMap((v) => v.tags.split(",").map((t) => t.trim().toLowerCase()))
    .filter(Boolean);

  // Count word frequency and get top keywords
  const wordCounts = new Map<string, number>();
  [...titleWords, ...tagWords].forEach((word) => {
    wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
  });

  return [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

// Generate demo competitor feed data
function generateDemoCompetitorFeed(): CompetitorFeedResponse {
  const now = new Date();
  const videos: CompetitorVideo[] = [
    {
      videoId: "comp-1",
      title: "This One Change DOUBLED My YouTube Growth",
      channelId: "channel-1",
      channelTitle: "Creator Academy",
      channelThumbnailUrl: null,
      videoUrl: "https://youtube.com/watch?v=comp-1",
      channelUrl: "https://youtube.com/channel/channel-1",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      stats: { viewCount: 245000, likeCount: 11760, commentCount: 735 },
      derived: {
        viewsPerDay: 81666,
        velocity24h: 52000,
        velocity7d: 180000,
        engagementPerView: 0.051,
        outlierScore: 1.8,
        dataStatus: "ready",
      },
      similarityScore: 0.85,
    },
    {
      videoId: "comp-2",
      title: "The Algorithm Changed (Here's What to Do Now)",
      channelId: "channel-2",
      channelTitle: "YouTube Strategy Pro",
      channelThumbnailUrl: null,
      videoUrl: "https://youtube.com/watch?v=comp-2",
      channelUrl: "https://youtube.com/channel/channel-2",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      stats: { viewCount: 189000, likeCount: 9450, commentCount: 567 },
      derived: {
        viewsPerDay: 94500,
        velocity24h: 78000,
        velocity7d: 160000,
        engagementPerView: 0.053,
        outlierScore: 2.1,
        dataStatus: "ready",
      },
      similarityScore: 0.78,
    },
    {
      videoId: "comp-3",
      title: "I Studied 100 Viral Videos - Here's the Pattern",
      channelId: "channel-3",
      channelTitle: "Growth Hacker",
      channelThumbnailUrl: null,
      videoUrl: "https://youtube.com/watch?v=comp-3",
      channelUrl: "https://youtube.com/channel/channel-3",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      stats: { viewCount: 567000, likeCount: 34020, commentCount: 2835 },
      derived: {
        viewsPerDay: 113400,
        velocity24h: 45000,
        velocity7d: 320000,
        engagementPerView: 0.065,
        outlierScore: 1.2,
        dataStatus: "ready",
      },
      similarityScore: 0.92,
    },
    {
      videoId: "comp-4",
      title: "Stop Making This Thumbnail Mistake",
      channelId: "channel-1",
      channelTitle: "Creator Academy",
      channelThumbnailUrl: null,
      videoUrl: "https://youtube.com/watch?v=comp-4",
      channelUrl: "https://youtube.com/channel/channel-1",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      publishedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      stats: { viewCount: 156000, likeCount: 7800, commentCount: 468 },
      derived: {
        viewsPerDay: 39000,
        velocity24h: 22000,
        engagementPerView: 0.053,
        outlierScore: 0.4,
        dataStatus: "ready",
      },
      similarityScore: 0.71,
    },
    {
      videoId: "comp-5",
      title: "Why Your First 30 Seconds Are Killing Your Channel",
      channelId: "channel-4",
      channelTitle: "Retention Master",
      channelThumbnailUrl: null,
      videoUrl: "https://youtube.com/watch?v=comp-5",
      channelUrl: "https://youtube.com/channel/channel-4",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      stats: { viewCount: 78000, likeCount: 4680, commentCount: 390 },
      derived: {
        viewsPerDay: 78000,
        velocity24h: 78000,
        engagementPerView: 0.065,
        outlierScore: 2.5,
        dataStatus: "ready",
      },
      similarityScore: 0.88,
    },
    {
      videoId: "comp-6",
      title: "The Title Formula That Gets Clicks (Without Clickbait)",
      channelId: "channel-2",
      channelTitle: "YouTube Strategy Pro",
      channelThumbnailUrl: null,
      videoUrl: "https://youtube.com/watch?v=comp-6",
      channelUrl: "https://youtube.com/channel/channel-2",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      publishedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      stats: { viewCount: 312000, likeCount: 15600, commentCount: 936 },
      derived: {
        viewsPerDay: 52000,
        velocity24h: 28000,
        velocity7d: 290000,
        engagementPerView: 0.053,
        outlierScore: 0.1,
        dataStatus: "ready",
      },
      similarityScore: 0.75,
    },
  ];

  return {
    channelId: "demo-channel",
    range: "7d",
    sort: "velocity",
    generatedAt: now.toISOString(),
    cachedUntil: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
    videos,
  };
}

// Common words to filter out from keyword extraction
const commonWords = new Set([
  "the", "and", "for", "with", "this", "that", "from", "have", "you",
  "what", "when", "where", "how", "why", "who", "which", "your", "will",
  "can", "all", "are", "been", "being", "but", "each", "had", "has",
  "her", "here", "his", "into", "just", "like", "made", "make", "more",
  "most", "much", "must", "not", "now", "only", "other", "our", "out",
  "over", "own", "said", "same", "she", "should", "some", "such", "than",
  "them", "then", "there", "these", "they", "their", "through", "too",
  "under", "very", "was", "way", "were", "about", "after", "also",
  "video", "videos", "watch", "watching", "today", "new",
]);
