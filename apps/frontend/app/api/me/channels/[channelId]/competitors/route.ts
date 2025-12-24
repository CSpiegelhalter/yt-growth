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
import {
  getCurrentUserWithSubscription,
  hasActiveSubscription,
} from "@/lib/user";
import {
  getGoogleAccount,
  searchSimilarChannels,
  searchNicheVideos,
  fetchRecentChannelVideos,
  fetchVideosStatsBatch,
  fetchChannelStats,
  getCompetitorSizeRange,
} from "@/lib/youtube-api";
import { isDemoMode, isYouTubeMockMode } from "@/lib/demo-fixtures";
import { ensureMockChannelSeeded } from "@/lib/mock-seed";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { generateNicheQueries } from "@/lib/llm";
import type { CompetitorFeedResponse, CompetitorVideo } from "@/types/api";

// In-memory cache for niche queries (per channel, cleared on server restart)
const nicheCache = new Map<string, { niche: string; queries: string[] }>();

// YouTube Video Category ID to Name mapping
const YOUTUBE_CATEGORIES: Record<string, string> = {
  "1": "Film & Animation",
  "2": "Autos & Vehicles",
  "10": "Music",
  "15": "Pets & Animals",
  "17": "Sports",
  "19": "Travel & Events",
  "20": "Gaming",
  "22": "People & Blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News & Politics",
  "26": "Howto & Style",
  "27": "Education",
  "28": "Science & Technology",
  "29": "Nonprofits & Activism",
};

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["7d", "28d"]).default("7d"),
  sort: z
    .enum(["velocity", "engagement", "newest", "outliers"])
    .default("velocity"),
  cursor: z.string().optional(),
  // Product constraint: only return 10 at a time to reduce downstream YouTube calls.
  limit: z.coerce.number().min(1).max(10).default(10),
  // Scale factor to find larger channels (1 = normal, 2 = 2x bigger, etc.)
  scale: z.coerce.number().min(1).max(5).default(1),
  // Page number for fetching additional batches of competitor videos (0 = first batch)
  page: z.coerce.number().min(0).max(10).default(0),
});

// Minimum hours between snapshots for a video
const SNAPSHOT_INTERVAL_HOURS = 6;
const BASE_VIDEOS_PER_CHANNEL = 5;
const MAX_COMPETITOR_CHANNELS = 8;

