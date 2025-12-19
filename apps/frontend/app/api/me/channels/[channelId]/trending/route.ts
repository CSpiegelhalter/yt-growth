/**
 * GET /api/me/channels/[channelId]/trending
 *
 * Get trending videos in the user's niche - VIDEO-FIRST list with pagination.
 * Returns specific videos (not just channels) that are performing well recently.
 *
 * Auth: Required
 * Subscription: Required
 * Caching: 12-24h per channelId + range
 *
 * Query params:
 * - range: "7d" | "14d" | "28d" (default: "7d")
 * - limit: number (default: 12, max: 50)
 * - cursor: string (for pagination)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { getCurrentUserWithSubscription, hasActiveSubscription } from "@/lib/user";
import { getGoogleAccount, searchSimilarChannels, fetchRecentChannelVideos } from "@/lib/youtube-api";
import { isDemoMode, getDemoData } from "@/lib/demo-fixtures";
import type { TrendingListResponse, TrendingVideo, SimilarChannelsResponse } from "@/types/api";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["7d", "14d", "28d"]).default("7d"),
  limit: z.coerce.number().min(1).max(50).default(12),
  cursor: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  // Return demo data if demo mode is enabled
  if (isDemoMode()) {
    const demoData = generateDemoTrendingData();
    return Response.json({ ...demoData, demo: true });
  }

  try {
    // Auth check
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
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
      limit: url.searchParams.get("limit") ?? "12",
      cursor: url.searchParams.get("cursor") ?? undefined,
    });

    if (!queryResult.success) {
      return Response.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { range, limit, cursor } = queryResult.data;

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

    // Extract keywords from recent video titles and tags
    const titleWords = channel.Video
      .flatMap((v) => (v.title ?? "").toLowerCase().split(/\s+/))
      .filter((w) => w.length > 3 && !commonWords.has(w));
    
    const tagWords = channel.Video
      .flatMap((v) => (v.tags ?? "").split(",").map((t) => t.trim().toLowerCase()))
      .filter(Boolean);

    // Count word frequency and get top keywords
    const wordCounts = new Map<string, number>();
    [...titleWords, ...tagWords].forEach((word) => {
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    });

    const keywords = [...wordCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    if (keywords.length === 0) {
      return Response.json({
        channelId,
        range,
        generatedAt: new Date().toISOString(),
        cachedUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        videos: [],
      } as TrendingListResponse);
    }

    // Search for similar channels
    const similarChannelResults = await searchSimilarChannels(ga, keywords, 8);

    // Filter out the user's own channel
    const filteredChannels = similarChannelResults
      .filter((c) => c.channelId !== channelId)
      .slice(0, 6);

    // Calculate date range
    const rangeDays = range === "7d" ? 7 : range === "14d" ? 14 : 28;
    const publishedAfter = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();

    // Fetch recent videos from all similar channels
    const allVideos: TrendingVideo[] = [];
    
    // Handle pagination via cursor
    const cursorOffset = cursor ? parseInt(cursor, 10) : 0;
    
    await Promise.all(
      filteredChannels.map(async (sc) => {
        try {
          const recentVideos = await fetchRecentChannelVideos(ga, sc.channelId, publishedAfter, 8);
          
          recentVideos.forEach((v) => {
            allVideos.push({
              videoId: v.videoId,
              title: v.title,
              channelId: sc.channelId,
              channelTitle: sc.channelTitle,
              channelThumbnailUrl: sc.thumbnailUrl,
              videoUrl: `https://youtube.com/watch?v=${v.videoId}`,
              channelUrl: `https://youtube.com/channel/${sc.channelId}`,
              thumbnailUrl: v.thumbnailUrl,
              publishedAt: v.publishedAt,
              viewCount: v.views,
              viewsPerDay: v.viewsPerDay,
              durationSec: v.durationSec,
              isUserVideo: false,
            });
          });
        } catch (err) {
          console.warn(`Failed to fetch videos for channel ${sc.channelId}:`, err);
        }
      })
    );

    // Sort by viewsPerDay descending (most trending first)
    allVideos.sort((a, b) => b.viewsPerDay - a.viewsPerDay);

    // Apply pagination
    const paginatedVideos = allVideos.slice(cursorOffset, cursorOffset + limit);
    const hasMore = cursorOffset + limit < allVideos.length;
    const nextCursor = hasMore ? String(cursorOffset + limit) : undefined;

    const cachedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

    return Response.json({
      channelId,
      range,
      generatedAt: new Date().toISOString(),
      cachedUntil: cachedUntil.toISOString(),
      nextCursor,
      videos: paginatedVideos,
    } as TrendingListResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Trending videos error:", err);
    
    // Return demo data as fallback on error
    const demoData = generateDemoTrendingData();
    return Response.json({
      ...demoData,
      demo: true,
      error: "Using demo data - actual fetch failed",
    });
  }
}

// Generate demo trending data
function generateDemoTrendingData(): TrendingListResponse {
  const now = new Date();
  const videos: TrendingVideo[] = [
    {
      videoId: "trend-1",
      title: "This One Change DOUBLED My YouTube Growth",
      channelId: "channel-1",
      channelTitle: "Creator Academy",
      channelThumbnailUrl: null,
      videoUrl: "https://youtube.com/watch?v=trend-1",
      channelUrl: "https://youtube.com/channel/channel-1",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      viewCount: 245000,
      viewsPerDay: 81666,
      isUserVideo: false,
    },
    {
      videoId: "trend-2",
      title: "The Algorithm Changed (Here's What to Do)",
      channelId: "channel-2",
      channelTitle: "YouTube Strategy Pro",
      channelThumbnailUrl: null,
      videoUrl: "https://youtube.com/watch?v=trend-2",
      channelUrl: "https://youtube.com/channel/channel-2",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      viewCount: 189000,
      viewsPerDay: 94500,
      isUserVideo: false,
    },
    {
      videoId: "trend-3",
      title: "I Studied 100 Viral Videos - Here's the Pattern",
      channelId: "channel-3",
      channelTitle: "Growth Hacker",
      channelThumbnailUrl: null,
      videoUrl: "https://youtube.com/watch?v=trend-3",
      channelUrl: "https://youtube.com/channel/channel-3",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      viewCount: 567000,
      viewsPerDay: 113400,
      isUserVideo: false,
    },
    {
      videoId: "trend-4",
      title: "Stop Making This Thumbnail Mistake",
      channelId: "channel-1",
      channelTitle: "Creator Academy",
      channelThumbnailUrl: null,
      videoUrl: "https://youtube.com/watch?v=trend-4",
      channelUrl: "https://youtube.com/channel/channel-1",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      publishedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      viewCount: 156000,
      viewsPerDay: 39000,
      isUserVideo: false,
    },
    {
      videoId: "trend-5",
      title: "Why Your First 30 Seconds Are Killing Your Channel",
      channelId: "channel-4",
      channelTitle: "Retention Master",
      channelThumbnailUrl: null,
      videoUrl: "https://youtube.com/watch?v=trend-5",
      channelUrl: "https://youtube.com/channel/channel-4",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      viewCount: 78000,
      viewsPerDay: 78000,
      isUserVideo: false,
    },
    {
      videoId: "trend-6",
      title: "The Title Formula That Gets Clicks (Without Clickbait)",
      channelId: "channel-2",
      channelTitle: "YouTube Strategy Pro",
      channelThumbnailUrl: null,
      videoUrl: "https://youtube.com/watch?v=trend-6",
      channelUrl: "https://youtube.com/channel/channel-2",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      publishedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      viewCount: 312000,
      viewsPerDay: 52000,
      isUserVideo: false,
    },
  ];

  return {
    channelId: "demo-channel",
    range: "7d",
    generatedAt: now.toISOString(),
    cachedUntil: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
    videos,
  };
}

// Common words to filter out
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

