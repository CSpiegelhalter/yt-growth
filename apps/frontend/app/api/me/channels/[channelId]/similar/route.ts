/**
 * GET /api/me/channels/[channelId]/similar
 *
 * Find similar channels and their recent successful videos.
 * This is a PAID feature - requires active subscription.
 *
 * Auth: Required
 * Subscription: Required
 * Caching: 12-24h per channelId + range
 *
 * Query params:
 * - range: "7d" | "14d" (default: "7d")
 * - channels: number (default: 5, max: 10)
 *
 * Demo mode: Returns fixture data when NEXT_PUBLIC_DEMO_MODE=1 or on API failure
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { getCurrentUserWithSubscription, hasActiveSubscription } from "@/lib/user";
import { getGoogleAccount, searchSimilarChannels, fetchRecentChannelVideos } from "@/lib/youtube-api";
import { generateSimilarChannelInsights } from "@/lib/llm";
import { isDemoMode, getDemoData } from "@/lib/demo-fixtures";
import type { SimilarChannelsResponse, SimilarChannel } from "@/types/api";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["7d", "14d"]).default("7d"),
  channels: z.coerce.number().min(1).max(10).default(5),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  // Return demo data if demo mode is enabled
  if (isDemoMode()) {
    const demoData = getDemoData("similar-channels");
    return Response.json({ ...(demoData as object), demo: true });
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
      channels: url.searchParams.get("channels") ?? "5",
    });

    if (!queryResult.success) {
      return Response.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { range, channels: channelCount } = queryResult.data;

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
        similarChannels: [],
        insights: {
          whatTheyreDoing: ["Not enough data to analyze similar channels"],
          ideasToSteal: [],
          formatsToTry: [],
        },
      } as SimilarChannelsResponse);
    }

    // Search for similar channels
    const similarChannelResults = await searchSimilarChannels(ga, keywords, channelCount + 2);

    // Filter out the user's own channel
    const filteredChannels = similarChannelResults
      .filter((c) => c.channelId !== channelId)
      .slice(0, channelCount);

    // Calculate date range
    const rangeDays = range === "7d" ? 7 : 14;
    const publishedAfter = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();

    // Fetch recent videos for each similar channel
    const similarChannels: SimilarChannel[] = await Promise.all(
      filteredChannels.map(async (sc, index) => {
        try {
          const recentVideos = await fetchRecentChannelVideos(ga, sc.channelId, publishedAfter, 5);
          
          // Calculate similarity score based on keyword overlap (simplified)
          const similarityScore = Math.max(0.3, 1 - index * 0.1); // Decreasing score based on order

          return {
            channelId: sc.channelId,
            channelTitle: sc.channelTitle,
            channelThumbnailUrl: sc.thumbnailUrl,
            similarityScore,
            recentWinners: recentVideos.slice(0, 3).map((v) => ({
              videoId: v.videoId,
              title: v.title,
              publishedAt: v.publishedAt,
              thumbnailUrl: v.thumbnailUrl,
              views: v.views,
              viewsPerDay: v.viewsPerDay,
            })),
          };
        } catch (err) {
          console.warn(`Failed to fetch videos for channel ${sc.channelId}:`, err);
          return {
            channelId: sc.channelId,
            channelTitle: sc.channelTitle,
            channelThumbnailUrl: sc.thumbnailUrl,
            similarityScore: 0.5,
            recentWinners: [],
          };
        }
      })
    );

    // Generate insights using LLM
    let insights: SimilarChannelsResponse["insights"] = {
      whatTheyreDoing: [],
      ideasToSteal: [],
      formatsToTry: [],
    };

    const channelsWithVideos = similarChannels.filter((c) => c.recentWinners.length > 0);
    if (channelsWithVideos.length >= 2) {
      try {
        insights = await generateSimilarChannelInsights(
          channel.title ?? "Your Channel",
          channelsWithVideos.map((c) => ({
            title: c.channelTitle,
            recentVideos: c.recentWinners.map((v) => v.title),
          }))
        );
      } catch (err) {
        console.warn("Failed to generate similar channel insights:", err);
        insights = {
          whatTheyreDoing: ["Similar channels are posting consistently in your niche"],
          ideasToSteal: ["Check their highest-viewed recent videos for topic inspiration"],
          formatsToTry: ["Try formats that are working for these channels"],
        };
      }
    }

    const cachedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

    return Response.json({
      channelId,
      range,
      generatedAt: new Date().toISOString(),
      cachedUntil: cachedUntil.toISOString(),
      similarChannels,
      insights,
    } as SimilarChannelsResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Similar channels error:", err);
    
    // Return demo data as fallback on error
    const demoData = getDemoData("similar-channels");
    if (demoData) {
      return Response.json({
        ...(demoData as object),
        demo: true,
        error: "Using demo data - actual fetch failed",
      });
    }
    
    return Response.json(
      { error: "Failed to fetch similar channels", detail: message },
      { status: 500 }
    );
  }
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