export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  // Fixture demo mode short-circuits. If YT_MOCK_MODE=1, we want to run real codepaths instead.
  if (isDemoMode() && !isYouTubeMockMode()) {
    const url = new URL(req.url);
    const queryResult = QuerySchema.safeParse({
      range: url.searchParams.get("range") ?? "7d",
      sort: url.searchParams.get("sort") ?? "velocity",
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? "10",
    });
    const q = queryResult.success ? queryResult.data : QuerySchema.parse({});
    const demoData = generateDemoCompetitorFeed(q);
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
        {
          error: "Rate limit exceeded",
          resetAt: new Date(rlResult.resetAt).toISOString(),
        },
        { status: 429 }
      );
    }

    // Subscription check (paid feature)
    if (!isYouTubeMockMode() && !hasActiveSubscription(user.subscription)) {
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
      limit: url.searchParams.get("limit") ?? "10",
      scale: url.searchParams.get("scale") ?? "1",
      page: url.searchParams.get("page") ?? "0",
    });

    if (!queryResult.success) {
      return Response.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { range, sort, cursor, limit, scale, page } = queryResult.data;

    // Get channel and verify ownership
    let channel = await prisma.channel.findFirst({
      where: {
        youtubeChannelId: channelId,
        userId: user.id,
      },
      include: {
        Video: {
          select: {
            title: true,
            tags: true,
            categoryId: true,
          },
          orderBy: { publishedAt: "desc" },
          take: 10,
        },
      },
    });

    // In YT_MOCK_MODE, auto-seed the channel/videos if missing so pages work immediately.
    if (isYouTubeMockMode()) {
      const ga = await getGoogleAccount(user.id, channelId);
      if (!ga) {
        return Response.json(
          { error: "Google account not connected" },
          { status: 400 }
        );
      }
      await ensureMockChannelSeeded({
        userId: user.id,
        youtubeChannelId: channelId,
        minVideos: 25,
        ga,
      });
      channel = await prisma.channel.findFirst({
        where: { youtubeChannelId: channelId, userId: user.id },
        include: {
          Video: {
            select: { title: true, tags: true, categoryId: true },
            orderBy: { publishedAt: "desc" },
            take: 10,
          },
        },
      });
    }

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Get Google account for API calls
    const ga = await getGoogleAccount(user.id, channelId);
    if (!ga) {
      return Response.json(
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    // Extract video data for niche analysis
    const videoTitles = channel.Video.map((v) => v.title ?? "").filter(Boolean);
    const allTags: string[] = [];
    channel.Video.forEach((v) => {
      if (v.tags) {
        v.tags.split(",").forEach((t) => {
          const cleaned = t.trim().toLowerCase();
          if (cleaned.length > 2) allTags.push(cleaned);
        });
      }
    });

    // Count tag frequency and get top tags
    const tagCounts = new Map<string, number>();
    allTags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag]) => tag);

    // Get primary category
    const categoryCounts = new Map<string, number>();
    channel.Video.forEach((v) => {
      if (v.categoryId) {
        categoryCounts.set(
          v.categoryId,
          (categoryCounts.get(v.categoryId) ?? 0) + 1
        );
      }
    });
    const primaryCategoryId =
      [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const categoryName = primaryCategoryId
      ? YOUTUBE_CATEGORIES[primaryCategoryId]
      : null;

    console.log(
      `[Competitors] Category: ${categoryName}, Tags: ${topTags
        .slice(0, 5)
        .join(", ")}`
    );

    // Use LLM to generate niche queries (cached per channel for 24h)
    const nicheCacheKey = `niche:${channel.id}`;
    let nicheData = nicheCache.get(nicheCacheKey);

    if (!nicheData) {
      console.log(`[Competitors] Generating niche queries via LLM...`);
      nicheData = await generateNicheQueries({
        videoTitles,
        topTags,
        categoryName,
      });
      nicheCache.set(nicheCacheKey, nicheData);
      console.log(`[Competitors] LLM identified niche: "${nicheData.niche}"`);
    }

    const nicheQueries = nicheData.queries;

    if (nicheQueries.length === 0) {
      return Response.json({
        channelId,
        range,
        sort,
        generatedAt: new Date().toISOString(),
        cachedUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        videos: [],
        message: "Could not determine niche. Please add tags to your videos.",
      } as CompetitorFeedResponse);
    }

    // Use different query for each page (cycles through available queries)
    const queryIndex = page % nicheQueries.length;
    const searchQuery = nicheQueries[queryIndex];

    console.log(
      `[Competitors] Page ${page} using query: "${searchQuery}" (${nicheQueries.length} queries available)`
    );
    console.log(`[Competitors] Niche: "${nicheData.niche}"`);

    // For backward compatibility with searchSimilarChannels
    const userKeywords = searchQuery.split(/\s+/).filter((w) => w.length > 2);

    // Calculate date range
    const rangeDays = range === "7d" ? 7 : 28;
    const publishedAfter = new Date(
      Date.now() - rangeDays * 24 * 60 * 60 * 1000
    ).toISOString();

    // Cache the discovery list for 12h (so repeated page views don't burn YouTube quota).
    // Include page in the range key to store different batches separately
    const cacheRange = page > 0 ? `${range}_page${page}` : range;
    const cached = await prisma.competitorFeedCache.findUnique({
      where: {
        userId_channelId_range: {
          userId: user.id,
          channelId: channel.id,
          range: cacheRange,
        },
      },
    });

    // Get user's channel subscriber count for size-based filtering
    const userChannelStats = await fetchChannelStats(ga, [channelId]);
    const userSubCount = userChannelStats.get(channelId)?.subscriberCount ?? 0;
    const sizeRange = getCompetitorSizeRange(userSubCount, scale);

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

    const now = new Date();
    const cachedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

    if (cached && cached.cachedUntil > now) {
      const cachedRaw = cached.videosJson as unknown as typeof rawVideos;
      // Backward compatible: older caches may have too many per channel.
      // Enforce per-channel cap at read time too.
      const perChannelCounts = new Map<string, number>();
      cachedRaw.forEach((v) => {
        const n = perChannelCounts.get(v.channelId) ?? 0;
        if (n >= BASE_VIDEOS_PER_CHANNEL) return;
        perChannelCounts.set(v.channelId, n + 1);
        rawVideos.push(v);
      });
    } else {
      console.log(
        `[Competitors] User has ${userSubCount} subs, looking for channels with ${sizeRange.min}-${sizeRange.max} subs`
      );

      // Search for videos in the niche (more accurate than channel search)
      const { uniqueChannels: videoBasedChannels } = await searchNicheVideos(
        ga,
        searchQuery,
        50
      );

      console.log(
        `[Competitors] Video search found ${videoBasedChannels.length} unique channels for query: "${searchQuery}"`
      );

      // Filter out the user's own channel
      const candidateChannels = videoBasedChannels.filter(
        (c) => c.channelId !== channelId
      );

      // Fetch subscriber counts for candidate channels
      const channelStats = await fetchChannelStats(
        ga,
        candidateChannels.map((c) => c.channelId)
      );

      // Filter channels by size - find channels larger than user but not too large
      const sizeFilteredChannels = candidateChannels
        .map((c) => ({
          ...c,
          subscriberCount: channelStats.get(c.channelId)?.subscriberCount ?? 0,
        }))
        .filter((c) => {
          // Must be within our target range
          return (
            c.subscriberCount >= sizeRange.min &&
            c.subscriberCount <= sizeRange.max
          );
        })
        // Sort by subscriber count (prefer channels closer to user's next milestone)
        .sort((a, b) => a.subscriberCount - b.subscriberCount)
        .slice(0, MAX_COMPETITOR_CHANNELS);

      console.log(
        `[Competitors] Page ${page} (query: "${searchQuery}"): Found ${sizeFilteredChannels.length} size-appropriate channels:`,
        sizeFilteredChannels.map(
          (c) => `${c.channelTitle} (${c.subscriberCount})`
        )
      );

      // If not enough size-appropriate channels from video search, also try channel search as backup
      let filteredChannels = sizeFilteredChannels;
      if (filteredChannels.length < 3) {
        console.log(
          `[Competitors] Few channels found via video search, trying channel search as backup...`
        );
        const channelSearchResults = await searchSimilarChannels(
          ga,
          userKeywords,
          30
        );
        const additionalChannels = channelSearchResults
          .filter((c) => c.channelId !== channelId)
          .filter(
            (c) =>
              !sizeFilteredChannels.some((sc) => sc.channelId === c.channelId)
          );

        const additionalStats = await fetchChannelStats(
          ga,
          additionalChannels.map((c) => c.channelId)
        );

        const additionalFiltered = additionalChannels
          .map((c) => ({
            ...c,
            subscriberCount:
              additionalStats.get(c.channelId)?.subscriberCount ?? 0,
          }))
          .filter(
            (c) =>
              c.subscriberCount >= sizeRange.min &&
              c.subscriberCount <= sizeRange.max
          )
          .slice(0, MAX_COMPETITOR_CHANNELS - filteredChannels.length);

        filteredChannels = [...filteredChannels, ...additionalFiltered];
        console.log(
          `[Competitors] After backup channel search: ${filteredChannels.length} total channels`
        );
      }

      await Promise.all(
        filteredChannels.map(async (sc) => {
          try {
            const recentVideos = await fetchRecentChannelVideos(
              ga,
              sc.channelId,
              publishedAfter,
              BASE_VIDEOS_PER_CHANNEL
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
            console.warn(
              `Failed to fetch videos for channel ${sc.channelId}:`,
              err
            );
          }
        })
      );

      await prisma.competitorFeedCache.upsert({
        where: {
          userId_channelId_range: {
            userId: user.id,
            channelId: channel.id,
            range: cacheRange,
          },
        },
        create: {
          userId: user.id,
          channelId: channel.id,
          range: cacheRange,
          // Ensure we never store too many from a single channel (idea diversity).
          videosJson: rawVideos as unknown as object,
          cachedUntil,
        },
        update: {
          videosJson: rawVideos as unknown as object,
          cachedUntil,
        },
      });
    }

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
    const snapshotCutoff = new Date(
      now.getTime() - SNAPSHOT_INTERVAL_HOURS * 60 * 60 * 1000
    );

    const videosNeedingSnapshot = rawVideos.filter((v) => {
      const existing = existingVideoMap.get(v.videoId);
      if (!existing) return true; // New video, needs snapshot
      const lastSnapshot = existing.Snapshots[0];
      if (!lastSnapshot) return true;
      return lastSnapshot.capturedAt < snapshotCutoff;
    });

    // Fetch fresh stats for videos needing snapshots (batched API call)
    let freshStats = new Map<
      string,
      { viewCount: number; likeCount?: number; commentCount?: number }
    >();
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
      if (
        stats &&
        videosNeedingSnapshot.some((vn) => vn.videoId === v.videoId)
      ) {
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

    const videoDataMap = new Map(
      videosWithSnapshots.map((v) => [v.videoId, v])
    );

    // Build response with derived metrics
    const allVideos: CompetitorVideo[] = rawVideos.map((v) => {
      const dbVideo = videoDataMap.get(v.videoId);
      const snapshots = dbVideo?.Snapshots ?? [];

      // Calculate derived metrics from snapshots
      const derived = calculateDerivedMetrics(snapshots, v.viewsPerDay);

      // Calculate similarity score
      const titleWords = v.title
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const matchCount = titleWords.filter((w) =>
        userKeywords.includes(w)
      ).length;
      const similarityScore = Math.min(
        1,
        matchCount / Math.max(userKeywords.length, 1)
      );

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

    // Determine if there are more pages available (based on available unique queries)
    const hasMoreUniqueQueries = page + 1 < nicheQueries.length;

    return Response.json({
      channelId,
      range,
      sort,
      generatedAt: new Date().toISOString(),
      cachedUntil: cachedUntil.toISOString(),
      nextCursor,
      videos: paginatedVideos,
      targetSizeDescription: sizeRange.description,
      currentPage: page,
      hasMorePages: hasMoreUniqueQueries,
      totalQueries: nicheQueries.length,
    } as CompetitorFeedResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Competitor feed error:", err);
    return Response.json(
      { error: "Failed to fetch competitor feed", detail: message },
      { status: 500 }
    );
  }
}

// Calculate derived metrics from snapshots
function calculateDerivedMetrics(
  snapshots: Array<{
    capturedAt: Date;
    viewCount: number;
    likeCount: number | null;
    commentCount: number | null;
  }>,
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
  if (
    latest.likeCount != null &&
    latest.commentCount != null &&
    latestViews > 0
  ) {
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

  const velocity24h = snapshot24hAgo
    ? latestViews - snapshot24hAgo.viewCount
    : undefined;
  const velocity7d = snapshot7dAgo
    ? latestViews - snapshot7dAgo.viewCount
    : undefined;

  // Calculate acceleration (needs at least 3 snapshots spanning 48h)
  let acceleration24h: number | undefined;
  if (snapshots.length >= 3 && snapshot24hAgo) {
    // Find snapshot ~48h ago
    const snapshot48hAgo = snapshots.find((s) => {
      const age = now - s.capturedAt.getTime();
      return age >= 44 * 60 * 60 * 1000 && age <= 52 * 60 * 60 * 1000;
    });

    if (snapshot48hAgo) {
      const prevVelocity24h =
        snapshot24hAgo.viewCount - snapshot48hAgo.viewCount;
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
  const values = videos.map(
    (v) => v.derived.velocity24h ?? v.derived.viewsPerDay
  );

  if (values.length < 3) return; // Need at least 3 for meaningful z-score

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
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
        return (
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
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

// Generate demo competitor feed data
function generateDemoCompetitorFeed(input: {
  range: "7d" | "28d";
  sort: "velocity" | "engagement" | "newest" | "outliers";
  cursor?: string;
  limit: number;
}): CompetitorFeedResponse {
  const now = new Date();
  const channels = Array.from({ length: 18 }).map((_, i) => ({
    channelId: `demo-ch-${String(i + 1).padStart(2, "0")}`,
    channelTitle: `Demo Channel ${i + 1}`,
  }));

  const days = input.range === "7d" ? 7 : 28;
  const pool: CompetitorVideo[] = [];

  for (const ch of channels) {
    for (let i = 0; i < 5; i++) {
      const idx = pool.length + 1;
      const publishedAt = new Date(
        now.getTime() - ((idx % days) + 1) * 24 * 60 * 60 * 1000
      ).toISOString();
      const viewCount = 50_000 + ((idx * 19_123) % 2_000_000);
      const likeCount = Math.floor(viewCount * 0.05);
      const commentCount = Math.floor(viewCount * 0.004);
      const viewsPerDay = Math.round(viewCount / Math.max(1, (idx % days) + 1));
      const velocity24h = Math.round(viewsPerDay * (0.7 + (idx % 10) / 20));
      const velocity7d = Math.round(velocity24h * 5.2);
      const engagementPerView =
        viewCount > 0 ? (likeCount + commentCount) / viewCount : undefined;

      pool.push({
        videoId: `demo-comp-${idx}`,
        title: `Demo Winner #${idx}: A High-Performing Idea to Remix`,
        channelId: ch.channelId,
        channelTitle: ch.channelTitle,
        channelThumbnailUrl: null,
        videoUrl: `https://youtube.com/watch?v=demo-comp-${idx}`,
        channelUrl: `https://youtube.com/channel/${ch.channelId}`,
        thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        publishedAt,
        stats: { viewCount, likeCount, commentCount },
        derived: {
          viewsPerDay,
          velocity24h,
          velocity7d,
          engagementPerView,
          outlierScore: (idx % 9) / 2,
          dataStatus: "ready",
        },
        similarityScore: 0.55 + (idx % 40) / 100,
      });
    }
  }

  // Sort by requested sort type (simplified)
  const videos = [...pool];
  switch (input.sort) {
    case "newest":
      videos.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      break;
    case "engagement":
      videos.sort(
        (a, b) =>
          (b.derived.engagementPerView ?? 0) -
          (a.derived.engagementPerView ?? 0)
      );
      break;
    case "outliers":
      videos.sort(
        (a, b) => (b.derived.outlierScore ?? 0) - (a.derived.outlierScore ?? 0)
      );
      break;
    case "velocity":
    default:
      videos.sort(
        (a, b) =>
          (b.derived.velocity24h ?? b.derived.viewsPerDay) -
          (a.derived.velocity24h ?? a.derived.viewsPerDay)
      );
      break;
  }

  const cursorOffset = input.cursor ? parseInt(input.cursor, 10) : 0;
  const paginated = videos.slice(cursorOffset, cursorOffset + input.limit);
  const hasMore = cursorOffset + input.limit < videos.length;
  const nextCursor = hasMore ? String(cursorOffset + input.limit) : undefined;

  return {
    channelId: "demo-channel",
    range: input.range,
    sort: input.sort,
    generatedAt: now.toISOString(),
    cachedUntil: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
    nextCursor,
    videos: paginated,
  };
}
